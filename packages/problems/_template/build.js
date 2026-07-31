// The shape of the flow, and the order it gets built in.

/**
 * The drawer's contents. `isDistractor: true` is a node that does NOT belong — each one
 * is a chance to probe a misconception, so give the ones you expect a probe in probes.js.
 */
// At least two entries, and at least one distractor — the schema and
// `validateProblem()` both insist, because a palette with nothing wrong in it asks the
// learner to pick from a list of one right answer.
// A flow has to start and finish, so the palette must require at least one `trigger`
// and one `action` category node — `validateProblem()` errors otherwise. An AI node
// additionally requires a `model`.
export const nodePalette = [
  { type: 'TODO-trigger-type', label: 'TODO Trigger Label', category: 'trigger', isDistractor: false },
  { type: 'TODO-action-type', label: 'TODO Action Label', category: 'action', isDistractor: false },
  { type: 'TODO-distractor-type', label: 'TODO Plausible Wrong', category: 'trigger', isDistractor: true },
];

/** A router's outputs. Empty for a linear problem — the engine handles both. */
export const branches = [
  { id: 'TODO_branch_id', label: 'TODO Branch Label' },
];

/**
 * The "shape of it" sketch on the Understand screen — shown BEFORE the quiz asks which
 * node does each job.
 *
 * TWO ENFORCED RULES, both learned the hard way:
 *   - labels describe the JOB, never the node. "read and label it", not "Classify with
 *     AI" — naming the node hands over the answer to a graded question.
 *   - three words maximum. The sketch wraps at two words per line in a ~96px column, so
 *     a four-word label is three lines tall and drags the row out of alignment.
 *
 * `caption` is currently rendered nowhere. Author it anyway or leave it — see STATUS.
 */
export const flowSummary = {
  steps: [
    { type: 'TODO-catalog-type', label: 'TODO three words' },
  ],
  caption: 'TODO. Two sentences on the shape, no node names.',
};

/**
 * Canonical order, used to detect a SEQUENCE mistake: from a given source, only these
 * types are a valid next step. `branchNext` is what a router's outputs accept;
 * `modelNext` is what an AI node's model slot accepts. Omit either if unused.
 */
export const flow = {
  start: ['TODO-trigger-type'],
  next: { 'TODO-trigger-type': ['TODO-next-type'], 'TODO-next-type': [] },
  branchNext: ['TODO-action-type'],
  modelNext: ['TODO-model-type'],
};

/**
 * The guided build, phase by phase. `coach` is Iris's line on entering the phase.
 *
 * `nodeTypes` is what the phase requires; `pickable` is what the drawer OFFERS, which
 * should include the distractors worth probing. A phase completes when every nodeType is
 * placed AND configured — and for a routing phase, when every branch reaches a reply
 * (`branchReach.js` walks through passthrough nodes to find one).
 */
export const buildPhases = [
  {
    id: 'TODO-phase-id',
    label: 'TODO Phase Label',
    coach: 'TODO. What this phase is for, in Iris’s voice.',
    nodeTypes: ['TODO-catalog-type'],
    pickable: ['TODO-catalog-type', 'TODO-distractor-type'],
  },
];
