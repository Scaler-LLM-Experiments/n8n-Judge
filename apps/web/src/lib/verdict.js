// One place that decides what a graded answer's verdict is.
//
// The browser holds no answers — toPublicProblem strips every marker of
// correctness at the API boundary — so the ONLY source of a verdict is the
// server. When the server does not answer, the honest result is "we do not
// know", and every screen has to say so rather than guess.
//
// Both guesses were shipped, and both were wrong:
//
//   The NDV guessed WRONG. A right answer came back red with no explanation,
//   which is how the "same answer, different verdict" bug presented.
//
//   Understand and Stress Testing guessed CORRECT. Every option a learner
//   clicked went green. That is far worse: it teaches the wrong thing, unlocks
//   progress nobody earned, and hands out a score that means nothing.
//
// Three states, then. `correct: null` is not a failure mode to paper over — it is
// the truthful answer when the check did not complete.

/**
 * @param {{correct?: boolean, why?: string|null, unlocks?: string[]}|null} result
 *   the server's response, or null when it did not answer
 * @returns {{correct: boolean|null, why: string|null, unlocks: string[], verified: boolean}}
 */
export function resolveServerVerdict(result) {
  // A response missing `correct` is a partial or malformed answer, which tells us
  // no more than silence does.
  if (!result || typeof result.correct !== 'boolean') {
    return { correct: null, why: null, unlocks: [], verified: false };
  }

  return {
    correct: result.correct,
    why: result.why ?? null,
    // Only a verified correct answer unlocks anything. Granting progress on an
    // unverified pick would let a dropped request buy a node.
    unlocks: result.correct ? (result.unlocks ?? []) : [],
    verified: true,
  };
}

/** Copy for the one state that has no explanation to show. */
export const UNVERIFIED_MESSAGE = 'Could not check this just now — your answer was not marked wrong. Try again in a moment.';
