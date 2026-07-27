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

  // Wrong-pick probes. Three rules, applied to every entry (see email-triage
  // for the reference version of this comment):
  //   1. Never name the correct node — the probe diagnoses a misconception,
  //      it does not resolve it. The learner goes back and chooses again.
  //   2. Every option is a position someone actually holds — no escape hatch.
  //   3. The correct answer accurately describes what the WRONG node really
  //      does; understanding that is what reveals it doesn't fit here.
  nodeProbes: {
    schedule: {
      prompt: 'Schedule Trigger is on the canvas. When would this actually run?',
      options: [
        { text: 'On a fixed clock — every few minutes, or at set times of day', correct: true, response: 'Correct. Now compare that to when a transcript actually becomes available. A clock has no idea a call just ended — how would it know to go check?' },
        { text: 'The moment the meeting tool sends over a finished transcript', correct: false, misconception: 'poll-vs-event', response: 'No — a schedule only fires on its own clock, never on an incoming push from another system. Something needs to actually receive that data the instant it lands.' },
        { text: 'Once, right when the workflow is turned on', correct: false, misconception: 'schedule-runs-once', response: 'A Schedule Trigger repeats on its interval — it does not fire only once at activation. But repeating on a timer still isn’t the same as reacting the moment a call ends.' },
      ],
    },
    'chat-trigger': {
      prompt: 'Chat Trigger is on the canvas. If you keep it, what actually starts this workflow?',
      options: [
        { text: 'Someone typing into a live chat session', correct: true, response: 'Right — that’s all it listens for. Now think about how the transcript actually reaches this workflow once a call ends, and pick the trigger built to catch that.' },
        { text: 'The meeting tool posting over the finished transcript', correct: false, misconception: 'chat-vs-webhook', response: 'It won’t catch that. Chat Trigger is wired to a live chat widget, not to another system posting data after the fact — go back to what’s actually built to receive a post like that.' },
        { text: 'Any incoming data, since it’s the general-purpose starting point', correct: false, misconception: 'triggers-interchangeable', response: 'Triggers aren’t general-purpose — each one subscribes to exactly one kind of event. Which event does this workflow actually need to begin from?' },
      ],
    },
    classify: {
      prompt: 'Classify with AI is on the canvas. What does this node actually hand back?',
      options: [
        { text: 'One category label, chosen from a fixed set you define ahead of time', correct: true, response: 'Right — it sorts input into buckets you set up in advance. Now look at what this step in the flow actually needs to produce from the transcript, and whether a label is it.' },
        { text: 'A written summary of whatever text it reads', correct: false, misconception: 'classify-vs-summarize', response: 'That’s not what this node produces — it returns one label from a fixed list, not prose. The transcript needs turning into readable notes, not sorted into a category.' },
        { text: 'Whatever shape you ask for in the prompt, a summary included', correct: false, misconception: 'ai-nodes-interchangeable', response: 'A classifier node is built to emit one of its predefined categories, no matter how the prompt is worded — it isn’t a general-purpose writer. Something else in the palette is built for open-ended writing.' },
      ],
    },
    'slack-message': {
      prompt: 'Slack — Send Message is on the canvas. What happens to a message once it’s posted in a channel?',
      options: [
        { text: 'It sits in the channel history, and scrolls further down as new messages arrive', correct: true, response: 'Right — it stays there, but it’s soon buried under whatever gets posted next. Think about what the team needs to do with these notes days or weeks later, and whether a channel post supports that.' },
        { text: 'It stays pinned and easy to find whenever anyone needs it later', correct: false, misconception: 'notify-vs-store', response: 'A regular message isn’t pinned or indexed on its own — it scrolls away with everything else in the channel. The task calls for something the team can reliably find later, not just a heads-up.' },
        { text: 'It gets saved as its own separate, searchable file', correct: false, misconception: 'chat-message-is-document', response: 'A chat message lives inside the channel’s timeline, not as a standalone file. If the goal is a lasting record for each call, something else is built to create that.' },
      ],
    },
    switch: {
      prompt: 'Switch is on the canvas. What does this node need in order to send work down more than one path?',
      options: [
        { text: 'Two or more distinct categories or rules to route items on', correct: true, response: 'Right — it needs multiple distinct values to split across. Now look back at this problem: is there more than one path a transcript could take, or does every call get handled the same way?' },
        { text: 'Nothing extra — it can still branch even with just one outcome', correct: false, misconception: 'route-without-branches', response: 'A Switch only earns its place when there’s more than one category to split on; with a single outcome for every case, there’s nothing to route between. Does this workflow actually treat any calls differently?' },
        { text: 'If there’s only one kind of case, it just passes the item straight through unchanged', correct: false, misconception: 'switch-passthrough', response: 'It doesn’t just pass through — every item still has to match a rule you’ve set up, and with none defined here it would have nowhere to go. This flow doesn’t need a routing decision at all.' },
      ],
    },
    code: {
      prompt: 'Code is on the canvas to summarize the transcript. What would you actually have to write inside it to produce a summary?',
      options: [
        { text: 'Explicit, deterministic logic — string handling, fixed rules, no understanding of meaning', correct: true, response: 'Right — it only executes exactly what you write, nothing more. Now think about a rambling, cross-talking transcript: could fixed logic decide what matters and write it up in plain sentences?' },
        { text: 'A rule that keeps the first and last few sentences of the transcript', correct: false, misconception: 'rules-vs-ai', response: 'That would just chop text, not summarize it — you’d lose whatever important point was buried in the middle. Producing real notes needs something that reads for meaning, not a fixed rule.' },
        { text: 'Nothing much — it can tell which parts of a transcript matter on its own', correct: false, misconception: 'code-is-smart', response: 'Code has no understanding of meaning; it only runs the exact steps you program. Deciding what’s worth keeping in a messy transcript takes actual reading and judgment.' },
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
    'schedule-runs-once': 'Thought a Schedule Trigger fires once rather than on a repeating interval',
    'triggers-interchangeable': 'Assumed any trigger can start the flow, regardless of the event it’s built for',
    'ai-nodes-interchangeable': 'Assumed any AI node can produce any output format based on the prompt alone',
    'chat-message-is-document': 'Treated a chat message as a saved, standalone document',
    'switch-passthrough': 'Assumed an unrouted Switch simply passes data through unchanged',
    'code-is-smart': 'Expected Code to interpret meaning rather than run written rules',
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
