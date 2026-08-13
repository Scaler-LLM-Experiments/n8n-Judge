// The Understand quiz: one node-pick per decision the flow requires.
//
// 30% of the score, and it runs BEFORE the build, so this is where a learner reasons
// about the shape of the flow rather than clicking through it. A correct pick UNLOCKS
// its node types for the builder, so this list decides what they have to work with.
//
// The teaching here is `wrongHint` (a question, never an answer) and `explanation` (the
// reward for getting it right). If the learner later PLACES one of these wrong nodes,
// the probe in probes.js is what records the misconception.
//
// The correct answer sits at a different index in every question, on purpose. Parking it
// at the top is a pattern a learner can pass without reading, and so is never putting it
// there — the aim is the uniform expectation, not the absence of index 0.
export const dissection = [
  {
    id: 'start',
    prompt:
      'Start at the top. Nothing lands in an inbox, nobody submits anything, and no other system calls in. What should notice that it is time to run?',
    options: [
      { label: 'Google Sheets Trigger', type: 'google-sheets-trigger' },
      { label: 'Schedule Trigger', type: 'schedule' },
      { label: 'Webhook', type: 'webhook' },
      { label: 'Gmail Trigger', type: 'gmail-trigger' },
    ],
    correctType: 'schedule',
    wrongHint:
      'Ritika does this at the same time every weekday whether or not anybody has touched anything. What event is that, exactly?',
    // Deliberately does NOT add "…whether the sheet changed overnight or not". That
    // clause is the `late-correction` Stress Testing answer stated outright, three
    // screens before the question is asked. What a clock trigger ignores is the thing
    // the learner should have to work out.
    explanation:
      'A Schedule Trigger treats time itself as the event: the clock reaching 07:30 is the thing that happens. That is what "before the first roast, every weekday" actually is. A time, not an arrival.',
    unlocks: ['schedule'],
  },
  {
    id: 'source',
    prompt:
      'The counts live in a spreadsheet this flow does not own. Forty rows of them. What brings those rows into the flow so the next step can work on them?',
    options: [
      { label: 'HTTP Request', type: 'http-request' },
      { label: 'Code', type: 'code' },
      { label: 'Google Sheets', type: 'google-sheets' },
      { label: 'Merge', type: 'merge' },
    ],
    correctType: 'google-sheets',
    wrongHint:
      'There is a node in n8n for the app the data is actually in, and it already knows how to talk to it. Is this that node?',
    // The reward for a correct PICK, so it may only talk about the node — never about
    // the dropdown inside it. It used to say the node "is not only for writing rows —
    // pointed at a tab and asked for its rows…", which is the Operation field's four
    // options sorted into three wrong ones and the right one, handed over before the
    // build starts. Same leak the flowSummary label and the statement were both scrubbed
    // for; this surface was missed. What is left says what the node IS and what shape
    // its output has, both of which the prompt already presupposes.
    explanation:
      'The Google Sheets node already speaks Google Sheets. The credential, the document, the tab and the column names are all things it understands. So getting at a spreadsheet Brightleaf already keeps takes no code and no hand-built API call. What it hands on arrives as items, one per line of the table, which is the shape every step after it works in.',
    unlocks: ['google-sheets'],
  },
  {
    id: 'narrow',
    prompt:
      'Most of those forty rows are perfectly well stocked and nobody needs to see them. What keeps the ones that are running low and stops the rest going any further, without needing anywhere to send them?',
    options: [
      { label: 'If', type: 'if' },
      { label: 'Code', type: 'code' },
      { label: 'Loop Over Items', type: 'loop-over-items' },
      { label: 'Filter', type: 'filter' },
    ],
    correctType: 'filter',
    wrongHint:
      'Ask what happens to a row that is fine. Does this option need somewhere to send it, or can it simply let it go?',
    explanation:
      'Filter asks its question of every item and passes on only the ones that answer yes. The rest are dropped, not routed. Which is exactly right here, because a well-stocked bean needs no path of its own.',
    unlocks: ['filter'],
  },
  {
    id: 'gather',
    // The prompt used to state the per-item rule ("n8n runs every node after this once
    // per item"), which is what `fan-out` asks about in Stress Testing. It now states
    // the REQUIREMENT — three things arrive, the buyer wants one — and leaves the
    // mechanism to be learned where it costs something: the `loop-over-items` probe.
    prompt:
      'Forty rows went in and three came out. They are still three separate items, travelling one behind the other, and the buyer wants one message rather than three. What turns those three into one thing?',
    options: [
      { label: 'Aggregate', type: 'aggregate' },
      { label: 'Merge', type: 'merge' },
      { label: 'Split Out', type: 'split-out' },
      { label: 'Remove Duplicates', type: 'remove-duplicates' },
    ],
    correctType: 'aggregate',
    wrongHint:
      'You have many items on one stream and you want one. Read each option and ask what it takes IN and what it hands OUT. One of them is the wrong direction, one needs two streams, and one just throws things away.',
    explanation:
      'Aggregate collects everything that reaches it and hands it on as one item with the whole set inside. Each row still intact. Whatever comes next then has a single thing to work with instead of several.',
    unlocks: ['aggregate'],
  },
  {
    id: 'post',
    prompt:
      'Last decision. The shortlist has to be in front of the buyer before the suppliers stop taking orders at 10 a.m. Where does it go?',
    options: [
      { label: 'Google Docs', type: 'google-docs' },
      { label: 'Slack', type: 'slack' },
      { label: 'Notion', type: 'notion' },
      { label: 'Nothing. Ritika will check the run', type: 'noop' },
    ],
    correctType: 'slack',
    wrongHint:
      'The buyer is not going to go looking. Which of these arrives somewhere they are already reading at half past seven?',
    explanation:
      'Slack posts the shortlist into the room the supply chain already lives in, so it is waiting when the buyer opens their laptop. Writing it into a document or a database would mean somebody has to remember to go and read it.',
    unlocks: ['slack'],
  },
];
