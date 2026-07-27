// Problems come from the database, not a bundled registry. The list endpoint
// returns card-level fields only; the full data object (nodeSetup, probes,
// answers) arrives per-problem when a journey actually starts.
//
// There is deliberately no fallback to the in-repo @judge/problems registry.
// A silent fallback would let a broken database look like a working app, and
// would serve a learner content that differs from what the server will grade
// them against.

export async function fetchProblemList() {
  const res = await fetch('/api/problems', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not load challenges (${res.status})`);
  const body = await res.json();
  return body.problems ?? [];
}

// Returns the problem data object, with the version it came from attached.
// `problemVersionId` is what a Session pins so republishing never changes a
// journey that is already under way.
export async function fetchProblem(slug) {
  const res = await fetch(`/api/problems/${encodeURIComponent(slug)}`, { cache: 'no-store' });
  if (res.status === 404) throw new Error(`No published challenge called "${slug}".`);
  if (!res.ok) throw new Error(`Could not load "${slug}" (${res.status})`);
  const body = await res.json();
  return { ...body.data, problemVersionId: body.problemVersionId, version: body.version };
}

// `?problem=<slug>` from either the hash or the query string. Dev routes use
// the hash form; returns null so callers can fall back to the first published
// problem rather than assuming one.
export function slugFromUrl() {
  if (typeof window === 'undefined') return null;
  const m = `${window.location.hash || ''}&${window.location.search || ''}`.match(/[?&]problem=([\w-]+)/);
  return m ? m[1] : null;
}
