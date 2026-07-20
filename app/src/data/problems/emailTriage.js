export const emailTriage = {
  id: 'email-triage',
  title: 'Email Triage Automation',
  statement:
    "Your inbox is full of mixed feedback. Build a flow that watches for new emails, uses AI to classify each one (Bug Report / Feature Request / Complaint), and routes urgent complaints differently from everything else — each path sends the right reply.",

  testCaseSummary: [
    'A New Email trigger starts the flow.',
    'A Chat Model is plugged into the Classify with AI node.',
    'The email is classified with AI, then the result is parsed.',
    'A Switch node routes the parsed result by category.',
    'Each of the 3 categories — Bug Report, Feature Request, Urgent Complaint — sends its own reply.',
  ],

  nodePalette: [
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
  ],

  referenceGraph: {
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
  },

  testCases: [
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
  ],

  buildSteps: [
    { id: 'trigger', label: 'Start the flow', categories: ['trigger'] },
    { id: 'think', label: 'Classify, connect a model, parse & route', categories: ['ai', 'model', 'core'] },
    { id: 'act', label: 'Send the replies', categories: ['action'] },
  ],

  evalQuestions: [
    {
      id: 'general-question-gap',
      prompt:
        "A customer email arrives that's just a general question, with no bug/feature/complaint keywords. What happens in this flow?",
      options: [
        'It gets logged as a Feature Request by default',
        "It doesn't match any of the 3 defined paths, so nothing sends",
        'The flow throws an error and stops',
        'It is automatically escalated as Urgent Complaint',
      ],
      correctIndex: 1,
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
    },
  ],
};
