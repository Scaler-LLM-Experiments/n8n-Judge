// WHO this challenge is, and how it is advertised.
//
// Everything here is read before a learner commits, so it is the copy that decides
// whether they start at all.

/** Kebab-case, unique, and permanent — sessions and clip paths are keyed by it. */
export const id = 'trial-signup-desk';

/** Title case, on the card and the Understand hero. */
export const title = 'TerraTrek Gear. Free-Trial Signup Desk';

/**
 * The FULL brief. Stays complete: the problem panel, the sticky note and Ask-AI's
 * context all read this, so it must carry every detail a learner needs mid-build.
 */
// 133 words in 9 sentences, none over 25, no dashes. It was 201 words in one block.
//
// Every fact a graded decision reads survives: the four form answers (the sheet's column
// mapping is keyed by them), the USD_INR_Rate heading, one row per signup, an instant
// email naming the person and their plan, and both traps.
//
// Two things were cut deliberately rather than for length. "There is no AI step anywhere
// in this flow" answered a question the Understand quiz asks, and "it is four nodes" told
// the learner how many to place before the build began.
export const statement =
  'TerraTrek Gear takes free-trial signups through a web form. Every submission carries four answers: Full Name, Email, Plan (Basic, Plus or Pro) and Referral Source.\n\n' +
  'Today somebody copies each one into a spreadsheet, looks up the day\u2019s dollar-to-rupee rate, and types a welcome email. Build the flow that does all three on its own.\n\n' +
  'Every signup gets one row on the Signups sheet, each answer under its own heading, with the current rate in the USD_INR_Rate column. The person gets an instant welcome email naming them and their plan.\n\n' +
  'Two things make this harder than it looks. Referral Source is free text, so commas, quotes and whole sentences all have to land inside its own column. And Full Name or Referral Source can arrive blank, which must still produce a row and an email, never a stopped run.';
export const tagline =
  'Log every free-trial signup to a spreadsheet with a live exchange rate and send the welcome email, with no AI step at all.';

/**
 * The TWO-LINE version, on the Understand hero and the Home card.
 *
 * Capped at 125 characters by the schema, and the cap comes from the card — 13.5px in a
 * ~440px column, clamped to two lines, so longer copy is cut mid-word. Measured.
 */
export const brief =
  'Free-trial signups arrive on a form. Log every one to a sheet with today’s rate, and welcome the person.';

/**
 * `easy | moderate | difficult`, and roughly how long a first attempt takes.
 *
 * Sized from this problem's real decision count, not from taste: 20 scored decisions
 * (4 understand, 4 placements, 9 config, 3 stress), which is the easy / 15-min band.
 * Deliberately kept there — this is the beginner "core nodes" build, so an NDV field
 * that was not really a decision got cut rather than counted.
 */
export const difficulty = 'easy';
export const difficultyNote =
  'Four nodes, no AI and no branching. The difficulty is the order they run in and getting each answer under the right column.';
export const estimatedMinutes = 15;

/**
 * Card art. `prompt` is authored now; `src` is filled in after
 * `npm run covers:generate` writes `apps/web/public/covers/<id>.png`.
 *
 * A null `src` is a normal state — the card draws its own placeholder. The prompt is
 * production material and is stripped at the API boundary, never sent to a browser.
 *
 * Motif reserved for this case only: a loose lattice of rounded squares — a grid, for
 * the spreadsheet this flow fills. Not a chevron (email-triage), not four-point
 * sparkles (expense-approvals).
 * Palette reserved: bright lime-green into warm yellow. Not blue, not coral.
 *
 * The case spec described this subject as an isometric scene; the shared style in
 * scripts/generate-covers.mjs forbids isometric objects and asks for one abstract motif
 * family, so the scene carries across as its geometry instead — a grid, reading left to
 * right, with the empty space on the left.
 */
export const coverImage = {
  prompt:
    'Bright vivid lime-green into warm sunny yellow colour field. High-chroma spring green to golden yellow gradients, fresh and energetic, not olive, not muted. Soft spray-paint grain. A loose lattice of large soft-edged rounded squares drifting across the right half, several slightly out of focus and spaced unevenly, like a grid coming apart. Empty bright green atmosphere filling the left. No chevrons, no sparkles, no other symbols.',
  src: '/covers/trial-signup-desk.png',
  alt: 'Bright lime and yellow spray field with a soft lattice of rounded squares on the right',
};
