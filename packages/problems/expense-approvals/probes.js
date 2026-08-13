// What Iris asks when the learner reaches for the WRONG node, and what the report calls
// each misconception.
//
// Keyed by the WRONG node's type. There is an entry for every distractor any phase makes
// pickable, because a type with no entry falls back to the generated sequence probe —
// four framings of "a node only gets what the one before it hands over" — which is a fair
// question about ordering and says nothing about a node that does the wrong job.
//
// Three copy rules, all enforced:
//   1. never name the correct node — the probe diagnoses, it does not resolve;
//   2. every option is a position someone actually holds, with no escape hatch;
//   3. the correct answer is an accurate account of what the WRONG node really does.
//
// Understanding what the wrong node does is what tells a learner it does not fit here,
// without being told which one does. The learner's pick renders NEUTRAL: the placement is
// already known to be wrong and the node comes off the canvas either way.
export const nodeProbes = {
  'chat-trigger': {
    prompt: 'Chat Trigger is on the canvas. If you keep it, what actually starts this flow?',
    options: [
      {
        text: 'A claim arriving in the finance inbox',
        correct: false,
        misconception: 'chat-trigger-is-email',
        response:
          'It won’t. A Chat Trigger is attached to a chat session and never sees a mailbox at all. Go back to the event this flow really begins with.',
      },
      {
        text: 'Somebody typing a message into a chat window',
        correct: true,
        response:
          'Right, that is all it listens for. Now think about how a claim actually reaches finance in this problem, and pick the thing that hears it.',
      },
      {
        text: 'Any incoming message. The trigger works out where it came from',
        correct: false,
        misconception: 'triggers-interchangeable',
        response:
          'Triggers don’t adapt. Each one subscribes to exactly one event on one service. Which event does this flow start from?',
      },
    ],
  },

  schedule: {
    prompt: 'On a Schedule is on the canvas. When would this flow run?',
    options: [
      {
        text: 'On a fixed clock. Every few minutes, or at a set hour',
        correct: true,
        response:
          'Correct, and a finance team sweeping the inbox each morning is a real way to work. But this flow answers people. How long should someone wait for a reply because their claim landed just after a tick?',
      },
      {
        text: 'The moment a claim arrives',
        correct: false,
        misconception: 'poll-vs-event',
        response:
          'No. A schedule fires on the clock and never on the event, so anything arriving between ticks waits for the next one. How fast does a claimant expect to hear back?',
      },
      {
        text: 'Once, when the workflow is switched on',
        correct: false,
        misconception: 'schedule-runs-once',
        response:
          'A Schedule Trigger repeats on its interval; it is not a one-shot. But repeating on a clock still is not the same as reacting the instant something lands.',
      },
    ],
  },

  webhook: {
    prompt: 'On Webhook Call is on the canvas. What has to happen before it fires?',
    options: [
      {
        text: 'Gmail calls it automatically whenever mail arrives',
        correct: false,
        misconception: 'email-is-http',
        response:
          'Gmail has no idea your webhook exists. A webhook only fires when something has been configured to send a request to it.',
      },
      {
        text: 'It watches the inbox, the same as any other trigger',
        correct: false,
        misconception: 'triggers-interchangeable',
        response: 'A webhook watches a URL, not a mailbox. What is actually subscribed to the inbox here?',
      },
      {
        text: 'Another system has to send an HTTP request to its URL',
        correct: true,
        response:
          'Exactly. So ask who would call that URL when somebody emails their taxi receipt in. Nothing does, unless you go and build it.',
      },
    ],
  },

  code: {
    prompt: 'Code is on the canvas to work out each claim’s outcome. What would you have to write inside it?',
    options: [
      {
        text: 'A description of the policy, and it works out the rest',
        correct: false,
        misconception: 'rules-vs-ai',
        response:
          'Code doesn’t take a description. It runs exactly the logic you write, line by line. Something else in the palette does take one.',
      },
      {
        text: 'Rules that look for an amount and for particular words in the text',
        correct: true,
        response:
          'Right, and for the 5,000 limit that works. Now read this claim: "please reimburse my travel from last week". Which rule catches one that never mentions a figure at all?',
      },
      {
        text: 'Nothing. Code reads the claim and applies the policy itself',
        correct: false,
        misconception: 'code-is-smart',
        response:
          'Code only does what it is told. It has no idea what a claim means; it can only match what you have explicitly described.',
      },
    ],
  },

  if: {
    prompt: 'If is on the canvas. How many separate paths can a single If node send a claim down?',
    options: [
      {
        text: 'Two. A true path and a false path',
        correct: true,
        response: 'Right. Now count the outcomes this problem has to answer differently. Does two cover it?',
      },
      {
        text: 'As many as you add conditions for',
        correct: false,
        misconception: 'if-vs-switch',
        response:
          'No. If always has exactly two outputs. Extra conditions combine into one true or false decision; they do not add paths.',
      },
      {
        text: 'One. It lets the matching claims through',
        correct: false,
        misconception: 'if-is-filter',
        response:
          'That describes a different node, one that drops what does not match. If drops nothing; it sends work down one of two paths.',
      },
    ],
  },

  filter: {
    prompt: 'Filter is on the canvas. What happens to a claim that does not match its condition?',
    options: [
      {
        text: 'It carries on down a second path',
        correct: false,
        misconception: 'filter-is-if',
        response:
          'Filter has one output, not two. There is no second path for a non-match to take, which is the whole difference between the two nodes.',
      },
      {
        text: 'It is held back, and picked up on the next run',
        correct: false,
        misconception: 'filter-holds-items',
        response: 'Nothing is held. A filter makes its decision on the spot and does not remember the item afterwards.',
      },
      {
        text: 'It is dropped, and nothing after this node ever sees it',
        correct: true,
        response:
          'Exactly. So an incomplete claim would simply vanish, and the person who sent it would never hear a word back. Every claim here needs an answer, including the ones that are wrong.',
      },
    ],
  },

  'http-request': {
    prompt: 'HTTP Request is on the canvas. What would it bring into this flow?',
    options: [
      {
        text: 'It reads the claim and works out which outcome it deserves',
        correct: false,
        misconception: 'http-is-judgement',
        response:
          'An HTTP request fetches whatever a URL returns. It forms no opinion about the claim in front of it, and this step has to form one.',
      },
      {
        text: 'A call out to another system, and whatever that system sends back',
        correct: true,
        response:
          'Right. So what does this flow need from somewhere else? Read the policy again: the limit is flat, and everything the decision rests on is already in the claim.',
      },
      {
        text: 'A check on how much budget the claimant has left this quarter',
        correct: false,
        misconception: 'http-needs-an-api',
        response:
          'A real finance system might well work that way, and then this node would be exactly right. It is not the rule you were given, though: nothing here depends on anything outside the claim.',
      },
    ],
  },

  'slack-message': {
    prompt: 'Slack, Send Message is at the end of a path. Who sees this?',
    options: [
      {
        text: 'Whoever happens to be in the channel it posts to',
        correct: true,
        response:
          'Correct. Now, the claim came in as an email from one person, and that person is waiting on an answer to it. Where does your answer need to land?',
      },
      {
        text: 'The claimant, wherever they are',
        correct: false,
        misconception: 'slack-reaches-claimant',
        response:
          'Only if they are in that channel and happen to look. A message in a shared channel is not addressed to anybody in particular.',
      },
      {
        text: 'The manager, so they can approve it from there',
        correct: false,
        misconception: 'slack-is-approval',
        response:
          'Nothing in this flow waits for anyone to click anything. Every path ends by telling the claimant where their claim stands, and one of those messages happens to mention a manager.',
      },
    ],
  },

  'google-docs': {
    prompt: 'Google Docs, Create Document is at the end of a path. What does the claimant get?',
    options: [
      {
        text: 'A copy of the document, sent on to them',
        correct: false,
        misconception: 'docs-emails-itself',
        response:
          'Creating a document does not send anything. It writes a file in a Drive folder and stops there.',
      },
      {
        text: 'A record they can go and check for the decision',
        correct: false,
        misconception: 'log-instead-of-reply',
        response:
          'Keeping a record is genuinely useful, and plenty of finance flows do both. But nobody reads a log they were never told about. What does this path owe the person waiting?',
      },
      {
        text: 'Nothing. A document is written and filed away',
        correct: true,
        response:
          'Right, and filing is not answering. Somebody emailed a claim in and is sitting there wondering whether they are getting their money.',
      },
    ],
  },
};

