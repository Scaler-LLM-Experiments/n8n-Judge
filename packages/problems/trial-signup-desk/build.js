// The shape of the flow, and the order it gets built in.
//
// This flow is LINEAR and has no AI step, on purpose: it is the beginner "core nodes"
// build, the one a learner meets before any AI node. So `branches` is empty, there is no
// router phase, and `flow` carries no `branchNext` or `modelNext`.

/**
 * The drawer's contents. `isDistractor: true` is a node that does NOT belong — each one
 * is a chance to probe a misconception, and every distractor listed here has an entry in
 * probes.js.
 *
 * Every type is a real @judge/catalog entry. `google-sheets` and `form-trigger` were
 * added to the catalog for this shape: none of the older terminals has cells, so none of
 * them can carry the decision this case is about — which answer goes under which column.
 */
export const nodePalette = [
  { type: 'form-trigger', label: 'On form submission', category: 'trigger', isDistractor: false },
  { type: 'webhook', label: 'On Webhook Call', category: 'trigger', isDistractor: true },
  { type: 'schedule', label: 'On a Schedule', category: 'trigger', isDistractor: true },
  { type: 'http-request', label: 'HTTP Request', category: 'core', isDistractor: false },
  { type: 'code', label: 'Code', category: 'core', isDistractor: true },
  { type: 'web-search', label: 'Web Search', category: 'core', isDistractor: true },
  { type: 'switch', label: 'Switch', category: 'core', isDistractor: true },
  { type: 'google-sheets', label: 'Google Sheets — Append Row', category: 'action', isDistractor: false },
  { type: 'action', label: 'Send Reply', category: 'action', isDistractor: false },
  { type: 'google-docs', label: 'Google Docs — Create Document', category: 'action', isDistractor: true },
];

/**
 * A router's outputs. EMPTY, because this flow has nothing to route: every signup takes
 * the same path, whatever plan it is on. `switch` appears in the palette only as a
 * distractor, so `validateProblem()`'s "a routing node needs at least 2 branches" rule
 * does not fire — it looks at required types, not distractors.
 */
export const branches = [];

/**
 * The "shape of it" sketch on the Understand screen — shown BEFORE the quiz asks which
 * node does each job.
 *
 * TWO ENFORCED RULES: labels describe the JOB and never the node, and three words
 * maximum. The check matches every palette label as a SUBSTRING, so with `Code` and
 * `Switch` in the palette above, a label reading "encode it" or "switch it over" fails on
 * the word inside the word.
 */
export const flowSummary = {
  steps: [
    { type: 'form-trigger', label: 'a signup arrives' },
    { type: 'http-request', label: 'fetch the rate' },
    { type: 'google-sheets', label: 'log every signup' },
    { type: 'action', label: 'welcome the person' },
  ],
  caption:
    'One straight line, no choices along the way. What matters is the order: the rate has to be in hand before the row is written, because the row is what carries it.',
};

/**
 * Canonical order, used to detect a SEQUENCE mistake: from a given source, only these
 * types are a valid next step. This is what makes the ordering graded rather than
 * decorative — reaching for the welcome email from the rate node marks it wrong and
 * probes it, because the row has not been written yet.
 *
 * No `branchNext` (nothing routes) and no `modelNext` (no AI node), so both are omitted.
 */
export const flow = {
  start: ['form-trigger'],
  next: {
    'form-trigger': ['http-request'],
    'http-request': ['google-sheets'],
    'google-sheets': ['action'],
    action: [],
  },
};

/**
 * The guided build, phase by phase. `coach` is Iris's line on entering the phase.
 *
 * `nodeTypes` is what the phase requires; `pickable` is what the drawer OFFERS. EVERY
 * phase declares its own `pickable`, because the fallback lists in @judge/catalog cover
 * only some types and a phase that forgets it can make a required node unpickable.
 *
 * The distractors are chosen per phase: the ways people expect a form to reach them, the
 * things people reach for instead of calling an API, and the terminals that record or
 * split instead of writing a row.
 */
export const buildPhases = [
  {
    id: 'intake',
    label: 'Catch the signup',
    coach: 'Let’s build. Somebody has just filled in the trial form and pressed submit. What should notice?',
    nodeTypes: ['form-trigger'],
    pickable: ['form-trigger', 'webhook', 'schedule'],
  },
  {
    id: 'rate',
    label: 'Get today’s rate',
    coach: 'That’s the way in. The row has to carry today’s dollar-to-rupee rate, and nothing on the form asks for it — so where does it come from?',
    nodeTypes: ['http-request'],
    pickable: ['http-request', 'code', 'web-search'],
  },
  {
    id: 'log-and-welcome',
    label: 'Log it and welcome them',
    coach: 'Now the rate is in hand. Last part: put the signup on the sheet, then tell the person they’re in.',
    nodeTypes: ['google-sheets', 'action'],
    pickable: ['google-sheets', 'action', 'google-docs', 'switch'],
  },
];
