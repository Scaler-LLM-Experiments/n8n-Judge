// Everything Iris says, and when.
//
// One phrase book, shared by the server (which renders the audio) and the client
// (which shows the caption), so the words you hear and the words you read can
// never drift apart.
//
// ---------------------------------------------------------------------------
// The writing rules. These are the feature.
// ---------------------------------------------------------------------------
// The audience is a non-technical learner reading in simple English, often not
// their first language. So:
//
//   * Short sentences. One idea each.
//   * Plain words. No idioms, no "let's dive in", no "nailed it".
//   * No em dashes. They do not read out loud and they slow a reader down.
//   * Calm and matter of fact. A patient colleague, not a cheerleader. "That is
//     right" lands better than "Amazing work!!" and survives being heard twenty
//     times in one session.
//   * Five to seven seconds spoken. Longer than that and the line is still
//     talking after the moment it was describing has passed.
//   * NEVER give the answer. Same rule as Ask AI. Iris says what happened and
//     what it means, never which option to pick. On a wrong answer she points at
//     where to look.
//
// Square brackets are ElevenLabs v3 audio tags. They shape delivery and are NOT
// spoken. `captionFor` strips them, so the caption is the clean sentence.
//
// Several lines per moment where a learner will hear it repeatedly. Verifying
// eight fields and hearing one identical sentence eight times is what makes
// narration feel like a machine.

/** @type {Record<string, string[]>} */
export const LINES = {
  // ---- arriving -----------------------------------------------------------
  welcome: [
    '[warm] Hello. I am Iris. I will stay with you through this one.',
    '[warm] Hi there. I am Iris. We will build this together, one step at a time.',
  ],
  problem_intro: [
    '[calm] This is the problem for today. Read it slowly. Then we will break it into parts.',
    '[calm] Here is what we have to build. Take a minute with it. Then we start.',
  ],
  understand_start: [
    '[calm] First, a few questions. I want to be sure the flow makes sense to you before you build it.',
  ],

  // ---- answering ----------------------------------------------------------
  answer_correct: [
    '[warm] That is right.',
    '[warm] Correct.',
    '[warm] Yes, that is the one.',
  ],
  answer_wrong: [
    '[calm] Not this one. Read what I wrote below, then try again.',
    '[calm] That is a fair guess, but no. Have a look at why.',
    '[thoughtful] Not quite. The reason is just below. Read it and pick again.',
  ],
  understand_done: [
    '[warm] Good. You know what this flow has to do. Now we build it.',
  ],

  // ---- building -----------------------------------------------------------
  build_start: [
    '[calm] This is the canvas. You add one node at a time, and each node does one job.',
  ],
  phase_intro: [
    '[calm] Next part. {phase}.',
    '[calm] Now for this bit. {phase}.',
  ],
  node_placed: [
    '[calm] Good. Now open it and set it up.',
    '[calm] That is placed. Open it to fill in the settings.',
  ],
  node_wrong: [
    '[thoughtful] That node cannot do the job we need here. Let me ask you something about it.',
  ],

  // ---- verifying ----------------------------------------------------------
  verify_pass: [
    '[warm] That is set up correctly.',
    '[warm] Good, this node is ready.',
    '[warm] Correct. This one is done.',
  ],
  verify_fail: [
    '[calm] Something here is not right yet. Look at the field I marked.',
    '[calm] Not ready yet. Check the field in red and try again.',
  ],

  // ---- running ------------------------------------------------------------
  run_start: [
    '[calm] Let us run it now, with real examples, and watch what happens.',
  ],
  run_pass: [
    '[warm] Every case came out right. Your flow works.',
    '[warm] All of them passed. That flow does its job.',
  ],
  run_fail: [
    '[calm] Some cases did not come out right. That is useful. Let us see which ones.',
  ],

  // ---- finishing ----------------------------------------------------------
  stress_start: [
    '[calm] Last part. A few questions about how the thing you built behaves.',
  ],
  report_ready: [
    '[calm] Here is how it went, and what I would work on next.',
  ],
};

/** Strip the v3 audio tags, leaving the sentence a learner reads. */
export function captionFor(line) {
  return String(line ?? '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Fill `{name}` placeholders. Missing values collapse to nothing, not "undefined". */
export function fillLine(line, vars = {}) {
  return String(line ?? '').replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '').trim());
}

/** Is this a moment we have words for? */
export function hasMoment(moment) {
  return Object.prototype.hasOwnProperty.call(LINES, moment);
}

/**
 * Pick one variant for a moment.
 *
 * The index is returned as well as the text, because the server caches rendered
 * audio per (moment, variant) and the client needs the same variant's words for
 * the caption. Passing the index through is what keeps the two in step.
 */
export function pickLine(moment, index) {
  const variants = LINES[moment];
  if (!variants?.length) return null;
  const i = Number.isInteger(index) ? ((index % variants.length) + variants.length) % variants.length : Math.floor(Math.random() * variants.length);
  return { index: i, line: variants[i] };
}

/**
 * Which mascot animation goes with a moment.
 *
 * The guide's rule, and it matters: the mascot reacts even when the sound is
 * muted or missing. A learner who has turned narration off should still see Iris
 * respond, so this mapping is deliberately independent of whether audio plays.
 */
export const MOMENT_CLIP = {
  welcome: 'hello',
  problem_intro: 'presenting',
  understand_start: 'presenting',
  answer_correct: 'correct',
  answer_wrong: 'shake-no',
  understand_done: 'celebrate',
  build_start: 'presenting',
  phase_intro: 'presenting',
  node_placed: 'idle',
  node_wrong: 'thinking',
  verify_pass: 'correct',
  verify_fail: 'shake-no',
  run_start: 'thinking',
  run_pass: 'celebrate',
  run_fail: 'thinking',
  stress_start: 'presenting',
  report_ready: 'presenting',
};

export function clipFor(moment) {
  return MOMENT_CLIP[moment] ?? 'idle';
}
