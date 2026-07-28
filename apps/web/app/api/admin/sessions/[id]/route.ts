import { auth } from '../../../../../auth';
import { getSessionTimeline } from '../../../../../src/server/analytics';

// One attempt, event by event — the read-only session timeline.
//
// ADMIN only, and deliberately NOT scoped to the caller: the whole point is
// reading someone else's session. That makes the role check the only thing
// standing between a learner and their cohort's answers, so it stays first.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'unauthenticated' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return Response.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await ctx.params;
  const timeline = await getSessionTimeline(id);
  if (!timeline) return Response.json({ error: 'not_found' }, { status: 404 });

  return Response.json(timeline);
}
