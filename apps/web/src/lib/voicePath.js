// The URL of one voice clip.
//
// ---------------------------------------------------------------------------
// Why this replaced a query API and a content hash
// ---------------------------------------------------------------------------
// Narration was slow, and the cause was the transport, not the vendor.
//
// The old design served clips from `GET /api/voice?moment=…` with
// `Cache-Control: no-store`, and the client fetched them with `fetch()`, awaited
// `res.blob()`, then made an object URL. Three separate problems, each fatal on its
// own:
//
//   1. `no-store` on a query URL means the browser can NEVER reuse a clip. Every
//      play was a server round trip, including the twentieth play of "Correct."
//   2. `await res.blob()` waits for the WHOLE file before playback can start. An
//      `<audio>` element pointed at a URL starts after a few KB and streams the
//      rest, which is what makes it feel instant.
//   3. A hand-rolled warm cache in JS was reimplementing the HTTP cache, worse,
//      and losing it on every navigation.
//
// So: a stable, human-readable path per clip, served immutable, and the client just
// does `new Audio(url)`. The browser handles caching, streaming, range requests and
// eviction — all of it better than the JS ever did.
//
// It also answers "should the clips have slugs": yes. A path like
//   email-triage/verify_pass--classify--classify-with-ai--v0.mp3
// is greppable in the bucket, and the caption comes from the local phrase book, so
// the client no longer needs a round trip just to learn what is being said.
//
// The cost of dropping the content hash: editing a line does NOT change its path,
// so a reworded line keeps its old audio until regenerated. `npm run voice:generate
// -- --force` exists for that, and it is the right trade — the hash bought
// automatic invalidation at the price of an uncacheable, unbrowsable URL.

/** Lowercase, alphanumerics and single dashes. Safe in a path and in S3. */
export function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\{\{|\}\}/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/**
 * The path for one clip, relative to the audio root.
 *
 * Deterministic from things the CLIENT already knows, which is the point: no
 * request is needed to work out what to play.
 *
 * @param problem  slug, or '' for a line that is not problem-specific
 * @param moment   e.g. 'verify_pass'
 * @param vars     { key, node, answer } — whatever the line interpolates
 * @param variant  which authored wording
 */
export function clipPath(problem, moment, vars = {}, variant = 0) {
  // Only the variables that change the words. `scope` is routing, not content.
  const parts = [slugify(vars.key), slugify(vars.node || vars.answer)].filter(Boolean);
  const tail = parts.length ? `--${parts.join('--')}` : '';
  const dir = slugify(problem) || 'shared';
  return `${dir}/${slugify(moment)}${tail}--v${variant}.mp3`;
}

/**
 * Where clips are served from.
 *
 * Defaults to this app's own route. `NEXT_PUBLIC_VOICE_CDN_BASE` points playback at
 * a CDN instead, which is the one remaining structural cost in this path: today
 * every learner's first play of a clip is an S3 GET whose bytes transit the Next
 * server, so the app is on the byte path for all narration egress. A distribution
 * in front collapses that to one origin fetch per clip per edge TTL, and needs no
 * invalidation strategy because the paths are already served `immutable`.
 *
 * NOT free, and the reason it is off by default: this route is AUTHENTICATED and
 * responds `Cache-Control: private`, both deliberately. Narration includes
 * explanations of correct answers, so an open clip endpoint is an answer key
 * anybody can enumerate. A shared cache in front of it means either dropping that
 * check or moving to signed URLs. Set this only alongside that decision.
 */
function clipBase() {
  const base = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_VOICE_CDN_BASE : null;
  return base ? String(base).replace(/\/+$/, '') : '/api/voice/clip';
}

/** Same path, as a URL the browser can fetch and cache. */
export function clipUrl(problem, moment, vars, variant) {
  return `${clipBase()}/${clipPath(problem, moment, vars, variant)}`;
}

/**
 * What the route accepts. Mirrors the reference implementation's guard: two
 * segments, an mp3, nothing that could climb out of the prefix.
 */
export const SAFE_CLIP_PATH = /^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*\.mp3$/;
