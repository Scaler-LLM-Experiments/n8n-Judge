import { createHash } from 'node:crypto';
import { enumerateSpeakable } from '../lib/voiceCatalogue.js';
import { clipFile, clipId } from '../lib/voicePath.js';

// Everything Iris says for one problem, as one flat table.
//
// ---------------------------------------------------------------------------
// Why a table exists at all
// ---------------------------------------------------------------------------
// A clip used to be found by DERIVING its path on both sides — once in the
// generator, once in the browser. Two derivations of the same rule is one rule too
// many: they drifted, the browser asked for names that were never stored, and the
// serving route answered a miss by calling the TTS vendor during the learner's session.
//
// So the generator writes down what it made, and everyone else reads that. The
// browser still derives the readable ID (it must — it knows the moment and the node
// at play time and nothing else), but the FILE comes out of this table. An id that
// is not in the table is a caption, not a vendor call.
//
// It is also a script in the ordinary sense: open voice-scripts/order-desk.json and
// you can read every line Iris speaks for that problem, in one place, and review the
// copy without running anything.
//
// Written by scripts/generate-voice.mjs and committed. Nothing computes it at
// runtime, in the browser or on the server.

/** Bumped only if the shape below changes in a way a reader has to care about. */
export const SCRIPT_VERSION = 1;

/**
 * The identity of a rendered clip: everything that changes the audio.
 *
 * The model is folded in, not just the text, because a Deepgram Aura model IS the
 * voice (`aura-2-helena-en` names the speaker, not a quality tier). Switching it
 * makes every existing clip wrong in exactly the way a rewrite does — and that is
 * the one case where re-rendering the whole library IS correct.
 *
 * Eight hex characters. Short enough to keep the file name readable, wide enough
 * that an accidental clash across a few hundred clips is not a real concern.
 */
export function fingerprint(text, model) {
  return createHash('sha256').update(`${model}\n${text}`).digest('hex').slice(0, 8);
}

/**
 * Build one problem's table.
 *
 * @param problem  the problem object (needs `id`, and whatever `enumerateSpeakable` reads)
 * @param catalog  NODE_CATALOG, for node labels
 * @param voice    { model } the Deepgram model the clips will be rendered with
 */
export function buildScript(problem, catalog, { model }) {
  const clips = {};

  for (const item of enumerateSpeakable(problem, catalog)) {
    for (const variant of item.variants) {
      const id = clipId(item.moment, item.key, item.vars, variant.index);

      // `caption`, not `spoken` — the tag-free sentence.
      //
      // The phrase book annotates delivery with `[warm]`, `[calm]` and friends. Those
      // were ElevenLabs v3 audio tags; Deepgram has no equivalent and would simply
      // READ THEM ALOUD. So what goes to the vendor is the sentence a learner reads,
      // which has the pleasant side effect that the audio and the on-screen caption
      // are now provably the same words.
      const text = variant.caption;

      // Two different sentences under one id would mean one silently overwrites the
      // other and a learner hears the wrong explanation — which is exactly what the
      // previous scheme did 17 times. Loud here, at authoring time, is the only
      // place it can be caught cheaply.
      const existing = clips[id];
      if (existing && existing.text !== text) {
        throw new Error(
          `voice: two different lines want the id "${id}" in ${problem?.id}:\n` +
            `  ${existing.text}\n  ${text}`
        );
      }

      clips[id] = {
        text,
        // Two things collapse here, and both are money.
        //
        // `item.scope` is '' for a line nobody authored, so the catalogue's generic
        // lines are filed under `shared/` and rendered once rather than once per
        // problem. And the file is keyed by the SENTENCE, not by the id, so the same
        // words reached from several moments are one recording — "Take your time"
        // does not get rendered separately for every node it can follow.
        file: clipFile(item.scope, item.moment, fingerprint(text, model)),
      };
    }
  }

  // Key-sorted, so regenerating with no changes produces byte-identical JSON and the
  // diff is empty. Same reason publishProblem sorts before comparing.
  const sorted = {};
  for (const id of Object.keys(clips).sort()) sorted[id] = clips[id];

  return {
    version: SCRIPT_VERSION,
    problem: problem?.id ?? null,
    renderedWith: `deepgram/${model}`,
    clips: sorted,
  };
}

/**
 * Every distinct file a set of tables refers to, mapped to the sentence it holds.
 *
 * This is what the generator renders and what the sync uploads. Shared lines appear
 * in several tables and collapse here, which is the saving.
 */
export function filesFrom(tables) {
  const files = new Map();
  for (const table of tables) {
    for (const clip of Object.values(table.clips ?? {})) files.set(clip.file, clip.text);
  }
  return files;
}