/**
 * Report-facing label per misconception code. Every code above needs one or the Result
 * screen prints a raw slug — `validateProblem()` rejects a missing one.
 *
 * `flow-sequence` is not used above: it is what BuildStage's generated sequence probe
 * records when a node the problem never probes is dropped in the wrong order. It has no
 * entry to validate against, so nothing catches its absence except a report with a slug
 * on it.
 */
export const misconceptionLabels = {
  'chat-trigger-is-email': 'Treated a chat trigger as an email trigger',
  'triggers-interchangeable': 'Assumed any trigger can start the flow',
  'poll-vs-event': 'Chose a scheduled sweep instead of reacting to the claim arriving',
  'schedule-runs-once': 'Thought a Schedule Trigger fires once rather than on an interval',
  'email-is-http': 'Confused a webhook with receiving email',
  'rules-vs-ai': 'Expected written rules to read a claim the way a person would',
  'code-is-smart': 'Expected Code to interpret meaning rather than run written rules',
  'if-vs-switch': 'Reached for If where a multi-way split was needed',
  'if-is-filter': 'Confused If (two paths) with Filter (drops non-matches)',
  'filter-is-if': 'Thought a filtered-out item continues down a second path',
  'filter-holds-items': 'Expected Filter to hold items back rather than drop them',
  'http-is-judgement': 'Expected an API call to make the judgement',
  'http-needs-an-api': 'Added a lookup the decision does not depend on',
  'slack-reaches-claimant': 'Assumed a channel message reaches the individual claimant',
  'slack-is-approval': 'Invented an approval step the flow does not have',
  'docs-emails-itself': 'Expected creating a document to deliver it',
  'log-instead-of-reply': 'Logged the outcome instead of answering the claimant',
  'flow-sequence': 'Placed a step out of the correct flow order',
};
