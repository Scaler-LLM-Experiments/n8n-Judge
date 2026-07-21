export const emailTriage = {
  id: 'email-triage',
  title: 'Email Triage Automation',
  statement:
    "Your inbox is full of mixed feedback. Build a flow that watches for new emails, uses AI to classify each one (Bug Report / Feature Request / Complaint), and routes urgent complaints differently from everything else — each path sends the right reply.",

  // Front-of-flow: dissect the problem. Each correct answer unlocks node(s) for
  // the builder. Learner must answer each correctly (with retry) to proceed.
  dissection: [
    {
      id: 'trigger',
      prompt: 'What event should kick this workflow off?',
      options: [
        'When a new email arrives in the inbox',
        'On a fixed schedule, every hour',
        'When someone opens a chat window',
        'Only when you run it manually',
      ],
      correctIndex: 0,
      explanation:
        'The job is to react to incoming support emails, so the flow should start the moment a new email lands. That is an event trigger — a New Email trigger — not a schedule or a manual run.',
      unlocks: ['trigger'],
    },
    {
      id: 'classify',
      prompt: 'How should the flow decide what kind of email each one is?',
      options: [
        'Use an AI model to read and classify it',
        'Check the sender’s email domain',
        'Ask the customer to pick a category',
        'Assign a category at random',
      ],
      correctIndex: 0,
      explanation:
        'Emails are free-form text, so rules on the domain won’t work and you can’t make the customer do it. An AI classification step reads the message and labels it — that’s the Classify with AI node, which needs a language model plugged in.',
      unlocks: ['classify', 'chat-gemini'],
    },
    {
      id: 'parse',
      prompt: 'The AI returns its answer as a line of text. What do you need before you can branch on it?',
      options: [
        'Parse it into structured fields (category, urgency)',
        'Send the text straight to the Switch',
        'Nothing — text works everywhere',
        'Email the raw text to yourself',
      ],
      correctIndex: 0,
      explanation:
        'The Switch node routes on a specific field, but the AI hands back a blob of text. You first parse it into clean fields — category and urgency — so later nodes can read them reliably.',
      unlocks: ['parse'],
    },
    {
      id: 'switch',
      prompt: 'You have three categories that each need different handling. Which node sends one input down multiple paths by rules?',
      options: ['Switch', 'If', 'Merge', 'Filter'],
      correctIndex: 0,
      explanation:
        'If only splits two ways (true/false). Merge combines streams and Filter drops items. The Switch node routes a single input to any number of outputs based on rules — exactly what three categories need.',
      unlocks: ['switch'],
    },
    {
      id: 'action',
      prompt: 'What should happen at the end of each category’s path?',
      options: [
        'Send a reply email tailored to that category',
        'Delete the incoming email',
        'Do nothing and stop',
        'Write it to a spreadsheet only',
      ],
      correctIndex: 0,
      explanation:
        'The whole point is to respond appropriately. Each branch ends in a Send Reply action so the customer actually hears back — with a message that fits their category.',
      unlocks: ['action'],
    },
  ],

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

  // The connections the learner must make, in order, with plain-language labels.
  // `match` reuses the same shape as testCases.requiredEdges.
  connectionGuide: [
    { id: 'trigger-classify', label: 'New Email → Classify with AI', match: { sourceType: 'trigger', targetType: 'classify' } },
    { id: 'model-classify', label: 'Gemini Chat Model → Classify’s Chat Model port', hint: 'Drag from the model’s top dot up into the dashed “Chat Model” port under Classify.', match: { sourceCategory: 'model', targetType: 'classify', targetHandle: 'ai_model' } },
    { id: 'classify-parse', label: 'Classify with AI → Parse Result', match: { sourceType: 'classify', targetType: 'parse' } },
    { id: 'parse-switch', label: 'Parse Result → Switch', match: { sourceType: 'parse', targetType: 'switch' } },
    { id: 'bug', label: 'Switch · Bug Report → Send Reply', match: { sourceType: 'switch', targetType: 'action', branch: 'bug_report' } },
    { id: 'feature', label: 'Switch · Feature Request → Send Reply', match: { sourceType: 'switch', targetType: 'action', branch: 'feature_request' } },
    { id: 'urgent', label: 'Switch · Urgent Complaint → Send Reply', match: { sourceType: 'switch', targetType: 'action', branch: 'urgent_complaint' } },
  ],

  // Sample emails the Run simulation streams through the flow, one after another.
  // `branch` is the Switch handle each should take (null = matches no branch).
  sampleCases: [
    { id: 'bug', from: 'dev@acme.io', subject: 'App crashes every time I log in', category: 'BUG_REPORT', urgency: 'HIGH', branch: 'bug_report', reply: 'Bug Report' },
    { id: 'feature', from: 'maria@acme.io', subject: 'Could you add a dark mode?', category: 'FEATURE_REQUEST', urgency: 'LOW', branch: 'feature_request', reply: 'Feature Request' },
    { id: 'urgent', from: 'furious@acme.io', subject: "I've been charged twice and no one is helping!", category: 'COMPLAINT', urgency: 'HIGH', branch: 'urgent_complaint', reply: 'Urgent Complaint' },
    { id: 'question', from: 'curious@acme.io', subject: 'What are your business hours?', category: 'QUESTION', urgency: 'LOW', branch: null, reply: null },
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
  ],
};
