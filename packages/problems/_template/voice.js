// Iris's narration for this problem.
//
// READ .claude/skills/iris-voice/SKILL.md FIRST. It is the contract: the 23 moments in
// journey order, the copy rules (all test-enforced), the measured v3 tag table, and the
// traps. What follows is only the shape.
//
// Keys are `moment` or `moment:key`. An authored entry REPLACES the generic phrase book
// for that moment — which means a single string here repeats verbatim every time, so give
// the moments that fire often (verify_fail, node_wrong) several variants and let them
// rotate. Leaving this file nearly empty is a valid choice: the generic phrase book
// covers the whole journey, just without naming anything specific to this problem.
//
// Every line opens with a [tag]. Word caps: 26 on an arrival, 22 elsewhere. No em dashes.
// Contractions always.
//
// AFTER EDITING ANY LINE, BOTH: `npm run voice:generate` (the fingerprint changed, so the
// file name changed) AND `npm run db:seed` (problems are served from Postgres). Skipping
// either looks exactly like a broken render.
export const voice = {
  problem_intro: ['[calm] TODO. What the problem is, in one breath.'],
  understand_start: ['[calm] TODO. What the quiz is about to ask them to do.'],
  understand_done: ['[excited] TODO. Name what they worked out. 26 words max.'],

  build_start: ['[calm] TODO. They have the nodes; now they build the setup.'],
  'phase_intro:TODO-phase-id': ['[calm] TODO. What this phase is for.'],
  'node_placed:TODO-catalog-type': ['[calm] TODO. What to do with the node they just placed.'],

  // The win. Name what this node now DOES in this flow.
  'verify_pass:TODO-catalog-type': ['[warm] TODO. Specific to this node.'],
  // Points at WHICH field, never at the value. Several variants — this is the most
  // repeated line in the journey.
  'verify_fail:TODO-catalog-type': [
    '[calm] TODO. Which field to look at.',
    '[thoughtful] TODO. The same, said differently.',
  ],

  // Opens on the trigger. Never says where it lands.
  'run_case:TODO-case-id': ['[calm] TODO. A customer sends… / a transcript arrives…'],
  // No em dashes in a spoken line, here or anywhere: they do not read aloud, and the
  // rule is test-enforced. This one used to have one, and the template's own scaffold
  // therefore shipped a warning to every new problem.
  run_pass: ['[excited] TODO. Say what passed, first. The line may be cut short.'],
  run_fail: ['[calm] TODO. Name it plainly, then point back to the flow.'],

  stress_start: ['[excited] TODO. What this section is testing.'],
  report_ready: ['[excited] TODO. The payoff.'],
};
