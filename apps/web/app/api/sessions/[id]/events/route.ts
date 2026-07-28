import { auth } from '../../../../../auth';
import { prisma } from '@judge/db';
import { clientTraceBatchSchema } from '@judge/trace';
import { planIngest } from '@judge/trace/ingest.ts';

// Batch trace ingest: everything the client observes about a session that the
// server did not already record itself.
//
// Idempotent on (sessionId, clientSeq). The client keeps its own monotonic
// counter and may re-send a batch after a dropped connection or a reload; rows it
// already delivered are skipped rather than duplicated.
//
// `seq` is allocated HERE, not by the client, under the same per-session advisory
// lock the check endpoint uses. Both endpoints write to one table with a unique
// (sessionId, seq), and a client counter cannot know about server-written rows —
// letting the client number them is what produced the intermittent 500s that made
// the same answer grade correct on one attempt and fail on the next.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authed = await auth();
  if (!authed?.user?.id) return Response.json({ error: 'unauthenticated' }, { status: 401 });

  const { id: sessionId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }

  const parsed = clientTraceBatchSchema.safeParse(body);
  if (!parsed.success) {
    // Name the first problem: a silently dropped batch is far worse to debug
    // than a rejected one, and the client logs this.
    return Response.json(
      { error: 'invalid_batch', detail: parsed.error.errors[0]?.message ?? 'invalid' },
      { status: 400 }
    );
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true },
  });
  if (!session) return Response.json({ error: 'not_found' }, { status: 404 });
  // Writing into someone else's session would let one learner forge another's
  // trace — which is the input the grading worker replays.
  if (session.userId !== authed.user.id) return Response.json({ error: 'forbidden' }, { status: 403 });

  const incoming = parsed.data.events;

  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${sessionId}))`;

    // Only the clientSeqs in this batch matter, so the lookup stays small even
    // for a long session.
    const existing = await tx.traceEvent.findMany({
      where: { sessionId, clientSeq: { in: incoming.map((e) => e.clientSeq) } },
      select: { clientSeq: true },
    });

    const last = await tx.traceEvent.findFirst({
      where: { sessionId },
      orderBy: { seq: 'desc' },
      select: { seq: true },
    });

    const plan = planIngest({
      events: incoming,
      existingClientSeqs: existing.map((e) => e.clientSeq).filter((n): n is number => n != null),
      maxSeq: last?.seq ?? 0,
    });

    if (plan.rows.length > 0) {
      await tx.traceEvent.createMany({
        data: plan.rows.map((r) => ({
          sessionId,
          seq: r.seq,
          clientSeq: r.clientSeq,
          type: r.type,
          payload: r.payload as object,
          clientTs: new Date(r.clientTs),
        })),
      });
    }

    return plan;
  });

  return Response.json({
    accepted: result.rows.length,
    skipped: result.skipped.length,
    // The client advances its "delivered" watermark from this, so a reload does
    // not replay the whole session.
    lastClientSeq: incoming.reduce((max, e) => Math.max(max, e.clientSeq), -1),
  });
}
