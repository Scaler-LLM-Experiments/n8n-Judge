export const emailTriage = {
  id: 'email-triage',
  title: 'Email Triage Automation',
  statement:
    "Your inbox is full of mixed feedback. Build a flow that watches for new emails, uses AI to classify each one (Bug Report / Feature Request / Complaint), and routes urgent complaints differently from everything else — each path sends the right reply.",
  tagline: 'Classify incoming support emails with AI and route each to the right reply.',


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
      // On Error is graded here because this is the node that can actually
      // fail — pull the Chat Model and the run visibly changes with each of
      // the three choices. Grading it on a node that cannot fail would be
      // marking an answer the learner never sees the result of.
      settings: [
        {
          key: 'onError',
          correct: 'continueErrorOutput',
          why: {
            continueErrorOutput:
              'Right. If classification fails, the email is routed somewhere you can see, instead of vanishing or taking the whole inbox down with it.',
            stopWorkflow:
              'One failure now halts everything behind it, and every email still queued goes unanswered until somebody notices. Is one bad classification worth stopping the inbox?',
            continueRegularOutput:
              'This carries on with nothing to work from, so the email reaches the Switch with no category, matches no branch, and quietly disappears. Try it — pull the Chat Model out and run the flow.',
          },
        },
      ],
      credential: 'Scaler AI Gateway',
      locked: [
        { label: 'System prompt', value: 'Classify this email as Bug Report, Feature Request or Complaint, with an urgency.', kind: 'textarea' },
        { label: 'Auto-fix format', value: 'On' },
      ],
      fields: [
        {
          // An expression field, not a dropdown of pre-written expressions.
          // Picking `{{ $json.body }}` off a list teaches recognition; writing
          // it — or dragging `body` in from the Input pane — teaches the
          // interaction n8n actually runs on.
          key: 'text',
          label: 'Text to classify',
          kind: 'expression',
          correct: '{{ $json.body }}',
          accepts: ['{{ $json.body }}', '{{ $json["body"] }}'],
          subtitle: 'Drag the field from Input, or type the expression yourself.',
          whyCorrect:
            'Right — the message body is the content being judged, and referencing it as an expression means every email gets read, not just this one.',
          whyWrong:
            'Look at what the Input pane is offering. One of those fields holds the customer’s actual complaint; the others hold who sent it and what they titled it. And if you typed the text in directly, ask yourself what happens on the next email.',
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
        { label: 'Max output tokens', value: '1024' },
        { label: 'Top P', value: '0.95' },
        { label: 'Safety settings', value: 'Default' },
      ],
      // Temperature used to sit in `locked` displaying "0" — the answer handed
      // over, and the node had nothing to configure at all. It is the one
      // setting on a Chat Model that decides whether classification is
      // repeatable, so it is the one the learner should have to reason about.
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
          subtitle: 'How much the model is allowed to vary its answer between runs.',
          whyCorrect:
            'Right. At 0 the model gives the same answer for the same email every time. Triage has to be repeatable — the same complaint should never be a Bug Report on Monday and a Complaint on Tuesday.',
          whyWrong:
            'Anything above 0 lets the model pick differently on identical input. That is useful when you want variety in writing, and the opposite of what you want when the answer decides which branch an email takes. What value makes it deterministic?',
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
          subtitle: 'Which value gets turned into clean, structured fields.',
          options: [
            { value: 'text', label: '{{ $json.text }}', correct: true, why: 'The AI’s raw answer — parse this into category + urgency.' },
            { value: 'body', label: '{{ $json.body }}', correct: false, why: 'That’s the original email, not the AI’s answer.' },
            { value: 'subject', label: '{{ $json.subject }}', correct: false, why: 'The email’s title — there’s nothing to parse here.' },
          ],
        },
        {
          // Edit Fields' `assignments` — n8n's other repeatable group. This was a
          // dropdown of pre-baked combinations ("category, urgency"), which tested
          // recognition: the right answer was sitting there to be spotted. Now the
          // learner builds the list, one field at a time, and has to decide what
          // each one should hold.
          key: 'fields',
          label: 'Fields to pull out',
          kind: 'assignmentList',
          addLabel: 'Add Field',
          subtitle: 'Name each value you want, and say where it comes from. The nodes after this can only use what you extract here.',
          nameOptions: [
            { value: 'category', label: 'category', correct: true, why: 'The Switch routes on this, so it has to exist as a clean field.' },
            { value: 'urgency', label: 'urgency', correct: true, why: 'The AI assigns it, and the replies read it.' },
            { value: 'from', label: 'from', correct: false, why: 'Already on the email — it survives without being extracted.' },
            { value: 'summary', label: 'summary', correct: false, why: 'Nothing upstream produces a summary, so this would always be empty.' },
          ],
          valueOptions: [
            { value: 'text.category', label: '{{ $json.text.category }}', correct: true, why: 'Reaches into the AI’s parsed answer for the category it assigned.' },
            { value: 'text.urgency', label: '{{ $json.text.urgency }}', correct: true, why: 'Reaches into the AI’s parsed answer for the urgency it assigned.' },
            { value: 'body', label: '{{ $json.body }}', correct: false, why: 'The original email text, not the AI’s answer about it.' },
            { value: 'subject', label: '{{ $json.subject }}', correct: false, why: 'The email’s title — the AI’s answer is not in here.' },
          ],
          expect: {
            assignments: [
              { name: 'category', value: 'text.category' },
              { name: 'urgency', value: 'text.urgency' },
            ],
          },
          why: {
            count: {
              correct: 'Two fields — exactly what the rest of the flow reads. Nothing spare, nothing missing.',
              wrong: 'Work backwards: what do the nodes AFTER this one actually need? Extract those, and only those.',
            },
            names: {
              correct: 'These names are what the Switch and the replies look for, so they line up.',
              wrong: 'A field the later nodes never read is wasted work, and one they need but you did not extract leaves them empty. Look at what the Switch routes on.',
            },
            values: {
              correct: 'Each field reaches into the AI’s parsed answer, so it holds the label the AI actually assigned.',
              wrong: 'Check where each value comes from. The AI’s answer is what you want here — not the original email text it was reading.',
            },
          },
        },
      ],
    },
    switch: {
      // Graded Settings, not just parameters. Both directions are represented
      // on purpose: On Error must be CHANGED off its default, while Retry On
      // Fail must be LEFT alone. Flipping every toggle should fail as surely
      // as touching none of them.
      // Only settings with a visible consequence are graded. Always Output
      // Data changes what the general-question email does on EVERY run: off,
      // it goes unanswered; on, an empty item is pushed down the first branch
      // and a blank reply actually gets sent. The correct answer is to leave
      // it alone, so "flip every toggle" loses.
      settings: [
        {
          key: 'alwaysOutputData',
          correct: false,
          // One explanation per choice, so a learner is told why THEIR answer
          // is right or wrong rather than reading the same sentence either way.
          why: {
            false:
              'Correct — leave it off. When an email matches no branch, the Switch should produce nothing. That email going unanswered is a real gap you can see and fix; it is not something to paper over.',
            true:
              'Turn this on and an email that matched nothing is still pushed down the first branch as an empty item — so a blank reply goes out to a real customer. Silently wrong is worse than visibly missing. Run it and watch the general question.',
          },
        },
      ],
      locked: [
        // Just "Rules", which is what n8n shows. It used to read
        // "Rules — 3 outputs (Bug Report · Feature Request · Urgent Complaint)",
        // which was harmless when the branches were hardcoded and is an outright
        // answer leak now that building them IS the question.
        { label: 'Mode', value: 'Rules' },
      ],
      fields: [
        {
          // A rule LIST, not a dropdown: this is n8n's real `rules` parameter, a
          // repeatable group where each entry names an output and states what that
          // output tests. The learner builds the branches, and each one they add
          // appears on the node — which is the thing a hardcoded branch list can
          // never teach: in n8n a node's shape follows its configuration.
          //
          // `outputKey` values are the problem's branch IDs, so the wires the
          // learner then draws line up with `referenceGraph` and `testCases`.
          key: 'rules',
          label: 'Routing rules',
          kind: 'ruleList',
          addLabel: 'Add Routing Rule',
          subtitle: 'One rule per branch. Each rule names an output and says which emails go down it.',
          branchOptions: [
            { value: 'bug_report', label: 'Bug Report', correct: true, why: 'One of the three categories the AI assigns.' },
            { value: 'feature_request', label: 'Feature Request', correct: true, why: 'One of the three categories the AI assigns.' },
            { value: 'urgent_complaint', label: 'Urgent Complaint', correct: true, why: 'One of the three categories the AI assigns.' },
            { value: 'newsletter', label: 'Newsletter', correct: false, why: 'Nothing upstream ever produces this label, so the branch could never fire.' },
            { value: 'spam', label: 'Spam', correct: false, why: 'Not one of the categories this flow classifies into.' },
          ],
          leftOptions: [
            { value: 'category', label: '{{ $json.category }}', correct: true, why: 'The label the AI assigned — Bug / Feature / Complaint. This is the split.' },
            { value: 'urgency', label: '{{ $json.urgency }}', correct: false, why: 'How urgent, not what type — a secondary signal, not the split.' },
            { value: 'body', label: '{{ $json.body }}', correct: false, why: 'Raw text. The Switch needs a clean, predictable value to match on.' },
            { value: 'from', label: '{{ $json.from }}', correct: false, why: 'Who sent it, not what it is about.' },
          ],
          operatorOptions: [
            { value: 'equals', label: 'is equal to', correct: true, why: 'The category is one exact label, so an exact match is what you want.' },
            { value: 'contains', label: 'contains', correct: false, why: 'Looser than you need here, and it would let "Bug Report" also match a longer label.' },
            { value: 'notEquals', label: 'is not equal to', correct: false, why: 'That routes everything EXCEPT this category down the branch.' },
          ],
          rightOptions: [
            { value: 'Bug Report', label: 'Bug Report', correct: true, why: 'Matches the label the AI produces.' },
            { value: 'Feature Request', label: 'Feature Request', correct: true, why: 'Matches the label the AI produces.' },
            { value: 'Urgent Complaint', label: 'Urgent Complaint', correct: true, why: 'Matches the label the AI produces.' },
            { value: 'HIGH', label: 'HIGH', correct: false, why: 'That is an urgency, not a category.' },
          ],
          expect: {
            rules: [
              { outputKey: 'bug_report', left: 'category', operator: 'equals', right: 'Bug Report' },
              { outputKey: 'feature_request', left: 'category', operator: 'equals', right: 'Feature Request' },
              { outputKey: 'urgent_complaint', left: 'category', operator: 'equals', right: 'Urgent Complaint' },
            ],
          },
          // One explanation per aspect, per verdict — so a learner is told what is
          // wrong with the thing that is actually wrong, rather than "your Switch
          // is incorrect".
          why: {
            count: {
              correct: 'Three branches for the three categories the AI can produce. Every category has somewhere to go.',
              wrong: 'Count what the classifier can output — three categories — and give each one its own branch. Too few and some emails have nowhere to go; too many and a branch can never fire.',
            },
            categories: {
              correct: 'These are exactly the labels the AI assigns, so each branch can actually match something.',
              wrong: 'A branch can only fire if something upstream produces its label. Look at what the Classify step actually outputs, and name the branches after those.',
            },
            conditions: {
              correct: 'Each branch tests the category the AI assigned, matched exactly. That is what makes the routing predictable.',
              wrong: 'Check what each branch is testing. The value to route on is the label the AI assigned — not how urgent it is, and not the raw text — and it should match exactly.',
            },
          },
        },
        {
          key: 'fallback',
          label: 'Emails matching no rule',
          subtitle: 'What happens to an email that matches none of your rules.',
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
  // Wrong-pick probes. Three rules, applied to every entry:
  //   1. Never name the correct node. The probe diagnoses a misconception; it
  //      does not resolve it. The learner goes back and chooses again.
  //   2. Every option is a position someone actually holds — no "added it by
  //      mistake" escape, which used to be marked `correct: true` and handed
  //      out a free right answer (and a clean grading record) on every probe.
  //   3. The correct answer is an accurate account of what the WRONG node
  //      really does. Understanding that is what tells the learner it doesn't
  //      fit here, without being told which node does.
  nodeProbes: {
    'chat-trigger': {
      prompt: 'Chat Trigger is on the canvas. If you keep it, what actually starts this workflow?',
      options: [
        { text: 'Someone typing a message into a chat widget', correct: true, response: 'Right — that’s all it listens for. Now think about how a support request actually reaches you in this problem, and pick the trigger that hears it.' },
        { text: 'A new email arriving in the support inbox', correct: false, misconception: 'chat-trigger-is-email', response: 'It won’t. Chat Trigger is attached to a chat session and never sees a mailbox. Go back to what event this workflow really begins with.' },
        { text: 'Any inbound message — the trigger adapts to whatever arrives', correct: false, misconception: 'triggers-interchangeable', response: 'Triggers don’t adapt. Each one subscribes to exactly one event on one service. Which event does this problem start from?' },
      ],
    },
    schedule: {
      prompt: 'Schedule Trigger is on the canvas. When would this workflow run?',
      options: [
        { text: 'On a fixed clock — every few minutes, or at a set time', correct: true, response: 'Correct. Now compare that to when a support email actually arrives. A clock has no idea one landed — how long would it sit unanswered?' },
        { text: 'The moment an email arrives', correct: false, misconception: 'poll-vs-event', response: 'No — a schedule fires on the clock, never on the event. Anything arriving between ticks waits for the next one. How fast does this problem need to react?' },
        { text: 'Once, when the workflow is published', correct: false, misconception: 'schedule-runs-once', response: 'A Schedule Trigger repeats on its interval; it isn’t a one-shot. But repeating on a clock still isn’t the same as reacting the instant something happens.' },
      ],
    },
    webhook: {
      prompt: 'Webhook is on the canvas. What has to happen before it fires?',
      options: [
        { text: 'Another system has to send an HTTP request to its URL', correct: true, response: 'Exactly. So ask yourself who would call that URL when a customer emails support — nothing does, unless you build it.' },
        { text: 'Gmail calls it automatically whenever mail lands', correct: false, misconception: 'email-is-http', response: 'Gmail has no idea your webhook exists. A webhook only fires when something has been configured to POST to it.' },
        { text: 'It watches the inbox, the same as any other trigger', correct: false, misconception: 'triggers-interchangeable', response: 'A webhook watches a URL, not a mailbox. Which trigger is actually subscribed to the inbox?' },
      ],
    },
    if: {
      prompt: 'If is on the canvas. How many separate paths can a single If node send work down?',
      options: [
        { text: 'Two — a true path and a false path', correct: true, response: 'Right. Now count how many categories this problem has to route to different replies. Does two cover it?' },
        { text: 'As many as you add conditions for', correct: false, misconception: 'if-vs-switch', response: 'No — If always has exactly two outputs. Extra conditions combine into one true/false decision; they don’t add paths.' },
        { text: 'One — it filters, passing matching items through', correct: false, misconception: 'if-is-filter', response: 'That describes Filter, which drops what doesn’t match. If doesn’t drop anything — it sends work down one of two paths.' },
      ],
    },
    code: {
      prompt: 'Code is on the canvas to work out each email’s category. What would you have to write inside it?',
      options: [
        { text: 'Rules that look for specific words or patterns in the text', correct: true, response: 'Right. Now picture five customers describing the same billing problem in five different ways — how many of them would your rules catch?' },
        { text: 'A prompt describing the categories, and it works out the rest', correct: false, misconception: 'rules-vs-ai', response: 'Code doesn’t take a prompt. It runs exactly the logic you write, character by character. Something else in the palette does take one.' },
        { text: 'Nothing — Code works out the intent on its own', correct: false, misconception: 'code-is-smart', response: 'Code only does what it’s told. It has no understanding of what an email means; it can only match what you explicitly describe.' },
      ],
    },
    'web-search': {
      prompt: 'Web Search is on the canvas. What would it bring into this flow?',
      options: [
        { text: 'Information from the internet that isn’t in the email', correct: true, response: 'Right — and everything needed to categorise this email is already sitting in the email. What information are you actually missing?' },
        { text: 'An interpretation of what the customer’s message means', correct: false, misconception: 'search-vs-classify', response: 'Searching returns pages from the web; it doesn’t form a judgement about the message in front of you. That decision has to come from the email’s own text.' },
        { text: 'A check on whether the sender is a real customer', correct: false, misconception: 'search-as-lookup', response: 'That would be a lookup against your own records, not a web search — and it still isn’t the decision this step has to make.' },
      ],
    },
  },

  // Readable labels for misconception codes recorded during the run.
  // What Iris says on THIS problem. Overrides the default phrase book, keyed by
  // moment and optionally by node type.
  //
  // The reason to author these rather than take the defaults: a generic line has
  // to say "now open it and set it up", because it does not know what the node is
  // for. Here it can say what this particular node is deciding, which is the
  // difference between narration and teaching. None of these give an answer away;
  // they say what the node is FOR, never which option to pick.
  voice: {
    // Placing a node, per node type.
    'node_placed:trigger': [
      "[calm] That's the way in. Everything after it runs once per email that arrives.",
    ],
    'node_placed:classify': [
      "[calm] This is what reads the email and decides what kind it is. It needs a model to think with.",
    ],
    'node_placed:chat-gemini': [
      "[calm] That's the brain the classifier borrows. How it's set up decides how steady its answers are.",
    ],
    'node_placed:parse': [
      "[calm] The model replies as text. This turns it into fields the next nodes can actually read.",
    ],
    'node_placed:switch': [
      "[calm] This is where the kinds of email split apart. Each branch you build is one path out.",
    ],
    'node_placed:action': [
      "[calm] This is the reply itself. Whatever reaches it gets an email back.",
    ],

    // Finishing a stage, per phase.
    'phase_complete:trigger': ["[excited] The flow's got a way in now. That's a good start!"],
    'phase_complete:brain': ["[excited] It can read an email and understand it now! [pause] That was the hard part."],
    build_complete: ["[excited] The whole thing's wired up! [pause] Let's throw some real emails at it."],

    // This problem's stress test is about the gap, so point at behaviour.
    stress_start: [
      "[excited] Wonderful! [pause] Now let's stress test it. What does yours do with an email it wasn't expecting?",
    ],

    // ---- reasoning, per question -------------------------------------------
    // The generic verdict says WHICH answer was wrong. These say why it matters,
    // in one short sentence, from a different angle to the explanation on screen.
    // That is the handholding: not the full reason, which they are reading, but the
    // thought that gets them there.
    //
    // Still no answers. Each one describes the shape of the problem, not the node
    // that solves it.
    'answer_correct:trigger': [
      "[warm] Yes. {answer} wakes this up on its own, every time mail arrives.",
    ],
    'answer_wrong:trigger': [
      "[thoughtful] Would {answer} start on its own? Nobody's sitting here pressing anything.",
    ],
    'answer_wrong_again:trigger': [
      "[calm] Think about who or what begins this. The mail arrives without anyone asking.",
    ],

    'answer_correct:classify': [
      "[warm] Right. {answer} reads the words and works out what kind of message it is.",
    ],
    'answer_wrong:classify': [
      "[thoughtful] Could {answer} really judge what the email's about? Have another look.",
    ],
    'answer_wrong_again:classify': [
      "[calm] The email's free text. You need something that understands meaning, not something matching rules.",
    ],

    'answer_correct:parse': [
      "[warm] Yes. {answer} turns that blob of text into separate, usable fields.",
    ],
    'answer_wrong:parse': [
      "[thoughtful] The answer's one lump of text right now. Does {answer} help with that?",
    ],
    'answer_wrong_again:parse': [
      "[calm] Ask what shape the next node needs its input in, then work backwards.",
    ],

    'answer_correct:switch': [
      "[warm] Exactly. {answer} takes one email in and sends it out down one path.",
    ],
    'answer_wrong:switch': [
      "[thoughtful] {answer} gives you one way out. You need one in and three out.",
    ],
    'answer_wrong_again:switch': [
      "[calm] Count the outputs you need. Three categories means three separate exits.",
    ],

    'answer_correct:action': [
      "[warm] Yes. {answer} is what actually reaches the customer at the end.",
    ],
    'answer_wrong:action': [
      "[thoughtful] Would the person who wrote in ever see {answer}? They want a reply.",
    ],

    // ---- reasoning, per node setup -----------------------------------------
    'verify_fail:classify': [
      "[calm] Ah, not yet. Check what you pointed it at, because it only reads what you hand it.",
    ],
    'verify_fail:switch': [
      "[calm] Hmm, not right yet. Look at what each branch is testing, and what the AI actually gave you.",
    ],
    'verify_fail:chat-gemini': [
      "[thoughtful] Hmm. [pause] Not yet. Think about whether the same email should always get the same answer.",
    ],
    'verify_pass:chat-gemini': [
      "[warm] That's done. That setting is the difference between triage you can trust and a coin toss.",
    ],

    // ---- how these are made to sound like something -------------------------
    // The `[warm]` and `[calm]` markers are notes to the author. They were audio
    // tags once and are stripped before rendering now, so they change nothing.
    //
    // What DOES change delivery is punctuation, and measurably. The same twenty-five
    // characters, through Deepgram Aura:
    //
    //   "That is right, well done."   1.85s   commas run it together, lightest
    //   "That is right. Well done."   1.97s   the neutral baseline
    //   "That is right... well done." 2.06s   an ellipsis buys a beat
    //   "That is right! Well done!"   2.14s   lifts, about nine percent
    //   "That is right. Well. Done."  2.45s   full stops are the strongest lever
    //
    // So tone is built out of sentence length. A short sentence lands heavier than a
    // long one, and three of them in a row sound deliberate. That is used on purpose
    // below: `verify_fail` is fragmented so it slows down and sounds careful, while
    // `idle_nudge` uses commas so it stays light and does not nag.
    //
    // Note there are no exclamation marks anywhere, and that is a house rule with a
    // test behind it. It costs nothing: a run of short sentences lifts delivery more
    // than a "!" does (24 percent against 9), and it never reads as a cheerleader.
    // `understand_done` and `run_pass` are the two moments a learner has actually
    // finished something, so both are written as three short beats.

    // ---- arriving -----------------------------------------------------------
    // The screen already says who Iris is and what the challenge is called, so these
    // say what is NOT on the page: why this problem is worth doing.
    // No `welcome` override on purpose. The hello screen gets the generic greeting,
    // because a greeting is the same job whichever problem you picked. This problem's
    // hook lives on the next beat, where the statement is actually on screen.
    problem_intro: [
      "[calm] Okay, let's get started. Today's problem statement is simple. Your support inbox gets every kind of message at once. Read it through properly.",
    ],
    understand_start: ["[calm] Before we build anything, I want to see how you're reading this."],
    understand_done: ["[excited] That's the hard part done! [pause] You worked out every piece before touching the canvas."],

    // The canvas has just opened and it is empty. This is the only line that gets to
    // frame the whole build, so it gives the ordering principle and nothing else.
    build_start: ["[calm] Now that you've collected your nodes, let's start connecting them. Follow the order the email travels."],

    // ---- opening a build phase ----------------------------------------------
    // The phase title and its description are both on screen. These give the
    // question to hold in your head while you look at the palette, and never the
    // node that answers it.
    'phase_intro:trigger': ["[calm] Nothing here runs until something starts it, so begin at the top."],
    'phase_intro:brain': ["[calm] This part has to read plain English and decide. Think about what that needs."],
    'phase_intro:route': ["[calm] Now the paths split. Every category needs somewhere of its own to go."],

    // ---- a node is configured correctly -------------------------------------
    // Naming the node is safe here: they just set it up, so nothing is being given
    // away. What each line adds is the thing the screen does not say, which is what
    // this node now DOES inside this particular flow.
    'verify_pass:trigger': ["[warm] That's your first node working. It's watching the inbox now, and every email starts a run."],
    'verify_pass:classify': ["[warm] Ah, that one's the whole idea. It reads an email like a person would, and it calls it."],
    'verify_pass:parse': ["[warmly] Look at that. [pause] A paragraph went in, and clean fields came out. Now the Switch can read it."],
    'verify_pass:switch': ["[warm] Okay. Three ways out, and you decided every one of them. That's your routing done."],
    'verify_pass:action': ["[warm] And that's the last piece. Whatever reaches it goes back to a real person."],

    // ---- parameters right, settings still to do -----------------------------
    // Acknowledges and points at the tab that just unlocked. No praise: the node is
    // not finished, and spending the win here is what left the real completion flat.
    'verify_params:trigger': ["[calm] Okay, that's the parameters right. You've got one tab left."],
    'verify_params:classify': ["[calm] Right, that's what it reads. Now tell it what to do when things go wrong."],
    'verify_params:chat-gemini': ["[calm] Okay, that's the model set up. One more tab and it's done."],
    'verify_params:parse': ["[calm] Good, those are the right fields. Now the rest of it."],
    'verify_params:switch': ["[calm] Okay, your rules are right. Now, what happens to anything matching none of them?"],
    'verify_params:action': ["[calm] Right, that's it. You've got one tab left on this one."],

    // ---- a node is not right yet --------------------------------------------
    // Deliberately clipped: short sentences slow the delivery down and make it sound
    // careful rather than impatient. Each one points at WHICH field to look at
    // without saying what to put in it.
    'verify_fail:trigger': ["[thoughtful] Hmm. [pause] Not quite. Check which inbox it's watching, and which part it reads."],
    'verify_fail:parse': ["[calm] Ah, not yet. Look at what it's reading from, and the names you asked it for."],
    'verify_fail:action': ["[calm] Ah, not right yet. Check who it's replying to, and where the words come from."],

    // The wrong node, on the canvas. Never names the right one.
    node_wrong: ["[thoughtful] Hmm. [pause] That one won't do this job here. Let me ask you something."],

    // ---- the run ------------------------------------------------------------
    // Says what a run IS, because nothing on screen does: four real emails, sent
    // through the flow one after another, with the whole journey visible.
    run_start: ["[calm] Right, let's see if what you built holds up. Four real emails, one at a time."],

    // One line per email as it enters. Without these the run is a sticky note
    // sliding along a wire and every case looks the same.
    //
    // Each describes the EMAIL and stops there. Where it comes out is the thing
    // worth watching, and on the last one it is also the Stress Testing question, so
    // announcing the destination would answer a question not yet asked.
    'run_case:bug': ["[calm] Okay, here's the first. Their app crashes every time they log in. Watch what your classifier does."],
    'run_case:feature': ["[calm] Right, next up. Nothing's broken this time, they just want something that doesn't exist yet."],
    'run_case:urgent': ["[calm] Ah, this third one is angry. They've been charged twice and nobody's helping."],
    'run_case:question': ["[calm] And the last one is just a question. No bug, no request, no complaint. But keep an eye on it."],
    run_pass: ["[excited] All four of them! [pause] Every email went exactly where it should. That flow works."],
    run_fail: [
      "[calm] Hmm. Some didn't land where they should. That's useful to know, so let's follow one.",
      "[calm] Not all of them landed right. Follow one that missed and see where it turned.",
    ],

    // ---- noticing they have gone quiet --------------------------------------
    // Commas, not full stops: this one has to stay light. It is an offer, not a
    // prod, and it is the line most likely to be heard more than once.
    idle_nudge: [
      "[calm] Take your time. If it helps, ask what the last node handed over.",
      "[calm] Still thinking? Tell me what's unclear and I'll help.",
      "[calm] No rush at all. Look at what this step is given, and what it owes the next one.",
    ],

    'answer_wrong_again:action': [
      "[calm] Think about the person who wrote in. What do they actually receive?",
    ],

    report_ready: ["[excited] Alright, here it is! [pause] What stood out, and what I'd practise next."],
  },

  misconceptionLabels: {
    'chat-trigger-is-email': 'Treated a chat trigger as an email trigger',
    'triggers-interchangeable': 'Assumed any trigger can start the flow',
    'poll-vs-event': 'Chose a scheduled poll instead of an event trigger',
    'schedule-runs-once': 'Thought a Schedule Trigger fires once rather than on an interval',
    'email-is-http': 'Confused a webhook with receiving email',
    'if-vs-switch': 'Reached for If where a multi-way Switch was needed',
    'if-is-filter': 'Confused If (two paths) with Filter (drops non-matches)',
    'rules-vs-ai': 'Tried rules/code to classify free-text email',
    'code-is-smart': 'Expected Code to interpret meaning rather than run written rules',
    'search-vs-classify': 'Confused searching the web with classifying the email',
    'search-as-lookup': 'Confused a web search with looking up internal records',
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
  ],
};
