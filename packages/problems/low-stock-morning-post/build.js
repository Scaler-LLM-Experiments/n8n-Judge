// The shape of the flow, and the order it gets built in.
//
// `flowSummary` is drawn on the Understand screen BEFORE the dissection quiz, so its
// labels describe the job in three words and never name a node — `validateProblem()`
// rejects both mistakes, and it matches every palette label as a SUBSTRING, which with
// `If`, `Code` and `Merge` in the palette below rules out any label containing "if",
// "code" or "merge" inside another word ("notify", "verify", "identify" all fail).
//
// `flow` is what detects a sequence mistake; `buildPhases` is the guided order, each
// phase's `pickable` being what the drawer offers — including the distractors worth
// probing. Every phase declares its own `pickable`: the picker's fallback offers only a
// fraction of the library, so omitting it can make a required node unpickable.

// Every type here is a real @judge/catalog entry. Nothing is a compatibility alias:
// `schedule`, `google-sheets`, `filter`, `aggregate` and `slack` are the canonical
// types, and the distractors are all real nodes a beginner would genuinely reach for.
export const nodePalette = [
  { type: 'schedule', label: 'Schedule Trigger', category: 'trigger', isDistractor: false },
  { type: 'google-sheets-trigger', label: 'Google Sheets Trigger', category: 'trigger', isDistractor: true },
  { type: 'gmail-trigger', label: 'Gmail Trigger', category: 'trigger', isDistractor: true },
  { type: 'webhook', label: 'Webhook', category: 'trigger', isDistractor: true },
  { type: 'google-sheets', label: 'Google Sheets', category: 'action', isDistractor: false },
  { type: 'filter', label: 'Filter', category: 'core', isDistractor: false },
  { type: 'aggregate', label: 'Aggregate', category: 'core', isDistractor: false },
  { type: 'slack', label: 'Slack', category: 'action', isDistractor: false },
  { type: 'http-request', label: 'HTTP Request', category: 'core', isDistractor: true },
  { type: 'code', label: 'Code', category: 'core', isDistractor: true },
  { type: 'if', label: 'If', category: 'core', isDistractor: true },
  { type: 'loop-over-items', label: 'Loop Over Items', category: 'core', isDistractor: true },
  { type: 'split-out', label: 'Split Out', category: 'core', isDistractor: true },
  { type: 'merge', label: 'Merge', category: 'core', isDistractor: true },
  { type: 'remove-duplicates', label: 'Remove Duplicates', category: 'core', isDistractor: true },
  { type: 'stop-and-error', label: 'Stop and Error', category: 'core', isDistractor: true },
  { type: 'basic-llm-chain', label: 'Basic LLM Chain', category: 'ai', isDistractor: true },
];

// No router anywhere in this flow. `filter` is not a splitter — it has one output and
// drops what does not match — so nothing here fans out and there are no branch ids for
// a sample case to select.
export const branches = [];

// The "shape of it" sketch, shown on the Understand screen BEFORE the quiz asks which
// node does each job. Labels describe the JOB, in three words or fewer, and never name
// a node or contain one as a substring.
export const flowSummary = {
  steps: [
    { type: 'schedule', label: 'each weekday morning' },
    { type: 'google-sheets', label: 'read the stock' },
    { type: 'filter', label: 'keep only shortages' },
    { type: 'aggregate', label: 'gather into one' },
    { type: 'slack', label: 'tell the buyer' },
  ],
  caption:
    'Five steps in a straight line. The clock starts it, the counts are pulled in and narrowed down to what actually matters, and whatever is left goes out together.',
};

// Canonical flow order. Used to detect sequence mistakes: from a given source only
// certain node types are the valid next step. Declared for the whole chain, because
// `flow.next` is also what puts the "add next" cue on a node — a type missing from this
// map is a node the learner is never invited to continue from.
//
// No `branchNext` (nothing routes) and no `modelNext` (nothing thinks).
export const flow = {
  start: ['schedule'],
  next: {
    schedule: ['google-sheets'],
    'google-sheets': ['filter'],
    filter: ['aggregate'],
    aggregate: ['slack'],
    slack: [],
  },
};

// Three guided build phases. `coach` is Iris's line on entering the phase.
//
// `pickable` is the MENU, not the answer key: each phase offers five to seven plausible
// nodes, and every wrong one has a probe of its own in probes.js. The trigger phase
// offers the three ways people expect a spreadsheet flow to start; the middle phase
// offers what people reach for instead of reading a sheet and dropping rows (fetch it
// over HTTP, write the comparison in code, route the low ones, walk the rows in a loop);
// the last phase offers the four nodes whose labels sound like "make these many into
// one" plus the two that sound like error handling and a nicely-written message.
export const buildPhases = [
  {
    id: 'clock',
    label: 'Start the morning',
    coach: "Let's build. First: what should notice that it is time to run?",
    nodeTypes: ['schedule'],
    pickable: ['schedule', 'google-sheets-trigger', 'gmail-trigger', 'webhook'],
  },
  {
    id: 'shortlist',
    label: 'Read and narrow',
    coach:
      'That is the way in. Now get the counts into the flow and cut them down to the rows that actually need buying.',
    nodeTypes: ['google-sheets', 'filter'],
    pickable: ['google-sheets', 'filter', 'http-request', 'code', 'if', 'loop-over-items'],
  },
  {
    id: 'post',
    label: 'Put it in front of the buyer',
    coach:
      'Last part. Remember that n8n runs a node once for every item that reaches it — so think about how many things are arriving here before you decide what goes next.',
    nodeTypes: ['aggregate', 'slack'],
    pickable: ['aggregate', 'slack', 'split-out', 'merge', 'remove-duplicates', 'stop-and-error', 'basic-llm-chain'],
  },
];
