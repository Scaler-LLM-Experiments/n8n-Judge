// The shape of the flow, and the order it gets built in.
//
// `flowSummary` is drawn on the Understand screen BEFORE the dissection quiz, so its
// labels describe the job in three words or fewer and never name a node —
// `validateProblem()` rejects both mistakes, and it matches every palette label as a
// SUBSTRING. With `If`, `Code`, `Filter`, `Switch` and `Slack` in the palette below,
// that rules out any label containing "if", "code", "filter", "switch" or "slack"
// inside another word, which is why nothing here is "notify", "verify" or "encoded".
//
// `flow` is what detects a sequence mistake; `buildPhases` is the guided order, each
// phase's `pickable` being what the drawer offers — including the distractors worth
// probing. Every phase declares its own `pickable`: the picker's fallback offers only a
// fraction of the 200-type library, so omitting it can make a required node unpickable.

// Every type here is a real @judge/catalog entry and none is a compatibility alias.
// The four the flow needs are `schedule`, `http-request`, `edit-fields` and `slack`;
// everything else is a node a beginner genuinely reaches for on this problem.
//
// The two chat models are listed but deliberately NOT pickable in any phase. They are
// vocabulary — the learner should see that a brain exists and notice that this flow has
// nothing to attach one to — and a model-category node is added through an AI node's
// Chat Model slot rather than through the picker, so offering one in the drawer would
// be offering something the editor cannot place on the main wire.
export const nodePalette = [
  { type: 'schedule', label: 'Schedule Trigger', category: 'trigger', isDistractor: false },
  { type: 'webhook', label: 'Webhook', category: 'trigger', isDistractor: true },
  { type: 'chat-trigger', label: 'Chat Trigger', category: 'trigger', isDistractor: true },
  { type: 'rss-feed-trigger', label: 'RSS Feed Trigger', category: 'trigger', isDistractor: true },
  { type: 'http-request', label: 'HTTP Request', category: 'core', isDistractor: false },
  { type: 'edit-fields', label: 'Edit Fields (Set)', category: 'core', isDistractor: false },
  { type: 'slack', label: 'Slack', category: 'action', isDistractor: false },
  { type: 'code', label: 'Code', category: 'core', isDistractor: true },
  { type: 'rss-read', label: 'RSS Read', category: 'core', isDistractor: true },
  { type: 'information-extractor', label: 'Information Extractor', category: 'ai', isDistractor: true },
  { type: 'if', label: 'If', category: 'core', isDistractor: true },
  { type: 'switch', label: 'Switch', category: 'core', isDistractor: true },
  { type: 'filter', label: 'Filter', category: 'core', isDistractor: true },
  { type: 'text-classifier', label: 'Text Classifier', category: 'ai', isDistractor: true },
  { type: 'basic-llm-chain', label: 'Basic LLM Chain', category: 'ai', isDistractor: true },
  { type: 'gmail', label: 'Gmail', category: 'action', isDistractor: true },
  { type: 'send-email', label: 'Send Email', category: 'core', isDistractor: true },
  { type: 'openai-chat-model', label: 'OpenAI Chat Model', category: 'model', isDistractor: true },
  { type: 'google-gemini-chat-model', label: 'Google Gemini Chat Model', category: 'model', isDistractor: true },
];

// No router anywhere in this flow: four nodes, one chain. Different weather changes the
// TEXT of the message, never where it goes, so there is nothing to declare here and no
// branch id for a sample case to select.
export const branches = [];

// The "shape of it" sketch, shown on the Understand screen BEFORE the quiz asks which
// node does each job. Labels describe the JOB, in three words or fewer, and never name
// a node or contain one as a substring.
export const flowSummary = {
  steps: [
    { type: 'schedule', label: 'same time daily' },
    // NOT "ask the service" or "make the call" — both are fine, but this one says what
    // the flow GAINS rather than how, which keeps the second quiz question ("what goes
    // and gets them?") a real question.
    { type: 'http-request', label: "today's numbers" },
    { type: 'edit-fields', label: 'turn into words' },
    { type: 'slack', label: 'reaches his phone' },
  ],
  caption:
    'Four steps in a straight line. The clock starts it, this morning\'s numbers come into the flow, they are turned into two short lines a person can read, and the message goes where he will see it.',
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
    schedule: ['http-request'],
    'http-request': ['edit-fields'],
    'edit-fields': ['slack'],
    slack: [],
  },
};

// Three guided build phases. `coach` is Iris's line on entering the phase.
//
// `pickable` is the MENU, not the answer key. Every wrong node offered here has a probe
// of its own in probes.js: the trigger phase offers the three ways people expect a
// weather flow to begin (something arrives, somebody asks, a feed updates); the middle
// phase offers what people reach for instead of a plain GET (write the fetch in code,
// read it as a feed, have a model pull the numbers out); the last phase offers the two
// splitters, the dropper, the two AI steps and the two ways to send an email.
export const buildPhases = [
  {
    id: 'clock',
    label: 'Start the morning',
    coach: "Let's build. First: what should notice that it is time to run?",
    nodeTypes: ['schedule'],
    pickable: ['schedule', 'webhook', 'chat-trigger', 'rss-feed-trigger'],
  },
  {
    id: 'ask',
    label: 'Get this morning\'s numbers',
    coach:
      'That is the way in. Nothing has arrived, so the next step has to go out and get the forecast itself. The service is open, no key, no login.',
    nodeTypes: ['http-request'],
    pickable: ['http-request', 'code', 'rss-read', 'information-extractor'],
  },
  {
    id: 'message',
    label: 'Make it readable and send it',
    // Points at what changes and what does not, and leaves the conclusion to be drawn.
    // Saying "the destination never changes, so you do not need a splitter" would be the
    // `two-paths` Stress Testing answer in the author's own words, one screen early.
    // The second question balances the first. Both `values` picks turn on the same fact —
    // that a morning outside the codes in the brief can arrive — and the review found the
    // brief's own "the codes he sees most mornings" was the only signpost for it. This
    // names no code, does not say the legend is incomplete, and does not say a third kind
    // of morning exists; it just asks what the mapping does when neither case matches.
    coach:
      'Last part. A temperature and an integer are in the flow now, and what he needs is two short lines of English. Ask yourself what actually differs between a rainy morning and a clear one. And what your answer does on a morning that is neither.',
    nodeTypes: ['edit-fields', 'slack'],
    pickable: [
      'edit-fields',
      'slack',
      'if',
      'switch',
      'filter',
      'text-classifier',
      'basic-llm-chain',
      'gmail',
      'send-email',
    ],
  },
];
