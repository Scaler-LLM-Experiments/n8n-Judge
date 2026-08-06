// The NDV (node detail view), per node TYPE — not per instance.
//
// Every type is used exactly once in this problem, deliberately. Two Gmail nodes would
// share this one panel, one question and one answer key, so "email the person named in
// the request" and "reply to whoever filled in the form" would be graded identically —
// which is the misconception this case exists to teach, taught backwards.
//
// A node is configured in two ordered stages: Parameters must verify green before the
// Settings tab unlocks, and setup needs both. Every field is graded server-side by
// `checkAnswer()` — the browser is never told which option is correct.
//
// `settings` is a DIFFERENT SHAPE from `fields`, and it is not covered by
// `nodeSetupSchema` at all — zod strips it, so `validateProblem()` never sees it and
// nothing here can be caught mechanically. The shape is:
//
//   { key, correct: <value>, why: { '<value>': '…', '<other value>': '…' } }
//
// `why` is a MAP keyed by what the learner chose, so they are told why THEIR answer is
// right or wrong. The template's `options: [{ correct: true }]` shape leaves
// `graded.correct` undefined, which marks every learner wrong forever.
export const nodeSetup = {
  // The way in. It publishes the Ops Desk request form, so the three questions on that
  // form are the three named values everything downstream maps from.
  'form-trigger': {
    // What the INPUT pane of the NEXT node shows, and what its "Insert field…"
    // dropdown is built from. Authored here because the catalog carries one sample
    // per type shared by every case, so without this the learner is offered
    // trial-signup-desk's form (Full Name / Email / Plan / Referral Source) on the
    // exact screen where they must write an expression against THIS form's three
    // questions — every option in the dropdown wrong, the field unanswerable from
    // the pane. Keys must match the Form Fields above exactly.
    sampleOutput: {
      'Your name': 'Arjun Mehta',
      'Your email': 'arjun@fernwoodrobotics.com',
      'What do you need?':
        'Log a new distributor lead — Riya Kapoor at Kapoor Automation, she’s interested in the Pro plan. riya@kapoorautomation.in',
    },
    locked: [
      { label: 'Form Title', value: 'Ops Desk request' },
      { label: 'Form Description', value: 'Anything that is not engineering or sales. Priya picks these up.' },
      { label: 'Form Fields', value: 'Your name · Your email · What do you need?' },
      { label: 'Respond When', value: 'Form is submitted' },
    ],
    fields: [
      {
        key: 'required',
        label: 'Which answers must be filled in?',
        subtitle:
          'A required answer stops the form being submitted while it is empty. An optional one is allowed through blank, and everything after this has to cope with the blank.',
        options: [
          {
            value: 'text-only',
            label: 'Only "What do you need?"',
            correct: false,
            why: 'The box everything is read out of, yes. But two of the Ops Log’s six columns are the requester’s own name and address, and if those can arrive blank then rows land half empty — and the Slack message that is supposed to tell Priya who asked has nobody to name.',
          },
          {
            value: 'none',
            label: 'None of them',
            correct: false,
            why: 'Then a completely empty submission is a valid one. The reading step is handed nothing to read, and every column downstream of it fills with nothing. A form that accepts silence is not collecting anything.',
          },
          {
            value: 'name-email',
            label: 'Your name and Your email',
            correct: false,
            why: 'These two matter, and you have made the one box that the entire flow reads optional. A request that says nothing at all would be accepted, go to the model with no text in it, and take up a run producing nothing.',
          },
          {
            value: 'all',
            label: 'All three',
            correct: true,
            why: 'Right. This form asks three short questions and every one of them is load-bearing: two fill columns on the Ops Log and name the requester in Slack, and the third is the only thing there is to read. Nothing here is nice-to-have, so nothing here is optional.',
          },
        ],
      },
    ],
  },

  // The one AI step, and it does two jobs in one call: it decides the route AND produces
  // the values the spreadsheet and the email need. That is why it is an extractor.
  'information-extractor': {
    // The four attributes, as the Switch and the Sheets node downstream will see them.
    // The catalog sample is `{ output: {} }`, which showed those two nodes an empty
    // input pane and gave their dropdowns nothing to offer — on the screens where the
    // learner maps four of the Ops Log's six columns.
    // The form's three answers travel WITH the four extracted ones, because that is
    // the item the Ops Log row is built from: two of its six columns are typed into
    // the form and four are worked out from the sentence. A learner mapping that row
    // has to be able to reach both from the same pane.
    sampleOutput: {
      'Your name': 'Arjun Mehta',
      'Your email': 'arjun@fernwoodrobotics.com',
      'What do you need?':
        'Log a new distributor lead — Riya Kapoor at Kapoor Automation, she’s interested in the Pro plan. riya@kapoorautomation.in',
      request_type: 'log',
      subject_name: 'Riya Kapoor',
      subject_email: 'riya@kapoorautomation.in',
      detail: 'distributor lead, interested in the Pro plan',
    },
    locked: [
      { label: 'Schema Type', value: 'From Attribute Descriptions' },
      {
        label: 'Attributes',
        value:
          'request_type — which of the three kinds this is\nsubject_name — the person or thing the request is about, blank if none\nsubject_email — an address written inside the request, blank if none\ndetail — one plain line saying what should be recorded, or what the message should say',
        kind: 'textarea',
      },
      { label: 'Auto-fix format', value: 'On' },
    ],
    fields: [
      {
        // An expression field, not a dropdown of pre-written expressions. Picking the
        // right one off a list teaches recognition; writing it teaches the interaction.
        //
        // The subtitle names the form's three questions rather than pointing at the
        // Input pane, because the pane renders the catalog's shared sample output for a
        // form trigger and that sample belongs to a different case.
        key: 'text',
        label: 'Text to read',
        kind: 'expression',
        correct: '{{ $json["What do you need?"] }}',
        accepts: ['{{ $json["What do you need?"] }}', '{{ $json[\'What do you need?\'] }}'],
        subtitle:
          'The form asked three questions: "Your name", "Your email" and "What do you need?". Which of those three answers is the one with anything to work out in it?',
        whyCorrect:
          'Right. The free-text box is where all the mess lives — the name of a distributor, an address halfway through a sentence, a request that turns out to be neither. Referencing it as an expression means every submission gets read, not just this one.',
        whyWrong:
          'Two of the three answers on that form are already clean values that need nobody to interpret them: a name, and an address. The third is a sentence somebody typed in a hurry, and it is the only one with four things buried in it. And if you typed a request in directly, ask what the next submission gets read as.',
      },
      {
        // The instruction that makes `needs_human` real. It is a graded decision rather
        // than a line in the locked prompt because it IS the least-privilege lesson: the
        // model has to be told that "I cannot do this" is an allowed answer.
        key: 'unknownCategory',
        label: 'What should it answer when a request is neither a record-this nor a send-this?',
        subtitle:
          'Somebody asks what the desk can do. Somebody asks for a row to be deleted. Nothing about either is a record-this or a send-this.',
        options: [
          {
            value: 'blank',
            label: 'Leave request_type empty',
            correct: false,
            why: 'An empty value is not one of the things the routing is looking for, so this request arrives at the split carrying nothing that any rule tests for. Ask yourself where an item ends up when no rule claims it, and who finds out.',
          },
          {
            value: 'needs_human',
            label: 'Answer needs_human',
            correct: true,
            why: 'Right. "This is not something I can do" is an answer, and it has to be one the model is explicitly allowed to give — otherwise every request gets forced into a shape that fits. It is also the only one of the three that is honest about the desk’s limits.',
          },
          {
            value: 'guess',
            label: 'Pick whichever of the other two is closest',
            correct: false,
            why: 'Forcing a guess is how a request to remove somebody’s details ends up as a brand new row about them. A request the desk cannot do is not a near miss of one it can; it is a different thing, and pretending otherwise costs more than doing nothing.',
          },
          {
            value: 'invent',
            label: 'Make up a type that describes it',
            correct: false,
            why: 'A free invention reads well and routes nowhere. The split downstream tests for a fixed set of values, so a type nobody planned for is a type no rule will claim — and every request is different, so the inventions never repeat.',
          },
        ],
      },
    ],
  },

  // The model the extractor borrows. Nothing to wire beyond the connection, so the panel
  // is mostly locked context — but temperature decides whether the same request is read
  // the same way twice, and this flow writes to a spreadsheet on the strength of it.
  'openai-chat-model': {
    credential: 'OpenAI — Fernwood Ops',
    locked: [
      { label: 'Model', value: 'gpt-4.1-mini' },
      { label: 'Response Format', value: 'Text' },
      { label: 'Timeout', value: '60000 ms' },
      { label: 'Max Retries', value: '2' },
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
        subtitle: 'How much the model is allowed to vary its answer between runs.',
        whyCorrect:
          'Right. At 0 the same request is read the same way every time. Two people submitting the same sentence have to get the same result, or Priya cannot trust a single row on the sheet.',
        whyWrong:
          'Anything above 0 lets the model answer differently on identical input, so the same sentence could be recorded today and emailed tomorrow. Variety is worth having when you are asking for prose. What value makes this repeatable?',
      },
    ],
  },

  // The split. Its rules are what turn one value into three paths.
  switch: {
    // A router passes its item straight through, so this is the extractor's output
    // again — and it is what the Sheets, Gmail and Slack panes show, since all three
    // hang off this node. Without it they inherited the catalog's shared sample
    // (email-triage's `category` / `urgency`) and offered a learner two fields that
    // do not exist in this case, on the screens where they map six columns and pick
    // an address.
    sampleOutput: {
      'Your name': 'Arjun Mehta',
      'Your email': 'arjun@fernwoodrobotics.com',
      'What do you need?':
        'Log a new distributor lead — Riya Kapoor at Kapoor Automation, she’s interested in the Pro plan. riya@kapoorautomation.in',
      request_type: 'log',
      subject_name: 'Riya Kapoor',
      subject_email: 'riya@kapoorautomation.in',
      detail: 'distributor lead, interested in the Pro plan',
    },
    // Graded on a node where the setting has a visible consequence: the Run streams a
    // request the rules do not claim, and this toggle changes what that request does.
    // The correct answer is to leave it alone, so "flip every toggle" loses just as
    // surely as touching nothing.
    settings: [
      {
        key: 'alwaysOutputData',
        correct: false,
        why: {
          false:
            'Correct, leave it off. A split should not manufacture an item it has no rule for. Turning it on does not rescue a request the flow failed to understand — it fabricates one, and a fabricated row in the Ops Log looks exactly like a real one to everybody who reads it afterwards.',
          true:
            'Turn this on and a request that matched no rule is pushed down the FIRST branch anyway, as an empty item. So a blank line is appended to the Ops Log with nobody’s name on it, for a request nobody understood. Run the flow and watch the last case go through.',
        },
      },
    ],
    locked: [
      { label: 'Mode', value: 'Rules' },
      { label: 'Convert types where required', value: 'Off' },
    ],
    fields: [
      {
        // A rule LIST, not a dropdown: n8n's real `rules` parameter, a repeatable group
        // where each entry names an output and states what that output tests. The learner
        // builds the branches, and each one they add appears on the node — the thing a
        // hardcoded branch list can never teach: in n8n a node's shape follows its
        // configuration.
        //
        // The key is `routingRules` rather than `rules` on purpose. `rules` IS a real
        // Switch catalog parameter, and a case whose authored keys are all catalog keys
        // gets the full descriptor screen merged in — which would seed this control from
        // the descriptor's own default `{ values: [...] }` object instead of a row list.
        //
        // `outputKey` values are the problem's branch ids, so the wires the learner draws
        // next line up with `referenceGraph` and `testCases`.
        key: 'routingRules',
        label: 'Routing rules',
        kind: 'ruleList',
        addLabel: 'Add Routing Rule',
        subtitle:
          'One rule per way out. Each rule names an output and says which requests leave through it. The name on the wire is for you to read; the value on the right is what actually has to match.',
        branchOptions: [
          { value: 'log', label: 'Log only', correct: true, why: 'One of the three answers the reading step is allowed to give, so this output can actually fire.' },
          { value: 'email', label: 'Email only', correct: true, why: 'One of the three answers the reading step is allowed to give, so this output can actually fire.' },
          { value: 'needs_human', label: 'Needs a human', correct: true, why: 'One of the three answers the reading step is allowed to give, and the one that keeps the desk honest about what it cannot do.' },
          {
            value: 'both',
            label: 'Both',
            correct: false,
            why: 'A reasonable thing to want and not a thing this flow can do. Every request leaves through exactly one way out, and the reading step is asked for exactly one answer, so an output named for two of them would never fire.',
          },
          {
            value: 'urgent',
            label: 'Urgent',
            correct: false,
            why: 'Urgency is a real thing about a request and it is not one of the answers the reading step gives, so nothing would ever arrive here. An output that can never fire is a wire that quietly goes nowhere.',
          },
        ],
        leftOptions: [
          {
            value: 'request_type',
            label: '{{ $json.request_type }}',
            correct: true,
            why: 'The call the reading step already made about this request. Splitting on the decision itself is what keeps the routing predictable, because one value means one path.',
          },
          {
            value: 'detail',
            label: '{{ $json.detail }}',
            correct: false,
            why: 'The one-line summary — a sentence, written fresh for every request. You would be back to hunting for words inside prose, which is the job the reading step was added to remove.',
          },
          {
            value: 'subject_email',
            label: '{{ $json.subject_email }}',
            correct: false,
            why: 'Whether an address turned up inside the request. It is blank on plenty of perfectly good record-this requests, and present on some that are not send-this at all, so it is a clue rather than a decision.',
          },
          {
            value: 'requester',
            label: '{{ $json["Your name"] }}',
            correct: false,
            why: 'Who asked. The same person sends all three kinds of request in a week, so routing on their name sends every one of them the same way.',
          },
        ],
        operatorOptions: [
          { value: 'equals', label: 'is equal to', correct: true, why: 'The type is one exact value out of three, so an exact match is what you want and nothing overlaps.' },
          {
            value: 'contains',
            label: 'contains',
            correct: false,
            why: 'Looser than you need. Look at the three values written out next to each other and find the one that contains another one — that overlap is a request taking the first branch that happens to match.',
          },
          {
            value: 'isNotEmpty',
            label: 'is not empty',
            correct: false,
            why: 'That is true of all three types at once, so every rule would claim every request and the first one would always win. A test that is always true is not a route.',
          },
        ],
        rightOptions: [
          { value: 'log', label: 'log', correct: true, why: 'Matches one of the three values the reading step is told to answer with, character for character.' },
          { value: 'email', label: 'email', correct: true, why: 'Matches one of the three values the reading step is told to answer with, character for character.' },
          { value: 'needs_human', label: 'needs_human', correct: true, why: 'Matches one of the three values the reading step is told to answer with, character for character.' },
          {
            value: 'Log only',
            label: 'Log only',
            correct: false,
            why: 'That is the name written on the wire so a human can read the canvas, not the value arriving on the item. The two are allowed to differ, and here they do — an exact match against the label never fires.',
          },
          {
            value: 'delete',
            label: 'delete',
            correct: false,
            why: 'People do ask for things to be removed, and nothing upstream ever answers with this, so the rule sits there and never matches. Where a request like that should go is a question worth holding on to.',
          },
        ],
        expect: {
          rules: [
            { outputKey: 'log', left: 'request_type', operator: 'equals', right: 'log' },
            { outputKey: 'email', left: 'request_type', operator: 'equals', right: 'email' },
            { outputKey: 'needs_human', left: 'request_type', operator: 'equals', right: 'needs_human' },
          ],
        },
        // One explanation per aspect, per verdict. Each is written as advice about ONE
        // rule, because the NDV shows every verdict on the row it came from.
        why: {
          count: {
            correct: 'Three ways out for the three answers the reading step can give, so every request it has judged has somewhere to go.',
            wrong:
              'Count the answers the reading step is allowed to return, and give each one its own way out. Too few and some requests have nowhere to land; too many and a wire sits there that nothing can ever travel down.',
          },
          categories: {
            correct: 'This output is named after one of the three answers the reading step gives, so something real can arrive on it.',
            wrong:
              'An output only ever fires if the reading step produces the value this rule tests for. Name this one after a value the reading step is actually asked to produce — the list of those lives on that node, not on this one.',
          },
          conditions: {
            correct: 'This rule tests the decision the reading step already made, matched exactly, which is what makes one request take one path.',
            wrong:
              'Look at what this rule is testing. The thing to split on is the call that has already been made about the request, not the summary of it and not who sent it — and it should match exactly, not loosely.',
          },
        },
      },
    ],
  },

  // The Ops Log. Six columns from two different places, which is the decision this whole
  // case is built around.
  'google-sheets': {
    // What the OUTPUT pane shows after Verify. The catalog sample is
    // trial-signup-desk's row (Full Name / Plan / USD_INR_Rate), which appeared right
    // after the learner had carefully mapped THESE six columns — a different case's
    // spreadsheet presented as the result of their own work.
    sampleOutput: {
      'Requested By': 'Arjun Mehta',
      'Requester Email': 'arjun@fernwoodrobotics.com',
      Type: 'log',
      'Subject Name': 'Riya Kapoor',
      'Subject Email': 'riya@kapoorautomation.in',
      Detail: 'distributor lead, interested in the Pro plan',
      updates: { updatedRows: 1 },
    },
    credential: 'Google Sheets — Fernwood Ops',
    locked: [
      { label: 'Document', value: 'Fernwood Ops Log' },
      { label: 'Sheet', value: 'Requests' },
      { label: 'Operation', value: 'Append Row' },
      { label: 'Mapping Column Mode', value: 'Map each column manually' },
      {
        label: 'Columns on the sheet',
        value: 'Requested By · Requester Email · Type · Subject Name · Subject Email · Detail',
      },
    ],
    fields: [
      {
        // An assignment LIST, not a set of dropdowns: n8n's real per-column mapping,
        // where the learner names each heading and says what goes under it. Building it
        // is the skill; recognising a pre-baked correct combination is not.
        //
        // The key must be `columns` — the Sheets export spec reads `expect.assignments`
        // off exactly that key, and resolves each token back through `valueOptions` to
        // that option's LABEL. So every label here has to be a real n8n expression: a
        // label written as prose would be written into the spreadsheet cell verbatim.
        key: 'columns',
        label: 'Values to send',
        kind: 'assignmentList',
        addLabel: 'Add Column',
        subtitle:
          'One entry per column you are filling. Name the heading exactly as it appears on the sheet, then say which value belongs under it. Two of these come off the form the requester filled in; the other four had to be worked out from the sentence they wrote.',
        nameOptions: [
          { value: 'Requested By', label: 'Requested By', correct: true, why: 'A heading the Requests sheet really has. This is the column Priya scans when she wants to know who to go back to.' },
          { value: 'Requester Email', label: 'Requester Email', correct: true, why: 'A heading on the sheet, and the reason the form asks for an address at all — so there is a way back to whoever raised it.' },
          { value: 'Type', label: 'Type', correct: true, why: 'A heading on the sheet. It records what the desk decided this request was, which is the only way to audit the decision afterwards.' },
          { value: 'Subject Name', label: 'Subject Name', correct: true, why: 'A heading on the sheet, and the first of the four that are about the request rather than about the requester.' },
          { value: 'Subject Email', label: 'Subject Email', correct: true, why: 'A heading on the sheet. It is blank on plenty of rows, which is fine — a blank cell still writes.' },
          { value: 'Detail', label: 'Detail', correct: true, why: 'A heading on the sheet, and the one that has to hold a whole sentence. Commas and apostrophes inside a value are only trouble if something tries to split the value up.' },
          {
            value: 'Date',
            label: 'Date',
            correct: false,
            why: 'Genuinely useful, and not a column this sheet has. A value sent under a heading that does not exist is simply not written, and nothing warns you — check the column list on the panel above.',
          },
          {
            value: 'Status',
            label: 'Status',
            correct: false,
            why: 'There is no Status column on the Requests sheet, and nothing upstream produces a status either. Two ways for this row to write nothing at all.',
          },
        ],
        valueOptions: [
          {
            value: 'form.name',
            label: '{{ $json["Your name"] }}',
            correct: true,
            why: 'The name of the person who filled in the form, exactly as they typed it. This is one of the two values that come straight off the form with nothing worked out.',
          },
          {
            value: 'form.email',
            label: '{{ $json["Your email"] }}',
            correct: true,
            why: 'The address of the person who raised the request. Worth holding on to which person this is: it is not the address any outgoing message goes to.',
          },
          {
            value: 'ai.type',
            label: '{{ $json.request_type }}',
            correct: true,
            why: 'The call the reading step made. The same value the split routes on, recorded so the decision is visible after the fact.',
          },
          {
            value: 'ai.subjectName',
            label: '{{ $json.subject_name }}',
            correct: true,
            why: 'Who or what the request is ABOUT, which the reading step had to find inside the sentence. On plenty of rows this is a different person from the one who asked.',
          },
          {
            value: 'ai.subjectEmail',
            label: '{{ $json.subject_email }}',
            correct: true,
            why: 'The address written inside the request, if there was one. Often blank, and a blank here is a correct answer rather than a failure.',
          },
          {
            value: 'ai.detail',
            label: '{{ $json.detail }}',
            correct: true,
            why: 'The one plain line the reading step wrote. It is the version of the request somebody can skim six months later.',
          },
          {
            value: 'form.text',
            label: '{{ $json["What do you need?"] }}',
            correct: false,
            why: 'The request whole and raw, including the instructions the person was giving the desk. The Detail column is meant to hold what was asked for, not the asking — and a cell holding three sentences is a cell nobody reads.',
          },
          {
            value: 'ai.output',
            label: '{{ $json.output }}',
            correct: false,
            why: 'That is the container the four values arrived in, not one of them. The cell fills with a chunk of braces and quotes, or with the words [object Object]. You are one level too shallow.',
          },
        ],
        expect: {
          assignments: [
            { name: 'Requested By', value: 'form.name' },
            { name: 'Requester Email', value: 'form.email' },
            { name: 'Type', value: 'ai.type' },
            { name: 'Subject Name', value: 'ai.subjectName' },
            { name: 'Subject Email', value: 'ai.subjectEmail' },
            { name: 'Detail', value: 'ai.detail' },
          ],
        },
        why: {
          count: {
            correct: 'Six entries for the six headings on the sheet, so every column has something under it and none is left to guess.',
            wrong:
              'Count the headings on the Requests sheet and give each one an entry. A heading with no entry comes out empty on every row, and an entry naming no real heading writes nowhere at all.',
          },
          names: {
            correct: 'Each name matches a heading that is really on the sheet, spelled the same way, so each value has somewhere to land.',
            wrong:
              'A name here has to be a heading the Requests sheet actually has, spelled exactly. Read the column list on the locked panel above and check this row against it — a near-miss writes nothing and says nothing.',
          },
          values: {
            correct:
              'Each row puts the value that belongs under that heading, and keeps the two sources straight: what the requester typed into the form, and what had to be worked out from their sentence.',
            wrong:
              'Look at what this row is putting under that heading. Almost every mistake here is the same one: the person who ASKED and the person the request is ABOUT are two different people, and both of them have a name and an address on this item.',
          },
        },
      },
    ],
  },

  // The send-it-on path. One job, and the one decision on it is the case's second-best.
  gmail: {
    // The catalog sample is `{}`, so the OUTPUT pane said nothing at all about what
    // this node did. Naming the recipient is the point: it is the one the request was
    // ABOUT, not the one who filled the form in.
    sampleOutput: {
      sent: true,
      to: 'riya@kapoorautomation.in',
      subject: 'From the Fernwood ops desk',
    },
    credential: 'Gmail — Fernwood Ops',
    locked: [
      { label: 'Resource', value: 'Message' },
      { label: 'Operation', value: 'Send' },
      { label: 'Subject', value: 'From the Fernwood ops desk' },
      { label: 'Email Type', value: 'Text' },
    ],
    fields: [
      {
        key: 'sendTo',
        label: 'Send to',
        subtitle:
          'This item carries two addresses. One was typed into the form; the other was found inside the sentence. Read the request again before you choose.',
        options: [
          {
            value: 'requester',
            label: '{{ $json["Your email"] }}',
            correct: false,
            why: 'That is the person who filled in the form, and they are not who this message is for. Deepa asking for a quote to go to Riya would get the quote herself, and Riya would hear nothing — the request would look handled and would not be. It is the most visible address on the item and the warmest in your hand, because you have just mapped it into a column, which is exactly why this is the mistake people make.',
          },
          {
            value: 'subject',
            label: '{{ $json.subject_email }}',
            correct: true,
            why: 'Right. This is the address the reading step found inside the request, which is the whole reason it was asked to look for one. The person who asked and the person this concerns are two different people, and this is the second one.',
          },
          {
            value: 'ops',
            label: 'priya@fernwoodrobotics.com',
            correct: false,
            why: 'Every outgoing message would land on Priya, who would then forward each one by hand. That is the forty-five minutes a day this flow exists to give her back.',
          },
          {
            value: 'name',
            label: '{{ $json.subject_name }}',
            correct: false,
            why: 'The right person, and not an address. Gmail is handed something like "Riya Kapoor" to deliver to and refuses it — and on a request that named nobody, it is handed nothing at all.',
          },
        ],
      },
      {
        key: 'message',
        label: 'What the message says',
        subtitle: 'The body of the mail that lands in somebody’s inbox.',
        options: [
          {
            value: 'detail',
            label: 'The one-line summary the reading step wrote',
            correct: true,
            why: 'Right. It is already a plain sentence saying what the message should say, written for a reader rather than for the desk — which is exactly what it was asked for.',
          },
          {
            value: 'raw',
            label: 'The request, exactly as it was typed',
            correct: false,
            why: 'That forwards an internal instruction to an outsider. Riya would open a mail reading "Email Riya Kapoor at riya@… and let her know the Pro plan quote is ready" — she is being shown somebody else telling somebody else to write to her.',
          },
          {
            value: 'json',
            label: 'Everything the reading step returned',
            correct: false,
            why: 'A real person gets a line of braces, quotes and field names. That is a debug output, and it also leaks the internal type this request was given.',
          },
        ],
      },
    ],
  },

  // The needs-a-person path. Notice how little it does — that restraint is the lesson,
  // not an omission.
  slack: {
    // Same as Gmail: an empty catalog sample told the learner nothing about the one
    // path whose whole lesson is how little it does.
    sampleOutput: {
      ok: true,
      channel: '#ops-desk',
      text: 'Arjun Mehta: Log a new distributor lead — Riya Kapoor at Kapoor Automation, she’s interested in the Pro plan. riya@kapoorautomation.in',
    },
    credential: 'Slack — Fernwood',
    locked: [
      { label: 'Resource', value: 'Message' },
      { label: 'Operation', value: 'Send' },
      { label: 'Send Message To', value: 'Channel' },
      { label: 'Message Type', value: 'Simple Text Message' },
    ],
    fields: [
      {
        // A plain select rather than n8n's `resourceLocator`, deliberately.
        //
        // In real n8n a Slack channel IS a resourceLocator, and the kind is implemented
        // on both sides — but `checkAnswer` looks its explanation up with
        // `options.find(o => o.value === answer)` while the answer arrives wrapped as
        // `{ __rl, mode, value }`, so no option ever matches and the field returns NO
        // `why` at all. `whyCorrect`/`whyWrong` are not reached either, because the
        // presence of `options` wins. A graded field where Iris has nothing to say is
        // worse than one control's worth of lost fidelity, so this is a select until
        // that lookup unwraps the locator.
        key: 'channelId',
        label: 'Channel',
        subtitle: 'Where this lands, and therefore whether anybody acts on it.',
        options: [
          {
            value: 'general',
            label: '#general',
            correct: false,
            why: 'Everybody at Fernwood is in here, and that is the problem: a request meant for one person, put somewhere fifty people can all assume somebody else has picked it up.',
          },
          {
            value: 'ops-alerts',
            label: '#ops-alerts',
            correct: false,
            why: 'A channel full of automated noise that people mute in their first week. Posting where nobody is looking is very close to not posting at all.',
          },
          {
            value: 'ops-desk',
            label: '#ops-desk',
            correct: true,
            why: 'Right, and it is where Priya already spends her day. A request that needs a person only works if it arrives somewhere that person is already reading.',
          },
          {
            value: 'engineering',
            label: '#engineering',
            correct: false,
            why: 'The one team at Fernwood that explicitly does not handle this. The whole reason the desk exists is that everything which is not engineering or sales lands on Priya.',
          },
        ],
      },
      {
        key: 'text',
        label: 'What the message says',
        subtitle: 'Priya is going to read this and decide what to do about it herself.',
        options: [
          {
            value: 'name-and-raw',
            label: 'The requester’s name, and their request word for word',
            correct: true,
            why: 'Right. She needs to know who asked and exactly what they said, because she is the one making the judgement now. This is the one place the raw text belongs: it is going to the person who can act on it, not out to a stranger.',
          },
          {
            value: 'detail',
            label: 'The one-line summary the reading step wrote',
            correct: false,
            why: 'A tidier message, and it is the machine’s reading of a request the machine has just said it could not place. Handing Priya a paraphrase of something nobody understood asks her to trust the part that already went wrong.',
          },
          {
            value: 'type',
            label: 'Just the type it was given',
            correct: false,
            why: 'A channel full of messages saying needs_human tells her a request exists and nothing about it. She would have to go and open the form’s responses to find out what any of them said.',
          },
        ],
      },
    ],
  },
};
