// What one voice clip is called, and where it is served from.
//
// ---------------------------------------------------------------------------
// A name in two halves, and why
// ---------------------------------------------------------------------------
// A clip's file name is `<folder>/<id>--<fingerprint>.mp3`, e.g.
//
//   shared/verify-pass--classify--classify-with-ai--v0--a1b2c3d4.mp3
//
// The two halves are produced in completely different ways, and that is the whole
// point:
//
//   the ID is DERIVED, by the generator and the browser alike, from things both
//   already hold (a moment, a key, the filled variable, which variant);
//
//   the FINGERPRINT is NOT derived at runtime. It is computed once, by the
//   generator, from the sentence itself, and written into the problem's script
//   table (voice-scripts/<problem>.json). Playback looks it up. It is never
//   recomputed in a browser.
//
// Each half fixes a bug the previous scheme had.
//
// The ID fixes a silent mismatch. The old path took its variables from `vars` but
// the enumeration kept `key` OUTSIDE `vars`, so the browser asked for
// `node-placed--classify--classify-with-ai--v0.mp3` while the generator had stored
// `node-placed--classify-with-ai--v0.mp3`. Every node, verify and answer clip
// therefore missed storage — and the serving route's response to a miss was to call
// ElevenLabs and render it live. That is where the latency, the vendor spend and a
// large part of the S3 traffic came from. The key is now part of the id, and one
// function builds it for both sides.
//
// The FINGERPRINT fixes staleness. Clips are served `immutable` with a one-year
// cache, so a stable name means a reworded line keeps its old audio in every
// learner's browser for a year, with no way to reach in and clear it. Because the
// name now contains a hash of the sentence, rewording produces a different file:
// the browser has never seen it, fetches it, and untouched lines stay cached. It
// also removes the need for a separate staleness manifest, and gives the serving
// route a free ETag.
//
// Two different sentences can no longer share a name, which used to happen 17 times
// across the catalogue.

/**
 * The folder for a line no single problem owns.
 *
 * Every clip used to be filed under its problem, which meant the lines that are
 * word-for-word identical across the catalogue were rendered — and BILLED — once per
 * problem. A problem owns a line only when it AUTHORED that line via `problem.voice`;
 * everything still on the default wording lives here, once. The decision itself is
 * `clipScope` in voiceLines.js, which is the only place that judgement is made.
 */
export const SHARED_SCOPE = 'shared';

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
 * The readable identity of one line — no folder, no fingerprint, no extension.
 *
 * This doubles as the key in the problem's script table, so a human can open
 * voice-scripts/order-desk.json and read what Iris says at any moment by name.
 *
 * Everything that changes WHICH SENTENCE this is goes in, and nothing that does not.
 * `vars.scope` is deliberately absent: it routes variant selection in the browser
 * and has no bearing on the words.
 *
 * @param moment   e.g. 'verify_pass'
 * @param key      the node type or question id this line is about, or null
 * @param vars     { node, answer } — whatever the line interpolates
 * @param variant  which authored wording
 */
export function clipId(moment, key, vars = {}, variant = 0) {
  const parts = [slugify(moment), slugify(key), slugify(vars.node || vars.answer)].filter(Boolean);
  return `${parts.join('--')}--v${variant}`;
}

/**
 * Where one line's audio is stored.
 *
 * Note this is NOT `clipId` plus an extension, and the difference is deliberate.
 *
 *   the ID identifies a MOMENT — "the verify-pass line for the classify node" — and
 *   has to be unique, because it is how the browser looks a line up;
 *
 *   the FILE identifies AUDIO, and audio is the same audio whenever the sentence is
 *   the same. The generic "Take your time" plays at a dozen different moments; it is
 *   one recording, and paying to render it a dozen times is exactly the waste this
 *   pipeline exists to remove.
 *
 * So many ids can point at one file. The fingerprint carries the sentence, and the
 * moment prefix is there purely so the bucket stays browsable by a human — the
 * reason a bare content hash was rejected in the first place.
 *
 * @param scope        problem slug, or '' for a line nobody authored (see SHARED_SCOPE)
 * @param moment       e.g. 'verify_pass'
 * @param fingerprint  short hash of the sentence — from the script table, never recomputed here
 */
export function clipFile(scope, moment, fingerprint) {
  return `${slugify(scope) || SHARED_SCOPE}/${slugify(moment)}--${fingerprint}.mp3`;
}

/**
 * Where clips are served from.
 *
 * This app's own route, deliberately. Narration explains correct answers, so the
 * endpoint is authenticated and responds `Cache-Control: private` — which also means
 * it cannot sit behind a shared cache without either dropping that check or moving to
 * signed URLs. Repeat plays cost nothing anyway: each learner's browser keeps every
 * clip for a year, and the server keeps one copy on local disk for everybody.
 */
function clipBase() {
  const base = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_VOICE_CDN_BASE : null;
  return base ? String(base).replace(/\/+$/, '') : '/api/voice/clip';
}

/**
 * A stored file, as a URL the browser can fetch and cache.
 *
 * Takes the file VERBATIM from the script table rather than rebuilding it, because
 * rebuilding it is exactly how the browser and the generator drifted apart before.
 */
export function clipUrl(file) {
  return `${clipBase()}/${file}`;
}

/**
 * What the route accepts: one folder, one file, an mp3, nothing that could climb out
 * of the prefix. Note this is only a shape check — the route additionally refuses any
 * path that is not listed in a committed script table, so a well-formed but unknown
 * name never reaches storage.
 */
export const SAFE_CLIP_PATH = /^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*\.mp3$/;
