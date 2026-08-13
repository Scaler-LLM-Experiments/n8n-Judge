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
//
// Two probes deliberately stop short of their own conclusion — `filter` and `if`. Both
// lead straight into a Stress Testing question (what silence looks like, and what an
// extra path costs), and a probe that states the answer hands it to the learner who got
// the placement WRONG while the one who got it right never sees it. They ask instead.
export const nodeProbes = {
  // --- the trigger phase ----------------------------------------------------
  webhook: {
    prompt: 'A Webhook is on the canvas. What makes it fire?',
    options: [
      {
        text: 'It polls the address you give it and fires when the answer changes',
        correct: false,
        misconception: 'webhook-polls',
        response:
          'A webhook never goes and looks at anything. It sits at a URL of its own and waits. Something else has to come to it.',
      },
      {
        text: 'Another system has to send an HTTP request to its URL',
        correct: true,
        response:
          'Correct. So ask who would send that request at 9:00 every morning. Nothing will, unless you go and build the thing that sends it. At which point you have built a clock the hard way.',
      },
      {
        text: 'The forecast service calls it when the conditions in Bangalore change',
        correct: false,
        misconception: 'service-calls-webhook',
        response:
          'A public forecast service has no idea your URL exists, and it is not in the business of pushing weather at strangers. It answers questions; it does not raise them.',
      },
    ],
  },

  'chat-trigger': {
    prompt: 'A Chat Trigger is on the canvas. When does this flow run?',
    options: [
      {
        text: 'Every morning. You set the time inside it',
        correct: false,
        misconception: 'trigger-holds-a-schedule',
        response:
          'There is no time in it to set. A trigger subscribes to exactly one event, and this one\'s event is a person typing something.',
      },
      {
        text: 'Whenever the flow has something to say, it opens the chat itself',
        correct: false,
        misconception: 'trigger-speaks-first',
        response:
          'It is the other way round. A trigger is how something outside gets IN; it never starts a conversation on its own.',
      },
      {
        text: 'When somebody opens the chat and sends it a message',
        correct: true,
        response:
          'Right. Which would mean he has to ask, every morning, and then read an answer. He can already do that with a weather app in about the same number of taps. What was the flow supposed to save him?',
      },
    ],
  },

  'rss-feed-trigger': {
    prompt: 'An RSS Feed Trigger is on the canvas to watch for new weather. How does it behave?',
    options: [
      {
        text: 'You give it any web address and it turns whatever comes back into items',
        correct: false,
        misconception: 'rss-reads-any-url',
        response:
          'It wants a feed specifically. An RSS or Atom document with a list of dated entries in it. A JSON weather endpoint is not one, and it would have nothing to read.',
      },
      {
        text: 'It checks a feed on a schedule and hands on only entries it has not seen before',
        correct: true,
        response:
          'Exactly right, and the second half is what rules it out. It fires on NEW entries, so on a morning the feed has not published anything, your flow does not run at all. And he still has to leave the house. What has to happen every morning without fail?',
      },
      {
        text: 'It fires every time it checks, handing on whatever the feed currently says',
        correct: false,
        misconception: 'poller-fires-every-time',
        response:
          'It keeps track of what it has already seen and stays quiet when there is nothing new. That is the point of it. Otherwise every check would replay the same entries.',
      },
    ],
  },

  // --- the fetch phase ------------------------------------------------------
  code: {
    prompt: 'Code is on the canvas to go and get the forecast. What would be inside it?',
    options: [
      {
        text: 'Lines you write yourself: build the address, make the request, read the answer back',
        correct: true,
        response:
          'Right, and in Python or JavaScript that is exactly what you would write. It is a reasonable instinct from another kind of work, not a silly answer. But n8n has a general-purpose way to call an address, and it is a form field rather than a program. Is there anything here that needs code?',
      },
      {
        text: 'A description of what you want, which it works out how to fetch',
        correct: false,
        misconception: 'code-is-smart',
        response:
          'Code takes instructions, not descriptions. It runs precisely the lines you write and forms no view about the weather.',
      },
      {
        text: 'Nothing. A Code node passes the request through to the next step on its own',
        correct: false,
        misconception: 'code-has-defaults',
        response:
          'An empty Code node passes its input straight through and makes no request at all. Whatever it does, you wrote it.',
      },
    ],
  },

  'rss-read': {
    prompt: 'RSS Read is on the canvas to fetch the forecast. What does it expect to find at the address you give it?',
    options: [
      {
        text: 'Any address at all. It reads whatever comes back and hands it on',
        correct: false,
        misconception: 'rss-reads-any-url',
        response:
          'It is not a general-purpose fetcher. It parses one specific document format, and it fails on anything that is not that.',
      },
      {
        text: 'JSON, which it turns into fields',
        correct: false,
        misconception: 'rss-parses-json',
        response:
          'The other way round: it reads XML and knows nothing about JSON. The names of the two nodes are more similar than the jobs are.',
      },
      {
        text: 'A feed document. RSS or Atom XML, with a list of dated entries in it',
        correct: true,
        response:
          'Correct. Some weather sites do publish a feed, and if this one did, this would be a fair choice. It publishes plain JSON at a plain address instead, so what you need is the general way to call one of those.',
      },
    ],
  },

  'information-extractor': {
    prompt: 'Information Extractor is on the canvas to pull the temperature and the condition out of the response. What actually happens when it runs?',
    options: [
      {
        text: 'It reads the fields you named out of the incoming data, no model involved',
        correct: false,
        misconception: 'extractor-is-a-mapper',
        response:
          'That is a different kind of node entirely. This one cannot run at all until a Chat Model is wired to it. Reading is not what it does, asking is.',
      },
      {
        text: 'It sends the whole response to a language model and asks the model to fill in the fields you named',
        correct: true,
        response:
          'Right, and now weigh it. The service already answered in named fields. The temperature is a number called temperature_2m. This would pay for a model call, wait for it, and let a model retype a number that was already exact. Extraction is for prose, where nothing named the fields for you.',
      },
      {
        text: 'It is a cheaper, faster way to do what a plain mapping step does',
        correct: false,
        misconception: 'extractor-is-free',
        response:
          'Every item that reaches it is a billed model call and it is slower than everything else in this flow put together. There is no free path through it.',
      },
    ],
  },

  // --- the message phase ----------------------------------------------------
  if: {
    prompt: 'If is on the canvas to separate rainy mornings from clear ones. A clear morning arrives. Where does it go?',
    options: [
      {
        text: 'Nowhere. It stops at the node, because it did not match',
        correct: false,
        misconception: 'if-is-filter',
        response:
          'That describes a different node. If always has two outputs and every item leaves by one of them; nothing is dropped.',
      },
      {
        text: 'Down whichever output you added a condition for',
        correct: false,
        misconception: 'if-vs-switch',
        response:
          'If has exactly two outputs however many conditions you add. Extra conditions combine into one true-or-false answer; they do not create extra paths.',
      },
      {
        text: 'Out of the false output, which you then have to wire somewhere',
        correct: true,
        // Stops at the mechanism. Where both paths end up, and what having two of
        // them costs, is the `two-paths` Stress Testing question.
        response:
          'Correct. If routes, it does not discard, so you now have a second exit and something has to be at the end of it. Before you decide what: on a rainy morning and on a clear one, what is actually different about where this message needs to end up?',
      },
    ],
  },

  switch: {
    prompt: 'Switch is on the canvas to sort the weather into categories. What does it do with the item that arrives?',
    options: [
      {
        text: 'It labels the item with the category it matched and passes it on',
        correct: false,
        misconception: 'switch-labels',
        response:
          'It adds nothing to the item. A Switch decides which way the item leaves, and the item itself comes out exactly as it went in.',
      },
      {
        text: 'It sends the item down exactly one of the outputs you defined',
        correct: true,
        response:
          'Right. One item, one exit, and every exit you define needs its own nodes after it. So sorting the weather into four categories means four paths to build and keep working. What is it that actually varies between a rainy morning and a hot one here?',
      },
      {
        text: 'It runs a different part of the flow for each category and then brings them back together',
        correct: false,
        misconception: 'switch-rejoins',
        response:
          'Nothing rejoins on its own. Whatever you build after each exit is where that item stays, and each exit is a separate piece of flow you own.',
      },
    ],
  },

  filter: {
    prompt: 'Filter is on the canvas so the message only goes out when the weather is worth mentioning. An ordinary 24°C morning arrives. What happens?',
    options: [
      {
        text: 'It does not match, so it is dropped and nothing after this node runs',
        correct: true,
        // Deliberately does not draw the conclusion: what silence looks like from the
        // outside is the `service-down` Stress Testing question.
        response:
          'Right. Filter drops what does not match rather than routing it, so the send after it is never executed. Now hold that against what he asked for: one line, every morning. What does he see on the ordinary mornings, and what else would look exactly the same to him?',
      },
      {
        text: 'It carries on, with a flag on it saying it did not match',
        correct: false,
        misconception: 'filter-flags',
        response:
          'Nothing is flagged and nothing carries on. A non-matching item simply stops existing as far as the rest of the flow is concerned.',
      },
      {
        text: 'It is held until something matches, and then they go out together',
        correct: false,
        misconception: 'filter-queues',
        response:
          'There is no waiting room. Each run is its own run: what does not match is gone, and the next run knows nothing about it.',
      },
    ],
  },

  'text-classifier': {
    prompt: 'Text Classifier is on the canvas to work out what kind of day it is. What does it need, and what does it do with the item?',
    options: [
      {
        text: 'It reads the weather code and looks up which category the code belongs to',
        correct: false,
        misconception: 'classifier-is-a-lookup',
        response:
          'It does not look anything up. It hands text to a language model and takes the model\'s word for which of your categories it belongs to.',
      },
      {
        text: 'It adds a category field to the item and passes it on for something else to act on',
        correct: false,
        misconception: 'classifier-labels-only',
        response:
          'It has one output per category you configure, so it decides the item\'s route itself. There is no label to read afterwards.',
      },
      {
        text: 'It needs a Chat Model wired to it, and it asks that model to pick one of the categories you defined',
        correct: true,
        response:
          'Correct on both counts. Now notice what you would be asking it. The service already answered "what kind of day is it", as an integer, before this node ran. Paying a model to re-derive a fact you were handed adds cost and a second of latency. It also adds the chance of a different answer tomorrow.',
      },
    ],
  },

  'basic-llm-chain': {
    prompt: 'Basic LLM Chain is on the canvas to write the morning message nicely. What does adding it change?',
    options: [
      {
        text: 'A model turns the numbers into a sentence, and it needs a Chat Model wired to it',
        correct: true,
        response:
          'Correct on both counts, and both are worth weighing. He wants the same two-part line every morning so he can read it without thinking. A model that rewrites it can phrase it differently on Tuesday, and can quietly change a temperature while it is at it. Knowing when NOT to reach for a model is part of the job.',
      },
      {
        text: 'It formats the message inside n8n, so there is no model and no cost',
        correct: false,
        misconception: 'llm-is-free',
        response:
          'There is no local mode. Every run is a billed call out to whichever model you attach, and it is the slowest thing in the flow.',
      },
      {
        text: 'It can work out the advice as well, so nothing else needs to build the message',
        correct: false,
        misconception: 'llm-replaces-mapping',
        response:
          'It could be asked to, and it would sometimes be wrong. Including about the temperature it was given. Turning a known number and a known code into fixed words is exact work, and you do not want a probability attached to it.',
      },
    ],
  },

  gmail: {
    prompt: 'Gmail is on the canvas to send him the morning line. What does that mean for how he reads it?',
    options: [
      {
        text: 'Gmail can raise a phone notification without an email actually being sent',
        correct: false,
        misconception: 'gmail-notifies',
        response:
          'There is no notification-only mode. This node sends mail; whatever his phone then does about it is his mail app\'s business, not the flow\'s.',
      },
      {
        text: 'It arrives in his inbox, alongside everything else, and he has to open it to read it',
        correct: true,
        response:
          'Right. It would work, and it would land in the one place he is trying not to open at ten past nine. He has thirty seconds and one hand free. Where can one short line be read without opening anything?',
      },
      {
        text: 'Mail is more dependable than a chat app, which makes it the safer choice for something daily',
        correct: false,
        misconception: 'mail-is-more-reliable',
        response:
          'Both are about equally dependable, and dependability is not the constraint here. How quickly he can read it is. Also worth knowing: a daily automated mail to yourself is exactly the kind of thing a mail provider starts filing away.',
      },
    ],
  },

  'send-email': {
    prompt: 'Send Email is on the canvas. What does this node need that the app nodes in the list do not?',
    options: [
      {
        text: 'Nothing extra. It sends through n8n\'s own mail service',
        correct: false,
        misconception: 'send-email-is-hosted',
        response:
          'n8n does not run a mail service for you. This node needs somewhere real to hand the message to.',
      },
      {
        text: 'A Gmail account, the same as the dedicated mail node uses',
        correct: false,
        misconception: 'send-email-uses-gmail',
        response:
          'It has no idea what Gmail is. It speaks the generic mail protocol, so it works with any provider. And knows the specifics of none of them.',
      },
      {
        text: 'An SMTP server of its own: a host, a port and a login you supply',
        correct: true,
        response:
          'Correct. This is the node you use when you own a mail server, which is a whole setup step and something to keep working. Before that: does this message want to be mail at all? Think about where he is looking when it arrives.',
      },
    ],
  },
};

