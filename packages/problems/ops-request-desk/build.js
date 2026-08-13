// The shape of the flow, and the order it gets built in.
//
// Seven nodes, one instance of each type, and three exits that each end at exactly one
// action node. Both of those are engine constraints rather than taste: `nodeSetup` is
// keyed by node TYPE, so two Gmail nodes would share one answer key; and `simulateCase`
// returns at the FIRST action-category node it reaches, so chaining one action into
// another gives the second node no run to appear in.

/**
 * The drawer's contents. `isDistractor: true` is a node that does NOT belong — each one
 * is a chance to probe a misconception, and every distractor here has an entry in
 * probes.js.
 *
 * Labels name the NODE and never the operation this case grades on it. `Google Sheets`,
 * not `Google Sheets — Append Row`: the picker is on screen before the mapping question
 * is asked, and a palette label that spells out an answer is the same leak as a
 * flowSummary label that names a node.
 */
export const nodePalette = [
  { type: 'form-trigger', label: 'On form submission', category: 'trigger', isDistractor: false },
  { type: 'webhook', label: 'On Webhook Call', category: 'trigger', isDistractor: true },
  { type: 'schedule', label: 'On a Schedule', category: 'trigger', isDistractor: true },
  { type: 'information-extractor', label: 'Information Extractor', category: 'ai', isDistractor: false },
  { type: 'openai-chat-model', label: 'OpenAI Chat Model', category: 'model', isDistractor: false },
  { type: 'text-classifier', label: 'Text Classifier', category: 'core', isDistractor: true },
  { type: 'ai-agent', label: 'AI Agent', category: 'core', isDistractor: true },
  { type: 'edit-fields', label: 'Edit Fields', category: 'core', isDistractor: true },
  { type: 'switch', label: 'Switch', category: 'core', isDistractor: false },
  { type: 'filter', label: 'Filter', category: 'core', isDistractor: true },
  { type: 'if', label: 'If', category: 'core', isDistractor: true },
  { type: 'code', label: 'Code', category: 'core', isDistractor: true },
  { type: 'google-sheets', label: 'Google Sheets', category: 'action', isDistractor: false },
  { type: 'gmail', label: 'Gmail', category: 'action', isDistractor: false },
  { type: 'slack', label: 'Slack', category: 'action', isDistractor: false },
  { type: 'respond-to-webhook', label: 'Respond to Webhook', category: 'core', isDistractor: true },
];

/**
 * The router's labelled outputs, and the order here IS the output order the canvas and
 * the simulator both use.
 *
 * The IDS are the exact three values the AI is asked to answer with, because a branch can
 * only ever fire if something upstream produces the value it tests — that is the whole
 * lesson of the rule list. The LABELS are what a person reads on the wire.
 *
 * There is no fourth "everything else" exit. `simulateCase` dead-ends an item that
 * matches no branch, so `needs_human` is a declared branch and an explicit category the
 * extractor is instructed to return, rather than a catch-all port. What happens to an
 * item that matches nothing anyway is asked in Stress Testing.
 */
export const branches = [
  { id: 'log', label: 'Log only' },
  { id: 'email', label: 'Email only' },
  { id: 'needs_human', label: 'Needs a human' },
];

/**
 * The "shape of it" sketch on the Understand screen — shown BEFORE the quiz asks which
 * node does each job.
 *
 * TWO ENFORCED RULES: labels describe the JOB and never the node, and three words
 * maximum. The check matches every palette label above as a SUBSTRING, so with `If`,
 * `Code`, `Filter` and `Switch` in the palette, a label reading "notify them",
 * "encode it" or "switch paths" fails on the word inside the word.
 *
 * The router step's label is not actually drawn — ConceptFlow replaces it with "3 ways"
 * plus a dot per branch — but it has to pass the same two rules.
 */
export const flowSummary = {
  steps: [
    { type: 'form-trigger', label: 'a request arrives' },
    { type: 'information-extractor', label: 'read and unpack' },
    { type: 'switch', label: 'three ways out' },
    { type: 'google-sheets', label: 'one job each' },
  ],
  caption:
    'One step reads the free text and turns it into named values. The split then sends each request down its own path, and each path does exactly one thing and nothing more.',
};

/**
 * Canonical order, used to detect a SEQUENCE mistake: from a given source, only these
 * types are a valid next step.
 *
 * `branchNext` is keyed PER EXIT here, which the engine now supports (an array still
 * means "every exit accepts the same thing"). It matters for this problem because its
 * three exits end at three DIFFERENT node types: with one shared list the only question
 * the picker could ask was "is this a destination at all?", so the spreadsheet on the
 * escalation exit was accepted, the phase went green, and the mistake only surfaced
 * later as a failing Run. Now the exit itself is the question.
 *
 * Every terminal maps to an empty list. Chaining one action into another was considered
 * and rejected: `flow.next` is keyed by TYPE, so allowing it would put an "add next" cue
 * on every terminal and let a learner satisfy a required edge by hanging Gmail off the
 * log branch.
 */
export const flow = {
  start: ['form-trigger'],
  next: {
    'form-trigger': ['information-extractor'],
    'information-extractor': ['switch'],
    switch: [],
    'google-sheets': [],
    gmail: [],
    slack: [],
    'openai-chat-model': [],
  },
  branchNext: {
    log: ['google-sheets'],
    email: ['gmail'],
    needs_human: ['slack'],
  },
  modelNext: ['openai-chat-model'],
};

/**
 * The guided build, phase by phase. `coach` is Iris's line on entering the phase.
 *
 * `nodeTypes` is what the phase requires; `pickable` is what the drawer OFFERS. EVERY
 * phase declares its own `pickable`, because the picker's fallback lists cover only a
 * fraction of the 200-type library and a phase that omits it can make a required node
 * unpickable. A 'model'-category type is exempt from being pickable — it is added
 * through the AI node’s Chat Model slot (`flow.modelNext`), never through the drawer.
 *
 * The split and the three terminals are ONE phase on purpose: a routing phase only
 * completes once every declared branch reaches a configured terminal (`branchReach.js`),
 * so a phase holding the split alone could never clear.
 */
export const buildPhases = [
  {
    id: 'intake',
    label: 'Catch the request',
    coach: 'Let’s build. Somebody at Fernwood has just filled in the Ops Desk request and pressed submit. What should notice?',
    nodeTypes: ['form-trigger'],
    pickable: ['form-trigger', 'webhook', 'schedule'],
  },
  {
    id: 'read',
    label: 'Read what they wrote',
    coach: 'That’s the way in. Now the hard part: one box of free text, and four separate things the rest of the flow needs out of it.',
    nodeTypes: ['information-extractor', 'openai-chat-model'],
    pickable: ['information-extractor', 'text-classifier', 'ai-agent', 'code', 'edit-fields'],
  },
  {
    id: 'route',
    label: 'Send it where it belongs',
    coach: 'Every request now carries its type and its details. Last part: three exits, and each one does its own single job.',
    nodeTypes: ['switch', 'google-sheets', 'gmail', 'slack'],
    pickable: ['switch', 'google-sheets', 'gmail', 'slack', 'filter', 'if', 'respond-to-webhook'],
  },
];
