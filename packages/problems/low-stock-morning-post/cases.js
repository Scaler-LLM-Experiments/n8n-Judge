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
  onNew: '{from}. {subject}',
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
 * The other two are the morning the data is not clean and the morning somebody changes
 * the sheet after the sweep has already happened.
 *
 * Two rules were applied to this list on revision, and both are worth keeping:
 *
 *   1. NOTHING HERE MAY BE ANSWERED BY RECITING EARLIER COPY. `fan-out` used to ask
 *      "which part of n8n produced eleven messages?", whose answer — nodes run once per
 *      item — was printed in the dissection prompt, the build coach line and a probe.
 *      It now asks why the SAME bug is invisible on a quiet morning, which needs the
 *      rule applied rather than repeated. `late-correction` had the same problem and
 *      got the same treatment. The earlier copy was tightened as well; both halves were
 *      needed.
 *   2. NO QUESTION MAY REST ON A MECHANISM WE CANNOT VERIFY. `uncounted` used to assert
 *      that a blank cell and the text "8 kg" both fall out of a strict numeric
 *      comparison silently, with no error. n8n's condition builder with "Convert types
 *      where required" OFF plausibly raises a type error instead, and nobody here can
 *      run real n8n to settle it. The lesson does not need it settled: the design point
 *      — one condition cannot express "never counted" — is true under either reading,
 *      and it is the better question anyway. Every option below is worded so that its
 *      outcome-claim holds whichever way n8n behaves.
 */
