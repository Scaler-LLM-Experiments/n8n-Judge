// What Iris asks when the learner reaches for the WRONG node, and what the report calls
// each misconception.
//
// Keyed by the wrong node's type. A type with no entry here falls back to the generated
// sequence probe (four rotating framings of "a node only gets what the one before it
// hands over"), so author a probe for every distractor you deliberately offer.
//
// THREE COPY RULES, all enforced:
//   1. never name the correct node — the probe teaches, it does not answer;
//   2. every option is a real position someone would hold (no joke options, no
//      "I clicked it by accident");
//   3. the correct answer describes what the WRONG node actually does.
//
// Minimum three options. A wrong option needs a `misconception` code, or the report can
// never surface it. The learner's pick renders NEUTRAL, not green/red: the placement is
// already known to be wrong and the node comes off the canvas either way.
export const nodeProbes = {
  'TODO-distractor-type': {
    prompt: 'TODO. What did you expect this node to do here?',
    options: [
      {
        text: 'TODO. What the wrong node actually does.',
        correct: true,
        response: 'TODO. Confirm it, then say what this step needed instead — without naming the node.',
      },
      {
        text: 'TODO. The belief that led them here.',
        correct: false,
        misconception: 'TODO-misconception-code',
        response: 'TODO. Correct the belief, concretely.',
      },
      {
        text: 'TODO. Another real belief.',
        correct: false,
        misconception: 'TODO-misconception-code',
        response: 'TODO. Correct it.',
      },
    ],
  },
};

/**
 * Report-facing label per misconception code. Every code used above (and in
 * dissection.js) needs one, or the Result screen shows a raw slug.
 */
export const misconceptionLabels = {
  'TODO-misconception-code': 'TODO. The misconception, named in plain English.',
};
