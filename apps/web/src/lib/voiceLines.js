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
// Square brackets — `[warm]`, `[calm]`, `[thoughtful]`, `[excited]` — are AUTHORING
// NOTES ONLY. They were ElevenLabs v3 audio tags back when they reached the vendor;
// narration now renders through Deepgram Aura, which has no tag concept and would
// read them out loud, so they are stripped before anything is sent. `captionFor`
// does the stripping, and the generator renders exactly the caption — which is why
// what a learner hears and what they read are now provably the same words.
//
// Keep writing them. They record the intended tone next to the line, which is worth
// having even though nothing enforces it. To actually change delivery, change the
// words: shorter sentences land calmer, and an ellipsis buys a beat.
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
  // A SECOND wrong answer on the same question gets a stronger pointer. An
  // instructor does not repeat themselves at the same volume: the first miss is a
  // question, the second is a nudge toward where the answer lives. Still not the
  // answer, and the per-question authored version is where the real pointer goes.
  answer_wrong_again: [
    '[thoughtful] Still not it. Go back to the problem and ask what has to happen first.',
    '[calm] Let us slow down. What does this step actually need before it can run?',
    '[thoughtful] Try reading the options as jobs. Which job does this flow need doing here?',
  ],

  // Iris notices when a learner has gone quiet. Not a prompt to hurry: an offer.
  // The one thing a real instructor does that a screen never does is look up.
  idle_nudge: [
    '[calm] Take your time. If you are not sure what goes next, ask me.',
    '[calm] Still thinking? Tell me what you are stuck on and I will help.',
    '[calm] No rush. If it helps, look at what the last node hands over.',
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
  // Spoken when a build phase opens. `BuildStage` had been playing this since the
  // mascot mapping existed, but there were no words for it, so Iris animated and
  // said nothing at the start of every phase.
  //
  // The phase title and its description are both on screen, so these do not repeat
  // them — the rule is that Iris says the thing that is NOT written down. What is
  // missing from the page is how to think about the step, so that is what she gives,
  // and always as a question, never a hint at which node it is.
  phase_intro: [
    '[calm] Start with what this part needs before it can do anything.',
    '[calm] Ask what this piece hands on to the next one.',
    '[calm] Same idea as before. What has to happen first here?',
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
  // Spoken as each test case begins, keyed by the case id so a problem can say what
  // THIS email actually is. The generic version cannot know, so it only points.
  //
  // It describes the input and never the outcome: the whole value of watching a run
  // is seeing where something lands, and narrating the destination in advance throws
  // that away. It would also hand over the Stress Testing answer on the case that
  // deliberately matches no rule.
  run_case: ['[calm] Next one. Watch where it goes.'],
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

/**
 * The variables that actually change these words.
 *
 * A line's identity is its SENTENCE, so only variables the sentence interpolates may
 * take part in it. The default `verify_pass` is "Yes, {node} is set up right", so the
 * node belongs. An authored `verify_pass:chat-gemini` names the node in prose and
 * interpolates nothing, so the node does NOT belong — every chat-gemini verify is the
 * same recording.
 *
 * This exists because getting it wrong is silent and expensive. The enumeration
 * worked it out correctly and the player did not, so it asked for
 * `verify-fail--classify--classify-with-ai--v0` while the generator had written
 * `verify-fail--classify--v0`. The result: every line a problem author had taken the
 * trouble to write by hand — the most careful copy in the product — resolved to no
 * clip and played as a caption. Both sides now call this.
 *
 * @param lines  the resolved wording (from `resolveLines`), which is what decides
 * @param vars   whatever the caller happens to be holding
 */
export function speakingVars(lines, vars = {}) {
  const out = {};
  const uses = (name) => (lines ?? []).some((l) => String(l).includes(`{${name}}`));
  if (vars.node && uses('node')) out.node = vars.node;
  if (vars.answer && uses('answer')) out.answer = vars.answer;
  return out;
}

/**
 * Did this problem write its own wording for this line?
 *
 * The same test `resolveLines` makes, asked as a question instead of resolved — so
 * the two can never disagree about which lines a problem owns.
 *
 * @param problem  the problem object (may be null)
 * @param moment   e.g. 'node_placed'
 * @param key      usually a node type or question id
 */
export function hasOwnWording(problem, moment, key) {
  const overrides = problem?.voice ?? null;
  if (!overrides) return false;
  if (key && Array.isArray(overrides[`${moment}:${key}`])) return true;
  return Array.isArray(overrides[moment]);
}

/**
 * Which folder one line's audio belongs in — the problem's, or `shared`.
 *
 * This is the whole fix for rendering the same sentence once per problem. If the
 * words came from the default phrase book they are the same words for every problem,
 * so they are the same audio and there is no reason to pay for them again. Only an
 * authored line belongs to a problem.
 *
 * It has to be ONE function because five callers derive the same path independently
 * and they must agree exactly: the generator (what to render), the admin route and
 * the diagnostics (what is stored), and the browser (what to request). A browser
 * asking for a path the generator never wrote gets a 404 and falls back to a caption,
 * silently — which is precisely the class of bug that makes narration "just stop
 * working" for one problem.
 *
 * @param problemSlug  the slug to use when the line IS problem-specific
 * @returns the slug, or '' for shared — pass it straight to `clipFile`
 */
export function clipScope(problemSlug, problem, moment, key) {
  return hasOwnWording(problem, moment, key) ? (problemSlug ?? '') : '';
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
  answer_wrong_again: 'thinking',
  idle_nudge: 'idle',
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
  run_case: 'attentive',
  run_pass: 'celebrate',
  run_fail: 'thinking',
  stress_start: 'presenting',
  report_ready: 'presenting',
};

export function clipFor(moment) {
  return MOMENT_CLIP[moment] ?? 'idle';
}
