import { auth } from '../../../auth';
import { prisma } from '@judge/db';
import { getPublishedVersion } from '../../../src/server/problemVersions';

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
/**
 * A traced graph, but only if it can actually seed the canvas.
 *
 * Every node needs a numeric `position` — React Flow reads `position.x` while
 * building its internals and throws on the way in, which takes the whole Build
 * screen down rather than degrading. Graphs recorded before the tracer started
 * carrying positions have none, so this is not a hypothetical: without the check,
 * turning resume on would have crashed every learner mid-flight today.
 *
 * Returning null costs the learner their canvas and nothing else: they resume onto
 * the right screen and rebuild, and their recorded marks are untouched.
 */
function restorableGraph(graph: unknown): unknown | null {
  if (!graph || typeof graph !== 'object') return null;
  const nodes = (graph as { nodes?: unknown }).nodes;
  if (!Array.isArray(nodes) || !nodes.length) return null;
  const everyNodePlaceable = nodes.every((n) => {
    const pos = (n as { position?: { x?: unknown; y?: unknown } })?.position;
    return pos && typeof pos.x === 'number' && typeof pos.y === 'number';
  });
  return everyNodePlaceable ? graph : null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'unauthenticated' }, { status: 401 });

  const open = await prisma.session.findFirst({
    where: { userId: session.user.id, status: 'IN_PROGRESS' },
    orderBy: { startedAt: 'desc' },
    select: {
      id: true,
      startedAt: true,
      problem: { select: { slug: true, title: true } },
    },
  });
  if (!open) return Response.json({ resume: null });

  const events = await prisma.traceEvent.findMany({
    where: {
      sessionId: open.id,
      // `decision` is in here to answer "did this learner actually do anything",
      // not to locate a screen. Understand runs its three beats and its whole quiz
      // WITHOUT a screen_transition — the first one fires on the way to Build — so a
      // learner who answered four questions and closed the tab has decisions and
      // nothing else. Judging progress by transitions alone offered them no resume.
      type: { in: ['screen_transition', 'graph_mutation', 'decision'] },
    },
    orderBy: { seq: 'desc' },
    select: { type: true, payload: true, receivedAt: true },
    // Only the latest of each is needed, but they interleave, so take a window
    // rather than three queries. A learner generates a few hundred events at most.
    take: 500,
  });

  const lastScreen = events.find((e) => e.type === 'screen_transition');
  const lastGraph = events.find((e) => e.type === 'graph_mutation');
  // No transition yet means they never left the first screen, which is Understand.
  const screen = ((lastScreen?.payload as Record<string, unknown> | undefined)?.to as string | undefined) ?? 'statement';
  const graph = restorableGraph((lastGraph?.payload as Record<string, unknown> | undefined)?.graph);

  // An attempt with no events at all is a shell — the journey creates a session on
  // mount, so one exists the moment anyone opens a problem and closes the tab. There
  // is nothing to continue, and offering it is noise.
  if (!events.length) return Response.json({ resume: null });

  return Response.json({
    resume: {
      sessionId: open.id,
      slug: open.problem.slug,
      title: open.problem.title,
      screen,
      graph,
      lastSeenAt: (events[0]?.receivedAt ?? open.startedAt).toISOString(),
    },
  });
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
