// The finished flow, and everything the Run and Stress Testing measure against.
//
// `referenceGraph` is the correct build (it seeds the #run-story dev route).
// `sampleCases` stream through the learner's own graph during the Run — `branch: null`
// marks a case that intentionally matches no rule, which is the thing Stress Testing
// then asks about. `evalQuestions` grade against `correctIndex`, so the display order is
// shuffled per session and each option carries its authored index.

export const referenceGraph = {
  nodes: [
    { id: 'trigger-1', type: 'trigger', position: { x: 0, y: 180 }, requiredLabel: 'New Email' },
    { id: 'classify-1', type: 'classify', position: { x: 260, y: 180 }, requiredLabel: 'Classify with AI' },
    { id: 'model-1', type: 'chat-gemini', position: { x: 275, y: 340 }, requiredLabel: 'Gemini Chat Model' },
    { id: 'parse-1', type: 'parse', position: { x: 540, y: 180 }, requiredLabel: 'Parse Result' },
    { id: 'switch-1', type: 'switch', position: { x: 800, y: 180 }, requiredLabel: 'Switch' },
    { id: 'action-bug', type: 'action', position: { x: 1080, y: 40 }, requiredLabel: 'Send Reply — Bug Report' },
    { id: 'action-feature', type: 'action', position: { x: 1080, y: 180 }, requiredLabel: 'Send Reply — Feature Request' },
    { id: 'action-urgent', type: 'action', position: { x: 1080, y: 320 }, requiredLabel: 'Send Reply — Urgent Complaint' },
  ],
  edges: [
    { source: 'model-1', target: 'classify-1', targetHandle: 'ai_model' },
    { source: 'trigger-1', target: 'classify-1' },
    { source: 'classify-1', target: 'parse-1' },
    { source: 'parse-1', target: 'switch-1' },
    { source: 'switch-1', target: 'action-bug', branch: 'bug_report' },
    { source: 'switch-1', target: 'action-feature', branch: 'feature_request' },
    { source: 'switch-1', target: 'action-urgent', branch: 'urgent_complaint' },
  ],
};

export const testCases = [
  {
    id: 'trigger-present',
    description: 'A New Email trigger starts the flow.',
    kind: 'structural',
    checks: { requiredNodeTypes: ['trigger'] },
  },
  {
    id: 'model-connected',
    description: 'A Chat Model is plugged into the Classify with AI node.',
    kind: 'structural',
    checks: {
      requiredNodeTypes: ['classify'],
      requiredEdges: [{ sourceCategory: 'model', targetType: 'classify', targetHandle: 'ai_model' }],
    },
  },
  {
    id: 'classify-parse-chain',
    description: 'The email is classified with AI, then the result is parsed.',
    kind: 'structural',
    checks: {
      requiredNodeTypes: ['classify', 'parse'],
      requiredEdges: [
        { sourceType: 'trigger', targetType: 'classify' },
        { sourceType: 'classify', targetType: 'parse' },
      ],
    },
  },
  {
    id: 'switch-present-with-branches',
    description: 'A Switch node routes the parsed result by category.',
    kind: 'structural',
    checks: {
      requiredNodeTypes: ['switch'],
      requiredEdges: [{ sourceType: 'parse', targetType: 'switch' }],
    },
  },
  {
    id: 'each-branch-sends-reply',
    description: 'Each branch reaches its own Send Reply node (Bug Report, Feature Request, Urgent Complaint).',
    kind: 'structural',
    checks: {
      requiredEdges: [
        { sourceType: 'switch', targetType: 'action', branch: 'bug_report' },
        { sourceType: 'switch', targetType: 'action', branch: 'feature_request' },
        { sourceType: 'switch', targetType: 'action', branch: 'urgent_complaint' },
      ],
    },
  },
];

// The Switch's labelled outputs (branches). Drives the branch ports on the
// Switch node, the "all branches wired" completion check, and the run.

// Sample emails the Run simulation streams through the flow, one after another.
// `branch` is the Switch handle each should take (null = matches no branch).
export const sampleCases = [
  { id: 'bug', from: 'dev@acme.io', subject: 'App crashes every time I log in', category: 'BUG_REPORT', urgency: 'HIGH', branch: 'bug_report', reply: 'Bug Report' },
  { id: 'feature', from: 'maria@acme.io', subject: 'Could you add a dark mode?', category: 'FEATURE_REQUEST', urgency: 'LOW', branch: 'feature_request', reply: 'Feature Request' },
  { id: 'urgent', from: 'furious@acme.io', subject: "I've been charged twice and no one is helping!", category: 'COMPLAINT', urgency: 'HIGH', branch: 'urgent_complaint', reply: 'Urgent Complaint' },
  { id: 'question', from: 'curious@acme.io', subject: 'What are your business hours?', category: 'QUESTION', urgency: 'LOW', branch: null, reply: null },
];

export const evalQuestions = [
  {
    id: 'general-question-gap',
    caseId: 'question',
    prompt:
      "A customer email arrives that's just a general question, with no bug/feature/complaint keywords. What happens in this flow?",
    options: [
      'It gets logged as a Feature Request by default',
      "It doesn't match any of the 3 defined paths, so nothing sends",
      'The flow throws an error and stops',
      'It is automatically escalated as Urgent Complaint',
    ],
    correctIndex: 1,
    explanation:
      'Your Switch only has 3 branches — Bug Report, Feature Request, Urgent Complaint. A plain question matches none of them, so it silently falls through and no reply is ever sent. Real automations need a default/catch-all branch for exactly this.',
  },
  {
    id: 'why-fixed-path',
    prompt:
      'Why is this modeled as a fixed-path classifier rather than a full autonomous agent choosing tools?',
    options: [
      'Because Gemini cannot be used in an autonomous agent',
      'Because n8n does not support branching logic',
      "Because the structure is fixed and predictable — the AI only does one classification step, it doesn't choose which tools to call",
      'Because fixed-path classifiers are always more accurate than agents',
    ],
    correctIndex: 2,
    explanation:
      'The workflow is deterministic: the AI does exactly one job — classify — and everything else (parse, route, reply) is fixed wiring you designed. A full agent would decide its own steps and tools at runtime, which is powerful but unpredictable. For reliable, repeatable triage, a fixed path is the right call.',
  },
];
