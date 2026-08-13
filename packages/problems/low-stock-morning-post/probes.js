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
  // The single most tempting wrong answer in this case: the data is in a sheet, so the
  // sheet must be what starts it.
  'google-sheets-trigger': {
    prompt: 'A Google Sheets Trigger is on the canvas. When does this flow run?',
    options: [
      {
        text: 'Every time somebody edits a row in the Stock tab',
        correct: true,
        response:
          'Exactly right, and that is the problem. Baristas adjust counts all day, so this would fire a dozen times before lunch. And on a quiet Tuesday when nobody touches the sheet, it would not fire at all. What actually has to happen for Ritika to do this?',
      },
      {
        text: 'Once a day, when the sheet is opened',
        correct: false,
        misconception: 'sheet-trigger-is-daily',
        response:
          'It has no idea whether anybody has opened the sheet, and no notion of "a day". It polls for changed rows and fires on the change itself.',
      },
      {
        text: 'At the time you set inside it, reading the sheet on the way through',
        correct: false,
        misconception: 'trigger-does-two-jobs',
        response:
          'There is no time in it to set. A trigger subscribes to exactly one event, and this one\'s event is "a row changed". The clock is not part of it.',
      },
    ],
  },

  'gmail-trigger': {
    prompt: 'A Gmail Trigger is on the canvas. What has to happen before this flow starts?',
    options: [
      {
        text: 'Nothing in particular. It is the standard way to start a workflow',
        correct: false,
        misconception: 'triggers-interchangeable',
        response:
          'Triggers do not adapt. Each one subscribes to one event on one service, and this one only ever hears a mailbox. Which event does this flow really begin on?',
      },
      {
        text: 'Google notices the spreadsheet changed and mails the workflow about it',
        correct: false,
        misconception: 'sheet-notifies-by-mail',
        response:
          'Nothing sends that mail. A spreadsheet does not write to you when a cell changes, and this trigger is not subscribed to the spreadsheet at all.',
      },
      {
        text: 'An email has to arrive in the mailbox it is watching',
        correct: true,
        response:
          'Right, and nobody emails Brightleaf about their own stock levels. Read the brief again: what is it that comes round every weekday morning?',
      },
    ],
  },

  webhook: {
    prompt: 'A Webhook is on the canvas. What makes it fire?',
    options: [
      {
        text: 'It polls whatever you point it at and fires when the answer changes',
        correct: false,
        misconception: 'webhook-polls',
        response:
          'A webhook never goes and looks at anything. It sits at a URL and waits. Something else has to come to it.',
      },
      {
        text: 'Another system has to send an HTTP request to its URL',
        correct: true,
        response:
          'Correct. So ask who would send that request at 07:30 every weekday. Nothing will, unless you go and build the thing that does. At which point you have built a clock the hard way.',
      },
      {
        text: 'Google Sheets calls it whenever the Stock tab is edited',
        correct: false,
        misconception: 'sheet-calls-webhook',
        response:
          'The spreadsheet has no idea your URL exists. Somebody would have to write an Apps Script and wire it up by hand, and even then it would fire on edits rather than on the morning.',
      },
    ],
  },

  'http-request': {
    prompt: 'HTTP Request is on the canvas to fetch the stock counts. What would you have to do to make that work?',
    options: [
      {
        text: 'Nothing much. Give it the spreadsheet\'s URL and it returns the rows',
        correct: false,
        misconception: 'http-fetches-a-sheet',
        response:
          'A Google Sheets URL returns a web page, not your rows. Getting JSON out of Sheets means the Sheets API, an OAuth token, a range in A1 notation and a response you then have to unpick.',
      },
      {
        text: 'Register a Google Cloud project, mint credentials, and hand-build the API call and the parsing',
        correct: true,
        // Never point at the answer. This phase's pickable list contains exactly one
        // Google-named node, so "what has Google's name on it?" was the answer key
        // phrased as a question. The concept — a dedicated node exists for a named
        // product, and it owns the auth and the parsing so you do not — is the thing
        // worth asking about, and it does not identify anything on the list.
        response:
          'Exactly, and that is real work you would then own forever. The token, the range, the parsing, and every change Google makes to any of them. Generic HTTP is what you reach for when nothing better exists. Does that hold here, for a product this well known?',
      },
      {
        text: 'Point it at the sheet and let n8n work out the authentication from the credential list',
        correct: false,
        misconception: 'http-borrows-credentials',
        response:
          'HTTP Request can use a credential, but it will not compose the request for you. You are still writing the endpoint, the range and the parsing by hand.',
      },
    ],
  },

  code: {
    prompt: 'Code is on the canvas to work out which beans are low. What would be inside it?',
    options: [
      {
        text: 'A loop over the rows, comparing two numbers on each one',
        correct: true,
        response:
          'Right, and in Python that is exactly what you would write. Two things to weigh, though: n8n hands each row to the next node on its own already, and the ops team who will maintain this cannot read JavaScript. Is there a way to say "keep this one" without writing any?',
      },
      {
        text: 'A description of what counts as low, which it works out from there',
        correct: false,
        misconception: 'code-is-smart',
        response:
          'Code takes instructions, not descriptions. It runs precisely the lines you write and forms no view about coffee.',
      },
      {
        text: 'Nothing. Code reads the incoming rows and passes on the interesting ones',
        correct: false,
        misconception: 'code-has-defaults',
        response:
          'An empty Code node passes everything straight through. Whatever it does, you wrote it; there is no built-in idea of "interesting".',
      },
    ],
  },

  if: {
    prompt: 'If is on the canvas. A row arrives that is comfortably stocked. Where does it go?',
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
        response:
          'Correct. If routes, it does not discard. So you now have thirty-seven perfectly healthy rows coming out of a second exit and nowhere sensible to send them, and the build will not let you leave that hanging. What would you rather happen to a bean that is fine?',
      },
    ],
  },

  'loop-over-items': {
    prompt: 'Loop Over Items is on the canvas because there are forty rows to get through. What does n8n do with forty items if you DON\'T add it?',
    options: [
      {
        text: 'Only the first one is processed and the other thirty-nine are dropped',
        correct: false,
        misconception: 'first-item-only',
        response:
          'No. That is what the Execute Once setting does, and it is off by default. Nothing is being dropped.',
      },
      {
        text: 'It runs every node after this once per item, on its own, without being asked',
        correct: true,
        response:
          'Exactly, and that is the thing worth carrying out of this case. Coming from Python you would reach for a loop and you would be right to; in n8n the looping is already happening. This node exists for a narrower job. Handing work over in batches, usually to stay under somebody\'s rate limit.',
      },
      {
        text: 'It passes all forty on as one bundle for the next node to walk through',
        correct: false,
        misconception: 'items-arrive-as-a-list',
        response:
          'They stay forty separate items, not one list. That is the whole reason the next node fires forty times.',
      },
    ],
  },

  'split-out': {
    prompt: 'Split Out is on the canvas. What does it do to what arrives?',
    options: [
      {
        text: 'It divides the incoming items across two outputs so they can be handled separately',
        correct: false,
        misconception: 'split-out-splits-the-flow',
        response:
          'It has one output. The word "split" here is about splitting a list apart inside an item, not about splitting the flow into paths.',
      },
      {
        text: 'It breaks a long message into chunks small enough to post',
        correct: false,
        misconception: 'split-out-chunks-text',
        response:
          'Nothing to do with text length. It reads a field that holds a list and emits one item for each entry in it.',
      },
      {
        text: 'It takes one item holding a list, and turns it into one item per entry',
        correct: true,
        response:
          'Right. One thing in, many things out. Now look at what is arriving here and what has to leave: you have several separate rows and the buyer wants one post. Which direction do you actually need?',
      },
    ],
  },

  merge: {
    prompt: 'Merge is on the canvas to bring the low rows together. What does Merge actually combine?',
    options: [
      {
        text: 'Every item on one stream, folded into a single item',
        correct: false,
        misconception: 'merge-collapses-items',
        response:
          'That is a different node\'s job. Merge does not reduce a stream; it brings separate streams alongside each other.',
      },
      {
        text: 'Two or more separate inputs, so items from different branches travel on together',
        correct: true,
        response:
          'Correct, and notice it wants two inputs. This flow is one straight line. There is no second branch to bring alongside. What you have is many items on one line and you need them to become one.',
      },
      {
        text: 'The columns of a row, joined into one line of text',
        correct: false,
        misconception: 'merge-formats-text',
        response:
          'Merge never touches the inside of an item. Building a readable line out of fields is something the message itself does.',
      },
    ],
  },

  'remove-duplicates': {
    prompt: 'Remove Duplicates is on the canvas so a bean is not reported twice. What does it compare?',
    options: [
      {
        text: 'Items against each other within this run, and optionally against every previous run',
        correct: true,
        response:
          'Right, and the second half is the trap. Within one run no bean appears twice. Each row is its own bean and location. Across runs, a bean that is still low on Wednesday is still news on Wednesday, and suppressing it is how it gets forgotten.',
      },
      {
        text: 'Only what has been seen in earlier runs, never within the current one',
        correct: false,
        misconception: 'dedupe-is-history-only',
        response:
          'It does both. Its default mode compares the items in the current run against each other; remembering across runs is a separate mode you opt into.',
      },
      {
        text: 'Rows against the spreadsheet, to check none has been added twice',
        correct: false,
        misconception: 'dedupe-reads-the-source',
        response:
          'It never goes back to the source. It only sees the items that have already reached it.',
      },
    ],
  },

  'stop-and-error': {
    prompt: 'Stop and Error is on the canvas for the mornings when nothing is running low. What does it do?',
    options: [
      {
        text: 'It ends the run quietly, marking it as finished with nothing to do',
        correct: false,
        misconception: 'stop-error-is-a-clean-exit',
        response:
          'It does not end quietly. It throws, so the execution is recorded as failed and whoever watches failures gets pinged.',
      },
      {
        text: 'It halts the flow only for the items that reached it, and the rest carry on',
        correct: false,
        misconception: 'stop-error-is-per-item',
        response:
          'One item reaching it fails the entire execution. There is no per-item version of stopping.',
      },
      {
        text: 'It marks the whole execution as failed and raises an error',
        correct: true,
        response:
          'Right. Now ask whether that is what a morning with nothing low actually is. Full shelves are the good day. Logging it as a failure would train everyone to ignore the alerts.',
      },
    ],
  },

  'basic-llm-chain': {
    prompt: 'Basic LLM Chain is on the canvas to write the morning post nicely. What does adding it change?',
    options: [
      {
        text: 'A model rewrites the shortlist into prose, and it needs a Chat Model wired to it',
        correct: true,
        response:
          'Correct on both counts, and both are worth weighing. The buyer wants four fields per bean at half past seven, not a paragraph. And a model that rewrites the list can drop a bean or invent a number, which on a stock report is the one thing you cannot have. Knowing when NOT to reach for a model is part of the job.',
      },
      {
        text: 'It reads each row and works out which beans are actually low',
        correct: false,
        misconception: 'ai-does-the-comparison',
        response:
          'It could be asked to, and it would sometimes get it wrong. Comparing two numbers that are already in the row is exact work. You do not want a probability attached to it.',
      },
      {
        text: 'It formats the message and costs nothing, because no model call is made unless it needs one',
        correct: false,
        misconception: 'llm-is-free',
        response:
          'Every item that reaches it is a model call, billed, and slower than the rest of the flow put together. There is no free path through it.',
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
  'sheet-trigger-is-daily': 'Expected a row-change trigger to run once a day',
  'trigger-does-two-jobs': 'Expected one trigger to hold both the schedule and the read',
  'triggers-interchangeable': 'Assumed any trigger can start the flow',
  'sheet-notifies-by-mail': 'Expected a spreadsheet to email the workflow when it changed',
  'webhook-polls': 'Thought a webhook goes and checks something',
  'sheet-calls-webhook': 'Assumed Google Sheets would call a webhook on its own',
  'http-fetches-a-sheet': 'Expected a spreadsheet URL to return usable rows',
  'http-borrows-credentials': 'Expected HTTP Request to compose an app\'s API call for you',
  'code-is-smart': 'Expected Code to interpret a description rather than run written lines',
  'code-has-defaults': 'Expected a Code node to do something without being written',
  'if-is-filter': 'Thought a non-matching item stops at an If node',
  'if-vs-switch': 'Expected extra conditions on an If to create extra paths',
  'first-item-only': 'Thought n8n processes only the first item unless you loop',
  'items-arrive-as-a-list': 'Pictured many items as one list rather than many items',
  'split-out-splits-the-flow': 'Read "split" as splitting the flow into paths',
  'split-out-chunks-text': 'Expected Split Out to break up a long message',
  'merge-collapses-items': 'Expected Merge to fold one stream into a single item',
  'merge-formats-text': 'Expected Merge to build a readable line out of fields',
  'dedupe-is-history-only': 'Thought Remove Duplicates only compares against past runs',
  'dedupe-reads-the-source': 'Expected Remove Duplicates to check back against the spreadsheet',
  'stop-error-is-a-clean-exit': 'Treated raising an error as a tidy way to finish early',
  'stop-error-is-per-item': 'Expected an error to stop one item rather than the run',
  'ai-does-the-comparison': 'Handed an exact numeric comparison to a language model',
  'llm-is-free': 'Assumed a model step costs nothing until it is needed',
  'flow-sequence': 'Placed a step out of the correct flow order',
};
