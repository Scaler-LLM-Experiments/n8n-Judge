// The Understand quiz: one node-pick per decision the flow requires.
//
// This is 30% of the score, and it runs BEFORE the build, so it is where a learner
// reasons about the shape of the flow rather than clicking through it. A correct pick
// UNLOCKS its node types for the builder, so this list decides what they have to work
// with later.
//
// `wrongHint` is a question that points at the reasoning and never at the answer;
// `explanation` is the reward for getting it right. If the learner later PLACES one of
// these wrong nodes, the probe in probes.js is what records the misconception.
//
// The correct answer is deliberately spread across positions 1, 2 and 3 rather than
// parked at index 0. `balanceProblemOptions` re-spreads these server-side, but a
// clustered authored order is the signal that the distractors were never thought about.
//
// Two option types here — `notion-page` and `noop` — are not in this problem's palette.
// That is fine and deliberate: a dissection option is a quiz answer, never rendered as a
// node, and "log it to a different kind of record" and "do it by hand" are both positions
// real people hold at this point.
export const dissection = [
  {
    id: 'form-trigger',
    prompt: 'Start at the top. Somebody fills in the free-trial form and presses submit. What should notice?',
    options: [
      { label: 'On a Schedule', type: 'schedule' },
      { label: 'On Webhook Call', type: 'webhook' },
      { label: 'On form submission', type: 'form-trigger' },
      { label: 'Nothing — read the day’s responses each evening', type: 'noop' },
    ],
    correctType: 'form-trigger',
    wrongHint:
      'The person expects a welcome mail while they are still on the page. Does this option know the moment they pressed submit, or does it find out later?',
    explanation:
      'On form submission publishes the form itself, so it fires the instant somebody submits and it already knows every field on that form by name. That last part matters more than it looks: because it owns the four questions, the four answers arrive as named values the rest of the flow can map straight onto columns.',
    unlocks: ['form-trigger'],
  },
  {
    id: 'rate',
    prompt:
      'Each row has to carry today’s dollar-to-rupee rate, and nothing on the form asks for it. What brings that number into the flow?',
    options: [
      { label: 'Code', type: 'code' },
      { label: 'HTTP Request', type: 'http-request' },
      { label: 'Web Search', type: 'web-search' },
      { label: 'Nothing — type this week’s rate into the sheet by hand', type: 'noop' },
    ],
    correctType: 'http-request',
    wrongHint:
      'The number lives on somebody else’s server and changes every day. Which of these actually goes and asks for it, and gets back something a spreadsheet cell can hold?',
    explanation:
      'HTTP Request calls a URL and brings the response back into the flow as data. A public rate service answers with a small, predictable object, so the number you want is sitting at a known place inside it — which is what makes it safe to point a column at.',
    unlocks: ['http-request'],
  },
  {
    id: 'log',
    prompt:
      'Every signup needs its own line, with each of the four answers sitting under its own column heading. What does that?',
    options: [
      { label: 'Google Docs — Create Document', type: 'google-docs' },
      { label: 'Notion — Create Page', type: 'notion-page' },
      { label: 'Code', type: 'code' },
      { label: 'Google Sheets — Append Row', type: 'google-sheets' },
    ],
    correctType: 'google-sheets',
    wrongHint:
      'The team wants to sort by plan and count signups per week. Which of these gives you columns you can point a value at, rather than a page of text?',
    explanation:
      'Google Sheets — Append Row adds one row per signup and lets you say, per column, which incoming value goes under that heading. That mapping is the whole job here: it is why a referral answer full of commas stays in one cell instead of spilling into the next one.',
    unlocks: ['google-sheets'],
  },
  {
    id: 'welcome',
    prompt: 'Last decision. The person who just signed up should hear back straight away. What tells them?',
    options: [
      { label: 'Google Docs — Create Document', type: 'google-docs' },
      { label: 'Send Reply', type: 'action' },
      { label: 'Slack — Send Message', type: 'slack-message' },
      { label: 'Nothing — the row on the sheet is the record', type: 'noop' },
    ],
    correctType: 'action',
    wrongHint:
      'All you have is an email address they typed into a form. Which of these arrives somewhere they are actually looking?',
    explanation:
      'Send Reply mails the address the form collected, with a greeting and their plan in it. The row on the sheet is for your team; this is the half the person signing up ever sees, which is why the flow is not finished without it.',
    unlocks: ['action'],
  },
];
