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
  return {
    ...body.data,
    problemVersionId: body.problemVersionId,
    version: body.version,
    // The clip table for this problem: line id -> { text, file }. The voice player
    // looks a file up here and never builds one, so it can only ever request audio
    // that was actually rendered. Absent means captions only, which is a normal
    // state (no voice generated yet) rather than an error.
    voiceClips: body.voiceClips ?? null,
  };
}

// `?problem=<slug>` from either the hash or the query string. Dev routes use
// the hash form; returns null so callers can fall back to the first published
// problem rather than assuming one.
export function slugFromUrl() {
  if (typeof window === 'undefined') return null;
  const m = `${window.location.hash || ''}&${window.location.search || ''}`.match(/[?&]problem=([\w-]+)/);
  return m ? m[1] : null;
}

// The other direction: put the challenge the learner is in INTO the address bar,
// so a link to it can be copied out and sent.
//
// The whole journey is one client-side page — picking a challenge is React state,
// which means the URL says `/` from Home to Result unless something writes to it.
// Pure and separate from the browser call below so it can be tested without a DOM
// (vitest runs on `node` here).
//
// Only `problem` is touched. The hash is preserved because the dev routes live
// there, and any other query param because nothing here owns it.
export function urlWithSlug(href, slug) {
  const url = new URL(href);
  if (slug) url.searchParams.set('problem', slug);
  else url.searchParams.delete('problem');
  return `${url.pathname}${url.search}${url.hash}`;
}

// `replace` for the link the learner arrived on (there is nothing to go back to,
// and a pushState there would make Back a no-op); `push` for a card click, so
// Back leaves the challenge and returns to Home.
export function writeSlugToUrl(slug, { replace = false } = {}) {
  if (typeof window === 'undefined') return;
  const next = urlWithSlug(window.location.href, slug);
  window.history[replace ? 'replaceState' : 'pushState']({ problem: slug ?? null }, '', next);
}
