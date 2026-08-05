// WHO this challenge is, and how it is advertised.
//
// Everything here is read before a learner commits, so it is the copy that decides
// whether they start at all.

/** Kebab-case, unique, and permanent — sessions and clip paths are keyed by it. */
export const id = 'trial-signup-desk';

/** Title case, on the card and the Understand hero. */
export const title = 'TerraTrek Gear — Free-Trial Signup Desk';

/**
 * The FULL brief. Stays complete: the problem panel, the sticky note and Ask-AI's
 * context all read this, so it must carry every detail a learner needs mid-build.
 */
export const statement =
  'TerraTrek Gear takes free-trial signups through a web form. Every submission carries four answers: Full Name, Email, Plan (Basic, Plus or Pro) and Referral Source. Today somebody copies each signup into a spreadsheet by hand, looks up the day’s dollar-to-rupee rate so the team can quote local pricing, and types out a welcome email. Build the flow that does all three on its own. Every signup gets one row on the Signups sheet, each answer under its own column heading, with the current USD to INR rate in the USD_INR_Rate column, and the person gets an instant welcome email naming them and their plan. Two things make this harder than it looks. Referral Source is free text, so people write commas, quotes, apostrophes, whole sentences and other alphabets into it, and all of that has to land inside its own column instead of spilling into the next one. And Full Name and Referral Source can both arrive blank: a blank must still produce a logged row and a welcome email, never a stopped run. There is no AI step anywhere in this flow. It is four nodes, wired in an order that matters, with every answer mapped to the right column.';

/** One line, for the catalogue. */
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
    'Bright vivid lime-green into warm sunny yellow colour field — high-chroma spring green to golden yellow gradients, fresh and energetic, not olive, not muted. Soft spray-paint grain. A loose lattice of large soft-edged rounded squares drifting across the right half, several slightly out of focus and spaced unevenly, like a grid coming apart. Empty bright green atmosphere filling the left. No chevrons, no sparkles, no other symbols.',
  src: null,
  alt: 'Bright lime and yellow spray field with a soft lattice of rounded squares on the right',
};
