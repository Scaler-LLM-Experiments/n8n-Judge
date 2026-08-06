// The Understand quiz: one node-pick per decision the flow requires.
//
// This is 30% of the score, and it runs BEFORE the build, so it is where a learner
// reasons about the shape of the flow rather than clicking through it.
//
// A correct pick UNLOCKS node types for the builder (`unlocks`), so this list decides
// what the learner has to work with later. Every type named here must exist in
// @judge/catalog.
//
// Rules `validateProblem()` enforces:
//   - a wrong option needs a misconception code, or it can never reach the report;
//   - no escape-hatch option text ("added it by mistake") — every option is a real
//     position someone would hold;
//   - never park the correct answer at index 0 out of habit. An audit once found it
//     there in 13/13 items. `apps/web/scripts/verify-option-balance.mjs` checks this.
export const dissection = [
  {
    id: 'intake',
    prompt:
      'Start at the top. Somebody at Fernwood has just filled in the Ops Desk request and pressed submit. What should notice?',
    options: [
      { label: 'On a Schedule', type: 'schedule' },
      { label: 'On Webhook Call', type: 'webhook' },
      { label: 'On form submission', type: 'form-trigger' },
      { label: 'Chat Trigger', type: 'chat-trigger' },
    ],
    correctType: 'form-trigger',
    wrongHint:
      'The form is one Priya built inside the automation tool itself, and it is the only way a request reaches this flow. Does this option have any idea that form exists?',
    explanation:
      'The form trigger publishes the Ops Desk request and fires the instant somebody submits it, so the three answers arrive as named values with nothing to fetch or dig out first.',
    unlocks: ['form-trigger'],
  },
  {
    id: 'read',
    prompt:
      'The request is one free-text box. Four separate things have to come out of it: which of the three kinds it is, who or what it is about, any address written inside it, and a one-line summary. What does that?',
    options: [
      { label: 'Text Classifier', type: 'text-classifier' },
      { label: 'Code', type: 'code' },
      { label: 'Information Extractor', type: 'information-extractor' },
      { label: 'AI Agent', type: 'ai-agent' },
    ],
    correctType: 'information-extractor',
    wrongHint:
      'Sorting the request into one of three kinds is only half the job. Read the Ops Log’s six headings again: what would you put under Subject Name and Detail if all you got back was which kind it is?',
    explanation:
      'The Information Extractor reads the sentence once and hands back several named values at a time, so the same call that decides the route also produces the details the spreadsheet and the email need. It borrows a language model, which you will plug in underneath it.',
    unlocks: ['information-extractor', 'openai-chat-model'],
  },
  {
    id: 'route',
    prompt:
      'Every request now carries the kind it is. One request comes in, and it has to leave down exactly one of three paths. What does that?',
    options: [
      { label: 'If', type: 'if' },
      { label: 'Switch', type: 'switch' },
      { label: 'Filter', type: 'filter' },
      { label: 'Code', type: 'code' },
    ],
    correctType: 'switch',
    wrongHint:
      'Count the ways out this option gives you. Three kinds of request need three separate paths, and none of the three may be dropped on the floor.',
    explanation:
      'A Switch takes one item and sends it to whichever labelled output matches: one for the ones to be recorded, one for the ones to be sent on, one for the ones a person has to look at.',
    unlocks: ['switch'],
  },
  {
    id: 'record',
    prompt:
      'First path. The request wants something written into Priya’s Ops Log, which has six headings already in place and rows going back two years. What writes it?',
    options: [
      { label: 'Notion', type: 'notion' },
      { label: 'Google Docs', type: 'google-docs' },
      { label: 'Code', type: 'code' },
      { label: 'Google Sheets', type: 'google-sheets' },
    ],
    correctType: 'google-sheets',
    wrongHint:
      'The Ops Log already exists and Priya already works in it every day. Which of these adds a line under headings that are already there, instead of inventing a second place to keep things?',
    explanation:
      'The Ops Log is a spreadsheet, so the node that speaks to that spreadsheet is what adds to it: one new line per request, each value landing under the heading it belongs to.',
    unlocks: ['google-sheets'],
  },
  {
    id: 'send',
    prompt:
      'Second path. The request asks for a message to go to a named person, at an address written inside the request itself. What sends it?',
    options: [
      { label: 'Respond to Webhook', type: 'respond-to-webhook' },
      { label: 'Gmail', type: 'gmail' },
      { label: 'Slack', type: 'slack' },
      { label: 'Notion', type: 'notion' },
    ],
    correctType: 'gmail',
    wrongHint:
      'The person this message is for may not work at Fernwood at all — an address is the only thing you have for them. Would this option reach somebody like that?',
    explanation:
      'Fernwood runs on Gmail, so the Gmail node is what puts a message in somebody’s inbox. Watch whose inbox, though: the form asked the requester for their own address, and the one this message is going to is a different address entirely.',
    unlocks: ['gmail'],
  },
  {
    id: 'escalate',
    prompt:
      'Third path. The request is a question about the desk, or something the desk simply cannot do. It has to land in front of Priya, in the channel she already watches all day. What gets it there?',
    options: [
      { label: 'Slack', type: 'slack' },
      { label: 'Google Sheets', type: 'google-sheets' },
      { label: 'Gmail', type: 'gmail' },
      { label: 'Nothing — it stops here and Priya will spot it', type: 'noop' },
    ],
    correctType: 'slack',
    wrongHint:
      'Priya already spends her whole day in one channel. Which of these puts something in front of her there, rather than filing it somewhere she would have to think to go and look?',
    explanation:
      'A Slack message drops the requester’s name and their own words into a channel Priya is already reading. Notice what this path does NOT do: no row, no outgoing email. Doing less than it could is the point of it.',
    unlocks: ['slack'],
  },
];
