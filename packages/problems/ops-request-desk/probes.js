// What Iris asks when the learner reaches for the WRONG node, and what the report calls
// each misconception.
//
// Keyed by the wrong node's type. A type with no entry here falls back to the generated
// sequence probe (four rotating framings of "a node only gets what the one before it
// hands over"), so there is an entry for every distractor any phase makes pickable.
//
// THREE COPY RULES, all enforced:
//   1. never name the correct node — the probe teaches, it does not answer;
//   2. every option is a real position someone would hold (no joke options, no
//      "I clicked it by accident");
//   3. the correct answer describes what the WRONG node actually does.
//
// Minimum three options. A wrong option needs a `misconception` code, or the report can
// never surface it. The learner's pick renders NEUTRAL, not green/red: the placement is
// already known to be wrong and the node comes off the canvas either way.
export const nodeProbes = {
  webhook: {
    prompt: 'On Webhook Call is on the canvas. What has to happen before it fires?',
    options: [
      {
        text: 'The Ops Desk request form posts to it whenever somebody submits',
        correct: false,
        misconception: 'form-is-http',
        response:
          'Only if somebody had wired that up, and nobody has. A webhook waits at a URL for a request that something else has been configured to send; the form has no idea the URL exists.',
      },
      {
        text: 'Some other system has to send an HTTP request to its URL',
        correct: true,
        response:
          'Exactly. So ask who would call that URL when a colleague fills in a form Priya built inside this very tool. Nothing does, unless you go and build the caller too.',
      },
      {
        text: 'Nothing special — it watches for anything arriving, the same as any trigger',
        correct: false,
        misconception: 'triggers-interchangeable',
        response:
          'Triggers do not adapt. Each one subscribes to exactly one event on one service. Which event does this flow actually begin with?',
      },
    ],
  },

  schedule: {
    prompt: 'On a Schedule is on the canvas. When would this flow run?',
    options: [
      {
        text: 'The moment somebody submits the form',
        correct: false,
        misconception: 'poll-vs-event',
        response:
          'No. A schedule fires on the clock and never on the event, so anything arriving between ticks sits there until the next one. What starts this flow is somebody pressing submit.',
      },
      {
        text: 'On a fixed clock — every few minutes, or at a set hour',
        correct: true,
        response:
          'Correct, and Priya sweeping the responses each morning is a real way to work. But this flow answers people. How long should somebody wait because their request landed just after a tick?',
      },
      {
        text: 'Once, when the workflow is switched on',
        correct: false,
        misconception: 'schedule-runs-once',
        response:
          'A Schedule Trigger repeats on its interval; it is not a one-shot. Repeating on a clock still is not the same as reacting the instant something lands.',
      },
    ],
  },

  'text-classifier': {
    prompt:
      'Text Classifier is on the canvas to read the request. Suppose it works perfectly. What do you have afterwards?',
    options: [
      {
        text: 'The kind, plus whatever else was worth pulling out of the sentence',
        correct: false,
        misconception: 'classifier-extracts',
        response:
          'It does not. A classifier is asked one question and answers it with one label; nothing else about the sentence survives the step. Four of the six columns on the Ops Log need something more than a label.',
      },
      {
        text: 'The kind, and the routing already done — no separate split needed',
        correct: false,
        misconception: 'classify-is-routing',
        response:
          'Close to true in real n8n, and it is the wrong half to lean on here. Even if the routing came free, this flow still has four values to find inside the sentence, and a label is not one of them.',
      },
      {
        text: 'Which of the three kinds this request is, and nothing else',
        correct: true,
        response:
          'Right, and that is genuinely half the job — the split downstream would be happy. Now open the Ops Log again and look at Subject Name, Subject Email and Detail. Where do those three come from?',
      },
    ],
  },

  'ai-agent': {
    prompt: 'AI Agent is on the canvas. Who decides what happens to a request in that design?',
    options: [
      {
        text: 'You do, by wiring the paths — the agent just makes the reading more reliable',
        correct: false,
        misconception: 'agent-is-a-better-model',
        response:
          'An agent is not a stronger reader bolted onto your wiring; it replaces the wiring with its own decisions. If the paths are yours, this step only has to produce values for them.',
      },
      {
        text: 'The model does, at run time, by choosing which tools to call',
        correct: true,
        response:
          'Correct, and that is a real and useful pattern — you may well have met this exact scenario built that way. It is a different skill, though. Here YOU decide the routes and the model only reads. What does this step actually have to hand back?',
      },
      {
        text: 'Nobody — it works out the whole flow from the request on its own',
        correct: false,
        misconception: 'agent-builds-the-flow',
        response:
          'An agent picks between tools you have given it; it does not invent a workflow. And there is no tool here for it to pick — the paths are the thing you are being asked to build.',
      },
    ],
  },

  code: {
    prompt: 'Code is on the canvas to work out what each request needs. What would you have to write inside it?',
    options: [
      {
        text: 'A description of the three kinds, and it works out the rest',
        correct: false,
        misconception: 'rules-vs-ai',
        response:
          'Code does not take a description. It runs exactly the logic you write, line by line. Something else in the drawer does take one.',
      },
      {
        text: 'Nothing much — Code reads the sentence and works out what it means',
        correct: false,
        misconception: 'code-is-smart',
        response:
          'Code only does what it is told. It has no idea what a request means; it can only match what you have spelled out in advance, and people do not write requests in advance.',
      },
      {
        text: 'Rules that look for particular words and for anything shaped like an address',
        correct: true,
        response:
          'Right, and for the obvious ones that works. Now read this: "Please delete Riya Kapoor’s row from the Ops Log — she emailed this morning." It contains the word "log" and the word "email". Which of your rules wins?',
      },
    ],
  },

  'edit-fields': {
    prompt: 'Edit Fields is on the canvas between the form and the rest of the flow. What can it put into a field?',
    options: [
      {
        text: 'Values that are already on the item, renamed or rearranged',
        correct: true,
        response:
          'Exactly — it moves what is already there. So ask where Subject Name is meant to come from. Nothing on this item holds it yet; somebody still has to work it out of the sentence.',
      },
      {
        text: 'New values, worked out from what the sentence says',
        correct: false,
        misconception: 'set-invents-values',
        response:
          'It cannot work anything out. Edit Fields copies and renames; it has no reading of the text at all. A field it cannot source stays empty.',
      },
      {
        text: 'Nothing yet — but the spreadsheet needs its fields renamed first, so it has to be here',
        correct: false,
        misconception: 'sheets-needs-renaming',
        response:
          'It does not. The spreadsheet step maps each column to whatever value you point at, under whatever name that value already has. Renaming ahead of it is work nobody asked for.',
      },
    ],
  },

  filter: {
    prompt: 'Filter is on the canvas. What happens to a request that does not match its condition?',
    options: [
      {
        text: 'It carries on down a second path',
        correct: false,
        misconception: 'filter-is-if',
        response:
          'Filter has one way out, not two. There is no second path for a non-match to take, and that is the entire difference between this node and the ones that split.',
      },
      {
        text: 'It is held back and picked up on the next run',
        correct: false,
        misconception: 'filter-holds-items',
        response: 'Nothing is held. A filter decides on the spot and does not remember the item afterwards.',
      },
      {
        text: 'It is dropped, and nothing after this node ever sees it',
        correct: true,
        response:
          'Exactly. So two of the three kinds of request would vanish here, and the people who sent them would never hear a word. Every request needs to end up somewhere, including the ones the desk cannot answer.',
      },
    ],
  },

  if: {
    prompt: 'If is on the canvas. How many separate paths can a single If node send a request down?',
    options: [
      {
        text: 'Two — a true path and a false path',
        correct: true,
        response: 'Right. Now count the kinds of request this desk has to answer differently. Does two cover it?',
      },
      {
        text: 'As many as you add conditions for',
        correct: false,
        misconception: 'if-vs-switch',
        response:
          'No. If always has exactly two outputs. Extra conditions combine into one true-or-false answer; they never add a third way out.',
      },
      {
        text: 'Two, and you chain a second one onto the false path to get three',
        correct: false,
        misconception: 'chained-ifs',
        response:
          'You can, and it half works, which is what makes it worth naming. Every extra kind of request means another node, the reading is spread over two places that can disagree, and the canvas stops showing you the three ways out at a glance.',
      },
    ],
  },

  'respond-to-webhook': {
    prompt: 'Respond to Webhook is at the end of a path. Who receives what it sends?',
    options: [
      {
        text: 'Whatever made an HTTP call to this workflow, as the reply to that call',
        correct: true,
        response:
          'Correct, and there is no such caller here — nothing in this flow was started by an HTTP request. The word "respond" is doing a lot of work in that node name; it means answering a call, not answering a person.',
      },
      {
        text: 'The person who filled in the form, as a message back to them',
        correct: false,
        misconception: 'respond-reaches-person',
        response:
          'It does not send anybody a message. It hands a body back to a caller that is waiting on the line, and on this path there is nobody waiting.',
      },
      {
        text: 'The next node — it passes the response on so the flow can keep going',
        correct: false,
        misconception: 'respond-is-passthrough',
        response:
          'That is not what it is for. It exists to close off a request that came in over HTTP, which is a different shape of workflow from this one entirely.',
      },
    ],
  },
};

