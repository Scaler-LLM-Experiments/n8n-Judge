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

  // Each attempt is its own row — analytics dedupe by user+problem rather than
  // the app pretending a retry is the same session.
  const created = await prisma.session.create({
    data: {
      userId: session.user.id,
      problemId: version.problemId,
      problemVersionId: version.id,
    },
    select: { id: true, problemVersionId: true, startedAt: true },
  });

  return Response.json(
    { sessionId: created.id, problemVersionId: created.problemVersionId, version: version.version },
    { status: 201 }
  );
}
