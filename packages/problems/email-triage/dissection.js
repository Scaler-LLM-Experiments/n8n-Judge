// The Understand quiz: one node-pick per decision the flow requires.
//
// A correct pick UNLOCKS that node type for the build, so the list here determines what
// the learner has to work with later. Every wrong option carries a misconception code,
// or it can never reach the report.

// Front-of-flow: Iris interrogates the learner to dissect the problem. Each
// question is a NODE/APP pick — options map to real node types, and the chosen
// node drops onto the canvas (tagged right/wrong). Correct answers unlock the
// node for the builder. Must answer correctly (with retry) to advance.
export const dissection = [
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
    explanation: 'A New Email trigger fires the moment a support email lands. Exactly the signal this workflow needs to react to.',
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
    explanation: 'Classify with AI reads the message the way a person would and labels it. Resilient to however the email is phrased. It’ll need a language model plugged in, which you’ll wire up later.',
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
    explanation: 'Parse Result turns the AI’s text into clean fields. Category and urgency. So every node after it can read them reliably.',
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
    explanation: 'Switch routes a single input to as many labelled outputs as you define. One each for Bug Report, Feature Request and Urgent Complaint.',
    unlocks: ['switch'],
  },
  {
    id: 'action',
    prompt: 'Last decision. At the end of each branch, what actually responds to the customer?',
    options: [
      { label: 'Send Reply', type: 'action' },
      { label: 'Slack. Send Message', type: 'slack-message' },
      { label: 'Google Docs', type: 'google-docs' },
      { label: 'Do nothing', type: 'noop' },
    ],
    correctType: 'action',
    wrongHint: 'The customer reached out over email. Would this option actually get a response back to them?',
    explanation: 'Send Reply emails the customer back with a message tailored to their category. The whole point of the triage.',
    unlocks: ['action'],
  },
];
