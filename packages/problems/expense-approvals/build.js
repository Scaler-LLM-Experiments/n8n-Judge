// The shape of the flow, and the order it gets built in.
//
// `flowSummary` is drawn on the Understand screen BEFORE the dissection quiz, so its
// labels describe the job in three words and never name a node — `validateProblem()`
// rejects both mistakes. `flow` is what detects a sequence mistake; `branches` is what
// the router fans out to; `buildPhases` is the guided order, each phase's `pickable`
// being what the drawer offers (including the distractors worth probing).

// Every type here is a real @judge/catalog entry: a palette type outside the catalog
// renders from nodeIcons metadata only, which `validateProblem()` warns about and the
// registry test treats as a failure.
export const nodePalette = [
  { type: 'trigger', label: 'New Email', category: 'trigger', isDistractor: false },
  { type: 'chat-trigger', label: 'Chat Trigger', category: 'trigger', isDistractor: true },
  { type: 'schedule', label: 'On a Schedule', category: 'trigger', isDistractor: true },
  { type: 'webhook', label: 'On Webhook Call', category: 'trigger', isDistractor: true },
  { type: 'classify', label: 'Classify with AI', category: 'ai', isDistractor: false },
  { type: 'chat-gemini', label: 'Gemini Chat Model', category: 'model', isDistractor: false },
  { type: 'parse', label: 'Parse Result', category: 'core', isDistractor: false },
  { type: 'switch', label: 'Switch', category: 'core', isDistractor: false },
  { type: 'code', label: 'Code', category: 'core', isDistractor: true },
  { type: 'http-request', label: 'HTTP Request', category: 'core', isDistractor: true },
  { type: 'filter', label: 'Filter', category: 'core', isDistractor: true },
  { type: 'if', label: 'If', category: 'core', isDistractor: true },
  { type: 'action', label: 'Send Reply', category: 'action', isDistractor: false },
  { type: 'slack-message', label: 'Slack. Send Message', category: 'action', isDistractor: true },
  { type: 'google-docs', label: 'Google Docs. Create Document', category: 'action', isDistractor: true },
];

// The Switch's labelled outputs. These ids are what `expect.rules` names, what the
// wires carry, and what a sample case's `branch` points at, so they are the one
// vocabulary the routing shares end to end.
//
// The labels are exactly the words the AI is told to answer with (see the locked
// system prompt on `classify`), because a branch can only fire if something upstream
// produces its label — and that is the whole lesson of the rule list.
export const branches = [
  { id: 'auto_approve', label: 'Auto Approve' },
  { id: 'manager_approval', label: 'Manager Approval' },
  { id: 'missing_info', label: 'Missing Info' },
];

// The "shape of it" sketch, shown on the Understand screen BEFORE the quiz asks which
// node does each job. Labels describe the JOB, in three words or fewer, and never name
// a node — `validateProblem()` enforces both, and it matches every palette label as a
// substring, so with `If` and `Code` in the palette above, a label reading "verify it"
// or "codify it" fails on the word inside the word.
//
// The router step's label is not actually drawn: ConceptFlow replaces it with "3 ways"
// plus a dot per branch, because joining the branch names made a five-line cell. It
// still has to pass the same two rules.
export const flowSummary = {
  steps: [
    { type: 'trigger', label: 'a claim arrives' },
    { type: 'classify', label: 'read and judge' },
    { type: 'parse', label: 'pull the verdict' },
    { type: 'switch', label: 'split three ways' },
    { type: 'action', label: 'answer the person' },
  ],
  caption: 'One AI step makes the call on each claim. The split then sends it down its own path, and each path answers differently.',
};

// Canonical flow order. Used to detect sequence mistakes: from a given source
// (or the model / branch ports) only certain node types are the valid next step.
export const flow = {
  start: ['trigger'],
  next: { trigger: ['classify'], classify: ['parse'], parse: ['switch'], switch: [], action: [], 'chat-gemini': [] },
  branchNext: ['action'],
  modelNext: ['chat-gemini'],
};

// The three guided build phases. `coach` is Iris's line on entering the phase.
//
// `pickable` is what the drawer offers here, distractors included: the trigger phase
// offers the three wrong ways to start a flow; the judging phase offers what people reach
// for instead of a model (rules in Code, a lookup against the finance API, dropping the
// claims that look incomplete); the routing phase offers the nodes that split too few ways
// or tell somebody who is not the claimant. Every one of them has a probe in probes.js.
export const buildPhases = [
  {
    id: 'intake',
    label: 'Catch the claim',
    coach: "Let's build. First, what should notice that a claim has arrived?",
    nodeTypes: ['trigger'],
    pickable: ['trigger', 'chat-trigger', 'schedule', 'webhook'],
  },
  {
    id: 'judge',
    label: 'Make the call',
    coach: "That's the way in sorted. Now let's get it reading each claim and deciding what to do with it.",
    nodeTypes: ['classify', 'chat-gemini', 'parse'],
    pickable: ['classify', 'parse', 'code', 'http-request', 'filter'],
  },
  {
    id: 'route',
    label: 'Route and reply',
    coach: 'It can judge a claim now. Last part: send each decision down its own path and answer the claimant.',
    nodeTypes: ['switch', 'action'],
    pickable: ['switch', 'action', 'if', 'filter', 'slack-message', 'google-docs'],
  },
];
