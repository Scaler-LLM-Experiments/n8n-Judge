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
//   * NEVER REVEAL AN ANSWER THE LEARNER HAS NOT GIVEN. That is the actual rule,
//     and it is narrower than "never name a node". Naming what they just DID is
//     not a leak, it is the difference between a person and a screen reader:
//     "Yes, the Chat Trigger is set up right" beats "That is right". What must
//     never happen is naming the answer to a question still open, so a wrong
//     answer points at where to look and never at what to pick.
//   * DO NOT READ THE SCREEN. If the words are already on the page, saying them
//     adds nothing and competes with reading. The phase label, the problem
//     statement and the explanation text are all visible: Iris says the thing
//     that is NOT written down, or she says nothing.
//   * Excitement is earned, and only at completion. Everywhere else it is noise;
//     on finishing a stage it is the payoff.
//
// Square brackets are ElevenLabs v3 audio tags. They shape delivery and are NOT
// spoken. `captionFor` strips them, so the caption is the clean sentence.
//
// Several lines per moment where a learner will hear it repeatedly. Verifying
// eight fields and hearing one identical sentence eight times is what makes
// narration feel like a machine.
//
// Per-problem and per-node overrides live in `problem.voice` (see
// `resolveLines`), because a generic line cannot know that this Switch is routing
// support email rather than leads. What is here is the floor, not the target.

/** @type {Record<string, string[]>} */
export const LINES = {
  // ---- arriving -----------------------------------------------------------
  // The greeting screen already says who Iris is, so she does not introduce
  // herself again. She says what she will DO, which is not on the page.
  welcome: [
    '[warm] I will stay with you the whole way. If something is unclear, ask me.',
    '[warm] I am here the whole time. Ask me whenever you get stuck.',
  ],
  // The statement is on screen and the learner is reading it. One nudge about HOW
  // to read it, then silence.
  problem_intro: [
    '[calm] Read it once for the shape, not the detail. We will pull it apart together.',
  ],
  understand_start: [
    '[calm] A few questions first. I want to know how you are thinking about it.',
  ],

  // ---- answering ----------------------------------------------------------
  // The explanation appears on screen, so Iris marks the verdict and gets out of
  // the way. Anything longer talks over the learner reading the reason.
  // `{answer}` is what the learner picked, so the verdict is about their actual
  // choice. Naming it is safe: they chose it, and it is already on screen marked.
  answer_correct: [
    '[warm] Yes, {answer} is right.',
    '[warm] Correct, {answer} is the one.',
    '[warm] That is it, {answer}.',
  ],
  // A QUESTION, not a correction. "No" closes the thought down; "do you really
  // think that fits here?" sends them back to look at the thing itself, which is
  // where the learning is. Names the wrong choice, never the right one, and leaves
  // the actual teaching to the explanation on screen.
  answer_wrong: [
    '[thoughtful] Hmm. Do you really think {answer} belongs here?',
    '[thoughtful] Are you sure about {answer}? Think about what it actually does.',
    '[calm] Have another look at {answer}. Would it really work at this point?',
  ],

  // ---- stage completion: this is where the energy belongs -----------------
  // Finishing something is the one moment a learner has genuinely earned a
  // reaction, so these are the only lines allowed to be excited. Everywhere else
  // enthusiasm is noise; here it is the payoff.
  understand_done: [
    '[excited] Yes. You have got the shape of it. Now the fun part, we build it.',
    '[excited] That is the thinking done. Now let us actually build the thing.',
  ],
  phase_complete: [
    '[excited] That part is done. Nice.',
    '[excited] Done. That piece works now.',
    '[excited] Good. One more piece in place.',
  ],
  build_complete: [
    '[excited] The whole flow is built. Let us see if it holds up.',
  ],

  // ---- building -----------------------------------------------------------
  // The canvas and the phase label are both visible, so no line reads them out.
  build_start: [
    '[calm] One node at a time. Each one does a single job, and passes its result on.',
  ],
  // `{node}` is the node just placed, so the line is about THAT node rather than
  // being a generic "now configure it".
  node_placed: [
    '[calm] Good. Now open {node} and tell it what to do.',
    '[calm] {node} is on the board. Open it to set it up.',
  ],
  node_wrong: [
    '[thoughtful] That one cannot do the job here. Let me ask you something.',
  ],

  // ---- verifying ----------------------------------------------------------
  // `{node}` is the node just verified. Same reasoning as the answer lines: the
  // learner opened it and configured it, so naming it reveals nothing.
  verify_pass: [
    '[warm] Yes, {node} is set up right.',
    '[warm] Good, {node} is done.',
    '[warm] {node} is correct now.',
  ],
  verify_fail: [
    '[calm] {node} is not right yet. Check the field I marked.',
    '[calm] Something in {node} is off. Look at what is in red.',
  ],

  // ---- running ------------------------------------------------------------
  run_start: ['[calm] Watch what happens to each one as it goes through.'],
  run_pass: ['[excited] Every case came out right. That flow works.', '[excited] All of them passed. Well built.'],
  run_fail: ['[calm] Some did not come out right. That is worth knowing. Let us look.'],

  // ---- finishing ----------------------------------------------------------
  stress_start: ['[calm] Now, does it still make sense when things go wrong?'],
  report_ready: ['[calm] Here is what stood out, and what I would practise next.'],
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

/**
 * The lines for a moment, after per-problem and per-node overrides.
 *
 * Resolution order, most specific first:
 *
 *   problem.voice['node_placed:switch']   this node, on this problem
 *   problem.voice['node_placed']          this problem
 *   LINES['node_placed']                  the default
 *
 * This exists because a generic line cannot know what the flow is FOR. "Open the
 * Switch and tell it what to do" is fine; "This is where support email splits from
 * everything else" is better, and only the problem author can write it. The
 * defaults are the floor, not the intended ceiling.
 *
 * @param moment   e.g. 'node_placed'
 * @param options  { problem, key } — `key` is usually a node type
 */
export function resolveLines(moment, { problem, key } = {}) {
  const overrides = problem?.voice ?? null;
  if (overrides) {
    if (key && Array.isArray(overrides[`${moment}:${key}`])) return overrides[`${moment}:${key}`];
    if (Array.isArray(overrides[moment])) return overrides[moment];
  }
  return LINES[moment] ?? null;
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
export function pickLine(moment, index, options) {
  const variants = resolveLines(moment, options);
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
  phase_complete: 'celebrate',
  build_complete: 'celebrate',
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
