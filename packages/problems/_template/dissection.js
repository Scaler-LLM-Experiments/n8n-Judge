// The Understand quiz: one node-pick per decision the flow requires.
//
// This is 30% of the score, and it runs BEFORE the build, so it is where a learner
// reasons about the shape of the flow rather than clicking through it.
//
// A correct pick UNLOCKS node types for the builder (`unlocks`), so this list decides
// what the learner has to work with later. Every type named here must exist in
// @judge/catalog.
//
// Rules `validateProblem()` enforces:
//   - a wrong option needs a misconception code, or it can never reach the report;
//   - no escape-hatch option text ("added it by mistake") — every option is a real
//     position someone would hold;
//   - never park the correct answer at index 0 out of habit. An audit once found it
//     there in 13/13 items. `apps/web/scripts/verify-option-balance.mjs` checks this.
export const dissection = [
  {
    id: 'TODO-decision-id',
    prompt: 'TODO. Ask about the JOB, not the node name.',
    options: [
      { label: 'TODO wrong but plausible', type: 'TODO-catalog-type' },
      { label: 'TODO correct', type: 'TODO-catalog-type' },
      { label: 'TODO wrong', type: 'TODO-catalog-type' },
      { label: 'TODO wrong', type: 'TODO-catalog-type' },
    ],
    correctType: 'TODO-catalog-type',
    wrongHint: 'TODO. A question that points at the reasoning, never at the answer.',
    explanation: 'TODO. What this node does in THIS flow, once they have it right.',
    unlocks: ['TODO-catalog-type'],
  },
];
