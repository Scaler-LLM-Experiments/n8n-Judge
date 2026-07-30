import { prisma } from '@judge/db';
import { toPublicProblem } from '@judge/problem-schema';
import { voiceScriptFor } from '@judge/voice-scripts';

// One problem's full published data — the object the journey is driven by.
// Returns the version id alongside it so a Session can pin the exact version
// it started against (republishing must never change a running session).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  try {
    const problem = await prisma.problem.findUnique({
      where: { slug },
      include: {
        versions: { where: { status: 'PUBLISHED' }, orderBy: { version: 'desc' }, take: 1 },
      },
    });

    if (!problem) return Response.json({ error: 'not_found' }, { status: 404 });

    const published = problem.versions[0];
    if (!published) return Response.json({ error: 'not_published' }, { status: 404 });

    return Response.json({
      slug: problem.slug,
      title: problem.title,
      version: published.version,
      problemVersionId: published.id,
      // The public projection: every marker of a correct answer is stripped
      // here. Verdicts come from POST /api/sessions/[id]/check instead, which
      // also records the attempt. Serving `published.data` raw put the whole
      // answer key one devtools fetch away.
      data: toPublicProblem(published.data as Record<string, unknown>),
      // Which audio file each of Iris's lines lives in.
      //
      // Sent with the problem rather than fetched separately: it is the request the
      // journey already makes, it is already authenticated, and it keeps the table
      // scoped to the one problem being played. The browser looks a file up here —
      // it never derives one. Deriving it on both sides is exactly how the player
      // and the generator drifted apart, and the old cost of a miss was a live
      // Deepgram render inside the learner's session.
      //
      // No new exposure: the phrase book already ships in the client bundle, so this
      // adds file names, not words. A line with no entry simply plays as a caption
      // and makes no request at all.
      //
      // Null when voice has not been generated for this problem yet, which is a
      // normal state and reads as "captions only".
      voiceClips: voiceScriptFor(slug)?.clips ?? null,
    });
  } catch (err) {
    console.error(`[api/problems/${slug}] failed:`, err);
    return Response.json({ error: 'problem_unavailable' }, { status: 503 });
  }
}
