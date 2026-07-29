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
        // Card-level too: the badge is part of choosing, so it cannot wait for the
        // full problem fetch that happens after a learner has already committed.
        difficulty: data.difficulty ?? null,
        difficultyNote: data.difficultyNote ?? null,
        version: p.versions[0]?.version ?? null,
      };
    });

    return Response.json({ problems: items });
  } catch (err) {
    console.error('[api/problems] failed:', err);
    return Response.json({ error: 'problems_unavailable' }, { status: 503 });
  }
}
