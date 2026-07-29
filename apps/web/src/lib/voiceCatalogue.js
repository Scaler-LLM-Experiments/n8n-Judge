import { LINES, captionFor, fillLine, resolveLines } from './voiceLines.js';

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
 * @param {Record<string, any>|null} [problem]
 * @param {Record<string, any>} [catalog] NODE_CATALOG, for node labels
 * @returns {Array<{moment: string, key: string|null, vars: Record<string, string>, spoken: string, caption: string}>}
 */
export function enumerateSpeakable(problem = null, catalog = {}) {
  const out = [];
  const seen = new Set();

  const add = (moment, key, vars, line) => {
    const spoken = fillLine(line, vars);
    // The same wording can arise from several moments (a shared default line, two
    // nodes with the same label). One clip covers all of them.
    if (seen.has(spoken)) return;
    seen.add(spoken);
    out.push({ moment, key, vars, spoken, caption: captionFor(spoken) });
  };

  // Moments with no variables: one clip per authored variant.
  const plainMoments = Object.keys(LINES).filter(
    (m) => !(m in ANSWER_MOMENTS) && !NODE_MOMENTS.includes(m)
  );
  for (const moment of plainMoments) {
    for (const line of resolveLines(moment, { problem })) add(moment, null, {}, line);
  }

  if (!problem) {
    // No problem: still enumerate the variable moments so the defaults exist, with
    // the variable left empty. Better than nothing for a smoke run, useless for a
    // real learner, which is why generation takes a problem.
    for (const moment of [...Object.keys(ANSWER_MOMENTS), ...NODE_MOMENTS]) {
      for (const line of resolveLines(moment, {})) add(moment, null, {}, line);
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
      for (const line of lines) {
        if (!line.includes('{answer}')) {
          add(moment, q.id, {}, line);
          continue;
        }
        for (const opt of options) add(moment, q.id, { answer: opt.label }, line);
      }
    }
  }

  // `{node}`: every node the problem asks for.
  for (const type of nodeTypesOf(problem)) {
    const node = labelForNodeType(problem, type, catalog);
    for (const moment of NODE_MOMENTS) {
      const lines = resolveLines(moment, { problem, key: type });
      for (const line of lines) {
        if (!line.includes('{node}')) {
          add(moment, type, {}, line);
          continue;
        }
        add(moment, type, { node }, line);
      }
    }
  }

  // Per-phase completion lines, which key off the phase id.
  for (const phase of problem.buildPhases ?? []) {
    for (const line of resolveLines('phase_complete', { problem, key: phase.id })) {
      add('phase_complete', phase.id, {}, line);
    }
  }

  return out;
}
