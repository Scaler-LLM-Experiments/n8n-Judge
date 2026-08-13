// The NDV, per node TYPE — not per instance.
//
// Keyed by type, so using one type twice gives both instances the same panel. That is
// load-bearing here: the reference graph places THREE `action` nodes, one per branch,
// and they share this one setup. It is legitimate only because "reply to the person who
// sent the claim" really is the same configuration on all three paths — what differs
// between them is the wording of the reply, which is a locked template, not a decision.
// If one branch had to write to somebody other than the claimant, this would have to be
// a second node type.
//
// A node is configured in two ordered stages: Parameters must verify green before the
// Settings tab unlocks, and setup needs both. Every field is graded server-side by
// `checkAnswer()`; the browser is never told which option is correct.
//
// `settings` are authored as `{ key, correct, why: { <value>: string } }` — a map keyed
// by the value the learner chose, so they are told why THEIR answer is right or wrong.
export const nodeSetup = {
  trigger: {
    credential: 'Gmail. Scaler Finance',
    locked: [
      { label: 'Event', value: 'On new email received' },
      { label: 'Poll frequency', value: 'Every minute' },
    ],
    fields: [
      {
        key: 'label',
        label: 'Label to watch',
        subtitle: 'Mail sent to the claims address is labelled on arrival. Which label does this flow pick up from?',
        options: [
          {
            value: 'all',
            label: 'All Mail',
            correct: false,
            why: 'Everything the finance inbox receives, including vendor invoices, payroll threads and internal chatter. The flow would spend a model call on each one.',
          },
          {
            value: 'expenses',
            label: 'Expenses',
            correct: true,
            why: 'Everything sent to the claims address, labelled as it lands. That is the mail this flow is for, whatever any single message turns out to contain.',
          },
          {
            value: 'sent',
            label: 'Sent',
            correct: false,
            why: 'Mail finance has sent out. Claims come the other way.',
          },
          {
            value: 'starred',
            label: 'Starred',
            correct: false,
            why: 'Only what somebody has flagged by hand, so nothing would ever arrive on its own and the automation would wait for a human first.',
          },
        ],
      },
      {
        // A boolean, and a real n8n one: the Gmail trigger's Simplify option decides
        // whether the item is clean named fields or Gmail's raw API payload. Every
        // expression the learner writes later depends on the answer, which is why it
        // belongs at the start rather than as trivia.
        key: 'simple',
        label: 'Simplify Output',
        kind: 'boolean',
        correct: true,
        subtitle: 'What shape each email arrives in.',
        whyCorrect:
          'Right. Simplified output hands on clean named fields, so the nodes after this one can read the sender and the message directly.',
        whyWrong:
          'Turn this off and each email arrives as Gmail’s raw payload: nested parts, headers, and the text base64 encoded inside them. Every expression downstream would have to dig it out. What shape do you want the next node to receive?',
      },
    ],
  },

  classify: {
    // On Error is graded here because this is the node that can actually fail: pull the
    // Chat Model out and the Run visibly changes with each of the three choices. Grading
    // a setting on a node that cannot fail marks an answer the learner never sees the
    // result of.
    settings: [
      {
        key: 'onError',
        correct: 'continueErrorOutput',
        why: {
          continueErrorOutput:
            'Right. A claim the model could not read stops somewhere you can see it. Finance deals with that one by hand, instead of never hearing about it.',
          stopWorkflow:
            'One unreadable claim now halts everything behind it, and every claim still queued goes unanswered until somebody notices the inbox has gone quiet. Is one bad claim worth stopping payroll week?',
          continueRegularOutput:
            'This carries on with nothing to work from, so the claim reaches the split with no decision on it, matches no branch, and disappears. The claimant is left waiting and nobody is told. Try it: pull the Chat Model out and run the flow.',
        },
      },
    ],
    credential: 'Scaler AI Gateway',
    locked: [
      {
        label: 'System prompt',
        value:
          'Read the expense claim. Reply with JSON: {"decision","amount"}. decision is "Auto Approve" when the claim states an amount, a date and a reason and the amount is under 5000. "Manager Approval" when the amount is 5000 or more. "Missing Info" when any of the three is absent.',
        kind: 'textarea',
      },
      { label: 'Auto-fix format', value: 'On' },
    ],
    fields: [
      {
        // An expression field, not a dropdown of pre-written expressions. Picking
        // `{{ $json.body }}` off a list teaches recognition; writing it, or dragging
        // `body` in from the Input pane, teaches the interaction n8n runs on.
        key: 'text',
        label: 'Text to classify',
        kind: 'expression',
        correct: '{{ $json.body }}',
        accepts: ['{{ $json.body }}', '{{ $json["body"] }}'],
        subtitle: 'Drag the field in from Input, or type the expression yourself.',
        whyCorrect:
          'Right. The body is where the claim actually is: what was spent, when, and what for. Referencing it as an expression means every claim gets read, not just this one.',
        whyWrong:
          'Look at what the Input pane is offering. One of those fields holds what the person actually wrote about their spending; the others hold who they are and what they titled the mail. And if you typed a claim in directly, ask what happens on the next one.',
      },
      {
        key: 'output',
        label: 'How should it return the answer?',
        subtitle: 'The shape everything after this can rely on.',
        options: [
          {
            value: 'sentence',
            label: 'A sentence explaining the decision',
            correct: false,
            why: 'Good for a human to read and useless to route on. You would be back to searching text for words like "approve".',
          },
          {
            value: 'word',
            label: 'A single word',
            correct: false,
            why: 'You would lose the amount, and finance quotes the amount back in the reply. One loose word is also brittle to match on.',
          },
          {
            value: 'json',
            label: 'JSON. { decision, amount }',
            correct: true,
            why: 'Two named fields the next nodes can read the same way every time: the decision to route on, the amount to quote back.',
          },
        ],
      },
    ],
  },

  // The language model the classifier borrows. Nothing to wire beyond the connection,
  // so its panel is mostly locked context — but temperature is the one setting that
  // decides whether the same claim gets the same answer twice, and on a flow that pays
  // people money that is worth reasoning about rather than reading.
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
        placeholder: '0. 1',
        subtitle: 'How much the model is allowed to vary its answer between runs.',
        whyCorrect:
          'Right. At 0 the same claim gets the same decision every time. Two people submitting identical claims have to get identical answers, or the policy is not a policy.',
        whyWrong:
          'Anything above 0 lets the model answer differently on identical input. The same 4,900 rupee claim could be approved today and sent to a manager tomorrow. Variety is worth having when you are writing prose. What value makes this repeatable?',
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
          {
            value: 'body',
            label: '{{ $json.body }}',
            correct: false,
            why: 'That is the claim as the person wrote it, not the decision that was made about it.',
          },
          {
            value: 'text',
            label: '{{ $json.text }}',
            correct: true,
            why: 'The AI’s own answer. This is the JSON to turn into fields.',
          },
          {
            value: 'subject',
            label: '{{ $json.subject }}',
            correct: false,
            why: 'The line the claimant typed in the subject box. There is nothing structured in there to parse.',
          },
        ],
      },
      {
        // Edit Fields' `assignments`: a list the learner builds rather than a dropdown of
        // pre-baked combinations. Building it means deciding what each field should hold,
        // which is the actual skill; spotting the right combination in a list is not.
        key: 'fields',
        label: 'Fields to pull out',
        kind: 'assignmentList',
        addLabel: 'Add Field',
        subtitle: 'Name each value you want out, and say where it comes from. The nodes after this can only use what you extract here.',
        nameOptions: [
          { value: 'decision', label: 'decision', correct: true, why: 'The split routes on this, so it has to exist as a clean field.' },
          { value: 'amount', label: 'amount', correct: true, why: 'Every reply quotes the figure back to the claimant, so it needs to be a field of its own.' },
          { value: 'from', label: 'from', correct: false, why: 'Already on the email, and it survives without being extracted.' },
          { value: 'receipt', label: 'receipt', correct: false, why: 'Nothing upstream produces a receipt field, so this one would always be empty.' },
        ],
        valueOptions: [
          { value: 'text.decision', label: '{{ $json.text.decision }}', correct: true, why: 'Reaches into the AI’s parsed answer for the call it made.' },
          { value: 'text.amount', label: '{{ $json.text.amount }}', correct: true, why: 'Reaches into the AI’s parsed answer for the figure it read off the claim.' },
          { value: 'body', label: '{{ $json.body }}', correct: false, why: 'The claim as it was written, not the AI’s answer about it.' },
          { value: 'subject', label: '{{ $json.subject }}', correct: false, why: 'The subject line. The AI’s answer is not in here.' },
        ],
        expect: {
          assignments: [
            { name: 'decision', value: 'text.decision' },
            { name: 'amount', value: 'text.amount' },
          ],
        },
        why: {
          count: {
            correct: 'Two fields, which is exactly what the rest of the flow reads. Nothing spare, nothing missing.',
            wrong: 'Work backwards: what do the nodes AFTER this one need to read? Extract those, and only those.',
          },
          names: {
            correct: 'These names are what the split and the replies look for, so they line up.',
            wrong: 'A field nothing downstream reads is wasted work, and one they need but you did not extract leaves them empty. Look at what the split has to route on, and at what a reply has to quote.',
          },
          values: {
            correct: 'Each one reaches into the AI’s parsed answer, so the field holds what the AI actually decided.',
            wrong: 'Check where this value is coming from. What you want is inside the AI’s answer, not inside the claim it was reading.',
          },
        },
      },
    ],
  },

  switch: {
    // Graded Settings on a node where the setting has a visible consequence. Always
    // Output Data changes what the payroll question does on EVERY run: off, it goes
    // unanswered; on, an empty item is pushed down the first branch and a blank reply
    // is genuinely sent to a real person. The correct answer is to leave it alone, so
    // "flip every toggle" loses just as surely as touching nothing.
    settings: [
      {
        key: 'alwaysOutputData',
        correct: false,
        why: {
          false:
            'Correct, leave it off. When a mail matches no branch the split should produce nothing at all. A claim nobody answered is a gap you can find and fix; it is not something to paper over.',
          true:
            'Turn this on and a mail that matched nothing is still pushed down the first branch as an empty item. Somebody gets a reply approving a claim they never made. Silently wrong is worse than visibly missing. Run it and watch the payroll question.',
        },
      },
    ],
    locked: [{ label: 'Mode', value: 'Rules' }],
    fields: [
      {
        // A rule LIST, not a dropdown: n8n's real `rules` parameter, a repeatable group
        // where each entry names an output and states what that output tests. The learner
        // builds the branches, and each one they add appears on the node, which is the
        // thing a hardcoded branch list can never teach: in n8n a node's shape follows
        // its configuration.
        //
        // `outputKey` values are the problem's branch ids, so the wires the learner draws
        // next line up with `referenceGraph` and `testCases`.
        key: 'rules',
        label: 'Routing rules',
        kind: 'ruleList',
        addLabel: 'Add Routing Rule',
        subtitle: 'One rule per branch. Each rule names an output and says which claims go down it.',
        branchOptions: [
          { value: 'auto_approve', label: 'Auto Approve', correct: true, why: 'One of the three decisions the AI is asked to make.' },
          { value: 'manager_approval', label: 'Manager Approval', correct: true, why: 'One of the three decisions the AI is asked to make.' },
          { value: 'missing_info', label: 'Missing Info', correct: true, why: 'One of the three decisions the AI is asked to make.' },
          { value: 'rejected', label: 'Rejected', correct: false, why: 'Nothing upstream ever answers "Rejected", so this branch could never fire. Turning a claim down is a person’s job, not this flow’s.' },
          { value: 'over_budget', label: 'Over Budget', correct: false, why: 'Reasonable words, but not one of the answers the AI can give, so nothing would ever match it.' },
        ],
        leftOptions: [
          { value: 'decision', label: '{{ $json.decision }}', correct: true, why: 'The call the AI made after applying the policy. That is what the paths are for.' },
          {
            value: 'amount',
            label: '{{ $json.amount }}',
            correct: false,
            why: 'The amount is the reason behind the call, not the call itself. Route on it and you are writing the policy twice, in two places that can disagree, and a claim that never said what it was for still slips through.',
          },
          { value: 'body', label: '{{ $json.body }}', correct: false, why: 'The claim in the claimant’s own words. Routing needs one clean, predictable value.' },
          { value: 'from', label: '{{ $json.from }}', correct: false, why: 'Who submitted it. Two people can send the same claim and it should go the same way.' },
        ],
        operatorOptions: [
          { value: 'equals', label: 'is equal to', correct: true, why: 'The decision is one exact label out of three, so an exact match is what you want.' },
          { value: 'contains', label: 'contains', correct: false, why: 'Looser than you need, and "Approve" inside "Manager Approval" is exactly the kind of overlap that bites.' },
          { value: 'largerThan', label: 'is greater than', correct: false, why: 'That compares sizes. A decision is a label, and a label is not bigger or smaller than another one.' },
        ],
        rightOptions: [
          { value: 'Auto Approve', label: 'Auto Approve', correct: true, why: 'Matches an answer the AI actually gives, word for word.' },
          { value: 'Manager Approval', label: 'Manager Approval', correct: true, why: 'Matches an answer the AI actually gives, word for word.' },
          { value: 'Missing Info', label: 'Missing Info', correct: true, why: 'Matches an answer the AI actually gives, word for word.' },
          { value: '5000', label: '5000', correct: false, why: 'That is the policy limit, which the AI has already applied. It is a figure, not a decision.' },
          { value: 'Approved', label: 'Approved', correct: false, why: 'Close to the real answer and therefore worse than obviously wrong: an exact match against a label nothing produces never fires.' },
        ],
        expect: {
          rules: [
            { outputKey: 'auto_approve', left: 'decision', operator: 'equals', right: 'Auto Approve' },
            { outputKey: 'manager_approval', left: 'decision', operator: 'equals', right: 'Manager Approval' },
            { outputKey: 'missing_info', left: 'decision', operator: 'equals', right: 'Missing Info' },
          ],
        },
        // One explanation per aspect, per verdict, so a learner is told what is wrong
        // with the thing that is actually wrong. Each is written as advice about ONE
        // branch, because the NDV shows every verdict on the row it came from.
        why: {
          count: {
            correct: 'Three branches for the three decisions the AI can return, so every claim it judges has somewhere to go.',
            wrong: 'Count the answers the AI is allowed to give, and give each one its own branch. Too few and some claims have nowhere to go; too many and a branch sits there that can never fire.',
          },
          categories: {
            correct: 'Each branch is named after an answer the AI actually gives, so each one can match something real.',
            wrong: 'A branch only ever fires if something upstream produces its name. Read what the classifier is told to answer with, and name this branch after one of those.',
          },
          conditions: {
            correct: 'This branch tests the decision the AI made, matched exactly, which is what makes the routing predictable.',
            wrong: 'Look at what this branch is testing. Split on the call the AI already made, not the figure behind it and not the raw claim. It should match exactly.',
          },
        },
      },
      {
        key: 'fallback',
        label: 'Claims matching no rule',
        subtitle: 'What happens to an email that matches none of your rules.',
        options: [
          {
            value: 'first',
            label: 'Send it down the first branch',
            correct: false,
            why: 'That approves and pays anything the flow did not understand, which is the most expensive possible way to be wrong.',
          },
          {
            value: 'error',
            label: 'Throw an error',
            correct: false,
            why: 'A non-match is not a failure. The split simply has no matching output, and turning that into an error stops work that was fine.',
          },
          {
            value: 'none',
            label: 'Fall through. No reply sent',
            correct: true,
            why: 'With three branches, anything else falls through silently. That is a real gap, and the stress test is about to ask you what falls into it.',
          },
        ],
      },
    ],
  },

  action: {
    credential: 'Gmail. Scaler Finance',
    locked: [
      { label: 'Operation', value: 'Reply to message' },
      { label: 'Subject', value: 'Re: your expense claim' },
      { label: 'Send as', value: 'HTML' },
    ],
    fields: [
      {
        key: 'to',
        label: 'Send reply to',
        subtitle: 'Where the outgoing reply is addressed.',
        options: [
          {
            value: 'manager',
            label: '{{ $json.manager }}',
            correct: false,
            why: 'Nothing upstream produces a manager’s address, so this sends to nobody. And all three replies go to the claimant: one of them mentions a manager, which is not the same as writing to one.',
          },
          {
            value: 'to',
            label: '{{ $json.to }}',
            correct: false,
            why: 'That was the finance address the claim was sent to, so this replies to yourself.',
          },
          {
            value: 'from',
            label: '{{ $json.from }}',
            correct: true,
            why: 'The person who submitted the claim. They are the one waiting to hear.',
          },
        ],
      },
      {
        key: 'bodySrc',
        label: 'What goes in the reply',
        subtitle: 'Which message the claimant actually receives.',
        options: [
          {
            value: 'original',
            label: 'The claim they sent',
            correct: false,
            why: 'That posts their own words back at them without answering anything.',
          },
          {
            value: 'template',
            label: 'The wording written for this outcome',
            correct: true,
            why: 'Each branch sends the message that matches its decision: paid, waiting on a manager, or here is what we still need.',
          },
          {
            value: 'raw',
            label: 'The JSON the AI produced',
            correct: false,
            why: 'A real person would get a line of braces and quotes. That is a debug output, not a reply.',
          },
        ],
      },
    ],
  },
};
