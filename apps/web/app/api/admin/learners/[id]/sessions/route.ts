import { auth } from '../../../../../../auth';
import { getLearnerSessions } from '../../../../../../src/server/analytics';

// Every attempt by one learner, for the drill-down.
// ADMIN only — see the analytics route for why the check lives here and not in
// middleware.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'unauthenticated' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return Response.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await ctx.params;
  return Response.json(await getLearnerSessions(id));
}
