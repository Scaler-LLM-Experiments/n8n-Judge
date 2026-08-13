import { z } from 'zod';
import { auth } from '../../../../../auth';
import { prisma } from '@judge/db';

// The learner's rating of the whole challenge: 1–5 stars plus an optional
// comment, collected on the Result screen.
//
// Additive telemetry, deliberately decoupled from grading:
//   - it is NOT a `TraceEvent`, so the rubric never replays it and it cannot
//     move a score. That is also why this route takes no per-session advisory
//     lock: it writes one row in its own table, not into the `(sessionId, seq)`
//     space that `/check` and `/events` contend for.
//   - a failure here is answered with `ok: false` rather than an error the
//     screen has to handle. The client already holds a localStorage copy and
//     treats the call as fire-and-forget; a learner must never see their report
//     break because they rated it.
//
// One row per attempt, upserted: a star click writes immediately, then the
// comment arrives on Send or on blur, and both update the same row.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(4000).optional().nullable(),
});

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

  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'invalid_rating' }, { status: 400 });

  // The session is the only thing that says WHICH challenge and WHOSE rating
  // this is — neither is read from the request. Rating someone else's attempt
  // would put words in their mouth in the admin panel.
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true },
  });
  if (!session) return Response.json({ error: 'not_found' }, { status: 404 });
  if (session.userId !== authed.user.id) return Response.json({ error: 'forbidden' }, { status: 403 });

  const comment = parsed.data.comment?.trim() ? parsed.data.comment.trim() : null;

  try {
    await prisma.rating.upsert({
      where: { sessionId },
      create: { sessionId, userId: session.userId, stars: parsed.data.rating, text: comment },
      update: { stars: parsed.data.rating, text: comment },
    });
    return Response.json({ ok: true });
  } catch (err) {
    // A genuine database error is ours to see in the log and not the learner's
    // to be shown: the screen is already rendered and the score is already safe.
    console.error('[rating] write failed', err);
    return Response.json({ ok: false });
  }
}
