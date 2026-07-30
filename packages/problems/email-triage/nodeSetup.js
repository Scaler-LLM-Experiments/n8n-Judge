// The NDV, per node TYPE — not per instance.
//
// Keyed by type, so using one type twice in a problem gives both instances the same
// panel and grades one decision that may only make sense for one of them. Each field's
// options carry `{value,label,correct,why}`; `why` is what Iris explains after a verify.
// Parameters must verify green before Settings unlocks, and setup needs both.

// Node setup, field-based. Each node's NDV shows a locked credential plus the
// fields the learner must set. Each field is a real select; its `options`
// carry the correct value and a per-option "why" Iris uses to explain a
// green (correct) or red (wrong) result after the learner hits "Verify setup".
export const nodeSetup = {
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
};

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