/**
 * Report-facing label per misconception code. Every code used above needs one, or the
 * Result screen prints a raw slug — `validateProblem()` rejects a missing one.
 *
 * `flow-sequence` is not used above: it is what BuildStage's generated sequence probe
 * records when a node this problem never probes is dropped in the wrong order. Nothing
 * validates its absence except a report with a slug on it.
 */
export const misconceptionLabels = {
  'form-is-http': 'Assumed the form would call a webhook by itself',
  'triggers-interchangeable': 'Assumed any trigger can start the flow',
  'poll-vs-event': 'Chose a scheduled sweep instead of reacting to the submission',
  'schedule-runs-once': 'Thought a Schedule Trigger fires once rather than on an interval',
  'classifier-extracts': 'Expected a classifier to return details as well as a label',
  'classify-is-routing': 'Judged the AI step by the routing alone, not by what the destinations need',
  'agent-is-a-better-model': 'Read an agent as a stronger reader rather than as a different design',
  'agent-builds-the-flow': 'Expected an agent to work out the whole workflow by itself',
  'rules-vs-ai': 'Expected written rules to read a request the way a person would',
  'code-is-smart': 'Expected Code to interpret meaning rather than run written rules',
  'set-invents-values': 'Expected a field-setting step to produce values nothing upstream holds',
  'sheets-needs-renaming': 'Believed values must be renamed before a spreadsheet can accept them',
  'filter-is-if': 'Thought a filtered-out item continues down a second path',
  'filter-holds-items': 'Expected Filter to hold items back rather than drop them',
  'if-vs-switch': 'Reached for If where a three-way split was needed',
  'chained-ifs': 'Faked a multi-way split by chaining two-way ones',
  'respond-reaches-person': 'Confused answering an HTTP call with messaging a person',
  'respond-is-passthrough': 'Treated a response node as an ordinary step in the chain',
  'flow-sequence': 'Placed a step out of the correct flow order',
  // Also generated rather than authored: BuildStage records these when a node that IS
  // a destination somewhere is dropped on an exit that wanted a different one. Only
  // reachable on a problem whose `flow.branchNext` is keyed per exit, which this one is.
  'branch-is-positional': 'Read a router’s exits as an ordered list rather than as named routes',
  'branch-destination-unused': 'Chose a destination because it was spare, not because the exit needed it',
  'branch-destination-shape': 'Told the exits apart by the data they carry rather than by what was asked for',
};
