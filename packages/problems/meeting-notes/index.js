// Meeting Notes Summarizer — a LINEAR problem (no router): a call transcript
// arrives, an AI node summarizes it into notes + action items, and the notes
// are saved to a shared Google Doc. This shape (trigger → ai(+model) → action,
// no switch/branches) is only runnable because the engine walk is now
// metadata-driven — it validates the topology generalization end to end.
//
// Authored from scratch at production quality: no legacy prototype fields
// (buildSteps / connectionGuide / testCaseSummary), every node type is a real
// @judge/catalog entry, and run narration is overridden for the meeting domain
// via `simulation` (the default templates are email-flavoured).

export const meetingNotes = {
  id: 'meeting-notes',
  title: 'Meeting Notes Summarizer',
  tagline: 'Turn a raw call transcript into clean notes, saved for the team.',
  statement:
    'After every customer call, your meeting tool posts the raw transcript to a webhook. Build a flow that takes that transcript, uses AI to write a short summary with clear action items, and saves those notes to a shared Google Doc — so nobody has to write up calls by hand. There is only one path here: every call gets summarized and saved.',

  dissection: [
    {
      id: 'trigger',
      prompt: 'A call just ended and your meeting tool has the transcript ready to send over. What should start this workflow?',
      options: [
        { label: 'Webhook', type: 'webhook' },
        { label: 'Schedule', type: 'schedule' },
        { label: 'Chat Trigger', type: 'chat-trigger' },
        { label: 'Trigger manually', type: 'manual' },
      ],
      correctType: 'webhook',
      wrongHint: 'The meeting tool pushes the transcript to you the moment the call ends. Which trigger sits and waits for another app to send it something?',
      explanation: 'A Webhook gives you a URL the meeting tool can POST each transcript to — the flow runs the instant a call wraps up, no polling or clicking.',
      unlocks: ['webhook'],
    },
    {
      id: 'summarize',
      prompt: 'The transcript is long, rambling, and full of crosstalk. What should turn it into a tidy summary with action items?',
      options: [
        { label: 'Summarize with AI', type: 'summarize' },
        { label: 'Classify with AI', type: 'classify' },
        { label: 'Code', type: 'code' },
        { label: 'Switch', type: 'switch' },
      ],
      correctType: 'summarize',
      wrongHint: 'You need to condense meaning from messy free text — not sort it into buckets or cut it with fixed rules. What actually reads and rewrites it?',
      explanation: 'Summarize with AI reads the whole transcript and writes a concise summary plus action items. It needs a language model plugged in, which you’ll wire up next.',
      unlocks: ['summarize', 'chat-gemini'],
    },
    {
      id: 'save',
      prompt: 'The notes are written. Where should they go so the whole team can find and read them later?',
      options: [
        { label: 'Google Docs — Create Document', type: 'google-docs' },
        { label: 'Slack — Send Message', type: 'slack-message' },
        { label: 'Send Reply', type: 'action' },
        { label: 'Code', type: 'code' },
      ],
      correctType: 'google-docs',
      wrongHint: 'The task is to keep the notes somewhere lasting and shared. Which option actually stores a document the team can open days later?',
      explanation: 'Google Docs creates a document per call that lives in a shared folder — a durable record the team can search, unlike a message that scrolls away.',
      unlocks: ['google-docs'],
    },
  ],

  nodePalette: [
    { type: 'webhook', label: 'Webhook', category: 'trigger', isDistractor: false },
    { type: 'schedule', label: 'Schedule', category: 'trigger', isDistractor: true },
    { type: 'chat-trigger', label: 'Chat Trigger', category: 'trigger', isDistractor: true },
    { type: 'summarize', label: 'Summarize with AI', category: 'ai', isDistractor: false },
    { type: 'classify', label: 'Classify with AI', category: 'ai', isDistractor: true },
    { type: 'chat-gemini', label: 'Gemini Chat Model', category: 'model', isDistractor: false },
    { type: 'google-docs', label: 'Google Docs — Create Document', category: 'action', isDistractor: false },
    { type: 'slack-message', label: 'Slack — Send Message', category: 'action', isDistractor: true },
    { type: 'switch', label: 'Switch', category: 'core', isDistractor: true },
    { type: 'code', label: 'Code', category: 'core', isDistractor: true },
  ],

  referenceGraph: {
    nodes: [
      { id: 'webhook-1', type: 'webhook', position: { x: 0, y: 180 }, requiredLabel: 'Transcript received' },
      { id: 'summarize-1', type: 'summarize', position: { x: 300, y: 180 }, requiredLabel: 'Summarize with AI' },
      { id: 'model-1', type: 'chat-gemini', position: { x: 315, y: 340 }, requiredLabel: 'Gemini Chat Model' },
      { id: 'docs-1', type: 'google-docs', position: { x: 620, y: 180 }, requiredLabel: 'Save to Google Docs' },
    ],
    edges: [
      { source: 'model-1', target: 'summarize-1', targetHandle: 'ai_model' },
      { source: 'webhook-1', target: 'summarize-1' },
      { source: 'summarize-1', target: 'docs-1' },
    ],
  },

  testCases: [
    {
      id: 'trigger-present',
      description: 'A Webhook trigger starts the flow.',
      kind: 'structural',
      checks: { requiredNodeTypes: ['webhook'] },
    },
    {
      id: 'model-connected',
      description: 'A Chat Model is plugged into the Summarize node.',
      kind: 'structural',
      checks: {
        requiredNodeTypes: ['summarize'],
        requiredEdges: [{ sourceCategory: 'model', targetType: 'summarize', targetHandle: 'ai_model' }],
      },
    },
    {
      id: 'transcript-to-ai',
      description: 'The transcript flows from the Webhook into Summarize.',
      kind: 'structural',
      checks: {
        requiredNodeTypes: ['webhook', 'summarize'],
        requiredEdges: [{ sourceType: 'webhook', targetType: 'summarize' }],
      },
    },
    {
      id: 'ai-to-docs',
      description: 'The summary is saved to Google Docs.',
      kind: 'structural',
      checks: {
        requiredNodeTypes: ['google-docs'],
        requiredEdges: [{ sourceType: 'summarize', targetType: 'google-docs' }],
      },
    },
  ],

  // No router in this flow — the switch is only ever a distractor.
  branches: [],

  flowSummary: {
    steps: [
      { type: 'webhook', label: 'Transcript received' },
      { type: 'summarize', label: 'Summarize with AI' },
      { type: 'google-docs', label: 'Save to Google Docs' },
    ],
    caption: 'Gemini Chat Model powers Summarize · every call’s notes are saved to a shared Google Doc.',
  },

  // Linear sequence rules. No branchNext (no router); modelNext wires the AI node’s
  // Chat Model slot. `next` values are empty at the terminal + model nodes.
  flow: {
    start: ['webhook'],
    next: { webhook: ['summarize'], summarize: ['google-docs'], 'google-docs': [], 'chat-gemini': [] },
    modelNext: ['chat-gemini'],
  },

  buildPhases: [
    {
      id: 'trigger',
      label: 'Set your trigger',
      coach: 'Let’s build. First — what should start this flow when a transcript arrives?',
      nodeTypes: ['webhook'],
      pickable: ['webhook', 'schedule', 'chat-trigger'],
    },
    {
      id: 'summarize-save',
      label: 'Summarize & save',
      coach: 'Trigger’s set. Now read the transcript, write the notes, and save them where the team can read them.',
      nodeTypes: ['summarize', 'chat-gemini', 'google-docs'],
      pickable: ['summarize', 'classify', 'google-docs', 'slack-message', 'switch', 'code'],
    },
  ],

  nodeSetup: {
    webhook: {
      credential: 'Scaler Meetings — Webhook',
      locked: [
        { label: 'Method', value: 'POST' },
        { label: 'Path', value: '/transcript' },
        { label: 'Respond', value: 'Immediately' },
      ],
      fields: [
        {
          key: 'source',
          label: 'Which field carries the transcript?',
          subtitle: 'The part of the incoming request that flows on to the next steps.',
          options: [
            { value: 'transcript', label: '{{ $json.transcript }}', correct: true, why: 'The full call transcript — the text everything downstream summarizes.' },
            { value: 'title', label: '{{ $json.title }}', correct: false, why: 'Just the meeting title — far too little to summarize a whole call.' },
            { value: 'auth', label: '{{ $headers.authorization }}', correct: false, why: 'That’s an auth header, not the meeting content.' },
          ],
        },
      ],
    },
    summarize: {
      credential: 'Scaler AI Gateway',
      locked: [
        { label: 'System prompt', value: 'Summarize the call transcript in 3–4 sentences, then list the action items with an owner for each.', kind: 'textarea' },
        { label: 'Auto-fix format', value: 'On' },
      ],
      fields: [
        {
          key: 'text',
          label: 'Text to summarize',
          subtitle: 'Point the model at the content it should read.',
          options: [
            { value: 'transcript', label: '{{ $json.transcript }}', correct: true, why: 'The transcript from the webhook — this is what gets summarized.' },
            { value: 'title', label: '{{ $json.title }}', correct: false, why: 'Only the title; the model would have almost nothing to work from.' },
            { value: 'blank', label: 'Leave it blank', correct: false, why: 'With no input, the model has nothing to summarize.' },
          ],
        },
        {
          key: 'style',
          label: 'What should it produce?',
          subtitle: 'The shape of the notes you want back.',
          options: [
            { value: 'notes', label: 'A short summary + bulleted action items', correct: true, why: 'Skimmable notes the team can act on — exactly the goal.' },
            { value: 'verbatim', label: 'The transcript, word for word', correct: false, why: 'That’s not a summary — it just hands back the raw text.' },
            { value: 'label', label: 'A single category label', correct: false, why: 'That’s classification; here you want written notes, not a bucket.' },
          ],
        },
      ],
    },
    // The language model plugged into Summarize — nothing to configure, it just
    // needs to be connected — so its NDV is all locked settings, no Verify step.
    'chat-gemini': {
      credential: 'Scaler AI Gateway',
      locked: [
        { label: 'Model', value: 'models/gemini-2.5-flash' },
        { label: 'Temperature', value: '0.2' },
        { label: 'Max output tokens', value: '1024' },
      ],
    },
    'google-docs': {
      credential: 'Google Docs — Scaler Workspace',
      locked: [
        { label: 'Operation', value: 'Create document from text' },
        { label: 'Folder', value: 'Team / Call Notes' },
      ],
      fields: [
        {
          key: 'title',
          label: 'Document title',
          subtitle: 'How each saved doc is named in the shared folder.',
          options: [
            { value: 'per-call', label: 'Call notes — {{ $json.title }}', correct: true, why: 'Names each doc by its meeting, so the team can find the right one later.' },
            { value: 'static', label: 'Untitled document', correct: false, why: 'Every call would collide on the same vague name — impossible to find.' },
            { value: 'transcript', label: '{{ $json.transcript }}', correct: false, why: 'A whole transcript as the title is unreadable in a file list.' },
          ],
        },
        {
          key: 'content',
          label: 'What goes in the document?',
          subtitle: 'The body of the note that gets saved.',
          options: [
            { value: 'summary', label: 'The AI summary + action items', correct: true, why: 'The clean notes — the whole point of the flow.' },
            { value: 'raw', label: 'The raw transcript', correct: false, why: 'That skips the summary and dumps the messy transcript back in.' },
            { value: 'title', label: 'Just the meeting title', correct: false, why: 'A title with no notes underneath helps no one.' },
          ],
        },
      ],
    },
  },

  nodeProbes: {
    schedule: {
      prompt: 'Why a Schedule trigger?',
      options: [
        { text: 'It can check for new transcripts on a timer', correct: false, misconception: 'poll-vs-event', response: 'It can, but polling adds delay and runs even when there’s been no call. The transcript is pushed to you — react to that event with a Webhook.' },
        { text: 'Added it by mistake', correct: true, response: 'No worries — putting it back.' },
      ],
    },
    'chat-trigger': {
      prompt: 'Why Chat Trigger?',
      options: [
        { text: 'A transcript is basically a chat message', correct: false, misconception: 'chat-vs-webhook', response: 'Chat Trigger listens for live chatbot messages, not a transcript another app posts. The meeting tool POSTs to a URL — that’s a Webhook.' },
        { text: 'Added it by mistake', correct: true, response: 'All good — back it goes.' },
      ],
    },
    classify: {
      prompt: 'Why Classify with AI?',
      options: [
        { text: 'It uses AI to read the transcript, so it fits', correct: false, misconception: 'classify-vs-summarize', response: 'Both use AI, but Classify sorts text into fixed categories. You want a written summary with action items — that’s the Summarize node.' },
        { text: 'Added it by mistake', correct: true, response: 'No problem — removing it.' },
      ],
    },
    'slack-message': {
      prompt: 'Why Slack here?',
      options: [
        { text: 'The team should get the notes', correct: false, misconception: 'notify-vs-store', response: 'Slack pings people, but the notes scroll away. The task is to store them somewhere lasting — a Google Doc. (A Slack heads-up is a nice add-on, not the record itself.)' },
        { text: 'Added it by mistake', correct: true, response: 'Back to the sidebar.' },
      ],
    },
    switch: {
      prompt: 'Why a Switch?',
      options: [
        { text: 'To handle different kinds of meetings differently', correct: false, misconception: 'route-without-branches', response: 'There’s only one path here — every transcript gets summarized and saved the same way. No routing to do, so no Switch.' },
        { text: 'Added it by mistake', correct: true, response: 'Removing it.' },
      ],
    },
    code: {
      prompt: 'Why Code to summarize?',
      options: [
        { text: 'I can write code to shorten the transcript', correct: false, misconception: 'rules-vs-ai', response: 'Chopping text isn’t summarizing — you’d lose the meaning. Let the AI actually read and condense it.' },
        { text: 'Added it by mistake', correct: true, response: 'Back it goes.' },
      ],
    },
  },

  misconceptionLabels: {
    'poll-vs-event': 'Chose a scheduled poll instead of an event (webhook) trigger',
    'chat-vs-webhook': 'Confused a chat trigger with a posted webhook',
    'classify-vs-summarize': 'Reached for classification where summarization was needed',
    'notify-vs-store': 'Confused notifying the team with storing a durable record',
    'route-without-branches': 'Added routing to a single-path flow',
    'rules-vs-ai': 'Tried code/rules to summarize free text',
    'flow-sequence': 'Placed a step out of the correct flow order',
  },

  // Sample call transcripts the Run streams through the flow. This flow has no
  // router, so branch is null on every case — each one is expected to deliver
  // (be summarized and saved), and the run succeeds only if all of them do.
  sampleCases: [
    { id: 'billing', from: 'priya@acme.io', subject: 'Acme × Scaler — billing sync', category: 'CALL', urgency: 'MEDIUM', branch: null, reply: null },
    { id: 'onboarding', from: 'sam@acme.io', subject: 'New team onboarding call', category: 'CALL', urgency: 'LOW', branch: null, reply: null },
    { id: 'renewal', from: 'lee@acme.io', subject: 'Contract renewal discussion', category: 'CALL', urgency: 'HIGH', branch: null, reply: null },
  ],

  // Meeting-domain narration overriding the email-flavoured defaults in simulate.js.
  simulation: {
    onNew: 'New transcript in: “{subject}”',
    noTrigger: 'Nothing is listening for the transcript, so the flow never starts.',
    trigger: '{label} fires — the transcript is in.',
    aiNoModel: '{label} has no Chat Model connected — it can’t run.',
    aiRead: '{label} reads the transcript and writes up the notes + action items.',
    parse: '{label} tidies the notes.',
    actionSend: '{targetLabel} saves the notes to a shared Google Doc.',
    action: 'Notes saved.',
    deadEnd: 'The flow dead-ends here — the notes never get saved.',
  },

  evalQuestions: [
    {
      id: 'chain-vs-agent',
      prompt: 'This flow always does the same thing: summarize, then save. Why build it as a fixed chain rather than an autonomous AI agent that decides its own steps?',
      options: [
        'Because Gemini cannot be used inside an agent',
        'Because the job is one fixed, predictable step (summarize) followed by fixed wiring — an agent would choose its own actions at runtime, which is unpredictable and unnecessary here',
        'Because n8n agents cannot write to Google Docs',
        'Because chains are always cheaper than agents in every case',
      ],
      correctIndex: 1,
      explanation:
        'The AI does exactly one job — summarize — and everything else (save to Docs) is wiring you designed. A full agent decides its own steps and tools each run, which is powerful but unpredictable. For a repeatable task like write-ups, a fixed chain is the right, reliable choice.',
    },
    {
      id: 'model-required',
      prompt: 'When you first run it, the Summarize node errors: “A Chat Model sub-node must be connected.” What does that mean?',
      options: [
        'The webhook never received a transcript',
        'The AI node has no language model wired into its Chat Model port, so it has no brain to run',
        'Google Docs rejected the document',
        'The transcript was too long for the model',
      ],
      correctIndex: 1,
      explanation:
        'An AI node like Summarize is just the wrapper — it needs a language model (the Gemini Chat Model) connected to its dashed Chat Model port to actually run. No model wired in, no summary. It’s the most common first-run mistake with AI nodes.',
    },
  ],
};
