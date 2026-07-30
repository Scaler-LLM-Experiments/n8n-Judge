// The shape of the flow, and the order it gets built in.
//
// `flowSummary` is drawn on the Understand screen BEFORE the dissection quiz, so its
// labels describe the job in three words and never name a node — `validateProblem()`
// rejects both mistakes. `flow` is what detects a sequence mistake; `branches` is what
// the router fans out to; `buildPhases` is the guided order, each phase's `pickable`
// being what the drawer offers (including the distractors worth probing).

export const nodePalette = [
  { type: 'trigger', label: 'New Email', category: 'trigger', isDistractor: false },
  { type: 'chat-trigger', label: 'Chat Trigger', category: 'trigger', isDistractor: true },
  { type: 'classify', label: 'Classify with AI', category: 'ai', isDistractor: false },
  { type: 'chat-gemini', label: 'Gemini Chat Model', category: 'model', isDistractor: false },
  { type: 'parse', label: 'Parse Result', category: 'core', isDistractor: false },
  { type: 'switch', label: 'Switch', category: 'core', isDistractor: false },
  { type: 'web-search', label: 'Web Search', category: 'core', isDistractor: true },
  { type: 'action', label: 'Send Reply', category: 'action', isDistractor: false },
  { type: 'slack-message', label: 'Slack — Send Message', category: 'action', isDistractor: true },
  { type: 'calendar-event', label: 'Google Calendar — Create Event', category: 'action', isDistractor: true },
  { type: 'notion-page', label: 'Notion — Create Page', category: 'action', isDistractor: true },
  { type: 'google-docs', label: 'Google Docs — Create Document', category: 'action', isDistractor: true },
];

// The Switch's labelled outputs (branches). Drives the branch ports on the
// Switch node, the "all branches wired" completion check, and the run.
export const branches = [
  { id: 'bug_report', label: 'Bug Report' },
  { id: 'feature_request', label: 'Feature Request' },
  { id: 'urgent_complaint', label: 'Urgent Complaint' },
];

// Read-only summary of the built agent, shown atop the Stress Testing stage.
// Labels describe the JOB, never the node — this sketch is shown before the
// dissection quiz asks which node does each job. `validateProblem` enforces it.
export const flowSummary = {
  steps: [
    { type: 'trigger', label: 'email arrives' },
    { type: 'classify', label: 'read and label' },
    { type: 'parse', label: 'pull the label' },
    { type: 'switch', label: 'split by label' },
    { type: 'action', label: 'send the reply' },
  ],
  caption: 'Three categories, three replies. One AI step decides which, and the split sends each down its own path.',
};

// Canonical flow order. Used to detect sequence mistakes: from a given source
// (or the model / branch ports) only certain node types are the valid next step.
export const flow = {
  start: ['trigger'],
  next: { trigger: ['classify'], classify: ['parse'], parse: ['switch'], switch: [], action: [], 'chat-gemini': [] },
  branchNext: ['action'],
  modelNext: ['chat-gemini'],
};

// The 3 guided build sub-phases. `coach` is Iris's line on entering the phase.
export const buildPhases = [
  { id: 'trigger', label: 'Set your trigger', coach: "Let's build. First — what should start this flow?", nodeTypes: ['trigger'], pickable: ['trigger', 'chat-trigger', 'schedule', 'webhook'] },
  { id: 'brain', label: 'Give it a brain', coach: "Trigger's set. Now let's make it read and understand each email.", nodeTypes: ['classify', 'chat-gemini', 'parse'], pickable: ['classify', 'parse', 'code', 'if', 'web-search'] },
  { id: 'route', label: 'Route & reply', coach: 'It can read emails now. Last part — route by category and send the right reply.', nodeTypes: ['switch', 'action'], pickable: ['switch', 'action', 'if', 'merge', 'filter', 'slack-message', 'google-docs'] },
];

// Node setup, field-based. Each node's NDV shows a locked credential plus the
// fields the learner must set. Each field is a real select; its `options`
// carry the correct value and a per-option "why" Iris uses to explain a
// green (correct) or red (wrong) result after the learner hits "Verify setup".
