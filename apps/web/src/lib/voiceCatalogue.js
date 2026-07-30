import { LINES, captionFor, clipScope, fillLine, resolveLines, speakingVars } from './voiceLines.js';

// Every line that can ever be spoken, enumerated.
//
// This is what makes pre-rendering possible, and it is the whole reason the voice
// lines take their variables from a closed set rather than from free text.
//
// A line like "Yes, {node} is set up right" is not one clip, it is one per node
// the problem contains. A line like "Do you really think {answer} belongs here?"
// is one per option of the question it belongs to. Both sets come straight out of
// the problem data, so the full list of things Iris can say is finite and known
// before any learner opens the app.
//
// Used by:
//   scripts/generate-voice.mjs   to render and store the lot, once
//   the tests                    to assert the copy rules across real fills
//
// If a line ever needs a variable whose values are NOT knowable up front (a
// learner's name, a free-text answer), it cannot be pre-rendered and has to be
// spliced or rendered live. That is a design constraint worth keeping: it is the
// reason `{node}` is a node label and not, say, whatever they typed.

/**
 * Moments whose `{answer}` comes from a dissection question's options, and WHICH
 * options each can be spoken with.
 *
 * This matters for the bill and for the content. `answer_correct` is only ever
 * played when the learner was right, so it can only be filled with the correct
 * option — enumerating it against every option renders lines that can never be
 * spoken ("Yes, Webhook wakes this up on its own", on a problem where the answer
 * is the Gmail trigger) and some that are not even grammatical. The inverse holds
 * for the wrong-answer moments.
 *
 * Getting this wrong nearly doubled the number of clips for these moments.
 */
const ANSWER_MOMENTS = {
  answer_correct: 'correct',
  answer_wrong: 'wrong',
  answer_wrong_again: 'wrong',
};
/** Moments whose `{node}` is a node in the problem. */
const NODE_MOMENTS = ['node_placed', 'verify_pass', 'verify_fail'];

/** Node types a problem actually uses, from its build phases. */
/** @param {Record<string, any>|null} problem */
function nodeTypesOf(problem) {
  const out = new Set();
  for (const phase of problem?.buildPhases ?? []) {
    for (const t of phase.nodeTypes ?? []) out.add(t);
  }
  return [...out];
}

/**
 * A readable label for a node type, matching what the UI passes at play time.
 *
 * It has to MATCH, exactly: the clip is addressed by the text it renders, so a
 * label that differs by a word here produces a different hash and a cache miss
 * that silently falls back to live rendering.
 */
/**
 * @param {Record<string, any>|null} problem
 * @param {string} type
 * @param {Record<string, any>} [catalog]
 */
export function labelForNodeType(problem, type, catalog = {}) {
  return problem?.nodeSetup?.[type]?.label ?? catalog?.[type]?.label ?? String(type ?? '').replace(/[-_]/g, ' ');
}

/**
 * Everything speakable for one problem (or the defaults alone, with no problem).
 *
 * Each entry carries the `scope` its clips belong under, so every caller addresses
 * the same folder without re-deciding it. Pass it to `clipFile` as-is.
 *
 * @param {Record<string, any>|null} [problem]
 * @param {Record<string, any>} [catalog] NODE_CATALOG, for node labels
 * @returns {Array<{moment: string, key: string|null, scope: string, vars: Record<string, string>, variants: Array<{index: number, spoken: string, caption: string}>, spoken: string, caption: string}>}
 */
export function enumerateSpeakable(problem = null, catalog = {}) {
  const out = [];
  const seen = new Set();

  /**
   * One entry per (moment, key, vars), carrying EVERY variant with its index.
   *
   * The index is part of the clip's path, and which variant a learner hears is
   * decided in their browser from a session seed — so all of them must exist in
   * storage. Grouping them keeps the generator's job obvious: for each entry, store
   * each variant.
   */
  const add = (moment, key, vars, lines) => {
    const id = `${moment}|${key ?? ''}|${vars.node ?? ''}|${vars.answer ?? ''}`;
    if (seen.has(id)) return;
    seen.add(id);
    const variants = lines.map((line, index) => {
      const spoken = fillLine(line, vars);
      return { index, spoken, caption: captionFor(spoken) };
    });
    if (!variants.length) return;
    out.push({
      moment,
      key,
      // Decided once, here, so the generator and the browser cannot disagree about
      // where this clip lives. Shared unless the problem wrote these words itself.
      scope: clipScope(problem?.id, problem, moment, key),
      vars,
      variants,
      // The first variant, kept for callers that only need an example.
      spoken: variants[0].spoken,
      caption: variants[0].caption,
    });
  };

  // Moments with no variables: one clip per authored variant.
  const plainMoments = Object.keys(LINES).filter(
    (m) => !(m in ANSWER_MOMENTS) && !NODE_MOMENTS.includes(m)
  );
  for (const moment of plainMoments) add(moment, null, {}, resolveLines(moment, { problem }) ?? []);

  if (!problem) {
    // No problem: still enumerate the variable moments so the defaults exist, with
    // the variable left empty. Better than nothing for a smoke run, useless for a
    // real learner, which is why generation takes a problem.
    for (const moment of [...Object.keys(ANSWER_MOMENTS), ...NODE_MOMENTS]) {
      add(moment, null, {}, resolveLines(moment, {}) ?? []);
    }
    return out;
  }

  // `{answer}`: every option of every question, per question, because a question
  // may author its own wording.
  for (const q of problem.dissection ?? []) {
    for (const [moment, wants] of Object.entries(ANSWER_MOMENTS)) {
      const lines = resolveLines(moment, { problem, key: q.id });
      // Only the options this moment can actually be spoken with. Correctness is
      // by `type` against the question's `correctType`, the same comparison the
      // grader makes.
      const options = (q.options ?? []).filter((opt) =>
        wants === 'correct' ? opt.type === q.correctType : opt.type !== q.correctType
      );
      // `speakingVars` decides whether the option label is part of this line's
      // identity — the same call the player makes, so the two cannot disagree.
      // An authored question line that names the option in prose is ONE clip; the
      // generic "Do you really think {answer} belongs here?" is one per option.
      if (!lines.some((l) => l.includes('{answer}'))) {
        add(moment, q.id, {}, lines);
      } else {
        for (const opt of options) add(moment, q.id, speakingVars(lines, { answer: opt.label }), lines);
      }
    }
  }

  // `{node}`: every node the problem asks for.
  for (const type of nodeTypesOf(problem)) {
    const node = labelForNodeType(problem, type, catalog);
    for (const moment of NODE_MOMENTS) {
      const lines = resolveLines(moment, { problem, key: type });
      add(moment, type, speakingVars(lines, { node }), lines);
    }
  }

  // One line per test case in the Run, keyed by the case id.
  for (const sample of problem.sampleCases ?? []) {
    add('run_case', sample.id, {}, resolveLines('run_case', { problem, key: sample.id }) ?? []);
  }

  // Per-phase lines, which key off the phase id.
  //
  // `build_complete` is in here as well as being a plain moment, because BuildStage
  // plays it with the LAST phase's id (it fires in the same place `phase_complete`
  // does). Without this the final line of the whole build — the payoff — had no clip.
  // The text is the same for every phase, so they all resolve to one recording and
  // the extra ids cost nothing to render.
  for (const phase of problem.buildPhases ?? []) {
    for (const moment of ['phase_intro', 'phase_complete', 'build_complete']) {
      add(moment, phase.id, {}, resolveLines(moment, { problem, key: phase.id }) ?? []);
    }
  }

  return out;
}
