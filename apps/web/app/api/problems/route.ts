import { prisma } from '@judge/db';

// The challenge list. Serves only PUBLISHED versions, so an in-progress draft
// never leaks to a learner. Once auth lands (M1 step 2) this filters by the
// caller's batch/program via ProblemAssignment; until then it returns
// everything published.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const problems = await prisma.problem.findMany({
      where: { currentPublishedVersionId: { not: null } },
      orderBy: { createdAt: 'asc' },
      include: {
        versions: { where: { status: 'PUBLISHED' }, orderBy: { version: 'desc' }, take: 1 },
      },
    });

    // The list only needs card-level fields — don't ship every problem's full
    // data object (nodeSetup, probes, answers) just to render a home screen.
    const items = problems.map((p) => {
      const data = (p.versions[0]?.data ?? {}) as Record<string, unknown>;
      return {
        id: p.slug,
        slug: p.slug,
        title: p.title,
        tagline: data.tagline ?? null,
        // The card's own copy. Two lines by construction (the schema caps `brief`
        // at 180 characters), so a card cannot grow a paragraph and knock the CTA
        // out of line with the card next to it.
        brief: data.brief ?? null,
        // Card-level too: the badge, the duration and the cover are all part of
        // CHOOSING, so none of them can wait for the full problem fetch that only
        // happens once a learner has already committed to a challenge.
        difficulty: data.difficulty ?? null,
        difficultyNote: data.difficultyNote ?? null,
        estimatedMinutes: data.estimatedMinutes ?? null,
        // `src` only. The authored prompt is production material for generating the
        // art later and has no business in a learner's browser.
        coverImage: (() => {
          const art = data.coverImage as { src?: string | null; alt?: string } | undefined;
          if (!art) return null;
          return { src: art.src ?? null, alt: art.alt ?? null };
        })(),
        version: p.versions[0]?.version ?? null,
      };
    });

    return Response.json({ problems: items });
  } catch (err) {
    console.error('[api/problems] failed:', err);
    return Response.json({ error: 'problems_unavailable' }, { status: 503 });
  }
}
