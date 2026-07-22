export const emailTriage = {
  id: 'email-triage',
  title: 'Email Triage Automation',
  statement:
    "Your inbox is full of mixed feedback. Build a flow that watches for new emails, uses AI to classify each one (Bug Report / Feature Request / Complaint), and routes urgent complaints differently from everything else — each path sends the right reply.",

  // Front-of-flow: Iris interrogates the learner to dissect the problem. Each
  // question is a NODE/APP pick — options map to real node types, and the chosen
  // node drops onto the canvas (tagged right/wrong). Correct answers unlock the
  // node for the builder. Must answer correctly (with retry) to advance.
  dissection: [
    {
      id: 'trigger',
      prompt: 'Let’s start at the very top. Which app should kick this workflow off?',
      options: [
        { label: 'New Email', type: 'trigger' },
        { label: 'Chat Trigger', type: 'chat-trigger' },
        { label: 'Schedule', type: 'schedule' },
        { label: 'Webhook', type: 'webhook' },
      ],
      correctType: 'trigger',
      wrongHint: 'Think about what has to be watching the inbox in real time. Does this one actually do that?',
      explanation: 'A New Email trigger fires the moment a support email lands — exactly the signal this workflow needs to react to.',
      unlocks: ['trigger'],
    },
    {
      id: 'classify',
      prompt: 'A raw email just came in. What should read it and work out what kind of email it is?',
      options: [
        { label: 'Classify with AI', type: 'classify' },
        { label: 'If', type: 'if' },
        { label: 'Code', type: 'code' },
        { label: 'Switch', type: 'switch' },
      ],
      correctType: 'classify',
      wrongHint: 'The email is messy, free-form text. Would fixed rules or code reliably tell a bug apart from a complaint?',
      explanation: 'Classify with AI reads the message the way a person would and labels it — resilient to however the email is phrased. It’ll need a language model plugged in, which you’ll wire up later.',
      unlocks: ['classify', 'chat-gemini'],
    },
    {
      id: 'parse',
      prompt: 'The AI hands its answer back as one blob of text. What comes next, before you can branch on it?',
      options: [
        { label: 'Parse Result', type: 'parse' },
        { label: 'Send it straight to Switch', type: 'switch' },
        { label: 'Send Reply now', type: 'action' },
        { label: 'Do nothing', type: 'noop' },
      ],
      correctType: 'parse',
      wrongHint: 'Right now it’s just a string of text. Can the next node reliably branch on that as-is?',
      explanation: 'Parse Result turns the AI’s text into clean fields — category and urgency — so every node after it can read them reliably.',
      unlocks: ['parse'],
    },
    {
      id: 'switch',
      prompt: 'Three categories, three different replies. Which node sends one input down several paths by rule?',
      options: [
        { label: 'Switch', type: 'switch' },
        { label: 'If', type: 'if' },
        { label: 'Merge', type: 'merge' },
        { label: 'Filter', type: 'filter' },
      ],
      correctType: 'switch',
      wrongHint: 'You need one item to go down three separate paths by rule. Does this node give you that many outputs?',
      explanation: 'Switch routes a single input to as many labelled outputs as you define — one each for Bug Report, Feature Request and Urgent Complaint.',
      unlocks: ['switch'],
    },
    {
      id: 'action',
      prompt: 'Last decision. At the end of each branch, what actually responds to the customer?',
      options: [
        { label: 'Send Reply', type: 'action' },
        { label: 'Slack — Send Message', type: 'slack-message' },
        { label: 'Google Docs', type: 'google-docs' },
        { label: 'Do nothing', type: 'noop' },
      ],
      correctType: 'action',
      wrongHint: 'The customer reached out over email. Would this option actually get a response back to them?',
      explanation: 'Send Reply emails the customer back with a message tailored to their category — the whole point of the triage.',
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

  // The Switch's labelled outputs (branches). Drives the branch ports on the
  // Switch node, the "all branches wired" completion check, and the run.
  branches: [
    { id: 'bug_report', label: 'Bug Report' },
    { id: 'feature_request', label: 'Feature Request' },
    { id: 'urgent_complaint', label: 'Urgent Complaint' },
  ],

  // Read-only summary of the built agent, shown atop the Stress Testing stage.
  flowSummary: {
    steps: [
      { type: 'trigger', label: 'New Email' },
      { type: 'classify', label: 'Classify with AI' },
      { type: 'parse', label: 'Parse Result' },
      { type: 'switch', label: 'Switch' },
      { type: 'action', label: 'Send Reply' },
    ],
    caption: 'Gemini Chat Model powers Classify · Switch fans out to 3 replies (Bug Report · Feature Request · Urgent Complaint).',
  },

  // Canonical flow order. Used to detect sequence mistakes: from a given source
  // (or the model / branch ports) only certain node types are the valid next step.
  flow: {
    start: ['trigger'],
    next: { trigger: ['classify'], classify: ['parse'], parse: ['switch'], switch: [], action: [], 'chat-gemini': [] },
    branchNext: ['action'],
    modelNext: ['chat-gemini'],
  },

  // The 3 guided build sub-phases. `coach` is Iris's line on entering the phase.
  buildPhases: [
    { id: 'trigger', label: 'Set your trigger', coach: "Let's build. First — what should start this flow?", nodeTypes: ['trigger'], pickable: ['trigger', 'chat-trigger', 'schedule', 'webhook'] },
    { id: 'brain', label: 'Give it a brain', coach: "Trigger's set. Now let's make it read and understand each email.", nodeTypes: ['classify', 'chat-gemini', 'parse'], pickable: ['classify', 'parse', 'code', 'if', 'web-search'] },
    { id: 'route', label: 'Route & reply', coach: 'It can read emails now. Last part — route by category and send the right reply.', nodeTypes: ['switch', 'action'], pickable: ['switch', 'action', 'if', 'merge', 'filter', 'slack-message', 'google-docs'] },
  ],

  // Node setup, field-based. Each node's NDV shows a locked credential plus the
  // fields the learner must set. Each field is a real select; its `options`
  // carry the correct value and a per-option "why" Iris uses to explain a
  // green (correct) or red (wrong) result after the learner hits "Verify setup".
  nodeSetup: {
    trigger: {
      credential: 'Gmail — Scaler Workspace',
      locked: [
        { label: 'Event', value: 'On new email received' },
        { label: 'Poll frequency', value: 'Every minute' },
        { label: 'Include attachments', value: 'No' },
      ],
      fields: [
        {
          key: 'mailbox',
          label: 'Mailbox to watch',
          subtitle: 'Which folder new mail is picked up from.',
          options: [
            { value: 'inbox', label: 'INBOX', correct: true, why: 'Support mail lands in the inbox — that’s what this flow should watch.' },
            { value: 'spam', label: 'Spam', correct: false, why: 'Spam is filtered-out junk; real requests won’t be waiting here.' },
            { value: 'sent', label: 'Sent', correct: false, why: 'That’s mail you sent out, not incoming customer email.' },
          ],
        },
        {
          key: 'value',
          label: 'Email field to read',
          subtitle: 'Which part of each incoming email flows on to the next steps.',
          options: [
            { value: 'body', label: 'Body — full message', correct: true, why: 'The full text of the email — what every step downstream judges intent on.' },
            { value: 'subject', label: 'Subject line', correct: false, why: 'Just the title. Often too little to tell a bug apart from a complaint.' },
            { value: 'from', label: 'From — sender address', correct: false, why: 'The sender’s address — that’s identity, not the content you classify.' },
          ],
        },
      ],
    },
    classify: {
      credential: 'Scaler AI Gateway',
      locked: [
        { label: 'System prompt', value: 'Classify this email as Bug Report, Feature Request or Complaint, with an urgency.', kind: 'textarea' },
        { label: 'Auto-fix format', value: 'On' },
      ],
      fields: [
        {
          key: 'text',
          label: 'Text to classify',
          subtitle: 'Point the model at the content it should read.',
          options: [
            { value: 'body', label: '{{ $json.body }}', correct: true, why: 'The message itself — this is what you classify on.' },
            { value: 'subject', label: '{{ $json.subject }}', correct: false, why: 'Only the title; the AI would miss most of the signal.' },
            { value: 'from', label: '{{ $json.from }}', correct: false, why: 'That’s the sender, not the content.' },
          ],
        },
        {
          key: 'output',
          label: 'How should it return the answer?',
          subtitle: 'The shape the next nodes can rely on.',
          options: [
            { value: 'json', label: 'JSON — { category, urgency }', correct: true, why: 'Structured fields the Parse and Switch steps can read reliably.' },
            { value: 'paragraph', label: 'A written paragraph', correct: false, why: 'Free text is hard to branch on — you’d be back to square one.' },
            { value: 'word', label: 'A single word', correct: false, why: 'You’d lose the urgency, and one loose word is brittle to parse.' },
          ],
        },
      ],
    },
    // The language model plugged into Classify. Nothing to set — it just needs to
    // be connected — so its NDV is all locked settings and has no Verify step.
    'chat-gemini': {
      credential: 'Scaler AI Gateway',
      locked: [
        { label: 'Model', value: 'models/gemini-2.5-flash' },
        { label: 'Temperature', value: '0' },
        { label: 'Max output tokens', value: '1024' },
        { label: 'Top P', value: '0.95' },
        { label: 'Safety settings', value: 'Default' },
      ],
    },
    parse: {
      locked: [
        { label: 'Mode', value: 'Parse JSON' },
        { label: 'On error', value: 'Continue' },
      ],
      fields: [
        {
          key: 'source',
          label: 'Text to parse',
          subtitle: 'Which value gets turned into clean, structured fields.',
          options: [
            { value: 'text', label: '{{ $json.text }}', correct: true, why: 'The AI’s raw answer — parse this into category + urgency.' },
            { value: 'body', label: '{{ $json.body }}', correct: false, why: 'That’s the original email, not the AI’s answer.' },
            { value: 'subject', label: '{{ $json.subject }}', correct: false, why: 'The email’s title — there’s nothing to parse here.' },
          ],
        },
        {
          key: 'fields',
          label: 'Fields to pull out',
          subtitle: 'What Parse should extract into clean values.',
          options: [
            { value: 'cat-urg', label: 'category, urgency', correct: true, why: 'Exactly what the Switch and the replies need downstream.' },
            { value: 'from-subj', label: 'from, subject', correct: false, why: 'Those already exist on the email — not what the AI produced.' },
            { value: 'body-time', label: 'body, receivedAt', correct: false, why: 'Raw email fields, not the classification result.' },
          ],
        },
      ],
    },
    switch: {
      locked: [
        { label: 'Mode', value: 'Rules — 3 outputs (Bug Report · Feature Request · Urgent Complaint)' },
      ],
      fields: [
        {
          key: 'routeOn',
          label: 'Value to route on',
          subtitle: 'The Switch reads this to decide which branch an email takes.',
          options: [
            { value: 'category', label: '{{ $json.category }}', correct: true, why: 'The label the AI assigned — Bug / Feature / Complaint. Route on this.' },
            { value: 'urgency', label: '{{ $json.urgency }}', correct: false, why: 'How urgent, not what type — a secondary signal, not the split.' },
            { value: 'body', label: '{{ $json.body }}', correct: false, why: 'Raw text — the Switch needs a clean, predictable value.' },
          ],
        },
        {
          key: 'fallback',
          label: 'Emails matching no rule',
          subtitle: 'What happens to an email that fits none of the three categories.',
          options: [
            { value: 'none', label: 'Fall through — no reply sent', correct: true, why: 'With only three branches, anything else silently falls through — that’s the gap the stress test asks about.' },
            { value: 'first', label: 'Send it down the first branch', correct: false, why: 'That would mislabel unrelated mail as a bug report.' },
            { value: 'error', label: 'Throw an error', correct: false, why: 'A non-match isn’t an error — the Switch simply has no matching output.' },
          ],
        },
      ],
    },
    action: {
      credential: 'Gmail — Scaler Workspace',
      locked: [
        { label: 'Operation', value: 'Reply to message' },
        { label: 'Subject', value: 'Re: your request' },
        { label: 'Send as', value: 'HTML' },
      ],
      fields: [
        {
          key: 'to',
          label: 'Send reply to',
          subtitle: 'Where the outgoing reply is addressed.',
          options: [
            { value: 'from', label: '{{ $json.from }}', correct: true, why: 'The person who emailed in — the reply goes back to them.' },
            { value: 'to', label: '{{ $json.to }}', correct: false, why: 'That was your own inbox — replying here just emails yourself.' },
            { value: 'subject', label: '{{ $json.subject }}', correct: false, why: 'The email’s title, not an address.' },
          ],
        },
        {
          key: 'bodySrc',
          label: 'What goes in the reply',
          subtitle: 'Which message the customer actually receives.',
          options: [
            { value: 'template', label: 'The category-specific template', correct: true, why: 'Each branch sends the reply matched to that category.' },
            { value: 'original', label: 'The original email text', correct: false, why: 'That just echoes their own message back to them.' },
            { value: 'blank', label: 'An empty message', correct: false, why: 'No help to the customer — the whole point is a real reply.' },
          ],
        },
      ],
    },
  },

  // Misconception probes for plausible wrong drops (types absent here get a light nudge).
  nodeProbes: {
    'chat-trigger': {
      prompt: 'Hmm — why Chat Trigger?',
      options: [
        { text: 'Emails and chats both bring in a message', correct: false, misconception: 'chat-trigger-is-email', response: 'Close, but Chat Trigger only listens for chatbot messages, not an inbox. A support inbox needs an email trigger.' },
        { text: 'Any trigger starts the flow, so it’s fine', correct: false, misconception: 'triggers-interchangeable', response: 'Triggers aren’t interchangeable — each fires on one specific event. You need the one that fires on a new email.' },
        { text: 'Added it by mistake', correct: true, response: 'No worries — popping it back.' },
      ],
    },
    schedule: {
      prompt: 'Why a Schedule trigger?',
      options: [
        { text: 'It can check the inbox on a timer', correct: false, misconception: 'poll-vs-event', response: 'It can, but that polls on a clock and adds delay. You want to react the instant an email lands — an event trigger.' },
        { text: 'Added it by mistake', correct: true, response: 'All good — back it goes.' },
      ],
    },
    webhook: {
      prompt: 'Why a Webhook?',
      options: [
        { text: 'Email must arrive over HTTP', correct: false, misconception: 'email-is-http', response: 'A webhook waits for an app to POST to a URL. Gmail doesn’t call your webhook when mail arrives — use the email trigger.' },
        { text: 'Added it by mistake', correct: true, response: 'No problem — removing it.' },
      ],
    },
    if: {
      prompt: 'Why If here?',
      options: [
        { text: 'It branches, and I need branches', correct: false, misconception: 'if-vs-switch', response: 'If only splits two ways (true/false). You have three categories — that’s what Switch is for.' },
        { text: 'Added it by mistake', correct: true, response: 'Back to the sidebar.' },
      ],
    },
    code: {
      prompt: 'Why Code to classify?',
      options: [
        { text: 'I can write rules to detect the category', correct: false, misconception: 'rules-vs-ai', response: 'Brittle — emails are free text phrased a thousand ways. Let an AI read it instead.' },
        { text: 'Added it by mistake', correct: true, response: 'Removing it.' },
      ],
    },
    'web-search': {
      prompt: 'Why Web Search?',
      options: [
        { text: 'To look up what the email means', correct: false, misconception: 'search-vs-classify', response: 'The answer is inside the email itself — you classify it, you don’t search the web for it.' },
        { text: 'Added it by mistake', correct: true, response: 'Back it goes.' },
      ],
    },
  },

  // Readable labels for misconception codes recorded during the run.
  misconceptionLabels: {
    'chat-trigger-is-email': 'Treated a chat trigger as an email trigger',
    'triggers-interchangeable': 'Assumed any trigger can start the flow',
    'poll-vs-event': 'Chose a scheduled poll instead of an event trigger',
    'email-is-http': 'Confused a webhook with receiving email',
    'if-vs-switch': 'Reached for If where a multi-way Switch was needed',
    'rules-vs-ai': 'Tried rules/code to classify free-text email',
    'search-vs-classify': 'Confused searching the web with classifying the email',
    'flow-sequence': 'Placed a step out of the correct flow order',
  },

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
