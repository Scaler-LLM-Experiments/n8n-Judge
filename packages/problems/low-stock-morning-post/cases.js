// The finished flow, and everything the Run and Stress Testing measure against.
//
// `referenceGraph` is the correct build (it seeds the #run-story dev route).
// `sampleCases` stream through the learner's own graph during the Run.
// `evalQuestions` grade against `correctIndex`, so the display order is shuffled per
// session and each option carries its authored index.

export const referenceGraph = {
  nodes: [
    { id: 'schedule-1', type: 'schedule', position: { x: 0, y: 200 }, requiredLabel: 'Schedule Trigger' },
    {
      id: 'sheets-1',
      type: 'google-sheets',
      position: { x: 260, y: 200 },
      requiredLabel: 'Google Sheets',
      // NOT decoration, and not a duplicate of nodeSetup. Judge resolves a node's role
      // from its catalog category, and `action` normally means "the flow ends here" —
      // which is right for posting to Slack and wrong for reading a spreadsheet. The
      // Google Sheets descriptor declares `passthroughWhen: { sheetOperation: ['read'] }`,
      // and that condition is evaluated against the node's CONFIGURED values, never a
      // catalog default (cases that legitimately end a branch by appending a row must
      // keep ending). So without this line the reference build truncates at the sheet
      // while a learner who answered the Operation field correctly walks all five nodes,
      // which is the worst possible split. See packages/catalog/catalog.js
      // `entryIsPassthrough` and `roleOf` in packages/engine/simulate.js.
      values: { sheetOperation: 'read' },
    },
    { id: 'filter-1', type: 'filter', position: { x: 520, y: 200 }, requiredLabel: 'Filter' },
    { id: 'aggregate-1', type: 'aggregate', position: { x: 780, y: 200 }, requiredLabel: 'Aggregate' },
    { id: 'slack-1', type: 'slack', position: { x: 1040, y: 200 }, requiredLabel: 'Slack' },
  ],
  edges: [
    { source: 'schedule-1', target: 'sheets-1' },
    { source: 'sheets-1', target: 'filter-1' },
    { source: 'filter-1', target: 'aggregate-1' },
    { source: 'aggregate-1', target: 'slack-1' },
  ],
};

// What "Run" checks structurally before it simulates. Each one is about one thing, and
// each description is shown to the learner as "what Run will check" — after the build,
// so naming the nodes here gives nothing away.
export const testCases = [
  {
    id: 'clock-starts-it',
    description: 'A Schedule Trigger starts the flow.',
    kind: 'structural',
    checks: { requiredNodeTypes: ['schedule'] },
  },
  {
    id: 'sheet-is-read',
    description: 'The schedule leads into a Google Sheets node, so the counts come into the flow.',
    kind: 'structural',
    checks: {
      requiredNodeTypes: ['google-sheets'],
      requiredEdges: [{ sourceType: 'schedule', targetType: 'google-sheets' }],
    },
  },
  {
    id: 'rows-narrowed',
    description: 'The rows go through a Filter, so only the ones that matter carry on.',
    kind: 'structural',
    checks: {
      requiredNodeTypes: ['filter'],
      requiredEdges: [{ sourceType: 'google-sheets', targetType: 'filter' }],
    },
  },
  {
    id: 'gathered-into-one',
    description: 'What survives the Filter reaches an Aggregate before anything is sent.',
    kind: 'structural',
    checks: {
      requiredNodeTypes: ['aggregate'],
      requiredEdges: [{ sourceType: 'filter', targetType: 'aggregate' }],
    },
  },
  {
    id: 'posted-once',
    description: 'The gathered shortlist reaches Slack, and Slack is the last node.',
    kind: 'structural',
    checks: {
      requiredNodeTypes: ['slack'],
      requiredEdges: [{ sourceType: 'aggregate', targetType: 'slack' }],
    },
  },
];