export const evalQuestions = [
  {
    id: 'fan-out',
    prompt:
      'A colleague built this flow with one step left out: the keep-only-shortages step wires straight into the post. On Monday eleven beans were low and eleven separate messages landed in the channel. Nothing errored. On Friday one bean was low, and their flow and yours put the same single message in the channel. Why did Friday look identical?',
    options: [
      'Slack groups messages sent to one channel seconds apart, so on a quiet morning the difference is hidden rather than absent',
      'One run can only ever produce one message. Monday\'s eleven must have come from the trigger firing eleven times',
      'With one row there was nothing to gather. The missing step turns many into one, and one is already one',
      'The step they left out tidies the message rather than controlling how many go out, so Monday\'s eleven had another cause',
    ],
    correctIndex: 2,
    explanation:
      'One run, one trigger, one read. None of those multiply. Items do. The sheet hands its rows on one at a time, and every node after it is executed once for each item that reaches it, without anybody asking for a loop. Monday: forty rows in, eleven out of the comparison, eleven items at the post, eleven posts. Friday: one item, one post. The same rule producing a result that looks perfectly fine. That is the shape of this bug and the reason it is worth a question of its own. It is not that the flow is broken; it is that it is broken in proportion to how bad the morning is, so it ships, behaves for a fortnight, and floods the channel on the first Monday anybody actually needed it. The gathering step turns however many arrive into one, and everything after it then runs exactly once whatever the day looks like.',
  },
  {
    id: 'quiet-friday',
    prompt:
      'Friday. Every one of the forty rows is comfortably above its reorder level, so nothing survives the comparison. The flow runs exactly as you built it. What does the buyer see in #supply-chain?',
    options: [
      'Nothing at all. And nothing tells the buyer whether that means full shelves or a workflow that never ran',
      'A short message saying no beans are below their level this morning, so the buyer knows the sweep ran',
      'An empty message, because the post still runs and simply has nothing in it to list',
      'A failed run, so whoever watches failures is told there was nothing to send',
    ],
    correctIndex: 0,
    explanation:
      'A node with no items reaching it is not executed at all, so the gather step and the post never run and the channel stays quiet. That is correct behaviour and it is also the flow\'s weakest point, because silence is ambiguous: full shelves, an expired Google credential, a workflow somebody switched off after a demo and a broken comparison all produce exactly the same nothing. Ops flows that people come to rely on usually post an "all clear" on quiet days for precisely this reason. Not because anyone needs to read it, but so that the absence of a message becomes evidence rather than a guess.',
  },
  {
    // REWRITTEN. The previous version graded an assertion about n8n's strict type
    // validation — that a blank cell and the text "8 kg" both fall out of the
    // comparison with no error and no trace. That may well be backwards: with "Convert
    // types where required" off, n8n's condition builder plausibly raises a type error
    // rather than quietly evaluating false, and this repo cannot run n8n to find out.
    // Grading a disputed mechanism is how a correct learner gets marked down.
    //
    // So the question no longer depends on it in either direction. The prompt brackets
    // the mechanism explicitly, and every option's outcome-claim is true whichever way
    // n8n behaves: three of the four are PROPOSALS (do nothing / default to zero / stop
    // the run) whose consequences follow from the proposal itself, and the correct
    // answer is a statement about what one condition can and cannot express, which no
    // amount of type validation changes. The lesson from the brief survives whole — it
    // was always a design lesson wearing a mechanism as a costume.
    id: 'uncounted',
    prompt:
      'Wednesday. Friday\'s count was rushed: Ethiopia Guji at Koregaon Park has a blank kg_on_hand against a reorder level of 6, and somebody typed "8 kg". With the unit. Into Sumatra Mandheling\'s cell. Your flow asks one question of every row: is kg_on_hand below reorder_level? Set aside what n8n does with those two cells. What is wrong with asking only that?',
    options: [
      'Nothing. Two bad cells are a counting problem, and a workflow should report what the sheet says rather than second-guess it',
      'Default kg_on_hand to 0 wherever it is blank or unreadable, so every row has a number and an uncounted bean is reported as having none',
      'Stop the run whenever any kg_on_hand is blank or not a number, so nobody acts on a shortlist drawn from a sheet that is not clean',
      'One condition can only say "low" or "fine", never "nobody counted this". Rewrite the rule so a row qualifies on either arm. Below its level, or blank or not a number',
    ],
    correctIndex: 3,
    explanation:
      'The two odd cells look like a parsing problem and are really a design problem: the rule you wrote can only say two things. "Is kg_on_hand below reorder_level" sorts every row into counted-and-low or counted-and-fine, and there is no third answer for "nobody counted this". Whatever the comparison ends up doing with a blank cell, it cannot tell you that. And the bean nobody weighed is exactly the one that runs out mid-service on a Saturday, which is the failure Ritika was doing this by hand to avoid. Defaulting the blank to zero is not the fix: zero means "I counted and there is none", blank means "I do not know", and turning one into the other puts a shortfall in front of the buyer that nobody measured. And it would do the same to the 8 kg that somebody really did weigh. Stopping the run is not the fix either; one hurried cell should not cost the other thirty-nine rows their morning. A production version asks two questions instead of one. Below its reorder level, OR the quantity is blank or not a number. And marks the second group as needing a physical count. The point is not that blanks are dangerous. It is that a single numeric condition has no vocabulary for "unknown", so if unknown matters to you, you have to give it one.',
  },
  {
    // Reframed. The old version ("what does the flow do?") was answerable straight from
    // the dissection explanation and the google-sheets-trigger probe, both of which
    // said a clock trigger ignores the data. This one puts the correction on a Friday
    // and asks for the next opportunity, which needs three facts held together: the
    // trigger is a clock, the clock skips the weekend, and each sweep re-reads the tab.
    id: 'late-correction',
    prompt:
      'Friday, 09:15. A barista at Baner corrects Decaf Colombia from 12 kg down to 0.5. This morning\'s count was wrong. Its reorder level is 4, so it belongs on the shortlist, and the 07:30 post went out without it. The buyer orders before the 10 a.m. cut-off. When does your flow next get a chance to tell them?',
    options: [
      'Within a few minutes. The sheet is where this flow gets its data, so a row changing underneath it brings it round again',
      'Monday at 07:30. The next sweep is the next chance there is, and there is no sweep at the weekend',
      'Saturday at 07:30. The schedule keeps its own time whether or not the cafés are open',
      'Never on its own. That row has already been read once, so the next sweep treats it as seen and moves past it',
    ],
    correctIndex: 1,
    explanation:
      'A clock trigger is deaf to the data, and that is mostly what you want here. It makes the post arrive at a predictable time and stops the channel filling with noise every time a barista adjusts a count. The price is that the flow\'s picture of the store room is exactly as old as the last sweep, and nothing in the flow knows the picture has gone stale. Each sweep does read the whole tab afresh, so the corrected row will be there in full when the next one runs; it is the waiting that costs, and it is worth noticing how much the weekday rule adds to it. The same correction on a Tuesday morning is about twenty-two hours late. On a Friday morning it is two and a half days late, straight through the weekend the cafés are busiest. If a same-day correction genuinely has to reach the buyer, that is a second run or a second workflow. Not a change to this one.',
  },
];
