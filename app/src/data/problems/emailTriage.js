export const emailTriage = {
  id: 'email-triage',
  title: 'Email Triage Automation',
  statement:
    "Your inbox is full of mixed feedback. Build a flow that watches for new emails, uses AI to classify each one (Bug Report / Feature Request / Complaint), and routes urgent complaints differently from everything else — each path sends the right reply.",

  nodePalette: [
    { type: 'trigger', label: 'New Email', category: 'trigger', isDistractor: false },
    { type: 'classify', label: 'Classify with AI', category: 'process', isDistractor: false },
    { type: 'parse', label: 'Parse Result', category: 'process', isDistractor: false },
    { type: 'route', label: 'Route', category: 'branch', isDistractor: false },
    { type: 'action', label: 'Send Reply', category: 'action', isDistractor: false },
    { type: 'complete', label: 'Complete', category: 'finish', isDistractor: false },
    { type: 'slack-message', label: 'Slack — Send Message', category: 'action', isDistractor: true },
    { type: 'calendar-event', label: 'Google Calendar — Create Event', category: 'action', isDistractor: true },
    { type: 'notion-page', label: 'Notion — Create Page', category: 'action', isDistractor: true },
    { type: 'web-search', label: 'Web Search', category: 'process', isDistractor: true },
    { type: 'google-docs', label: 'Google Docs — Create Document', category: 'action', isDistractor: true },
    { type: 'chat-trigger', label: 'Chat Trigger', category: 'trigger', isDistractor: true },
  ],

  referenceGraph: {
    nodes: [
      { id: 'trigger-1', type: 'trigger', position: { x: 0, y: 200 }, requiredLabel: 'New Email' },
      { id: 'classify-1', type: 'classify', position: { x: 260, y: 200 }, requiredLabel: 'Classify with AI' },
      { id: 'parse-1', type: 'parse', position: { x: 520, y: 200 }, requiredLabel: 'Parse Result' },
      { id: 'route-1', type: 'route', position: { x: 780, y: 200 }, requiredLabel: 'Route' },
      { id: 'action-bug', type: 'action', position: { x: 1040, y: 40 }, requiredLabel: 'Send Reply — Bug Report' },
      { id: 'action-feature', type: 'action', position: { x: 1040, y: 200 }, requiredLabel: 'Send Reply — Feature Request' },
      { id: 'action-urgent', type: 'action', position: { x: 1040, y: 360 }, requiredLabel: 'Send Reply — Urgent Complaint' },
      { id: 'complete-1', type: 'complete', position: { x: 1300, y: 200 }, requiredLabel: 'Complete' },
    ],
    edges: [
      { source: 'trigger-1', target: 'classify-1' },
      { source: 'classify-1', target: 'parse-1' },
      { source: 'parse-1', target: 'route-1' },
      { source: 'route-1', target: 'action-bug', branch: 'bug_report' },
      { source: 'route-1', target: 'action-feature', branch: 'feature_request' },
      { source: 'route-1', target: 'action-urgent', branch: 'urgent_complaint' },
      { source: 'action-bug', target: 'complete-1' },
      { source: 'action-feature', target: 'complete-1' },
      { source: 'action-urgent', target: 'complete-1' },
    ],
  },

  testCases: [
    {
      id: 'trigger-present',
      description: 'New Email trigger present and is the sole entry point.',
      kind: 'structural',
      checks: { requiredNodeTypes: ['trigger'] },
    },
    {
      id: 'classify-parse-chain',
      description: 'Classify with AI → Parse Result chain present before the branch.',
      kind: 'structural',
      checks: {
        requiredNodeTypes: ['classify', 'parse'],
        requiredEdges: [{ sourceType: 'classify', targetType: 'parse' }],
      },
    },
    {
      id: 'route-present-with-branches',
      description: 'Route node present and receives input from Parse Result.',
      kind: 'structural',
      checks: {
        requiredNodeTypes: ['route'],
        requiredEdges: [{ sourceType: 'parse', targetType: 'route' }],
      },
    },
    {
      id: 'each-branch-sends-reply',
      description: 'Each branch reaches its own Send Reply node (Bug Report, Feature Request, Urgent Complaint).',
      kind: 'structural',
      checks: {
        requiredEdges: [
          { sourceType: 'route', targetType: 'action', branch: 'bug_report' },
          { sourceType: 'route', targetType: 'action', branch: 'feature_request' },
          { sourceType: 'route', targetType: 'action', branch: 'urgent_complaint' },
        ],
      },
    },
    {
      id: 'all-paths-complete',
      description: 'Every path terminates at a Complete node (no dangling nodes).',
      kind: 'structural',
      checks: { requiresPath: true },
    },
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
