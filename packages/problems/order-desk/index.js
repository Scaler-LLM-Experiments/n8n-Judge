// The hard one. 21 nodes, a 12-node spine, eight routes.
//
// Written to exercise the whole system end to end rather than to be another
// three-branch classifier, so a few things here are deliberate:
//
//   * TWO AI nodes, each with its own Chat Model, and the correct On Error is
//     OPPOSITE on the two. Classify must fail visibly (nothing downstream can work
//     without a category); Summarize must carry on (the reply is still sendable
//     without a summary). That contrast is the single best teaching moment in the
//     problem and it cannot exist with one AI node.
//   * Every branch ends in a DIFFERENT kind of terminal where that is the honest
//     answer — Slack for engineering, Notion for a lead, Calendar for a callback,
//     Docs for the billing log, Gmail for anything the customer reads. Reachability
//     is checked by category (engine/branchReach.js), so this works as data.
//   * The delivery branch has a step BEFORE its reply, because "look something up,
//     then answer" is the most common real shape a three-branch problem never shows.
//   * Node types are used once each unless the same configuration is genuinely
//     right for every instance. `nodeSetup` is keyed by TYPE, so reusing `code` for
//     four different jobs would give all four the same NDV and grade a decision
//     that only makes sense for one of them. `action` repeats because "send the
//     customer a reply" really is the same setup four times over.
export const orderDesk = {
  id: 'order-desk',
  title: 'Order Desk Escalation Engine',
  statement:
    "You are automating the support desk of an online store. Every email that arrives has to be cleaned up, read, matched to its order, summarised for whoever picks it up, scored for urgency, and then sent down one of eight routes — a refund, an engineering ticket, a delivery update, a callback, a sales lead, the billing log, an account reset, or a cancellation. Build the whole pipeline and prove it holds up.",
  tagline: 'The full pipeline: clean the inbox, read the order, then route eight ways.',
  // Two lines, for the Understand hero and the Home card.
  brief:
    'A busy order desk gets mail all day, some of it noise. Clean it up, read the order behind it, then route each one.',

  difficulty: 'difficult',
  difficultyNote: '21 nodes, 8 routes, two AI steps. Set aside a full sitting.',
  // 61 decisions — more than double email-triage.
  estimatedMinutes: 45,
  coverImage: {
    prompt:
      'A short conveyor of cube parcels on the left feeding one simple sorting box in the middle, which fans out into a few chutes on the right. Wide, sparse, left to right.',
    src: '/covers/order-desk.png',
    alt: 'Parcels on a conveyor entering a sorter that fans out many ways',
  },

  // ---------------------------------------------------------------------------
  // Understand: nine picks, walking the pipeline front to back.
  // ---------------------------------------------------------------------------
  dissection: [
    {
      id: 'trigger',
      prompt: 'Start at the top. A customer emails the order desk. What should notice?',
      options: [
        { label: 'New Email', type: 'trigger' },
        { label: 'On a schedule', type: 'schedule' },
        { label: 'On webhook call', type: 'webhook' },
        { label: 'Trigger manually', type: 'manual' },
      ],
      correctType: 'trigger',
      wrongHint: 'Mail arrives whenever a customer decides to send it. Which of these hears that, the moment it happens?',
      explanation:
        'A New Email trigger subscribes to the mailbox, so the flow starts the instant something lands rather than whenever a clock next ticks.',
      unlocks: ['trigger'],
    },
    {
      id: 'filter',
      prompt: 'Half of what lands is out-of-office replies and receipts. What drops those before you spend anything on them?',
      options: [
        { label: 'Filter', type: 'filter' },
        { label: 'If', type: 'if' },
        { label: 'Switch', type: 'switch' },
        { label: 'Code', type: 'code' },
      ],
      correctType: 'filter',
      wrongHint: 'You want the junk gone, not sent down a second path you then have to build. Which one simply drops what does not match?',
      explanation:
        'Filter keeps the items matching your condition and discards the rest. Nothing continues, so there is no second branch to look after.',
      unlocks: ['filter'],
    },
    {
      id: 'remove-duplicates',
      prompt: 'A customer sends three emails about one order in ten minutes. What stops the desk answering the same thing three times?',
      options: [
        { label: 'Remove Duplicates', type: 'remove-duplicates' },
        { label: 'Filter', type: 'filter' },
        { label: 'Merge', type: 'merge' },
        { label: 'Code', type: 'code' },
      ],
      correctType: 'remove-duplicates',
      wrongHint: 'This is not about whether one email is worth keeping. It is about whether you have already seen it. Which node remembers?',
      explanation:
        'Remove Duplicates holds onto what it has already seen and drops repeats. Which field it compares on is the whole decision, and you will make it later.',
      unlocks: ['remove-duplicates'],
    },
    {
      id: 'wait',
      prompt: 'People often send a follow-up two minutes later with the bit they forgot. What lets the flow hold on briefly before it answers?',
      options: [
        { label: 'Wait', type: 'wait' },
        { label: 'On a schedule', type: 'schedule' },
        { label: 'Code', type: 'code' },
        { label: 'Filter', type: 'filter' },
      ],
      correctType: 'wait',
      wrongHint: 'A schedule decides when a flow STARTS. This flow has already started. You need to pause the item you are holding.',
      explanation:
        'Wait pauses this item and then resumes it. It is how a flow gives the real world a moment to catch up.',
      unlocks: ['wait'],
    },
    {
      id: 'classify',
      prompt: 'Now the email itself: free text, written however the customer felt. What works out which of the eight kinds it is?',
      options: [
        { label: 'Classify with AI', type: 'classify' },
        { label: 'Switch', type: 'switch' },
        { label: 'Code', type: 'code' },
        { label: 'If', type: 'if' },
      ],
      correctType: 'classify',
      wrongHint: 'Eight kinds, written eight hundred different ways. Would a rule you write by hand catch all of them?',
      explanation:
        'Classify with AI reads the message the way a person would and labels it, so it copes with however the email happens to be phrased. It will need a language model attached.',
      unlocks: ['classify', 'chat-gemini'],
    },
    {
      id: 'parse',
      prompt: 'The model answers with one blob of text. What turns that into fields the rest of the flow can read?',
      options: [
        { label: 'Parse Result', type: 'parse' },
        { label: 'Switch', type: 'switch' },
        { label: 'Merge', type: 'merge' },
        { label: 'Filter', type: 'filter' },
      ],
      correctType: 'parse',
      wrongHint: 'Right now it is a string. Ask what shape the node after it needs, then work backwards.',
      explanation:
        'Parse Result turns the model’s text into named fields. Everything downstream reads those names, so what you choose to pull out here decides what the rest of the flow can do.',
      unlocks: ['parse'],
    },
    {
      id: 'http-request',
      prompt: 'To answer properly you need the order: its value, and where it is. That lives in your own store system. What fetches it?',
      options: [
        { label: 'HTTP Request', type: 'http-request' },
        { label: 'Web Search', type: 'web-search' },
        { label: 'Code', type: 'code' },
        { label: 'Classify with AI', type: 'classify' },
      ],
      correctType: 'http-request',
      wrongHint: 'Your order database is not on the public internet, and nothing in the email contains the order value. Where does that data actually come from?',
      explanation:
        'HTTP Request calls an API and brings the response into the flow. It is how a workflow reads your own systems rather than guessing from the email.',
      unlocks: ['http-request'],
    },
    {
      id: 'summarize',
      prompt: 'Long angry threads get handed to a human. What turns one into a short brief they can read in five seconds?',
      options: [
        { label: 'Summarize with AI', type: 'summarize' },
        { label: 'Parse Result', type: 'parse' },
        { label: 'Code', type: 'code' },
        { label: 'Classify with AI', type: 'classify' },
      ],
      correctType: 'summarize',
      wrongHint: 'Labelling a message and condensing it are two different jobs. Which one produces prose a person reads?',
      explanation:
        'Summarize with AI writes a short version of the thread. Like the classifier it needs its own language model, and it has its own view on what should happen if it fails.',
      unlocks: ['summarize'],
    },
    {
      id: 'switch',
      prompt: 'Last one. Eight kinds of email, eight different endings. What takes one item in and sends it out down one of many paths?',
      options: [
        { label: 'Switch', type: 'switch' },
        { label: 'If', type: 'if' },
        { label: 'Filter', type: 'filter' },
        { label: 'Merge', type: 'merge' },
      ],
      correctType: 'switch',
      wrongHint: 'Count the endings you need. How many ways out does this option actually give you?',
      explanation:
        'Switch gives you as many labelled outputs as you define rules for, and each one becomes a separate path on the canvas.',
      unlocks: ['switch', 'code', 'action', 'slack-message', 'web-search', 'calendar-event', 'notion-page', 'google-docs'],
    },
  ],

  nodePalette: [
    { type: 'trigger', label: 'New Email', category: 'trigger', isDistractor: false },
    { type: 'filter', label: 'Filter', category: 'core', isDistractor: false },
    { type: 'remove-duplicates', label: 'Remove Duplicates', category: 'core', isDistractor: false },
    { type: 'wait', label: 'Wait', category: 'core', isDistractor: false },
    { type: 'classify', label: 'Classify with AI', category: 'ai', isDistractor: false },
    { type: 'chat-gemini', label: 'Gemini Chat Model', category: 'model', isDistractor: false },
    { type: 'parse', label: 'Parse Result', category: 'core', isDistractor: false },
    { type: 'http-request', label: 'HTTP Request', category: 'core', isDistractor: false },
    { type: 'summarize', label: 'Summarize with AI', category: 'ai', isDistractor: false },
    { type: 'code', label: 'Code', category: 'core', isDistractor: false },
    { type: 'switch', label: 'Switch', category: 'core', isDistractor: false },
    { type: 'action', label: 'Send Reply', category: 'action', isDistractor: false },
    { type: 'slack-message', label: 'Slack — Send Message', category: 'action', isDistractor: false },
    { type: 'web-search', label: 'Web Search', category: 'core', isDistractor: false },
    { type: 'calendar-event', label: 'Google Calendar — Create Event', category: 'action', isDistractor: false },
    { type: 'notion-page', label: 'Notion — Create Page', category: 'action', isDistractor: false },
    { type: 'google-docs', label: 'Google Docs — Create Document', category: 'action', isDistractor: false },
    // Distractors. Each one is a node somebody genuinely reaches for here.
    { type: 'chat-trigger', label: 'On chat message', category: 'trigger', isDistractor: true },
    { type: 'webhook', label: 'On webhook call', category: 'trigger', isDistractor: true },
    { type: 'schedule', label: 'On a schedule', category: 'trigger', isDistractor: true },
    { type: 'if', label: 'If', category: 'core', isDistractor: true },
    { type: 'merge', label: 'Merge', category: 'core', isDistractor: true },
    { type: 'manual', label: 'Trigger manually', category: 'trigger', isDistractor: true },
  ],

  // 21 nodes. Laid out left to right along the spine, branches fanning down the
  // right-hand side in `branches` order so the canvas reads top-to-bottom the same
  // way the routing rules do.
  referenceGraph: {
    nodes: [
      { id: 'trigger-1', type: 'trigger', position: { x: 0, y: 520 }, requiredLabel: 'New Email' },
      { id: 'filter-1', type: 'filter', position: { x: 240, y: 520 }, requiredLabel: 'Drop automated mail' },
      { id: 'dedupe-1', type: 'remove-duplicates', position: { x: 480, y: 520 }, requiredLabel: 'Remove Duplicates' },
      { id: 'wait-1', type: 'wait', position: { x: 720, y: 520 }, requiredLabel: 'Wait for a follow-up' },
      { id: 'classify-1', type: 'classify', position: { x: 960, y: 520 }, requiredLabel: 'Classify with AI' },
      { id: 'model-1', type: 'chat-gemini', position: { x: 975, y: 690 }, requiredLabel: 'Gemini Chat Model' },
      { id: 'parse-1', type: 'parse', position: { x: 1200, y: 520 }, requiredLabel: 'Parse Result' },
      { id: 'order-1', type: 'http-request', position: { x: 1440, y: 520 }, requiredLabel: 'Look up the order' },
      { id: 'summarize-1', type: 'summarize', position: { x: 1680, y: 520 }, requiredLabel: 'Summarize with AI' },
      { id: 'model-2', type: 'chat-gemini', position: { x: 1695, y: 690 }, requiredLabel: 'Gemini Chat Model' },
      { id: 'score-1', type: 'code', position: { x: 1920, y: 520 }, requiredLabel: 'Score the priority' },
      { id: 'switch-1', type: 'switch', position: { x: 2160, y: 520 }, requiredLabel: 'Switch' },

      { id: 'reply-refund', type: 'action', position: { x: 2460, y: 40 }, requiredLabel: 'Send Reply — Refund approved' },
      { id: 'slack-eng', type: 'slack-message', position: { x: 2460, y: 160 }, requiredLabel: 'Slack — #engineering' },
      { id: 'carrier-1', type: 'web-search', position: { x: 2460, y: 280 }, requiredLabel: 'Check the carrier' },
      { id: 'reply-delivery', type: 'action', position: { x: 2720, y: 280 }, requiredLabel: 'Send Reply — Delivery update' },
      { id: 'callback-1', type: 'calendar-event', position: { x: 2460, y: 400 }, requiredLabel: 'Book a callback' },
      { id: 'lead-1', type: 'notion-page', position: { x: 2460, y: 520 }, requiredLabel: 'Notion — Create a lead' },
      { id: 'billing-log', type: 'google-docs', position: { x: 2460, y: 640 }, requiredLabel: 'Google Docs — Billing log' },
      { id: 'reply-access', type: 'action', position: { x: 2460, y: 760 }, requiredLabel: 'Send Reply — Reset link' },
      { id: 'reply-cancel', type: 'action', position: { x: 2460, y: 880 }, requiredLabel: 'Send Reply — Cancellation' },
    ],
    edges: [
      { source: 'model-1', target: 'classify-1', targetHandle: 'ai_model' },
      { source: 'model-2', target: 'summarize-1', targetHandle: 'ai_model' },
      { source: 'trigger-1', target: 'filter-1' },
      { source: 'filter-1', target: 'dedupe-1' },
      { source: 'dedupe-1', target: 'wait-1' },
      { source: 'wait-1', target: 'classify-1' },
      { source: 'classify-1', target: 'parse-1' },
      { source: 'parse-1', target: 'order-1' },
      { source: 'order-1', target: 'summarize-1' },
      { source: 'summarize-1', target: 'score-1' },
      { source: 'score-1', target: 'switch-1' },
      { source: 'switch-1', target: 'reply-refund', branch: 'refund_request' },
      { source: 'switch-1', target: 'slack-eng', branch: 'bug_report' },
      { source: 'switch-1', target: 'carrier-1', branch: 'delivery_delay' },
      { source: 'carrier-1', target: 'reply-delivery' },
      { source: 'switch-1', target: 'callback-1', branch: 'angry_complaint' },
      { source: 'switch-1', target: 'lead-1', branch: 'sales_enquiry' },
      { source: 'switch-1', target: 'billing-log', branch: 'billing_question' },
      { source: 'switch-1', target: 'reply-access', branch: 'account_access' },
      { source: 'switch-1', target: 'reply-cancel', branch: 'cancel_order' },
    ],
  },

  branches: [
    { id: 'refund_request', label: 'Refund Request' },
    { id: 'bug_report', label: 'Bug Report' },
    { id: 'delivery_delay', label: 'Delivery Delay' },
    { id: 'angry_complaint', label: 'Angry Complaint' },
    { id: 'sales_enquiry', label: 'Sales Enquiry' },
    { id: 'billing_question', label: 'Billing Question' },
    { id: 'account_access', label: 'Account Access' },
    { id: 'cancel_order', label: 'Cancel Order' },
  ],

  // Labels describe the JOB, never the node — this sketch is shown before the
  // dissection quiz asks which node does each job. `validateProblem` enforces it.
  flowSummary: {
    steps: [
      { type: 'trigger', label: 'mail arrives' },
      { type: 'filter', label: 'ignore robots' },
      { type: 'remove-duplicates', label: 'drop repeats' },
      { type: 'wait', label: 'hold a moment' },
      { type: 'classify', label: 'read the mail' },
      { type: 'parse', label: 'pull the details' },
      { type: 'http-request', label: 'look up order' },
      { type: 'summarize', label: 'sum it up' },
      { type: 'code', label: 'score urgency' },
      { type: 'switch', label: 'split many ways' },
    ],
    caption:
      'Clean the inbox first, then read the order, then route. Two AI steps and eight endings, each landing somewhere different.',
  },

  flow: {
    start: ['trigger'],
    next: {
      trigger: ['filter'],
      filter: ['remove-duplicates'],
      'remove-duplicates': ['wait'],
      wait: ['classify'],
      classify: ['parse'],
      parse: ['http-request'],
      'http-request': ['summarize'],
      summarize: ['code'],
      code: ['switch'],
      switch: [],
      'web-search': ['action'],
      action: [],
      'slack-message': [],
      'calendar-event': [],
      'notion-page': [],
      'google-docs': [],
      'chat-gemini': [],
    },
    branchNext: ['action', 'slack-message', 'web-search', 'calendar-event', 'notion-page', 'google-docs'],
    modelNext: ['chat-gemini'],
  },

  // Four phases. The routing phase holds the Switch AND every terminal, because a
  // routing phase is not complete until its branches reach configured replies — put
  // the replies in a later phase and the stage can never clear.
  buildPhases: [
    {
      id: 'intake',
      label: 'Clean up the intake',
      coach: 'Before any of the clever bits: get the flow started, and get the junk out of it.',
      nodeTypes: ['trigger', 'filter', 'remove-duplicates', 'wait'],
      pickable: ['trigger', 'filter', 'remove-duplicates', 'wait', 'schedule', 'webhook', 'manual', 'chat-trigger', 'if', 'merge'],
    },
    {
      id: 'read',
      label: 'Read the email',
      coach: 'Now make it understand what it is holding, and turn that into fields.',
      nodeTypes: ['classify', 'chat-gemini', 'parse'],
      pickable: ['classify', 'parse', 'code', 'if', 'merge', 'summarize'],
    },
    {
      id: 'enrich',
      label: 'Bring in the order',
      coach: 'The email alone is not enough. Pull in the order, brief a human, and work out how urgent this is.',
      nodeTypes: ['http-request', 'summarize', 'code'],
      pickable: ['http-request', 'summarize', 'code', 'web-search', 'parse', 'merge', 'filter'],
    },
    {
      id: 'route',
      label: 'Route all eight ways',
      coach: 'The last part, and the big one. Build the eight rules, then give every one of them somewhere to land.',
      nodeTypes: ['switch', 'action', 'slack-message', 'web-search', 'calendar-event', 'notion-page', 'google-docs'],
      pickable: [
        'switch',
        'action',
        'slack-message',
        'web-search',
        'calendar-event',
        'notion-page',
        'google-docs',
        'if',
        'merge',
        'filter',
        'code',
      ],
    },
  ],

  nodeSetup: {
    trigger: {
      credential: 'Gmail — Store Support',
      locked: [
        { label: 'Event', value: 'On new email received' },
        { label: 'Poll frequency', value: 'Every minute' },
        { label: 'Include attachments', value: 'No' },
      ],
      fields: [
        {
          key: 'mailbox',
          label: 'Mailbox to watch',
          subtitle: 'Where the desk’s incoming mail arrives.',
          options: [
            { value: 'inbox', label: 'INBOX', correct: true, why: 'Customer mail lands here, so this is what the desk has to watch.' },
            { value: 'spam', label: 'Spam', correct: false, why: 'Already-filtered junk. A real order query will not be sitting in here.' },
            { value: 'sent', label: 'Sent', correct: false, why: 'Mail you sent out. Watching it would react to your own replies.' },
            { value: 'archive', label: 'Archive', correct: false, why: 'Mail already dealt with and put away, so nothing new arrives here.' },
          ],
        },
      ],
    },

    filter: {
      locked: [{ label: 'Combine conditions', value: 'AND' }],
      fields: [
        {
          key: 'condition',
          label: 'Keep the email when',
          subtitle: 'Only items matching this carry on. Everything else is dropped.',
          options: [
            {
              value: 'not-noreply',
              label: '{{ $json.from }} does not contain "noreply"',
              correct: true,
              why: 'Automated senders are the thing you are trying to lose, and the sender address is what identifies them.',
            },
            {
              value: 'subject-order',
              label: '{{ $json.subject }} contains "order"',
              correct: false,
              why: 'Plenty of genuine mail never says the word order, and you would throw all of it away.',
            },
            {
              value: 'body-not-empty',
              label: '{{ $json.body }} is not empty',
              correct: false,
              why: 'An out-of-office reply has a perfectly full body, so this keeps exactly what you wanted gone.',
            },
            {
              value: 'has-attachment',
              label: '{{ $json.hasAttachment }} is true',
              correct: false,
              why: 'That keeps only mail with a file attached, which is a tiny and unrelated slice of the inbox.',
            },
          ],
        },
      ],
    },

    'remove-duplicates': {
      locked: [
        { label: 'Operation', value: 'Remove items seen in previous executions' },
        { label: 'Keep', value: 'First occurrence' },
      ],
      fields: [
        {
          key: 'dedupeOn',
          label: 'Two emails are the same when this matches',
          subtitle: 'The value it remembers between runs.',
          options: [
            {
              value: 'threadId',
              label: '{{ $json.threadId }}',
              correct: true,
              why: 'One thread is one conversation, so a follow-up on the same thread is the repeat you want to drop.',
            },
            {
              value: 'from',
              label: '{{ $json.from }}',
              correct: false,
              why: 'That treats a customer as a duplicate of themselves. Their next, unrelated order query would be silently binned.',
            },
            {
              value: 'subject',
              label: '{{ $json.subject }}',
              correct: false,
              why: 'Two different customers both writing "Where is my order?" would collide, and one of them gets ignored.',
            },
            {
              value: 'receivedAt',
              label: '{{ $json.receivedAt }}',
              correct: false,
              why: 'A timestamp is different every time, so nothing would ever match and the node would do nothing at all.',
            },
          ],
        },
      ],
    },

    wait: {
      locked: [{ label: 'Limit wait time', value: 'Off' }],
      fields: [
        {
          key: 'resume',
          label: 'Resume',
          subtitle: 'What brings this item back to life.',
          options: [
            {
              value: 'interval',
              label: 'After a time interval',
              correct: true,
              why: 'You are giving the customer a couple of minutes to send the follow-up, and then carrying on regardless.',
            },
            {
              value: 'webhook',
              label: 'On webhook call',
              correct: false,
              why: 'Then the item sits there until something calls back, and nothing here ever will. The email waits forever.',
            },
            {
              value: 'datetime',
              label: 'At a specific date and time',
              correct: false,
              why: 'That pins every email to one moment on the calendar rather than pausing each for the same short spell.',
            },
          ],
        },
      ],
    },

    classify: {
      // The interesting half of this problem's Settings grading. Compare with
      // `summarize` below: same setting, opposite correct answer, and the reason is
      // whether anything downstream can work without this node's output.
      settings: [
        {
          key: 'onError',
          correct: 'continueErrorOutput',
          why: {
            continueErrorOutput:
              'Right. Nothing after this can work without a category, so a failure has to go somewhere you will see it rather than travel on pretending to be fine.',
            stopWorkflow:
              'One unreadable email now stops the desk for every customer behind it. Is a single bad classification worth a silent outage?',
            continueRegularOutput:
              'This carries on with no category at all, so the Switch matches nothing and the email vanishes without a reply. Pull the model out and run it.',
          },
        },
      ],
      credential: 'Scaler AI Gateway',
      locked: [
        {
          label: 'System prompt',
          value:
            'Label this email as one of: refund request, bug report, delivery delay, angry complaint, sales enquiry, billing question, account access, cancel order. Return JSON with intent, urgency and order_id.',
          kind: 'textarea',
        },
        { label: 'Auto-fix format', value: 'On' },
      ],
      fields: [
        {
          key: 'text',
          label: 'Text to classify',
          kind: 'expression',
          correct: '{{ $json.body }}',
          accepts: ['{{ $json.body }}', '{{ $json["body"] }}'],
          subtitle: 'Drag the field in from Input, or type the expression.',
          whyCorrect:
            'The body is what the customer actually wrote, and referencing it as an expression means every email gets read rather than just this one.',
          whyWrong:
            'Look at what Input is offering. One of those fields holds the customer’s message; the rest hold who sent it and what they titled it. And if you typed the words in directly, ask what the next email gets classified as.',
        },
        {
          key: 'output',
          label: 'How should it answer?',
          subtitle: 'The shape everything downstream depends on.',
          options: [
            {
              value: 'json',
              label: 'JSON — { intent, urgency, order_id }',
              correct: true,
              why: 'Named fields the next nodes can read without guessing. The order lookup needs that id specifically.',
            },
            { value: 'paragraph', label: 'A written paragraph', correct: false, why: 'Free prose puts you back where you started, with text to interpret.' },
            { value: 'word', label: 'A single word', correct: false, why: 'You would lose the urgency and the order id, and both are used further down.' },
            { value: 'number', label: 'A score from 1 to 8', correct: false, why: 'A number nobody can read back. Which of the eight is 6?' },
          ],
        },
      ],
    },

    'chat-gemini': {
      credential: 'Scaler AI Gateway',
      locked: [
        { label: 'Model', value: 'models/gemini-2.5-flash' },
        { label: 'Max output tokens', value: '1024' },
        { label: 'Top P', value: '0.95' },
        { label: 'Safety settings', value: 'Default' },
      ],
      fields: [
        {
          key: 'temperature',
          label: 'Temperature',
          kind: 'number',
          min: 0,
          max: 1,
          step: 0.1,
          correct: 0,
          placeholder: '0 – 1',
          subtitle: 'How much the answer is allowed to vary between runs.',
          whyCorrect:
            'At zero the same email always gets the same answer. Routing has to be repeatable, or one customer’s refund becomes somebody else’s bug report on a Tuesday.',
          whyWrong:
            'Above zero the model may answer differently on identical input. That is useful when you want variety in writing, and the opposite of what you want when the answer picks a branch. What value makes it deterministic?',
        },
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
          subtitle: 'The value being turned into fields.',
          options: [
            { value: 'text', label: '{{ $json.text }}', correct: true, why: 'The classifier’s own answer. That is the thing with structure hiding inside it.' },
            { value: 'body', label: '{{ $json.body }}', correct: false, why: 'The customer’s original email, which was never JSON to begin with.' },
            { value: 'subject', label: '{{ $json.subject }}', correct: false, why: 'A title. There is nothing in here to pull apart.' },
          ],
        },
        {
          key: 'fields',
          label: 'Fields to pull out',
          kind: 'assignmentList',
          addLabel: 'Add Field',
          subtitle: 'Name each value and say where it comes from. Everything after this can only use what you extract here.',
          nameOptions: [
            { value: 'intent', label: 'intent', correct: true, why: 'The Switch routes on this, so it has to exist as a clean field.' },
            { value: 'urgency', label: 'urgency', correct: true, why: 'The priority score reads it, and so does the callback.' },
            { value: 'order_id', label: 'order_id', correct: true, why: 'The order lookup puts this straight into its URL. Without it there is nothing to fetch.' },
            { value: 'from', label: 'from', correct: false, why: 'Already on the email. It survives perfectly well without being extracted again.' },
            { value: 'refund_amount', label: 'refund_amount', correct: false, why: 'Nothing upstream produces it. The order value comes from the lookup, later.' },
          ],
          valueOptions: [
            { value: 'text.intent', label: '{{ $json.text.intent }}', correct: true, why: 'Reaches into the classifier’s answer for the label it assigned.' },
            { value: 'text.urgency', label: '{{ $json.text.urgency }}', correct: true, why: 'Reaches into the classifier’s answer for the urgency it assigned.' },
            { value: 'text.order_id', label: '{{ $json.text.order_id }}', correct: true, why: 'The order id the classifier lifted out of the message.' },
            { value: 'body', label: '{{ $json.body }}', correct: false, why: 'The original email, not the answer about it.' },
            { value: 'from', label: '{{ $json.from }}', correct: false, why: 'The sender address, which is identity rather than anything the classifier decided.' },
          ],
          expect: {
            assignments: [
              { name: 'intent', value: 'text.intent' },
              { name: 'urgency', value: 'text.urgency' },
              { name: 'order_id', value: 'text.order_id' },
            ],
          },
          why: {
            count: {
              correct: 'Three fields, and all three get used further down. Nothing spare, nothing missing.',
              wrong:
                'Work backwards from the nodes AFTER this one. The Switch needs one thing, the score needs another, and the order lookup cannot run without a third. Extract those, and only those.',
            },
            names: {
              correct: 'These are the names the Switch, the score and the lookup all reach for, so they line up.',
              wrong:
                'A field nothing reads is wasted, and one that is needed but missing leaves a node empty. Look at what the Switch routes on, and at what the order lookup puts in its URL.',
            },
            values: {
              correct: 'Each one reaches into the classifier’s parsed answer, so it holds what the model actually decided.',
              wrong: 'Check where each value comes from. You want the model’s answer here, not the email text it was reading.',
            },
          },
        },
      ],
    },

    'http-request': {
      credential: 'Store API — internal',
      locked: [
        { label: 'Method', value: 'GET' },
        { label: 'Authentication', value: 'Predefined credential' },
        { label: 'Response format', value: 'JSON' },
      ],
      // Retry, not On Error. A network call to your own API is the textbook case for
      // retrying: it fails for a second and then works, and the alternative is an
      // email handled with no order attached because a packet went missing.
      settings: [
        {
          key: 'retryOnFail',
          correct: true,
          why: {
            true:
              'Right. An API call fails for a moment and then works. Retrying costs a second; not retrying means answering a customer with no idea what they ordered.',
            false:
              'One dropped connection and this email is handled with no order attached. Which of the failures here is actually worth a second attempt?',
          },
        },
      ],
      fields: [
        {
          key: 'url',
          label: 'URL',
          subtitle: 'The order this email is about.',
          options: [
            {
              value: 'order-by-id',
              label: 'https://api.store.internal/orders/{{ $json.order_id }}',
              correct: true,
              why: 'One order, the one this email is about, named by the id you extracted a moment ago.',
            },
            {
              value: 'all-orders',
              label: 'https://api.store.internal/orders',
              correct: false,
              why: 'That asks for every order in the shop. The one you need is in there somewhere, and nothing here picks it out.',
            },
            {
              value: 'search',
              label: 'https://api.store.internal/orders?q={{ $json.body }}',
              correct: false,
              why: 'Sending an entire email as a search term. You already know the exact id, so there is nothing to search for.',
            },
            {
              value: 'customer',
              label: 'https://api.store.internal/customers/{{ $json.from }}',
              correct: false,
              why: 'That returns the person, not the order. You need the value and the tracking id of one specific purchase.',
            },
          ],
        },
      ],
    },

    summarize: {
      // The mirror of `classify`. Same setting, opposite answer, and the difference
      // is the only thing worth learning here: whether the flow can carry on
      // usefully without what this node produces.
      settings: [
        {
          key: 'onError',
          correct: 'continueRegularOutput',
          why: {
            continueRegularOutput:
              'Right, and note this is the opposite of the classifier. A missing summary costs a human thirty seconds of reading. A missing category loses the email entirely.',
            stopWorkflow:
              'The reply is perfectly sendable without a summary, so stopping here withholds a real answer from a real customer over a nice-to-have.',
            continueErrorOutput:
              'That routes the email off to an error path nobody has wired, so it stops anyway. Ask what is genuinely lost if the summary is missing.',
          },
        },
      ],
      credential: 'Scaler AI Gateway',
      locked: [
        {
          label: 'System prompt',
          value: 'In two sentences, tell the agent what this customer wants and what has already gone wrong. No greeting.',
          kind: 'textarea',
        },
      ],
      fields: [
        {
          key: 'source',
          label: 'What to summarise',
          subtitle: 'The text the summary is written from.',
          options: [
            { value: 'body', label: '{{ $json.body }}', correct: true, why: 'The customer’s own words, in full. That is the thing a human needs condensed.' },
            {
              value: 'intent',
              label: '{{ $json.intent }}',
              correct: false,
              why: 'That is already one word. Summarising a label produces the same label back.',
            },
            {
              value: 'text',
              label: '{{ $json.text }}',
              correct: false,
              why: 'The classifier’s JSON. You would be summarising the machine’s answer instead of the customer’s message.',
            },
            {
              value: 'order',
              label: '{{ $json.order }}',
              correct: false,
              why: 'The order record. Useful context, but there is no complaint in a row of database fields.',
            },
          ],
        },
      ],
    },

    code: {
      locked: [
        { label: 'Mode', value: 'Run once for each item' },
        { label: 'Language', value: 'JavaScript' },
      ],
      fields: [
        {
          key: 'inputs',
          label: 'Work the score out from',
          subtitle: 'What the priority number is calculated on.',
          options: [
            {
              value: 'urgency-value',
              label: 'The urgency, and the order value',
              correct: true,
              why: 'An angry customer matters, and so does how much money is involved. Both are known by this point, and both belong in the number.',
            },
            {
              value: 'from',
              label: 'The sender’s email address',
              correct: false,
              why: 'Who they are says nothing about how badly this needs attention today.',
            },
            {
              value: 'subject-length',
              label: 'How long the subject line is',
              correct: false,
              why: 'A proxy for nothing. Short subjects are not calmer than long ones.',
            },
            {
              value: 'received',
              label: 'What time the email arrived',
              correct: false,
              why: 'Everything in a queue has a time. It orders the queue, it does not say which item is serious.',
            },
          ],
        },
      ],
    },

    switch: {
      settings: [
        {
          key: 'alwaysOutputData',
          correct: false,
          why: {
            false:
              'Correct, leave it off. An email matching none of the eight should produce nothing, and that gap is something you can see and fix.',
            true:
              'Turn this on and an email that matched nothing is pushed down the first branch as an empty item, so a blank refund confirmation goes to a real customer. Silently wrong beats visibly missing, but only for you.',
          },
        },
      ],
      locked: [{ label: 'Mode', value: 'Rules' }],
      fields: [
        {
          key: 'rules',
          label: 'Routing rules',
          kind: 'ruleList',
          addLabel: 'Add Routing Rule',
          subtitle: 'One rule per route. Each names an output and says which emails go down it. Eight of them.',
          branchOptions: [
            { value: 'refund_request', label: 'Refund Request', correct: true, why: 'One of the eight labels the classifier can produce.' },
            { value: 'bug_report', label: 'Bug Report', correct: true, why: 'One of the eight labels the classifier can produce.' },
            { value: 'delivery_delay', label: 'Delivery Delay', correct: true, why: 'One of the eight labels the classifier can produce.' },
            { value: 'angry_complaint', label: 'Angry Complaint', correct: true, why: 'One of the eight labels the classifier can produce.' },
            { value: 'sales_enquiry', label: 'Sales Enquiry', correct: true, why: 'One of the eight labels the classifier can produce.' },
            { value: 'billing_question', label: 'Billing Question', correct: true, why: 'One of the eight labels the classifier can produce.' },
            { value: 'account_access', label: 'Account Access', correct: true, why: 'One of the eight labels the classifier can produce.' },
            { value: 'cancel_order', label: 'Cancel Order', correct: true, why: 'One of the eight labels the classifier can produce.' },
            { value: 'spam', label: 'Spam', correct: false, why: 'Junk was dropped by the Filter long before this. Nothing reaching the Switch is spam.' },
            { value: 'vip_customer', label: 'VIP Customer', correct: false, why: 'Nothing upstream ever produces this label, so the branch could never fire.' },
          ],
          leftOptions: [
            { value: 'intent', label: '{{ $json.intent }}', correct: true, why: 'The label the classifier assigned. That is the split.' },
            { value: 'urgency', label: '{{ $json.urgency }}', correct: false, why: 'How urgent, not what kind. It feeds the score, not the routing.' },
            { value: 'priority', label: '{{ $json.priority }}', correct: false, why: 'The number you just calculated. It sorts the queue; it does not say what the email is about.' },
            { value: 'body', label: '{{ $json.body }}', correct: false, why: 'Raw text. A Switch needs a clean, predictable value to match on.' },
          ],
          operatorOptions: [
            { value: 'equals', label: 'is equal to', correct: true, why: 'The intent is one exact label, so an exact match is right.' },
            { value: 'contains', label: 'contains', correct: false, why: 'Looser than you need, and it would let one label match inside a longer one.' },
            { value: 'notEquals', label: 'is not equal to', correct: false, why: 'That sends everything EXCEPT this kind down the branch.' },
          ],
          rightOptions: [
            { value: 'refund_request', label: 'refund_request', correct: true, why: 'Matches a label the classifier produces.' },
            { value: 'bug_report', label: 'bug_report', correct: true, why: 'Matches a label the classifier produces.' },
            { value: 'delivery_delay', label: 'delivery_delay', correct: true, why: 'Matches a label the classifier produces.' },
            { value: 'angry_complaint', label: 'angry_complaint', correct: true, why: 'Matches a label the classifier produces.' },
            { value: 'sales_enquiry', label: 'sales_enquiry', correct: true, why: 'Matches a label the classifier produces.' },
            { value: 'billing_question', label: 'billing_question', correct: true, why: 'Matches a label the classifier produces.' },
            { value: 'account_access', label: 'account_access', correct: true, why: 'Matches a label the classifier produces.' },
            { value: 'cancel_order', label: 'cancel_order', correct: true, why: 'Matches a label the classifier produces.' },
            { value: 'HIGH', label: 'HIGH', correct: false, why: 'That is an urgency, not a kind of email.' },
          ],
          expect: {
            rules: [
              { outputKey: 'refund_request', left: 'intent', operator: 'equals', right: 'refund_request' },
              { outputKey: 'bug_report', left: 'intent', operator: 'equals', right: 'bug_report' },
              { outputKey: 'delivery_delay', left: 'intent', operator: 'equals', right: 'delivery_delay' },
              { outputKey: 'angry_complaint', left: 'intent', operator: 'equals', right: 'angry_complaint' },
              { outputKey: 'sales_enquiry', left: 'intent', operator: 'equals', right: 'sales_enquiry' },
              { outputKey: 'billing_question', left: 'intent', operator: 'equals', right: 'billing_question' },
              { outputKey: 'account_access', left: 'intent', operator: 'equals', right: 'account_access' },
              { outputKey: 'cancel_order', left: 'intent', operator: 'equals', right: 'cancel_order' },
            ],
          },
          why: {
            count: {
              correct: 'Eight rules for the eight labels the classifier can produce. Every one of them has somewhere to go.',
              wrong:
                'Count what the classifier can output and give each one its own rule. Too few and some emails have nowhere to land; too many and a branch sits there that can never fire.',
            },
            categories: {
              correct: 'These are exactly the labels the classifier assigns, so every branch can actually match something.',
              wrong:
                'A branch only fires if something upstream produces its label. Look at what the classifier is told to return, and name the outputs after those.',
            },
            conditions: {
              correct: 'Every rule tests the assigned intent, matched exactly. That is what makes the routing predictable.',
              wrong:
                'Check what each rule is testing. The value to route on is the label the classifier assigned, not how urgent it is and not the score you calculated, and it should match exactly.',
            },
          },
        },
        {
          key: 'fallback',
          label: 'Emails matching no rule',
          subtitle: 'What happens to an email none of the eight rules catch.',
          options: [
            {
              value: 'none',
              label: 'Fall through — nothing sent',
              correct: true,
              why: 'With eight branches and no catch-all, anything else falls through silently. That is the gap the stress test asks you about.',
            },
            { value: 'first', label: 'Send it down the first branch', correct: false, why: 'That tells a confused customer their refund is approved.' },
            { value: 'error', label: 'Throw an error', correct: false, why: 'A non-match is not a failure. The Switch simply has no output that fits.' },
          ],
        },
      ],
    },

    action: {
      credential: 'Gmail — Store Support',
      locked: [
        { label: 'Operation', value: 'Reply to message' },
        { label: 'Send as', value: 'HTML' },
      ],
      fields: [
        {
          key: 'to',
          label: 'Send the reply to',
          subtitle: 'Where the outgoing mail is addressed.',
          options: [
            { value: 'from', label: '{{ $json.from }}', correct: true, why: 'The person who wrote in. The reply goes back to them.' },
            { value: 'to', label: '{{ $json.to }}', correct: false, why: 'That was your own support address, so this emails yourself.' },
            { value: 'subject', label: '{{ $json.subject }}', correct: false, why: 'A title, not an address.' },
          ],
        },
        {
          key: 'bodySrc',
          label: 'What goes in the reply',
          subtitle: 'The message the customer actually receives.',
          options: [
            {
              value: 'template',
              label: 'The template for this route, with the order details filled in',
              correct: true,
              why: 'Each branch answers its own kind of question, and the order lookup gave you the specifics to put in it.',
            },
            { value: 'summary', label: 'The AI summary', correct: false, why: 'That was written for the agent, about the customer. Sending it back to them is strange reading.' },
            { value: 'original', label: 'Their original email', correct: false, why: 'That just posts their own words back at them.' },
            { value: 'blank', label: 'An empty message', correct: false, why: 'No help to anybody, and the whole point was a real answer.' },
          ],
        },
      ],
    },

    'slack-message': {
      credential: 'Slack — Store Workspace',
      locked: [{ label: 'Operation', value: 'Send a message' }],
      fields: [
        {
          key: 'channel',
          label: 'Channel',
          subtitle: 'Where the bug report is posted.',
          options: [
            { value: 'engineering', label: '#engineering', correct: true, why: 'The people who can actually fix a broken checkout.' },
            { value: 'general', label: '#general', correct: false, why: 'Everybody sees it and nobody owns it.' },
            { value: 'sales', label: '#sales', correct: false, why: 'Wrong team. They cannot do anything with a stack trace.' },
            { value: 'random', label: '#random', correct: false, why: 'A bug report goes to die here.' },
          ],
        },
        {
          key: 'text',
          label: 'Message',
          subtitle: 'What the channel sees.',
          options: [
            {
              value: 'summary-order',
              label: 'The AI summary, plus the order id and priority',
              correct: true,
              why: 'An engineer can triage from this without opening the mailbox, which is the point of posting it at all.',
            },
            { value: 'body', label: 'The raw email', correct: false, why: 'Making a channel read a whole complaint is how bug reports get scrolled past.' },
            { value: 'intent', label: 'Just the label "bug_report"', correct: false, why: 'True and useless. Nobody knows what broke.' },
          ],
        },
      ],
    },

    'web-search': {
      locked: [{ label: 'Results', value: 'Top 3' }],
      fields: [
        {
          key: 'query',
          label: 'Search for',
          subtitle: 'What to look up about this delivery.',
          options: [
            {
              value: 'tracking',
              label: '{{ $json.order.trackingId }} tracking status',
              correct: true,
              why: 'The tracking id came back with the order, and it is the one thing that identifies this parcel to the carrier.',
            },
            { value: 'body', label: '{{ $json.body }}', correct: false, why: 'Searching the web for somebody’s complaint returns pages about complaints.' },
            { value: 'from', label: '{{ $json.from }}', correct: false, why: 'That looks up the customer, not the parcel.' },
            { value: 'order_id', label: '{{ $json.order_id }} status', correct: false, why: 'Your internal order id means nothing to a carrier. They know the parcel by its tracking number.' },
          ],
        },
      ],
    },

    'calendar-event': {
      credential: 'Google Calendar — Support Leads',
      locked: [
        { label: 'Operation', value: 'Create an event' },
        { label: 'Calendar', value: 'Support callbacks' },
      ],
      fields: [
        {
          key: 'invitee',
          label: 'Invite',
          subtitle: 'Who gets the calendar invitation.',
          options: [
            { value: 'from', label: '{{ $json.from }}', correct: true, why: 'The upset customer. A callback they are not invited to is a meeting about them without them.' },
            { value: 'to', label: '{{ $json.to }}', correct: false, why: 'Your own support address, so the invite goes nowhere useful.' },
            { value: 'none', label: 'Nobody — leave it internal', correct: false, why: 'Then it is a note to yourself, and the customer still has not heard from anyone.' },
          ],
        },
        {
          key: 'when',
          label: 'When',
          subtitle: 'How soon the call is booked.',
          options: [
            { value: 'today', label: 'The next free slot today', correct: true, why: 'This branch exists because somebody is angry. Speed is the entire remedy.' },
            { value: 'week', label: 'Same time next week', correct: false, why: 'A week of silence after an angry email is how a complaint becomes a review.' },
            { value: 'month', label: 'In a month', correct: false, why: 'By then they have gone elsewhere and told people why.' },
          ],
        },
      ],
    },

    'notion-page': {
      credential: 'Notion — Store CRM',
      locked: [{ label: 'Operation', value: 'Create a database page' }],
      fields: [
        {
          key: 'database',
          label: 'Database',
          subtitle: 'Where a sales enquiry is filed.',
          options: [
            { value: 'leads', label: 'Leads', correct: true, why: 'Somebody asking what you sell is a lead, and this is where the sales team looks.' },
            { value: 'bugs', label: 'Bugs', correct: false, why: 'Wrong table. Nobody selling anything reads it.' },
            { value: 'billing', label: 'Billing', correct: false, why: 'There is no invoice here yet. They have not bought anything.' },
            { value: 'tickets', label: 'Support tickets', correct: false, why: 'That queue is for problems, and this is an opportunity.' },
          ],
        },
      ],
    },

    'google-docs': {
      credential: 'Google Docs — Finance',
      locked: [{ label: 'Operation', value: 'Append to document' }],
      fields: [
        {
          key: 'doc',
          label: 'Document',
          subtitle: 'Which log the billing question is appended to.',
          options: [
            { value: 'billing-log', label: 'Billing query log', correct: true, why: 'Finance reads this one, and a run of similar questions here is how a pricing problem gets noticed.' },
            { value: 'bug-log', label: 'Bug log', correct: false, why: 'A billing question is not a defect, and the wrong team would be reading it.' },
            { value: 'leads', label: 'Lead tracker', correct: false, why: 'Existing customer, existing invoice. Nothing to sell.' },
          ],
        },
      ],
    },
  },

  nodeProbes: {
    'chat-trigger': {
      prompt: 'On chat message is on the canvas. If you keep it, what starts this workflow?',
      options: [
        {
          text: 'Somebody typing into a chat widget',
          correct: true,
          response: 'Right, that is all it listens for. Now think about how a customer actually reaches an order desk, and pick the trigger that hears it.',
        },
        {
          text: 'A new email arriving at the order desk',
          correct: false,
          misconception: 'chat-trigger-is-email',
          response: 'It will not. A chat trigger is attached to a chat session and never sees a mailbox at all.',
        },
        {
          text: 'Any inbound message, whatever the channel',
          correct: false,
          misconception: 'triggers-interchangeable',
          response: 'Triggers do not adapt. Each subscribes to exactly one event on one service. Which event does this desk begin with?',
        },
      ],
    },
    schedule: {
      prompt: 'On a schedule is on the canvas. When would this flow run?',
      options: [
        {
          text: 'On a fixed clock, every few minutes or at a set hour',
          correct: true,
          response: 'Correct. Now compare that to when a customer actually writes in. A clock has no idea an email landed, so how long does it sit there?',
        },
        {
          text: 'The moment an email arrives',
          correct: false,
          misconception: 'poll-vs-event',
          response: 'No. A schedule fires on the clock and never on the event, so anything arriving between ticks waits.',
        },
        {
          text: 'Once, when you publish the workflow',
          correct: false,
          misconception: 'schedule-runs-once',
          response: 'It repeats on its interval rather than firing once. But repeating on a clock is still not reacting to something happening.',
        },
      ],
    },
    webhook: {
      prompt: 'On webhook call is on the canvas. What has to happen before it fires?',
      options: [
        {
          text: 'Some other system has to send an HTTP request to its URL',
          correct: true,
          response: 'Exactly. So ask who would call that URL when a customer emails the desk. Nothing does, unless you build it yourself.',
        },
        {
          text: 'Gmail calls it whenever mail lands',
          correct: false,
          misconception: 'email-is-http',
          response: 'Gmail has no idea your webhook exists. A webhook only fires when something has been configured to post to it.',
        },
        {
          text: 'It watches the mailbox like any other trigger',
          correct: false,
          misconception: 'triggers-interchangeable',
          response: 'A webhook watches a URL, not a mailbox. Which trigger is actually subscribed to the inbox?',
        },
      ],
    },
    manual: {
      prompt: 'Trigger manually is on the canvas. What does this desk look like if you keep it?',
      options: [
        {
          text: 'Somebody has to press Execute for each email',
          correct: true,
          response: 'Right, and that is a person doing the triage by hand with extra steps. What should notice the email instead?',
        },
        {
          text: 'It runs by itself once the workflow is active',
          correct: false,
          misconception: 'manual-is-automatic',
          response: 'A manual trigger only ever fires when a human clicks it. Activating the workflow changes nothing for it.',
        },
        {
          text: 'It runs once per email, automatically, after the first click',
          correct: false,
          misconception: 'manual-is-automatic',
          response: 'There is no memory of a first click. Every execution needs its own, which is not automation.',
        },
      ],
    },
    if: {
      prompt: 'If is on the canvas. How many separate paths can one If node send work down?',
      options: [
        {
          text: 'Two, a true path and a false path',
          correct: true,
          response: 'Right. Now count how many different endings this desk needs. Does two cover it?',
        },
        {
          text: 'As many as you add conditions for',
          correct: false,
          misconception: 'if-vs-switch',
          response: 'No. If always has exactly two outputs. More conditions combine into one true-or-false answer; they do not add paths.',
        },
        {
          text: 'One, passing through only what matches',
          correct: false,
          misconception: 'if-is-filter',
          response: 'That describes Filter, which drops what does not match. If drops nothing; it picks one of two ways out.',
        },
      ],
    },
    merge: {
      prompt: 'Merge is on the canvas. What does Merge do?',
      options: [
        {
          text: 'Waits for two separate inputs and combines them into one stream',
          correct: true,
          response: 'Right, and it needs both. Look at where you have put it: is there a second path arriving, or just one?',
        },
        {
          text: 'Combines several fields of one item into a single field',
          correct: false,
          misconception: 'merge-is-set',
          response: 'That is Edit Fields territory. Merge works across inputs, not across the fields inside one item.',
        },
        {
          text: 'Removes duplicates as the items pass through',
          correct: false,
          misconception: 'merge-is-dedupe',
          response: 'It can be configured to combine matching items, but throwing away repeats is a different node’s whole job.',
        },
      ],
    },
    code: {
      prompt: 'Code is on the canvas to work out what kind of email this is. What would you have to write in it?',
      options: [
        {
          text: 'Rules looking for particular words or patterns in the text',
          correct: true,
          response: 'Right. Now picture eight kinds of email, each written a hundred ways. How many would your rules actually catch?',
        },
        {
          text: 'A prompt describing the eight kinds, and it works the rest out',
          correct: false,
          misconception: 'rules-vs-ai',
          response: 'Code does not take a prompt. It runs exactly the logic you write. Something else in the palette does take one.',
        },
        {
          text: 'Nothing, Code understands the message by itself',
          correct: false,
          misconception: 'code-is-smart',
          response: 'Code only does what it is told. It has no sense of what an email means, only what you explicitly describe.',
        },
      ],
    },
    'web-search': {
      prompt: 'Web Search is on the canvas here. What would it bring in?',
      options: [
        {
          text: 'Pages from the public internet',
          correct: true,
          response: 'Right. Now ask where this shop’s order records live. Are they on the public internet for anyone to search?',
        },
        {
          text: 'The order’s value and status from your store',
          correct: false,
          misconception: 'search-vs-api',
          response: 'Your order database is not on the web. Reading your own systems means calling them directly.',
        },
        {
          text: 'A judgement about what the customer means',
          correct: false,
          misconception: 'search-vs-classify',
          response: 'Searching returns pages. It does not form an opinion about the message in front of it.',
        },
      ],
    },
  },

  misconceptionLabels: {
    'chat-trigger-is-email': 'Treated a chat trigger as an email trigger',
    'triggers-interchangeable': 'Assumed any trigger can start the flow',
    'poll-vs-event': 'Chose a scheduled poll instead of an event trigger',
    'schedule-runs-once': 'Thought a Schedule Trigger fires once rather than on an interval',
    'email-is-http': 'Confused a webhook with receiving email',
    'manual-is-automatic': 'Expected a manual trigger to run without a person',
    'if-vs-switch': 'Reached for If where a multi-way Switch was needed',
    'if-is-filter': 'Confused If (two paths) with Filter (drops non-matches)',
    'merge-is-set': 'Confused Merge (across inputs) with editing fields on one item',
    'merge-is-dedupe': 'Confused Merge with removing duplicates',
    'rules-vs-ai': 'Tried rules or code to classify free-text email',
    'code-is-smart': 'Expected Code to interpret meaning rather than run written rules',
    'search-vs-api': 'Confused searching the web with calling your own API',
    'search-vs-classify': 'Confused searching the web with classifying the email',
    'flow-sequence': 'Placed a step out of the correct flow order',
  },

  // One per route, plus the one that matches nothing. The last is what the stress
  // test is built on.
  sampleCases: [
    { id: 'refund', from: 'anita@gmail.com', subject: 'Please refund order ORD-4471', category: 'refund_request', urgency: 'MEDIUM', branch: 'refund_request', reply: 'Refund Request' },
    { id: 'bug', from: 'dev@acme.io', subject: 'Checkout throws an error on the payment step', category: 'bug_report', urgency: 'HIGH', branch: 'bug_report', reply: 'Bug Report' },
    { id: 'delivery', from: 'rahul@gmail.com', subject: 'Where is my parcel? Ordered 9 days ago', category: 'delivery_delay', urgency: 'MEDIUM', branch: 'delivery_delay', reply: 'Delivery Delay' },
    { id: 'angry', from: 'furious@gmail.com', subject: 'Third email. Still no answer. Absolutely done with this', category: 'angry_complaint', urgency: 'HIGH', branch: 'angry_complaint', reply: 'Angry Complaint' },
    { id: 'sales', from: 'procurement@bigco.com', subject: 'Do you do bulk pricing for 200 units?', category: 'sales_enquiry', urgency: 'LOW', branch: 'sales_enquiry', reply: 'Sales Enquiry' },
    { id: 'billing', from: 'finance@acme.io', subject: 'Why is there GST on this invoice?', category: 'billing_question', urgency: 'LOW', branch: 'billing_question', reply: 'Billing Question' },
    { id: 'access', from: 'meera@gmail.com', subject: 'Cannot log in, password reset never arrives', category: 'account_access', urgency: 'MEDIUM', branch: 'account_access', reply: 'Account Access' },
    { id: 'cancel', from: 'sam@gmail.com', subject: 'Cancel ORD-4480 before it ships please', category: 'cancel_order', urgency: 'HIGH', branch: 'cancel_order', reply: 'Cancel Order' },
    // Matches none of the eight rules. Deliberate.
    { id: 'partnership', from: 'hello@influencer.co', subject: 'Collab? I have 40k followers and would love to work together', category: 'partnership', urgency: 'LOW', branch: null, reply: null },
  ],

  testCases: [
    {
      id: 'trigger-present',
      description: 'A New Email trigger starts the flow.',
      kind: 'structural',
      checks: { requiredNodeTypes: ['trigger'] },
    },
    {
      id: 'intake-cleaned',
      description: 'Automated mail is filtered and repeat threads are dropped before anything else runs.',
      kind: 'structural',
      checks: {
        requiredNodeTypes: ['filter', 'remove-duplicates'],
        requiredEdges: [
          { sourceType: 'trigger', targetType: 'filter' },
          { sourceType: 'filter', targetType: 'remove-duplicates' },
        ],
      },
    },
    {
      id: 'both-models-connected',
      description: 'Both the classifier and the summariser have a Chat Model attached.',
      kind: 'structural',
      checks: {
        requiredNodeTypes: ['classify', 'summarize'],
        requiredEdges: [
          { sourceCategory: 'model', targetType: 'classify', targetHandle: 'ai_model' },
          { sourceCategory: 'model', targetType: 'summarize', targetHandle: 'ai_model' },
        ],
      },
    },
    {
      id: 'classify-then-parse',
      description: 'The email is classified, then the answer is parsed into fields.',
      kind: 'structural',
      checks: {
        requiredNodeTypes: ['classify', 'parse'],
        requiredEdges: [{ sourceType: 'classify', targetType: 'parse' }],
      },
    },
    {
      id: 'order-looked-up',
      description: 'The order is fetched after the fields exist, and before the summary is written.',
      kind: 'structural',
      checks: {
        requiredNodeTypes: ['http-request'],
        requiredEdges: [
          { sourceType: 'parse', targetType: 'http-request' },
          { sourceType: 'http-request', targetType: 'summarize' },
        ],
      },
    },
    {
      id: 'scored-then-routed',
      description: 'A priority score is calculated, then the Switch routes on the result.',
      kind: 'structural',
      checks: {
        requiredNodeTypes: ['code', 'switch'],
        requiredEdges: [{ sourceType: 'code', targetType: 'switch' }],
      },
    },
    {
      id: 'all-eight-routes-land',
      description: 'All eight routes reach the right kind of ending.',
      kind: 'structural',
      checks: {
        requiredEdges: [
          { sourceType: 'switch', targetType: 'action', branch: 'refund_request' },
          { sourceType: 'switch', targetType: 'slack-message', branch: 'bug_report' },
          { sourceType: 'switch', targetType: 'web-search', branch: 'delivery_delay' },
          { sourceType: 'switch', targetType: 'calendar-event', branch: 'angry_complaint' },
          { sourceType: 'switch', targetType: 'notion-page', branch: 'sales_enquiry' },
          { sourceType: 'switch', targetType: 'google-docs', branch: 'billing_question' },
          { sourceType: 'switch', targetType: 'action', branch: 'account_access' },
          { sourceType: 'switch', targetType: 'action', branch: 'cancel_order' },
        ],
      },
    },
    {
      id: 'delivery-answers-after-lookup',
      description: 'The delivery route checks the carrier and then replies.',
      kind: 'structural',
      checks: { requiredEdges: [{ sourceType: 'web-search', targetType: 'action' }] },
    },
  ],

  evalQuestions: [
    {
      id: 'partnership-gap',
      caseId: 'partnership',
      prompt:
        'An influencer emails asking about a collaboration. It is not any of your eight kinds. What does your flow do with it?',
      options: [
        'It gets filed as a Sales Enquiry, since that is the closest match',
        'It matches none of the eight rules, so nothing happens and nobody replies',
        'The workflow throws an error and stops',
        'It goes down whichever branch was built first',
      ],
      correctIndex: 1,
      explanation:
        'Your Switch has eight rules and no catch-all, so an email matching none of them falls through silently. Nobody is emailed, nothing is logged, and no error is raised, which is exactly why this is the failure mode that survives longest in real automations. A default output, even one that just forwards to a human, is what closes it.',
    },
    {
      id: 'on-error-differs',
      prompt:
        'You set On Error differently on the two AI nodes: the classifier fails to its error output, the summariser carries on. Why is that the right pair?',
      options: [
        'Because the summariser is the cheaper node, so failures there matter less',
        'Because nothing downstream can work without a category, while a missing summary only costs a human some reading',
        'Because On Error should always alternate between nodes so failures are spread out',
        'Because the classifier runs first, and earlier nodes should always stop the flow',
      ],
      correctIndex: 1,
      explanation:
        'The question is always what the rest of the flow can still do. Without a category the Switch matches nothing and the email disappears, so that failure has to become visible. Without a summary the reply is still correct and sendable, so stopping would withhold a real answer over a convenience. Cost and running order have nothing to do with it.',
    },
    {
      id: 'dedupe-field',
      prompt: 'Suppose you had de-duplicated on the sender address instead of the thread. What breaks?',
      options: [
        'Nothing, a customer only ever has one issue open at a time',
        'A returning customer’s next, unrelated email is treated as a repeat and silently dropped',
        'The flow slows down because it has to remember more values',
        'Duplicate emails within one thread would stop being caught',
      ],
      correctIndex: 1,
      explanation:
        'De-duplicating on the sender says "I have heard from this person before, so ignore them". That is true and useless: the same customer will email again next month about something new, and it would never reach the desk. The thread is the unit of a conversation, which is why it is the right thing to compare.',
    },
    {
      id: 'retry-vs-error',
      prompt:
        'The order lookup has Retry On Fail turned on rather than a special On Error path. What is the reasoning?',
      options: [
        'Retrying is always safer than handling an error',
        'A network call often fails briefly and then succeeds, so a second attempt usually fixes it outright',
        'Because HTTP Request cannot use On Error',
        'Because retrying is faster than failing',
      ],
      correctIndex: 1,
      explanation:
        'Retry suits failures that are temporary, and a call to your own API dropping for a second is the clearest example there is. An error path suits failures that will not fix themselves, like a node with no model attached. Both exist because the two kinds of failure want different answers, so "always retry" is as wrong as never retrying.',
    },
  ],

  // Iris on this problem. Long pipeline, so the lines carry the shape of the flow:
  // where you are, and why this step exists at all. None of them name an answer.
  voice: {
    'node_placed:trigger': ['[calm] That is the way in. Everything after this happens once per email.'],
    'node_placed:filter': ['[calm] Good. Everything past this point costs money, so drop the junk here.'],
    'node_placed:remove-duplicates': ['[calm] This one remembers. What you compare on decides who gets ignored by mistake.'],
    'node_placed:wait': ['[calm] A small pause. People send the important bit in a second email.'],
    'node_placed:classify': ['[calm] This reads the email and decides what kind it is. It needs a model to think with.'],
    'node_placed:chat-gemini': ['[calm] The brain it borrows. One setting here decides if the answer is repeatable.'],
    'node_placed:parse': ['[calm] The model answers as text. This turns it into fields the rest can read.'],
    'node_placed:http-request': ['[calm] Now you leave the email behind and go ask your own systems.'],
    'node_placed:summarize': ['[calm] This one writes for a human. Think about what happens if it fails.'],
    'node_placed:code': ['[calm] A number for how badly this needs attention. Choose what it is built from.'],
    'node_placed:switch': ['[calm] Here is where the eight kinds split apart. Every rule you add is a path out.'],
    'node_placed:action': ['[calm] The reply itself. Whatever reaches this node gets an email back.'],
    'node_placed:slack-message': ['[calm] This one talks to your team, not the customer. Different audience, different words.'],
    'node_placed:web-search': ['[calm] Looking outward. Ask what the carrier actually knows this parcel by.'],
    'node_placed:calendar-event': ['[calm] A booked call. This branch exists because somebody is angry, so timing matters.'],
    'node_placed:notion-page': ['[calm] Filing an opportunity, not a problem. Where the sales team will look.'],
    'node_placed:google-docs': ['[calm] A log. Repeated questions in one place is how a pricing problem gets noticed.'],

    'phase_complete:intake': ['[excited] The inbox is clean now. That alone saves the desk hours.'],
    'phase_complete:read': ['[excited] It can read an email and turn it into fields. That was the hard part.'],
    'phase_complete:enrich': ['[excited] It knows the order and how urgent this is. Almost there.'],
    build_complete: ['[excited] All eight routes are live. Let us throw some real mail at it.'],

    stress_start: ['[calm] Now the interesting part. What does it do with an email you never planned for?'],

    'answer_correct:trigger': ['[warm] Yes. {answer} hears the mail land, on its own, every time.'],
    'answer_wrong:trigger': ['[thoughtful] Would {answer} notice on its own? Nobody is sitting here waiting.'],
    'answer_wrong_again:trigger': ['[calm] The mail arrives without anyone asking. What hears that?'],

    'answer_correct:filter': ['[warm] Right. {answer} keeps what matches and quietly loses the rest.'],
    'answer_wrong:filter': ['[thoughtful] {answer} gives you another path to build. Do you want one, or none?'],
    'answer_wrong_again:filter': ['[calm] You want the junk gone, not routed. Which node simply drops it?'],

    'answer_correct:remove-duplicates': ['[warm] Yes. {answer} remembers what it has already seen.'],
    'answer_wrong:remove-duplicates': ['[thoughtful] Could {answer} know it saw this last Tuesday? It has no memory.'],
    'answer_wrong_again:remove-duplicates': ['[calm] This is not about whether one email is worth keeping. It is about repeats.'],

    'answer_correct:wait': ['[warm] Right. {answer} holds this item and then lets it carry on.'],
    'answer_wrong:wait': ['[thoughtful] {answer} decides when a flow starts. This one already started.'],

    'answer_correct:classify': ['[warm] Yes. {answer} reads the words and works out what it is looking at.'],
    'answer_wrong:classify': ['[thoughtful] Eight kinds, written any number of ways. Could {answer} keep up?'],
    'answer_wrong_again:classify': ['[calm] Free text needs something that understands meaning, not a rule you typed.'],

    'answer_correct:parse': ['[warm] Right. {answer} turns that blob into separate, usable fields.'],
    'answer_wrong:parse': ['[thoughtful] It is one lump of text right now. Does {answer} help with that?'],

    'answer_correct:http-request': ['[warm] Yes. {answer} calls a system and brings the answer back in.'],
    'answer_wrong:http-request': ['[thoughtful] Your order records are not public. Would {answer} ever reach them?'],
    'answer_wrong_again:http-request': ['[calm] Nothing in the email holds the order value. It has to come from somewhere.'],

    'answer_correct:summarize': ['[warm] Right. {answer} writes the short version a person can skim.'],
    'answer_wrong:summarize': ['[thoughtful] Labelling and condensing are two jobs. Which one gives you prose?'],

    'answer_correct:switch': ['[warm] Exactly. {answer} takes one in and picks one of many ways out.'],
    'answer_wrong:switch': ['[thoughtful] Count the endings you need, then count what {answer} gives you.'],
    'answer_wrong_again:switch': ['[calm] Eight different endings. How many outputs does that need?'],

    'verify_fail:classify': ['[calm] Not yet. It can only read what you hand it. Check what you pointed at.'],
    'verify_fail:switch': ['[calm] Not right yet. Look at what each rule tests, and what the classifier really produces.'],
    'verify_fail:chat-gemini': ['[calm] Not yet. Should the same email always get the same answer?'],
    'verify_fail:remove-duplicates': ['[calm] Think about who gets wrongly ignored if you compare on that.'],
    'verify_fail:http-request': ['[calm] Not quite. You already know exactly which order this is about.'],
    'verify_pass:chat-gemini': ['[warm] Good. That setting is what makes the routing repeatable instead of a guess.'],
    'verify_pass:switch': ['[warm] Eight clean rules. That is the hardest bit of this build done.'],
  },

  // The default passthrough line names the parsed category, which reads oddly on a
  // spine with five passthrough nodes doing five different jobs. These say what
  // happened without pretending every node produced a category.
  simulation: {
    parse: '{label} runs, and passes the item on.',
    aiRead: '{label} works on the message. Intent {category}, urgency {urgency}.',
    switchNoMatch: 'Switch: "{category}" matches none of the eight rules, so this email goes unanswered.',
    switchTake: '{label} sends it down the {reply} route.',
    // Five different kinds of ending here, and only three of them email anybody.
    // The default line says "sends the reply", which is plainly wrong on the Slack
    // post and the Notion page.
    actionSend: '{targetLabel} handles it. That is this email dealt with.',
  },
};
