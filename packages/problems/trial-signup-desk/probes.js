// What Iris asks when the learner reaches for the WRONG node, and what the report calls
// each misconception.
//
// Keyed by the wrong node's type. There is an entry for every distractor any phase makes
// pickable, because a type with no entry falls back to the generated sequence probe —
// four framings of "a node only gets what the one before it hands over" — which is a fair
// question about ORDER and says nothing about a node that does the wrong job. That
// fallback is still the right answer for `action` placed early, which is a genuine
// ordering mistake rather than a wrong-job one, so it has no entry here.
//
// THREE COPY RULES, all enforced:
//   1. never name the correct node — the probe diagnoses, it does not resolve;
//   2. every option is a real position someone would hold, with no escape hatch;
//   3. the correct answer is an accurate account of what the WRONG node really does.
//
// The learner's pick renders NEUTRAL: the placement is already known to be wrong and the
// node comes off the canvas either way.
export const nodeProbes = {
  webhook: {
    prompt: 'On Webhook Call is on the canvas. What has to happen before it fires?',
    options: [
      {
        text: 'A form is really a webhook underneath, so this is the same thing by another name',
        correct: false,
        misconception: 'form-is-webhook',
        response:
          'They are close, and the difference is the whole lesson. A webhook accepts whatever body somebody else decides to send it, so nothing downstream knows what fields to expect. Something that publishes its own form knows all four questions by name, which is what makes them mappable later.',
      },
      {
        text: 'Some other system has to send an HTTP request to its URL',
        correct: true,
        response:
          'Exactly. So who sends that request when a visitor fills in your signup page? Nobody does, until you build and host the form yourself and wire it up by hand. Something in the drawer already owns its form.',
      },
      {
        text: 'It watches the signup page and fires when somebody submits it',
        correct: false,
        misconception: 'webhook-watches-a-page',
        response:
          'A webhook watches a URL for incoming calls. It has no idea a page exists and cannot see anybody typing on one.',
      },
    ],
  },

  schedule: {
    prompt: 'On a Schedule is on the canvas. When would a new signup reach the sheet?',
    options: [
      {
        text: 'On a fixed clock. Every few minutes, or at a set hour',
        correct: true,
        response:
          'Correct, and sweeping up a form’s responses on a timer is a real way to work. But this flow promises the person an instant welcome, so what starts it should be the submission itself.',
      },
      {
        text: 'The moment somebody submits the form',
        correct: false,
        misconception: 'poll-vs-event',
        response:
          'No. A schedule fires on the clock and never on the event. A signup arriving a minute after a tick sits there until the next one.',
      },
      {
        text: 'Every signup, as long as the interval is short enough',
        correct: false,
        misconception: 'schedule-is-close-enough',
        response:
          'Shortening the interval narrows the gap and never closes it, and it also means the flow wakes up all day to find nothing new. Meanwhile the welcome mail this flow promises is supposed to feel instant.',
      },
    ],
  },

  code: {
    prompt: 'Code is on the canvas to build the row that goes on the sheet. What would you have to put inside it?',
    options: [
      {
        text: 'A description of which answer belongs under which column, and it works out the rest',
        correct: false,
        misconception: 'code-takes-instructions',
        response:
          'Code takes JavaScript, not instructions. It runs exactly the lines you write, and nothing else in this flow is doing any interpreting either. There is no AI step here at all.',
      },
      {
        text: 'Not much. Code can write the values to the sheet itself once it has them',
        correct: false,
        misconception: 'code-can-reach-the-sheet',
        response:
          'Code shapes data and hands it on. It holds no Google credential and talks to no service, so nothing it builds ever reaches a spreadsheet on its own.',
      },
      {
        text: 'JavaScript that reads each answer off the item and returns an object keyed by column name',
        correct: true,
        response:
          'Right, and it would work. Now ask what it costs. The one person who can read that script owns this flow forever, and adding a column means editing code. This mapping is meant to be something you point and click.',
      },
    ],
  },

  'web-search': {
    prompt: 'Web Search is on the canvas to get the exchange rate. What comes back from it?',
    options: [
      {
        text: 'Today’s USD to INR rate as a number, ready to drop into the column',
        correct: false,
        misconception: 'search-returns-data',
        response:
          'A search returns results about a query: titles, snippets, links. Getting a number out of that means picking it out of prose, and the prose changes shape whenever the page behind it does.',
      },
      {
        text: 'A list of search results, as text',
        correct: true,
        response:
          'Right. Useful to a person, awkward for a column that has to hold one number. Asking a rate service directly gets you one value back, in a shape that is documented and does not move.',
      },
      {
        text: 'The same thing as calling a rate service, with a friendlier interface on top',
        correct: false,
        misconception: 'search-is-an-api',
        response:
          'Not the same. A rate service answers with a stable structure you can point a column at. A search answers with whatever the web happens to say today, and nothing promises tomorrow looks alike.',
      },
    ],
  },

  'google-docs': {
    prompt: 'Google Docs, Create Document is where the signups are meant to be logged. What does the team end up with?',
    options: [
      {
        text: 'A record of the signups, which is a log either way',
        correct: false,
        misconception: 'doc-is-a-log',
        response:
          'It is a record, and it is not a table. A document has no headings and no cells, so "put this answer under that heading" has no meaning inside one. And that mapping is the entire point of this step.',
      },
      {
        text: 'The signups added to the end of one growing document',
        correct: false,
        misconception: 'docs-appends',
        response:
          'Creating a document creates a new one; it does not add to an existing one. And either way there are no columns to add into.',
      },
      {
        text: 'One new document per signup, and nothing that can be sorted, filtered or totalled',
        correct: true,
        response:
          'Exactly, a fresh file every time. Nobody can filter thirteen documents by plan, or count last week’s trials. That is the whole reason the team asked for a spreadsheet.',
      },
    ],
  },

  switch: {
    prompt: 'Switch is on the canvas. Read what this flow does with a signup. What would you route on?',
    options: [
      {
        text: 'Nothing here. Every signup takes the same path',
        correct: true,
        response:
          'Right, and that is the answer. A split earns its place when two kinds of input need genuinely different handling. This flow treats every signup identically, so a split only adds branches with nothing to put down them.',
      },
      {
        text: 'The plan. Basic, Plus and Pro should each have their own path',
        correct: false,
        misconception: 'router-without-a-difference',
        response:
          'Read the brief again. All three plans do exactly the same thing: one row on the sheet, one welcome mail with the plan named inside it. Three paths doing identical work is three places to fix the same bug.',
      },
      {
        text: 'Whether the name came in blank, so blanks can be handled on their own path',
        correct: false,
        misconception: 'blank-needs-a-branch',
        response:
          'That is a real instinct, and it is answered a level down instead. A blank name changes how one line of the mail reads, not where the signup goes. It still needs its row and it still needs its welcome.',
      },
    ],
  },
};

