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

const KINDS: CheckKind[] = ['dissection', 'field', 'setting', 'probe', 'stress'];

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
  const priorAttempts = await prisma.traceEvent.count({
    where: { sessionId, type: 'decision', payload: { path: ['key'], equals: decisionKey } },
  });

  await prisma.traceEvent.create({
    data: {
      sessionId,
      // Server-assigned: the client does not get to choose ordering for
      // something it is being graded on.
      seq: await nextSeq(sessionId),
      type: result.unknown ? 'suspicious_check' : 'decision',
      clientTs: new Date(),
      payload: {
        key: decisionKey,
        kind: body.kind,
        id: body.id,
        answer: body.answer ?? null,
        correct: result.correct,
        firstTry: priorAttempts === 0,
        attempt: priorAttempts + 1,
        ...(result.misconception ? { misconception: result.misconception } : {}),
      },
    },
  });

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

async function nextSeq(sessionId: string): Promise<number> {
  const last = await prisma.traceEvent.findFirst({
    where: { sessionId },
    orderBy: { seq: 'desc' },
    select: { seq: true },
  });
  return (last?.seq ?? 0) + 1;
}
