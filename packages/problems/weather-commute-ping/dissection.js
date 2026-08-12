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
      { label: 'Webhook', type: 'webhook' },
      { label: 'Chat Trigger', type: 'chat-trigger' },
      { label: 'Schedule Trigger', type: 'schedule' },
      { label: 'RSS Feed Trigger', type: 'rss-feed-trigger' },
    ],
    correctType: 'schedule',
    wrongHint:
      'He does this at the same time every morning whether or not anything has happened anywhere. What event is that, exactly?',
    // Deliberately does NOT add "…and it will run whether the service is up or not",
    // which is the `service-down` Stress Testing answer three screens early.
    explanation:
      'A Schedule Trigger treats time itself as the event: the clock reaching 9:00 is the thing that happens. That is what "every morning, before he leaves" actually is — a time, not an arrival. Nothing on the internet is going to send you Bangalore\'s temperature unasked.',
    unlocks: ['schedule'],
  },
  {
    id: 'ask',
    prompt:
      'The forecast lives on somebody else\'s service, out on the open internet. It is not in an app n8n has a node for, and there is no key or login involved. What goes and gets this morning\'s conditions?',
    options: [
      { label: 'HTTP Request', type: 'http-request' },
      { label: 'Code', type: 'code' },
      { label: 'RSS Read', type: 'rss-read' },
      { label: 'Information Extractor', type: 'information-extractor' },
    ],
    correctType: 'http-request',
    wrongHint:
      'The service answers a plain web address with plain JSON. Which of these is the general-purpose way to call an address like that, without you writing the call yourself?',
    // Says nothing about the METHOD or the address, both of which are graded fields on
    // this node minutes later. What it explains is why a form field beats a fetch call.
    explanation:
      'HTTP Request is how n8n talks to anything that has no node of its own: you fill in the address in a form field and it hands the answer on as ordinary fields the next step can read. This is one of the highest-leverage nodes in n8n precisely because it is not code — no library, no error handling, nothing to maintain when somebody who cannot read JavaScript inherits the flow.',
    unlocks: ['http-request'],
  },
  {
    id: 'shape',
    prompt:
      'What is in the flow now is a temperature and an integer. What he needs is two short lines of English — the conditions in words, and one line about today\'s commute. What builds those two values?',
    options: [
      { label: 'Text Classifier', type: 'text-classifier' },
      { label: 'Basic LLM Chain', type: 'basic-llm-chain' },
      { label: 'If', type: 'if' },
      { label: 'Edit Fields (Set)', type: 'edit-fields' },
    ],
    correctType: 'edit-fields',
    wrongHint:
      'There is nothing here to interpret and nothing to route: the service already answered exactly, and every morning the message goes to the same place. What is left is deciding what each value should say. Which of these does that?',
    // The reward for a correct PICK, so it may only talk about the node. It does NOT
    // say which values to create, what to put in them, or that a lookup can miss —
    // those are the three graded aspects of this node's own field, and the mapping gap
    // is the whole point of the case.
    explanation:
      'Edit Fields is where you name a value and say what it should hold. Nothing is fetched, nothing is judged, nothing is routed — you are writing the two lines the message is made of, and every step after this can read them by name. Building text is not a decision about where an item goes, which is what separates this node from the two below it in the list.',
    unlocks: ['edit-fields'],
  },
  {
    id: 'send',
    prompt:
      'Last decision. It is a few minutes past nine, the message has just gone out, and he is standing up with one shoe on and his phone in his hand. Where does it need to have landed?',
    options: [
      { label: 'Gmail', type: 'gmail' },
      { label: 'Slack', type: 'slack' },
      { label: 'Send Email', type: 'send-email' },
      { label: 'Google Calendar', type: 'google-calendar' },
    ],
    correctType: 'slack',
    wrongHint:
      'He has thirty seconds and one hand free. Which of these puts one short line in front of somebody who is already looking at their phone, rather than somewhere they have to go and open?',
    explanation:
      'Slack lands the line in a room he already has open on his phone, so reading it costs nothing — which matters, because a flow whose output takes effort to find is a flow he goes back to checking the weather app instead of. Mail would work and would sit in an inbox with everything else; a calendar entry would be a reminder to go and look rather than the answer itself.',
    unlocks: ['slack'],
  },
];
