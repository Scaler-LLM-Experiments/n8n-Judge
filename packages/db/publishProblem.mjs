// Publishing a problem version, without ever editing one.
//
// Extracted from seed.mjs so it can be exercised directly (seed.mjs runs its
// work at import time, so importing it to test one function runs the whole
// seed), and because M5's authoring pipeline needs exactly this operation.
//
// The rule this enforces: a ProblemVersion is immutable once written. A Session
// pins the version it started against, and the web server caches versions with
// NO invalidation precisely because they cannot change. Editing a version in
// place silently rewrites what "correct" means underneath anyone mid-attempt and
// leaves every running server serving a stale copy from cache.

/**
 * Key-sorted serialisation, for comparing an in-repo problem against a stored
 * one. Plain JSON.stringify will not do: Postgres `jsonb` does not preserve key
 * order, so a round-tripped object reorders and every publish would look like a
 * change.
 */
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value === undefined ? null : value);
}

/**
 * Publish `p` for the problem row with this slug, appending a version when the
 * content differs from what is currently published.
 *
 * @returns {Promise<{version:number, status:string, changed:boolean, archived:number|null}>}
 */
export async function publishProblem(prisma, p, { authoredBy = 'seed' } = {}) {
  const problem = await prisma.problem.upsert({
    where: { slug: p.id },
    update: { title: p.title },
    create: { slug: p.id, title: p.title },
  });

  const published = await prisma.problemVersion.findFirst({
    where: { problemId: problem.id, status: 'PUBLISHED' },
    orderBy: { version: 'desc' },
  });

  if (published && canonical(published.data) === canonical(p)) {
    return { version: published.version, status: 'PUBLISHED', changed: false, archived: null };
  }

  const highest = await prisma.problemVersion.findFirst({
    where: { problemId: problem.id },
    orderBy: { version: 'desc' },
    select: { version: true },
  });

  const version = await prisma.problemVersion.create({
    data: {
      problemId: problem.id,
      version: (highest?.version ?? 0) + 1,
      status: 'PUBLISHED',
      data: p,
      authoredBy,
    },
  });

  // Archive rather than delete: a Session may still be pinned to it, and its
  // GradingReports cite it.
  if (published) {
    await prisma.problemVersion.update({ where: { id: published.id }, data: { status: 'ARCHIVED' } });
  }

  await prisma.problem.update({
    where: { id: problem.id },
    data: { currentPublishedVersionId: version.id },
  });

  return {
    version: version.version,
    status: 'PUBLISHED',
    changed: true,
    archived: published?.version ?? null,
  };
}
