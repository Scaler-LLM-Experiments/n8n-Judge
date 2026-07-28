import { auth } from '../../../../auth';
import { getOverview, getCases, getFunnel, getLearners } from '../../../../src/server/analytics';

// The admin dashboard's data, in one request.
//
// One payload rather than four endpoints: every panel is on screen at once, so
// four round trips would only buy four chances to render half a dashboard.
//
// ADMIN only. Learner emails, scores and drop-off points are exactly the data a
// learner must not be able to read about their cohort — and the middleware does
// not cover /api/admin, so the check has to be here.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'unauthenticated' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return Response.json({ error: 'forbidden' }, { status: 403 });

  const [overview, cases, funnel, learners] = await Promise.all([
    getOverview(),
    getCases(),
    getFunnel(),
    getLearners(),
  ]);

  return Response.json({ overview, cases, funnel, learners, generatedAt: new Date().toISOString() });
}
