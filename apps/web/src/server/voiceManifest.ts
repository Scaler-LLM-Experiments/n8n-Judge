import { createHash } from 'node:crypto';
import { readClip, writeClip } from './voiceStore';

// What each stored clip was rendered FROM, so a reworded line regenerates itself
// and nothing else does.
//
// ---------------------------------------------------------------------------
// Why this exists
// ---------------------------------------------------------------------------
// Clips used to be content-addressed: the key was a hash of voice + model + text,
// so editing a line changed its key and the old audio was simply never requested
// again. Correct, and completely automatic. It was dropped for slug paths
// (`email-triage/verify-pass--classify--v0.mp3`) because a hash cannot be cached
// under a readable URL, cannot be browsed in the bucket, and cannot be reasoned
// about by a human — see voicePath.js.
//
// The cost of that trade was invalidation. A slug path does NOT change when the
// words do, so a reworded line kept its old audio, silently, until somebody
// remembered to re-run generation with --force. Iris would say the previous
// version of a sentence and nothing anywhere would disagree.
//
// So: keep the readable path, and keep the hash beside it. The manifest maps clip
// path to a hash of exactly what produced the audio, which restores the property
// that matters — one line edited costs one render, and an unchanged line costs
// nothing — without giving up the URL.
//
// ---------------------------------------------------------------------------
// What it replaces, operationally
// ---------------------------------------------------------------------------
// It also removes almost all of generation's bookkeeping traffic. Deciding what to
// render used to mean asking the bucket about every clip, one request each. With a
// manifest that is one GET for the whole problem: a path whose recorded hash still
// matches is known to be current without asking storage anything.
//
// Maintained by the generator only. The playback route's self-heal (a clip missing
// at play time) does not touch it: that would be a read-modify-write of shared
// JSON on a cache miss, racing every other miss, to save one render on the next
// generation run. Not worth it.

/** One manifest per problem, so two problems never contend on the same object. */
export function manifestPath(problem: string): string {
  return `_manifest/${problem}.json`;
}

/**
 * The identity of a rendered clip: everything that changes the audio.
 *
 * Voice and model are in here, not just the text, because switching either one
 * makes every existing clip wrong in the same way a rewrite does — and that is
 * exactly the case where re-rendering everything IS the correct behaviour.
 */
export function clipHash(spoken: string, voiceId: string, modelId: string): string {
  return createHash('sha256').update(`${voiceId}\n${modelId}\n${spoken}`).digest('hex').slice(0, 32);
}

export type Manifest = Record<string, string>;

/** The recorded hashes for a problem. An absent or corrupt manifest reads as empty. */
export async function readManifest(problem: string): Promise<Manifest> {
  const bytes = await readClip(manifestPath(problem));
  if (!bytes) return {};
  try {
    const parsed = JSON.parse(bytes.toString('utf8'));
    return parsed && typeof parsed === 'object' ? (parsed as Manifest) : {};
  } catch {
    // A manifest we cannot read is treated as absent rather than fatal: the worst
    // outcome is that generation falls back to asking storage, which is what it
    // did before this file existed.
    return {};
  }
}

/** Persist a manifest. Returns whether it landed. */
export async function writeManifest(problem: string, manifest: Manifest): Promise<boolean> {
  const sorted: Manifest = {};
  // Key-sorted so a re-write with no changes produces identical bytes. Same reason
  // publishProblem sorts before comparing: unordered JSON makes every write look
  // like a change.
  for (const key of Object.keys(manifest).sort()) sorted[key] = manifest[key];
  return writeClip(manifestPath(problem), Buffer.from(`${JSON.stringify(sorted, null, 0)}\n`, 'utf8'));
}

export type ClipState = 'current' | 'stale' | 'unknown';

/**
 * What the manifest knows about one clip, without touching storage.
 *
 *   current  the recorded hash matches, so the stored audio is this exact sentence
 *   stale    a hash is recorded and it is DIFFERENT, so the words changed
 *   unknown  nothing recorded; storage has to be asked
 *
 * `unknown` is the state every clip is in the first time this runs, which is why
 * adoption exists — see `adopt` in the generate route.
 */
export function clipState(manifest: Manifest, path: string, hash: string): ClipState {
  const recorded = manifest[path];
  if (!recorded) return 'unknown';
  return recorded === hash ? 'current' : 'stale';
}

/** The problem a clip path belongs to (its first segment). */
export function problemOfPath(path: string): string {
  return path.split('/')[0] ?? 'shared';
}
