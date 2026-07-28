import { auth } from '../../../../../auth';
import { prisma } from '@judge/db';
import { checkAnswer, type CheckKind, type CheckRequest } from '@judge/problem-schema';
import { getVersionById } from '../../../../../src/server/problemVersions';

// Check one answer, and RECORD the attempt.
//
// The recording is the security property, not a side benefit. A check endpoint
// that only evaluates is a free oracle: three options, three requests, and
// guessing becomes cheaper than reading the answers ever was. Because every
// call is persisted as a TraceEvent, guessing is still allowed — it just
// scores like guessing, since `firstTry` is what Understanding is built on.
//
// Answers are graded against the version this Session PINNED, not against
// whatever is published now.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KINDS: CheckKind[] = ['dissection', 'field', 'setting', 'probe', 'stress', 'placement'];

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authed = await auth();
  if (!authed?.user?.id) return Response.json({ error: 'unauthenticated' }, { status: 401 });

  const { id: sessionId } = await ctx.params;

  let body: Partial<CheckRequest>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }
  if (!body.kind || !KINDS.includes(body.kind) || !body.id) {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true, problemVersionId: true },
  });
  if (!session) return Response.json({ error: 'not_found' }, { status: 404 });
  // Checking someone else's session would let one learner grade against
  // another's pinned version — and read their progress.
  if (session.userId !== authed.user.id) return Response.json({ error: 'forbidden' }, { status: 403 });

  const version = await getVersionById(session.problemVersionId);
  if (!version) return Response.json({ error: 'version_missing' }, { status: 500 });

  const result = checkAnswer(version.data, {
    kind: body.kind,
    id: body.id,
    answer: body.answer,
  });

  // An id that does not exist in the pinned version was never served to this
  // learner. Record it and refuse — it is a tampering signal, not a wrong
  // answer, and scoring it as "wrong" would bury it.
  const decisionKey = `${body.kind}:${body.id}`;
  const priorAttempts = await recordAttempt(sessionId, decisionKey, body, result);

  if (result.unknown) return Response.json({ error: 'unknown_question' }, { status: 400 });

  // Only what this learner earned: the verdict, the explanation for the answer
  // they actually chose, and (on a correct dissection pick) what it unlocks.
  // The misconception code stays server-side — it is a hint in itself.
  return Response.json({
    correct: result.correct,
    why: result.why ?? null,
    unlocks: result.unlocks ?? null,
    attempt: priorAttempts + 1,
    firstTry: priorAttempts === 0,
  });
}

/**
 * Record one attempt and return how many came before it.
 *
 * Serialised per session with a Postgres advisory lock, and this is not
 * optional. The NDV verifies every field of a node in ONE Promise.all, so a
 * single "Verify setup" press fires several checks concurrently against the same
 * session. Allocating `seq` as read-MAX-then-insert let two of them read the
 * same value; `TraceEvent` has a unique index on (sessionId, seq), so one insert
 * violated it and the request 500'd. The client turns a non-ok response into
 * "could not verify" — which is why the SAME answer graded correct on one press
 * and failed on the next, seemingly at random.
 *
 * Reproduced before fixing: 2 concurrent checks → 1 failed; 6 → 2 failed.
 *
 * The attempt COUNT is inside the same lock for the same reason — two checks of
 * one id would otherwise both count zero priors and both call themselves the
 * first try, which is the number Understanding is built on.
 */
async function recordAttempt(
  sessionId: string,
  decisionKey: string,
  body: Partial<CheckRequest>,
  result: { correct: boolean; unknown?: boolean; misconception?: string }
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    // hashtext() maps the session id onto the bigint the lock API wants. Held
    // until the transaction ends, so seq allocation cannot interleave.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${sessionId}))`;

    const priorAttempts = await tx.traceEvent.count({
      where: { sessionId, type: 'decision', payload: { path: ['key'], equals: decisionKey } },
    });

    const last = await tx.traceEvent.findFirst({
      where: { sessionId },
      orderBy: { seq: 'desc' },
      select: { seq: true },
    });

    await tx.traceEvent.create({
      data: {
        sessionId,
        // Server-assigned: the client does not get to choose ordering for
        // something it is being graded on.
        seq: (last?.seq ?? 0) + 1,
        type: result.unknown ? 'suspicious_check' : 'decision',
        clientTs: new Date(),
        payload: {
          key: decisionKey,
          kind: body.kind as string,
          id: body.id as string,
          answer: body.answer ?? null,
          correct: result.correct,
          firstTry: priorAttempts === 0,
          attempt: priorAttempts + 1,
          ...(result.misconception ? { misconception: result.misconception } : {}),
        },
      },
    });

    return priorAttempts;
  });
}

// (The old unlocked nextSeq() lived here. It is gone rather than kept unused:
// leaving a racy seq allocator in the file invites the next caller to use it.)