/**
 * Report-facing label per misconception code. Every code above needs one or the Result
 * screen prints a raw slug — `validateProblem()` rejects a missing one.
 *
 * `flow-sequence` is not used above: it is what BuildStage's generated sequence probe
 * records when a node the problem never probes is dropped in the wrong order.
 */
export const misconceptionLabels = {
  'webhook-polls': 'Thought a webhook goes and checks something',
  'service-calls-webhook': 'Expected a public API to push data at the workflow',
  'trigger-holds-a-schedule': 'Expected any trigger to carry a time inside it',
  'trigger-speaks-first': 'Expected a trigger to start a conversation rather than receive one',
  'rss-reads-any-url': 'Expected a feed node to read any web address',
  'poller-fires-every-time': 'Thought a feed trigger fires on every check rather than on new entries',
  'rss-parses-json': 'Mixed up the feed reader with a general HTTP call',
  'code-is-smart': 'Expected Code to interpret a description rather than run written lines',
  'code-has-defaults': 'Expected a Code node to do something without being written',
  'extractor-is-a-mapper': 'Thought the AI extractor reads named fields without a model',
  'extractor-is-free': 'Assumed an extraction step costs nothing',
  'if-is-filter': 'Thought a non-matching item stops at an If node',
  'if-vs-switch': 'Expected extra conditions on an If to create extra paths',
  'switch-labels': 'Expected a router to label the item rather than route it',
  'switch-rejoins': 'Expected separate paths to come back together on their own',
  'filter-flags': 'Expected a dropped item to carry on with a flag',
  'filter-queues': 'Expected a Filter to hold items back until they match',
  'classifier-is-a-lookup': 'Read an AI classifier as a lookup table',
  'classifier-labels-only': 'Missed that an AI classifier routes on its own outputs',
  'llm-is-free': 'Assumed a model step costs nothing',
  'llm-replaces-mapping': 'Handed exact, known values to a language model to reword',
  'gmail-notifies': 'Expected a mail node to raise a phone notification',
  'mail-is-more-reliable': 'Chose the destination on reliability rather than on how it is read',
  'send-email-is-hosted': 'Expected n8n to provide a mail server',
  'send-email-uses-gmail': 'Expected the generic mail node to use a Gmail account',
  'flow-sequence': 'Placed a step out of the correct flow order',
};
