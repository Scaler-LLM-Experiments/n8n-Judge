// What Iris asks when the learner reaches for the wrong node, and what the report calls
// each misconception.
//
// Keyed by the WRONG node's type. Three copy rules, all enforced: never name the correct
// node, every option is a position someone would actually hold, and the correct answer
// describes what the wrong node really does. A wrong option with no misconception code
// is rejected — it could never reach the report.

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
export const nodeProbes = {
  'chat-trigger': {
    prompt: 'Chat Trigger is on the canvas. If you keep it, what actually starts this workflow?',
    options: [
      { text: 'Someone typing a message into a chat widget', correct: true, response: 'Right. That’s all it listens for. Now think about how a support request actually reaches you in this problem, and pick the trigger that hears it.' },
      { text: 'A new email arriving in the support inbox', correct: false, misconception: 'chat-trigger-is-email', response: 'It won’t. Chat Trigger is attached to a chat session and never sees a mailbox. Go back to what event this workflow really begins with.' },
      { text: 'Any inbound message. The trigger adapts to whatever arrives', correct: false, misconception: 'triggers-interchangeable', response: 'Triggers don’t adapt. Each one subscribes to exactly one event on one service. Which event does this problem start from?' },
    ],
  },
  schedule: {
    prompt: 'Schedule Trigger is on the canvas. When would this workflow run?',
    options: [
      { text: 'On a fixed clock. Every few minutes, or at a set time', correct: true, response: 'Correct. Now compare that to when a support email actually arrives. A clock has no idea one landed. How long would it sit unanswered?' },
      { text: 'The moment an email arrives', correct: false, misconception: 'poll-vs-event', response: 'No. A schedule fires on the clock, never on the event. Anything arriving between ticks waits for the next one. How fast does this problem need to react?' },
      { text: 'Once, when the workflow is published', correct: false, misconception: 'schedule-runs-once', response: 'A Schedule Trigger repeats on its interval; it isn’t a one-shot. But repeating on a clock still isn’t the same as reacting the instant something happens.' },
    ],
  },
  webhook: {
    prompt: 'Webhook is on the canvas. What has to happen before it fires?',
    options: [
      { text: 'Another system has to send an HTTP request to its URL', correct: true, response: 'Exactly. So ask yourself who would call that URL when a customer emails support. Nothing does, unless you build it.' },
      { text: 'Gmail calls it automatically whenever mail lands', correct: false, misconception: 'email-is-http', response: 'Gmail has no idea your webhook exists. A webhook only fires when something has been configured to POST to it.' },
      { text: 'It watches the inbox, the same as any other trigger', correct: false, misconception: 'triggers-interchangeable', response: 'A webhook watches a URL, not a mailbox. Which trigger is actually subscribed to the inbox?' },
    ],
  },
  if: {
    prompt: 'If is on the canvas. How many separate paths can a single If node send work down?',
    options: [
      { text: 'Two. A true path and a false path', correct: true, response: 'Right. Now count how many categories this problem has to route to different replies. Does two cover it?' },
      { text: 'As many as you add conditions for', correct: false, misconception: 'if-vs-switch', response: 'No. If always has exactly two outputs. Extra conditions combine into one true/false decision; they don’t add paths.' },
      { text: 'One. It filters, passing matching items through', correct: false, misconception: 'if-is-filter', response: 'That describes Filter, which drops what doesn’t match. If doesn’t drop anything. It sends work down one of two paths.' },
    ],
  },
  code: {
    prompt: 'Code is on the canvas to work out each email’s category. What would you have to write inside it?',
    options: [
      { text: 'Rules that look for specific words or patterns in the text', correct: true, response: 'Right. Now picture five customers describing the same billing problem in five different ways. How many of them would your rules catch?' },
      { text: 'A prompt describing the categories, and it works out the rest', correct: false, misconception: 'rules-vs-ai', response: 'Code doesn’t take a prompt. It runs exactly the logic you write, character by character. Something else in the palette does take one.' },
      { text: 'Nothing. Code works out the intent on its own', correct: false, misconception: 'code-is-smart', response: 'Code only does what it’s told. It has no understanding of what an email means; it can only match what you explicitly describe.' },
    ],
  },
  'web-search': {
    prompt: 'Web Search is on the canvas. What would it bring into this flow?',
    options: [
      { text: 'Information from the internet that isn’t in the email', correct: true, response: 'Right. And everything needed to categorise this email is already sitting in the email. What information are you actually missing?' },
      { text: 'An interpretation of what the customer’s message means', correct: false, misconception: 'search-vs-classify', response: 'Searching returns pages from the web; it doesn’t form a judgement about the message in front of you. That decision has to come from the email’s own text.' },
      { text: 'A check on whether the sender is a real customer', correct: false, misconception: 'search-as-lookup', response: 'That would be a lookup against your own records, not a web search. And it still isn’t the decision this step has to make.' },
    ],
  },
};

// Readable labels for misconception codes recorded during the run.
// What Iris says on THIS problem. Overrides the default phrase book, keyed by
// moment and optionally by node type.
//
// The reason to author these rather than take the defaults: a generic line has
// to say "now open it and set it up", because it does not know what the node is
// for. Here it can say what this particular node is deciding, which is the
// difference between narration and teaching. None of these give an answer away;
// they say what the node is FOR, never which option to pick.

export const misconceptionLabels = {
  'chat-trigger-is-email': 'Treated a chat trigger as an email trigger',
  'triggers-interchangeable': 'Assumed any trigger can start the flow',
  'poll-vs-event': 'Chose a scheduled poll instead of an event trigger',
  'schedule-runs-once': 'Thought a Schedule Trigger fires once rather than on an interval',
  'email-is-http': 'Confused a webhook with receiving email',
  'if-vs-switch': 'Reached for If where a multi-way Switch was needed',
  'if-is-filter': 'Confused If (two paths) with Filter (drops non-matches)',
  'rules-vs-ai': 'Tried rules/code to classify free-text email',
  'code-is-smart': 'Expected Code to interpret meaning rather than run written rules',
  'search-vs-classify': 'Confused searching the web with classifying the email',
  'search-as-lookup': 'Confused a web search with looking up internal records',
  'flow-sequence': 'Placed a step out of the correct flow order',
};

// Sample emails the Run simulation streams through the flow, one after another.
// `branch` is the Switch handle each should take (null = matches no branch).
