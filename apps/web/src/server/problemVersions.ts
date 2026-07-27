import { prisma } from '@judge/db';

// In-memory cache of pinned ProblemVersions.
//
// Safe with NO invalidation, and the reason matters: a ProblemVersion is
// immutable BY CONSTRUCTION. Publishing creates a new version row and moves
// the pointer; it never edits an existing one, and a Session pins the version
// it started against. So a cached row can never go stale, and two server
// instances holding their own copies cannot disagree.
//
// If anyone ever makes versions editable in place, this breaks silently — that
// is what this comment is here to prevent.
//
// The point is that checking an answer does not hit Postgres. Only the first
// request for a given version does.

interface CachedVersion {
  id: string;
  version: number;
  problemId: string;
  slug: string;
  data: Record<string, unknown>;
}

const cache = new Map<string, CachedVersion>();

export async function getVersionById(id: string): Promise<CachedVersion | null> {
  const hit = cache.get(id);
  if (hit) return hit;

  const row = await prisma.problemVersion.findUnique({ where: { id }, include: { problem: true } });
  if (!row) return null;

  const entry: CachedVersion = {
    id: row.id,
    version: row.version,
    problemId: row.problemId,
    slug: row.problem.slug,
    data: row.data as Record<string, unknown>,
  };
  cache.set(entry.id, entry);
  return entry;
}

/** The currently published version of a problem, by slug. */
export async function getPublishedVersion(slug: string): Promise<CachedVersion | null> {
  const problem = await prisma.problem.findUnique({
    where: { slug },
    include: { versions: { where: { status: 'PUBLISHED' }, orderBy: { version: 'desc' }, take: 1 } },
  });
  const published = problem?.versions[0];
  if (!problem || !published) return null;

  const entry: CachedVersion = {
    id: published.id,
    version: published.version,
    problemId: problem.id,
    slug: problem.slug,
    data: published.data as Record<string, unknown>,
  };
  cache.set(entry.id, entry);
  return entry;
}

/** Test/dev hook — never needed in production, since versions are immutable. */
export function __clearVersionCache() {
  cache.clear();
}