/**
 * The mornings the Run streams through the learner's own flow.
 *
 * `sampleCaseSchema` is still message-shaped — it wants `from`, `subject`, `category`
 * and `urgency` on every case — and a scheduled sweep has no sender. So `from` is what
 * is being read and `subject` is which morning it is, which is what the Run narration
 * renders and is honest about what the case actually is. `urgency` is required by the
 * schema and nothing in this problem reads it.
 *
 * `branch: null` on both, because there is no router: the flow declares no branches, so
 * no case can select one and `simulateAll` falls back to requiring every case to
 * deliver. `validateProblem()` warns about the fall-through and the warning is correct
 * but not meaningful here — in a linear flow the interesting gap is not "matched no
 * branch", it is the morning that produces nothing at all, and that one cannot be a
 * sample case because the engine has no notion of how many items there are. It is the
 * `quiet-friday` question below instead.
 *
 * Only two of the brief's four example mornings are here for the same reason: the
 * eleven-row Monday and the empty Friday both turn on item COUNTS, which the engine
 * cannot model, so authored as sample cases they would be indistinguishable from the
 * ordinary Tuesday and would assert something the Run never checks. Both are Stress
 * Testing questions, and they are the two best ones in the case.
 */
export const sampleCases = [
  {
    id: 'tuesday',
    from: 'Bean Inventory 2026',
    subject: 'Stock tab · Tuesday 07:30 sweep · three beans under their own reorder level, thirty-seven fine',
    category: 'low_stock',
    urgency: 'MEDIUM',
    branch: null,
    reply: 'the shortlist goes out',
  },
  {
    // The boundary morning. Kenya Nyeri AA reads 6 against a reorder level of 6, which
    // is the argument the Filter's operator is about. The subject states the situation
    // and deliberately does not state the outcome.
    id: 'boundary',
    from: 'Bean Inventory 2026',
    subject: 'Stock tab · Thursday 07:30 sweep · Kenya Nyeri AA sitting exactly on its reorder level, two others below theirs',
    category: 'low_stock',
    urgency: 'LOW',
    branch: null,
    reply: 'the shortlist goes out',
  },
];

/**
 * Narration overrides for the Run.
 *
 * The engine's defaults are written for email triage — "New email from…", "reads it as
 * {category} · {urgency}" — and none of those are this problem's words. Wording only:
 * the walk itself is unchanged.
 *
 * `parse` is the line for every passthrough step, and this flow has three of them (the
 * sheet configured to read, the filter and the aggregate), so it has to be true of all
 * three. That is a limit of the engine's narration, not a choice.
 */
export const simulation = {
  onNew: '{from} — {subject}',
  noTrigger: 'Nothing starts this flow, so 07:30 comes and goes.',
  trigger: '{label} fires. Nothing had to arrive for it to.',
  parse: '{label} runs, and hands what it produced to the next step.',
  deadEnd: 'Nothing is wired after this, so the shortlist stops here and the buyer never sees it.',
  actionSend: '{targetLabel} puts the shortlist in front of the buyer.',
  action: 'The shortlist is posted.',
};

/**
 * Stress Testing: behaviour at the edges, not recall.
 *
 * Two of these exist because the engine cannot model them as Run cases — it has no
 * notion of item counts anywhere, so "eleven rows became eleven posts" and "nothing
 * qualified" can only be asked about. They are also the two best questions in the case.
 * The other two are the mornings the data is not clean and the morning somebody changes
 * the sheet after the sweep has already happened.
 */