/**
 * Report-facing label per misconception code. Every code used above needs one or the
 * Result screen prints a raw slug — `validateProblem()` rejects a missing one.
 *
 * `flow-sequence` is not used above: it is what BuildStage's generated sequence probe
 * records when a node the problem never probes is dropped in the wrong order, which in
 * this flow is the commonest mistake of all — reaching for the welcome mail before the
 * row has been written. Nothing validates its presence, so it is easy to leave out.
 */
export const misconceptionLabels = {
  'form-is-webhook': 'Treated a form trigger and a webhook as the same thing',
  'webhook-watches-a-page': 'Expected a webhook to watch a page for submissions',
  'poll-vs-event': 'Chose a timed sweep instead of reacting to the submission',
  'schedule-is-close-enough': 'Thought a short interval is as good as reacting to the event',
  'code-takes-instructions': 'Expected Code to follow a description rather than run written lines',
  'code-can-reach-the-sheet': 'Expected Code to write to the spreadsheet by itself',
  'search-returns-data': 'Expected a web search to hand back a clean value',
  'search-is-an-api': 'Treated a web search as equivalent to calling an API',
  'doc-is-a-log': 'Accepted a document where columns were needed',
  'docs-appends': 'Expected creating a document to add to an existing one',
  'router-without-a-difference': 'Split a flow whose paths would all do the same work',
  'blank-needs-a-branch': 'Reached for a branch to handle a blank answer',
  'flow-sequence': 'Placed a step out of the correct flow order',
};
