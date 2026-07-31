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
// The correct answer is deliberately not at index 0 every time. An audit of the retired
// problems found it there in 13 items out of 13, which a learner who always clicks the
// top option would have passed. `balanceProblemOptions` re-spreads these server-side,
// but authoring them clustered is a sign the distractors were never thought about.
export const dissection = [
  {
    id: 'trigger',
    prompt: 'Start at the top. A claim has just landed in the finance inbox. What should notice?',
    options: [
      { label: 'On a Schedule', type: 'schedule' },
      { label: 'On Webhook Call', type: 'webhook' },
      { label: 'New Email', type: 'trigger' },
      { label: 'Chat Trigger', type: 'chat-trigger' },
    ],
    correctType: 'trigger',
    wrongHint: 'A claim arrives without anyone announcing it. Does this one actually hear a mailbox?',
    explanation:
      'A New Email trigger fires the moment a claim lands, so the flow reacts to the claim itself instead of to a clock, or to another system deciding to call in.',
    unlocks: ['trigger'],
  },
  {
    id: 'classify',
    prompt: 'A claim is somebody typing out what they spent, in their own words. What decides the outcome?',
    options: [
      { label: 'Code', type: 'code' },
      { label: 'Classify with AI', type: 'classify' },
      { label: 'If', type: 'if' },
      { label: 'HTTP Request', type: 'http-request' },
    ],
    correctType: 'classify',
    wrongHint:
      'One claim reads "cab to the Andheri office, 480 rupees, Tuesday". The next reads "please reimburse my travel". What could read both and tell that one of them is complete?',
    explanation:
      'Classify with AI reads a claim the way a finance person would, applies the policy it was given, and answers with one of the three decisions. It needs a language model plugged in, which you will wire up later.',
    unlocks: ['classify', 'chat-gemini'],
  },
  {
    id: 'parse',
    prompt: 'The AI answers with one blob of text. What has to happen before anything can act on its decision?',
    options: [
      { label: 'Send it straight on to be split up', type: 'switch' },
      { label: 'Reply to the claimant now', type: 'action' },
      { label: 'Drop everything that does not match', type: 'filter' },
      { label: 'Parse Result', type: 'parse' },
    ],
    correctType: 'parse',
    wrongHint: 'The decision is buried inside a string of text. Can the next node reliably read one field out of that?',
    explanation:
      'Parse Result turns the AI’s text into clean named fields, so everything after it reads a decision and an amount instead of picking through a sentence.',
    unlocks: ['parse'],
  },
  {
    id: 'switch',
    prompt: 'Three outcomes, three different replies. What sends one claim down one of several paths, by rule?',
    options: [
      { label: 'Switch', type: 'switch' },
      { label: 'If', type: 'if' },
      { label: 'Filter', type: 'filter' },
      { label: 'Code', type: 'code' },
    ],
    correctType: 'switch',
    wrongHint: 'You need one claim in and three separate ways out. How many ways out does this one actually give you?',
    explanation:
      'Switch takes one item and sends it to whichever labelled output matches: one for approving, one for a manager, one for going back to the claimant.',
    unlocks: ['switch'],
  },
  {
    id: 'action',
    prompt: 'Last decision. At the end of every path, what tells the claimant what happened to their claim?',
    options: [
      { label: 'Google Docs — Create Document', type: 'google-docs' },
      { label: 'Slack — Send Message', type: 'slack-message' },
      { label: 'Send Reply', type: 'action' },
      { label: 'Nothing, finance will pick it up', type: 'noop' },
    ],
    correctType: 'action',
    wrongHint: 'The claimant sent an email and is waiting on an answer. Would this option ever reach them?',
    explanation:
      'Send Reply answers the claim in the thread it arrived in, with the wording for whichever outcome it got. All three paths end in one of these.',
    unlocks: ['action'],
  },
];
