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
//   * Short sentences. One idea each. SHORT, NOT CLIPPED: "You've got one tab left"
//     is the same length as "One tab left" and sounds like a person rather than a
//     status readout. Fragments are what make narration feel mechanical.
//   * KEEP THE "HMM"s. A one-word sentence is a problem when it is a STATUS —
//     "Set." "Done." "There." are a machine reporting. It is the opposite when it is
//     how people actually talk: "Hmm.", "Ah.", "Yes.", "Right.", "Exactly." are
//     acknowledgement and hesitation, they are why Iris sounds like someone in the
//     room, and they are deliberate. Do not tidy them away.
//   * USE CONTRACTIONS. Always. "That's", "it's", "let's", "you've", "didn't".
//     Every line in this file once avoided them — all 99 of them — while the screen
//     directly underneath said "I'm your mentor" and "you've got the plan". So the
//     writing contracted everywhere except the one place that is spoken aloud, which
//     is the place it matters most. Nobody has ever said "let us see" out loud.
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
// Square brackets are ElevenLabs v3 AUDIO TAGS and they are live: on v3 they reach
// the vendor and shape delivery. `captionFor` strips them, so a learner reads the
// clean sentence and hears the directed one.
//
// Measured against this voice, rendering the same words each way:
//
//   [pause] inline        +0.95s   a real beat. THE way to buy a pause on v3.
//   an ellipsis "..."     -0.46s   does NOT pause. It reads slightly faster.
//   [cheerfully]          -0.35s   lifts and quickens
//   [excited]             -0.23s   lifts
//   [warmly]              -0.57s   softens and quickens
//
// Two things worth knowing from that. None of them are read aloud, so a tag is safe.
// And the ellipsis result is the opposite of what it does on Deepgram, where there
// are no tags and punctuation is the only lever — so do not carry pacing tricks
// between vendors. On v3, use `[pause]`.
//
// `[laughs]` is deliberately unused: it changed the duration by only 0.22s, which is
// too small to tell an executed laugh from a swallowed one without listening, and a
// misfire is a strange noise in a learner's ear.
//
// If VOICE_VENDOR is deepgram the tags are stripped before sending (it reads them
// aloud), and pacing falls back to sentence length. See voiceScript.js.
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
  // A GREETING, and nothing else. This plays on the hello screen, so it is hello.
  //
  // It used to be overridden per problem with that problem's hook — email-triage
  // opened with "Support mail, sorted by hand, every single day" — which meant the
  // screen introduced Iris while Iris introduced the problem. Two different beats
  // fighting over one moment. The hook belongs on the statement screen, where the
  // statement actually is, so `problem_intro` carries it now.
  //
  // The screen already gives her name, her role and the promise to stay with you, so
  // these do not repeat any of that. What the page cannot do is sound pleased to see
  // you, so that is the job.
  welcome: [
    "[cheerfully] Hey there! I'm Iris, your mentor. [pause] I'll be guiding you through this whole n8n simulation. Ready when you are?",
    "[cheerfully] Hey there! I'm Iris, and I'm your mentor here. [pause] I'll guide you through the whole simulation. Shall we?",
  ],
  // The statement is on screen and the learner is reading it. One nudge about HOW
  // to read it, then silence.
  // Three beats, in this order, because arriving somewhere with no framing feels
  // random: say we are starting, say what the problem is in one line, then say what
  // to do about it. The statement itself is on screen — this is the orientation
  // around it, which is the part a page cannot give you.
  problem_intro: [
    "[calm] Okay, let's get started. Here's today's problem. Read it through once and get the shape of it.",
  ],
  understand_start: [
    '[calm] A few questions first. I want to see how you\'re thinking about it.',
  ],

  // ---- answering ----------------------------------------------------------
  // The explanation appears on screen, so Iris marks the verdict and gets out of
  // the way. Anything longer talks over the learner reading the reason.
  // `{answer}` is what the learner picked, so the verdict is about their actual
  // choice. Naming it is safe: they chose it, and it is already on screen marked.
  answer_correct: [
    '[warm] Yes, {answer}\'s right.',
    '[warm] That\'s it, {answer} is the one.',
    '[warm] Yes, it\'s {answer}.',
  ],
  // A SECOND wrong answer on the same question gets a stronger pointer. An
  // instructor does not repeat themselves at the same volume: the first miss is a
  // question, the second is a nudge toward where the answer lives. Still not the
  // answer, and the per-question authored version is where the real pointer goes.
  answer_wrong_again: [
    '[thoughtful] Still not it. Go back to the problem and ask what has to happen first.',
    '[calm] Let\'s slow down. What does this step actually need before it can run?',
    '[thoughtful] Try reading the options as jobs. Which job does this flow need done here?',
  ],

  // Iris notices when a learner has gone quiet. Not a prompt to hurry: an offer.
  // The one thing a real instructor does that a screen never does is look up.
  idle_nudge: [
    '[calm] Take your time. And if you\'re not sure what comes next, just ask.',
    '[calm] Still thinking? Tell me what you\'re stuck on and I\'ll help.',
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
    "[excited] You've got the shape of it! [pause] Now for the fun part. We build it.",
    "[excited] That's the thinking done. Now let's go and build the thing.",
  ],
  phase_complete: [
    "[excited] Right, that part's done. Nice work!",
    "[excited] That's it. That piece works now!",
    "[excited] Good, that's one more piece in place.",
  ],
  build_complete: [
    "[excited] The whole flow's built! [pause] Let's see if it holds up.",
  ],

  // ---- building -----------------------------------------------------------
  // The canvas and the phase label are both visible, so no line reads them out.
  build_start: [
    "[calm] Now that you've collected your nodes, let's start connecting them up.",
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
    '[calm] Ask yourself what this piece hands on to the next one.',
    '[calm] Same idea as before. What has to happen first here?',
  ],
  // `{node}` is the node just placed, so the line is about THAT node rather than
  // being a generic "now configure it".
  node_placed: [
    '[calm] Good. Now open {node} and tell it what to do.',
    '[calm] {node}\'s on the board. Open it up and set it up.',
  ],
  // Ten wordings, and they rotate (see `spokenCount` in voice.js): getting a node
  // wrong is one of the few things a learner does repeatedly in a sitting, and one
  // sentence played six times is what makes Iris sound like a recording.
  //
  // None of them name the right node, and none of them say what the wrong one does
  // either — the probe that opens next is the thing that asks. These only mark the
  // moment and hand over.
  node_wrong: [
    '[thoughtful] Hmm. That one can\'t do the job here. Let me ask you something.',
    '[thoughtful] Ah, not that one. There\'s something I want you to think about.',
    '[thoughtful] Hold on. That node can\'t give you what this step needs.',
    '[calm] Not quite. Before you try again, answer me this.',
    '[thoughtful] Hmm, that one won\'t work here. Here\'s the question to ask yourself.',
    '[calm] That\'s not the one. Let\'s work out why together.',
    '[thoughtful] Careful. That node does something else entirely. Have a think.',
    '[calm] Nearly, but no. One question first.',
    '[thoughtful] Hmm. Wrong tool for this job. Let me check something with you.',
    '[calm] That one can\'t do it. Let\'s find out what you\'re picturing.',
  ],

  // Answering the wrong-node probe. Separate from `answer_correct` because the probe
  // is not a quiz question the learner chose to be at — they got here by making a
  // mistake, so the correct answer is acknowledged and moved on from rather than
  // celebrated, and the wrong one never repeats the misconception back as fact.
  probe_correct: [
    '[warm] Yes, exactly that. Now put the right one in.',
    '[warm] Right. So you can see why it wouldn\'t work here.',
    '[warm] That\'s it. Go on and pick the one that fits.',
    '[warm] Ah, you\'ve got it. Try the placement again.',
    '[calm] Correct. That\'s the thing to watch for next time.',
    '[warm] Yes. Now you know what this step actually needs.',
    '[warm] Exactly right. Let\'s get the proper node in there.',
    '[calm] That\'s the one. Back to the board.',
  ],
  probe_wrong: [
    '[thoughtful] Not that. Read the other answers again and think about what this step gets handed.',
    '[calm] Hmm, no. Think about what that node actually produces.',
    '[thoughtful] That\'s the common guess, but no. Look at the others.',
    '[calm] Not quite. What would this step have to work with?',
    '[thoughtful] Ah, no. Have another look at what the node does.',
    '[calm] That isn\'t it. Try again, and take your time.',
    '[thoughtful] Hmm. Close, but that\'s not what happens here.',
    '[calm] No. One of the others describes it properly.',
  ],

  // ---- verifying ----------------------------------------------------------
  // `{node}` is the node just verified. Same reasoning as the answer lines: the
  // learner opened it and configured it, so naming it reveals nothing.
  verify_pass: [
    '[warm] Yes, {node}\'s set up right.',
    '[warm] Ah, {node}\'s done.',
    '[warm] {node}\'s right now.',
  ],
  // Parameters verified, and this node still has a Settings tab to get right. A
  // separate moment from `verify_pass` because they are separate events: this one
  // acknowledges and moves you on, and it deliberately does NOT celebrate, because
  // the node is not finished. Saying the same sentence for both is what made setup
  // feel like nothing was happening.
  verify_params: [
    '[calm] That\'s the parameters right. You\'ve got one tab left.',
    '[calm] Good, those are right. One more tab and this one\'s done.',
  ],
  // Ten wordings, rotated. This is the most repeated line in the whole journey — a
  // learner can fail verify on a dozen fields in one sitting — and it was two lines
  // chosen once per session, so it played identically every time.
  //
  // Every one points at WHERE to look and never at what to put there. `{node}` is
  // safe to name: the learner opened it themselves.
  verify_fail: [
    '[calm] Hmm, {node} isn\'t right yet. Check the field I marked.',
    '[calm] Hmm, something in {node}\'s off. Have a look at what\'s in red.',
    '[calm] Not there yet. The field I\'ve marked in {node} needs another look.',
    '[thoughtful] Hmm. One of these isn\'t what {node} needs. Check the red one.',
    '[calm] Close. Read the marked field in {node} again.',
    '[thoughtful] Ah, not quite. Look at what you\'ve put in {node}\'s red field.',
    '[calm] {node}\'s not happy with one of those. The marked one.',
    '[calm] Something\'s off in {node}. Check the field I\'ve flagged and try again.',
    '[thoughtful] Hmm, no. Have another think about the red field in {node}.',
    '[calm] Nearly. One field in {node} still needs fixing.',
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
  run_case: ["[calm] Okay, here's the next one. Watch where it goes."],
  run_pass: ["[excited] Every case came out right. That flow works.", "[excited] All of them passed. That's well built."],
  run_fail: ["[calm] Some didn't come out right. That's worth knowing. Let's look."],

  // ---- finishing ----------------------------------------------------------
  stress_start: ["[excited] Wonderful! [pause] Now let's stress test that setup of yours, right away."],
  // Stress Testing had `stress_start` and then silence for the whole section, so the
  // one screen that is entirely about judgement gave no spoken reaction to any of it.
  //
  // These never restate the answer: the written verdict beside the options already
  // explains it, and Iris repeating it is reading the screen. She reacts, and points.
  stress_correct: [
    '[warm] Yes, that\'s the one.',
    '[warm] Right. You\'ve thought that through.',
    '[warm] Exactly. That\'s what would happen.',
    '[calm] Correct. Read why, then carry on.',
    '[warm] Ah, good. That\'s it.',
    '[warm] Yes. You can see how it behaves now.',
    '[calm] That\'s right. Have a read of the reason.',
    '[warm] Got it in one.',
  ],
  stress_wrong: [
    '[thoughtful] Hmm, not that one. Read what actually happens.',
    '[calm] No. Have a read of why, it\'s worth knowing.',
    '[thoughtful] Ah, that\'s the trap. Read the explanation.',
    '[calm] Not quite. This one catches most people.',
    '[thoughtful] Hmm. Read what really happens there.',
    '[calm] That isn\'t it. The reason underneath is the useful part.',
    '[thoughtful] No, but it\'s a fair guess. Read on.',
    '[calm] Wrong one. Worth understanding why.',
  ],
  report_ready: ["[excited] Alright, here it is! [pause] Let's see how you did."],
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
  probe_correct: 'correct',
  probe_wrong: 'shake-no',
  stress_correct: 'correct',
  stress_wrong: 'shake-no',
  verify_pass: 'correct',
  verify_params: 'nod-yes',
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
