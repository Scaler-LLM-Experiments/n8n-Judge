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