export const evalQuestions = [
  {
    id: 'fan-out',
    prompt:
      'A colleague built this same flow without the step that gathers the rows together — the keep-only-shortages step wires straight into the post. On Monday eleven beans were below their level, and eleven separate messages landed in the channel. Nothing errored. Which part of n8n produced eleven messages out of one run?',
    options: [
      'The trigger fired eleven times, once for each row that turned out to be low',
      'The reading step called Slack once for each of the forty rows it pulled out of the sheet',
      'Every step after the sheet runs once per item, and the eleven rows were still eleven separate items when they reached the post',
      'Slack broke one long message into eleven, because of its length limit',
    ],
    correctIndex: 2,
    explanation:
      'One run, one trigger, one read. What multiplies is items: the sheet hands its rows on one at a time, and every node after it is executed once for each item that reaches it — without anybody asking. Forty rows went into the comparison and eleven came out, so eleven items arrived at the post and the post ran eleven times. The step that gathers them turns those eleven items into one, and everything after it then runs once. That is the whole reason it is in the flow, and it is why the same default that quietly does the comparison forty times for free is what floods the channel at the end.',
  },
  {
    id: 'quiet-friday',
    prompt:
      'Friday. Every one of the forty rows is comfortably above its reorder level, so nothing survives the comparison. The flow runs exactly as you built it. What does the buyer see in #supply-chain?',
    options: [
      'Nothing at all — and nothing tells the buyer whether that means full shelves or a workflow that never ran',
      'A short message saying no beans are low this morning',
      'An empty message, because the post still runs with nothing in it',
      'A failed run, so somebody is alerted that there was nothing to send',
    ],
    correctIndex: 0,
    explanation:
      'A node with no items reaching it is not executed at all, so the gather step and the post never run and the channel stays quiet. That is correct behaviour and it is also the flow\'s weakest point, because silence is ambiguous: full shelves, an expired Google credential, a workflow somebody switched off after a demo and a broken comparison all produce exactly the same nothing. Ops flows that people come to rely on usually post an "all clear" on quiet days for precisely this reason — not because anyone needs to read it, but so that the absence of a message becomes evidence rather than a guess.',
  },
  {
    id: 'uncounted',
    prompt:
      'Wednesday. Friday\'s count was rushed, so two rows are not clean numbers. Ethiopia Guji at Koregaon Park has a completely blank kg_on_hand, against a reorder level of 6 — nobody weighed it. And somebody typed "8 kg", with the unit, into Sumatra Mandheling\'s kg_on_hand, against a level of 10. Two other rows are ordinary, clearly-below matches. What reaches the channel?',
    options: [
      'All four rows: a blank cell counts as zero, and zero is below six',
      'All four rows: n8n reads "8 kg" as 8, and treats a blank as a missing value worth flagging',
      'The two ordinary rows only. Neither odd cell gives the comparison a number it can call below the level, so both fall out — and the post looks entirely correct',
      'None of them. A filter refuses to run while a column it compares has gaps in it',
    ],
    correctIndex: 2,
    explanation:
      'The naive comparison — is this number below that number — silently swallows both. A blank is not a number, so it is never below anything; "8 kg" is text, so there is nothing for the comparison to weigh. Neither row raises an error, neither row is kept, and the message that lands looks perfectly correct. That is the worst kind of wrong: the one bean nobody counted is the one that disappears from view, which is precisely the failure Ritika was doing this by hand to avoid. A production version of this flow does not use one condition — it uses "below its reorder level, OR the quantity is blank or not a number" — so an uncounted bean is put in front of the buyer as needing a physical count, rather than quietly assumed to be fine.',
  },
  {
    id: 'late-correction',
    prompt:
      'At 09:15 a barista at Baner realises Monday\'s count was wrong and corrects Decaf Colombia from 12 kg down to 0.5. Its reorder level is 4. What does the flow do?',
    options: [
      'It errors on the next run, because the row it already read no longer matches the sheet',
      'Nothing today. The correction is picked up at 07:30 tomorrow, and only if tomorrow is a weekday',
      'It runs again within a few minutes, because a row it reads has changed',
      'It posts a correction to the channel, because Slack keeps the message thread open',
    ],
    correctIndex: 1,
    explanation:
      'A clock trigger is deaf to the data. That is mostly what you want here — it makes the post arrive at a predictable time and stops the channel filling with noise every time a barista adjusts a count — but it also means the flow\'s picture of the store room is exactly as old as this morning\'s sweep, and a bean that ran out at nine is news at half past seven tomorrow. If a same-day correction genuinely has to reach the buyer, that is a second run or a second workflow, not a change to this one. And note what "tomorrow" means on a Friday afternoon: the next sweep is Monday.',
  },
];
