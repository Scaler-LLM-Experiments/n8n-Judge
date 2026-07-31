import { auth } from '../../../auth';
import { prisma } from '@judge/db';
import { getPublishedVersion, getVersionById } from '../../../src/server/problemVersions';
import { resumePointFromTrace } from '../../../src/server/resumePoint';

// Start an attempt. Minimal on purpose — M2 grows this into full session
// persistence and tracing; today it exists so that answer checking has
// somewhere to record attempts, and so a Session PINS a ProblemVersion.
//
// The pin is not bookkeeping. Without it, republishing a problem mid-attempt
// would change what "correct" means underneath a learner who is halfway
// through it.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The attempt this learner has open, for Home's "Continue where you left off".
 *
 * Where they got to and what they had built are BOTH read from the trace rather
 * than from `Session.currentScreen` / `Session.builtGraphSnapshot`. Those two
 * columns exist and look authoritative, but nothing writes them until a session
 * COMPLETES — trusting them would offer every learner a resume to screen one with
 * an empty canvas, which is worse than not offering it at all. The trace is what
 * actually happened: `screen_transition` carries where they went, and
 * `graph_mutation` carries the whole graph on every change, so the last one IS
 * the canvas they left behind.
 *
 * Returns `{ resume: null }` rather than a 404 when there is nothing open: Home
 * asks on every visit, and "nothing to continue" is the normal answer.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'unauthenticated' }, { status: 401 });

  const open = await prisma.session.findFirst({
    where: { userId: session.user.id, status: 'IN_PROGRESS' },
    orderBy: { startedAt: 'desc' },
    select: {
      id: true,
      startedAt: true,
      problemVersionId: true,
      problem: { select: { slug: true, title: true } },
    },
  });
  if (!open) return Response.json({ resume: null });

  const events = await prisma.traceEvent.findMany({
    where: {
      sessionId: open.id,
      // `decision` is in here for two reasons: it answers "did this learner
      // actually do anything" — Understand runs its beats and its whole quiz
      // WITHOUT a screen_transition, so a learner who answered four questions and
      // closed the tab has decisions and nothing else — and it names the questions
      // they answered, which is how the quiz resumes where they stopped.
      //
      // `phase_transition` is what puts them back in the right Build phase. It was
      // missing from this filter, which is why resume dropped a learner at phase one
      // and made them click through every celebration they had already earned.
      type: { in: ['screen_transition', 'phase_transition', 'graph_mutation', 'decision'] },
    },
    orderBy: { seq: 'desc' },
    select: { type: true, payload: true, receivedAt: true },
    // The interesting rows interleave, so take a window rather than one query per
    // type. A learner generates a few hundred events at most.
    take: 500,
  });

  // An attempt with no events at all is a shell — the journey creates a session on
  // mount, so one exists the moment anyone opens a problem and closes the tab. There
  // is nothing to continue, and offering it is noise.
  if (!events.length) return Response.json({ resume: null });

  // Everything about WHERE they were is derived in one tested place.
  const point = resumePointFromTrace(events);

  return Response.json({
    resume: {
      sessionId: open.id,
      slug: open.problem.slug,
      title: open.problem.title,
      ...point,
      // What their right answers unlocked, so the Understand summary comes back
      // with the toolkit they built rather than an empty row. Resolved against the
      // version this session PINNED, and only for questions they actually got
      // right — the same rule /check follows when it returns `unlocks`, so this
      // tells them nothing they were not already told.
      unlockedTypes: await unlockedTypesFor(open.problemVersionId, point.solved.dissection),
      lastSeenAt: (events[0]?.receivedAt ?? open.startedAt).toISOString(),
    },
  });
}

async function unlockedTypesFor(problemVersionId: string, solvedIds: string[]): Promise<string[]> {
  if (!solvedIds.length) return [];
  const version = await getVersionById(problemVersionId);
  const dissection = (version?.data as { dissection?: Array<Record<string, unknown>> } | undefined)?.dissection;
  if (!Array.isArray(dissection)) return [];

  const types = new Set<string>();
  for (const q of dissection) {
    if (typeof q.id !== 'string' || !solvedIds.includes(q.id)) continue;
    for (const t of (q.unlocks as string[] | undefined) ?? []) types.add(t);
  }
  return [...types];
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'unauthenticated' }, { status: 401 });

  let body: { slug?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }
  if (!body.slug) return Response.json({ error: 'slug_required' }, { status: 400 });

  const version = await getPublishedVersion(body.slug);
  if (!version) return Response.json({ error: 'not_found' }, { status: 404 });

  // Reuse the attempt already in progress, rather than opening a new one.
  //
  // This used to create unconditionally, and the journey calls it on mount — so
  // every page reload, every dev-route visit and every smoke run opened another
  // row. The result was 52 sessions against 17 recorded answers: almost all of
  // them empty shells, which would have made "how many learners attempted this"
  // meaningless the moment anyone looked at it.
  //
  // A genuine retry still gets its own row, because finishing a session marks it
  // COMPLETED (see the report route) and only IN_PROGRESS rows are reused. So
  // "one row per attempt" still holds — a reload is simply not an attempt.
  const existing = await prisma.session.findFirst({
    where: {
      userId: session.user.id,
      problemVersionId: version.id,
      status: 'IN_PROGRESS',
    },
    orderBy: { startedAt: 'desc' },
    select: { id: true, problemVersionId: true },
  });

  if (existing) {
    return Response.json(
      { sessionId: existing.id, problemVersionId: existing.problemVersionId, version: version.version, resumed: true },
      { status: 200 }
    );
  }

  const created = await prisma.session.create({
    data: {
      userId: session.user.id,
      problemId: version.problemId,
      problemVersionId: version.id,
    },
    select: { id: true, problemVersionId: true, startedAt: true },
  });

  return Response.json(
    { sessionId: created.id, problemVersionId: created.problemVersionId, version: version.version, resumed: false },
    { status: 201 }
  );
}
