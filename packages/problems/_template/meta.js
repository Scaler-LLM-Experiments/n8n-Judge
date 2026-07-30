// WHO this challenge is, and how it is advertised.
//
// Everything here is read before a learner commits, so it is the copy that decides
// whether they start at all.

/** Kebab-case, unique, and permanent — sessions and clip paths are keyed by it. */
export const id = 'TODO-slug';

/** Title case, on the card and the Understand hero. */
export const title = 'TODO Title';

/**
 * The FULL brief. Stays complete: the problem panel, the sticky note and Ask-AI's
 * context all read this, so it must carry every detail a learner needs mid-build.
 */
export const statement = 'TODO. What the learner is building, and the decisions it involves.';

/** One line, for the catalogue. */
export const tagline = 'TODO one-line summary.';

/**
 * The TWO-LINE version, on the Understand hero and the Home card.
 *
 * Capped at 125 characters by the schema, and the cap comes from the card — 13.5px in a
 * ~440px column, clamped to two lines, so longer copy is cut mid-word. Measured.
 */
export const brief = 'TODO. The situation in one sentence, then what the learner must make happen.';

/**
 * `easy | moderate | difficult`, and roughly how long a first attempt takes.
 *
 * Authored, not derived — a promise to someone deciding whether to start now. Size it
 * from the problem's real decision count rather than guessing:
 *   npx tsx -e "import {enumerateItems} from './packages/engine/rubric.ts'; \
 *     import {problems} from './packages/problems/index.js'; \
 *     console.log(enumerateItems(problems['TODO-slug']))"
 * For reference: 14 decisions is easy/15 min, 30 is moderate/25 min, 61 is difficult/45 min.
 */
export const difficulty = 'moderate';
export const difficultyNote = 'TODO. One line on why it earns that label.';
export const estimatedMinutes = 25;

/**
 * Card art. `prompt` is authored now; `src` is filled in after
 * `npm run covers:generate` writes `apps/web/public/covers/<id>.png`.
 *
 * A null `src` is a normal state — the card draws its own placeholder. The prompt is
 * production material and is stripped at the API boundary, never sent to a browser.
 * Keep it wide, sparse and left-to-right: the slot is 2:1 and a node setup reads that way.
 */
export const coverImage = {
  prompt: 'TODO. A wide, sparse, left-to-right scene. Style comes from scripts/generate-covers.mjs.',
  src: null,
  alt: 'TODO. What the picture shows, for a screen reader.',
};
