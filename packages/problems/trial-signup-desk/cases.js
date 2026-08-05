// The finished flow, and everything the Run and Stress Testing measure against.

/**
 * The CORRECT build. Positions matter — this seeds the #run-story dev route, so it lays
 * out left-to-right the way a learner builds it. `requiredLabel` is what the node must be
 * for the Run to accept it.
 *
 * One straight line and no branch edges at all, because nothing here routes.
 */
export const referenceGraph = {
  nodes: [
    { id: 'form-1', type: 'form-trigger', position: { x: 0, y: 180 }, requiredLabel: 'On form submission' },
    // Plain node labels, matching the catalog and the palette. `referenceGraph` is one of
    // the pinned client-visible leaks, and both of these used to name a graded answer —
    // the rate DIRECTION and the sheet OPERATION are each a scored field.
    { id: 'rate-1', type: 'http-request', position: { x: 340, y: 180 }, requiredLabel: 'HTTP Request' },
    { id: 'sheet-1', type: 'google-sheets', position: { x: 680, y: 180 }, requiredLabel: 'Google Sheets' },
    { id: 'welcome-1', type: 'action', position: { x: 1020, y: 180 }, requiredLabel: 'Send Reply — Welcome' },
  ],
  edges: [
    { source: 'form-1', target: 'rate-1' },
    { source: 'rate-1', target: 'sheet-1' },
    { source: 'sheet-1', target: 'welcome-1' },
  ],
};

/**
 * What "Run" checks structurally before it simulates. Each one is about one thing, and
 * each description is shown to the learner as "what Run will check".
 *
 * The second check is the one that makes ORDER graded rather than described: the rate has
 * to be fetched between the form and the sheet, because the row is what carries it.
 */
export const testCases = [
  {
    id: 'form-starts-it',
    description: 'A form submission starts the flow.',
    kind: 'structural',
    checks: { requiredNodeTypes: ['form-trigger'] },
  },
  {
    id: 'rate-before-the-row',
    description: 'The rate is fetched after the form and before the row, so the row can carry it.',
    kind: 'structural',
    checks: {
      requiredNodeTypes: ['http-request'],
      requiredEdges: [
        { sourceType: 'form-trigger', targetType: 'http-request' },
        { sourceType: 'http-request', targetType: 'google-sheets' },
      ],
    },
  },
  {
    id: 'every-signup-logged',
    // Says what the step is FOR without naming the operation: which of the sheet node's
    // operations does this is a scored field, and the Run checklist is on screen while a
    // learner can still be answering it.
    description: 'Every signup gets its own new line on the Signups sheet.',
    kind: 'structural',
    checks: { requiredNodeTypes: ['google-sheets'] },
  },
  {
    id: 'welcome-goes-out',
    description: 'The person who signed up is sent a welcome email once the row is written.',
    kind: 'structural',
    checks: {
      requiredNodeTypes: ['action'],
      requiredEdges: [{ sourceType: 'google-sheets', targetType: 'action' }],
    },
  },
];

/**
 * The signups the Run streams through the learner's own flow, one at a time.
 *
 * BRANCH IS NULL ON ALL OF THEM, and that is not the usual "this case matches no rule".
 * This flow declares no branches, so `null` is the only legal value the schema allows —
 * and `simulateAll` handles it: with no case carrying a branch, every case is expected to
 * deliver, which is exactly right for a linear flow. Nothing here falls through.
 *
 * The deliberate gap this case has instead is the DEGRADED PATH: `noname`, the signup that
 * arrives with the name box empty. It must still be logged and still be welcomed. That is
 * what the first stress question is about, and it is why `greeting` is graded on the mail
 * node and why `required` is graded on the form.
 *
 * These six are a subset of the source dataset's thirteen rows, one per hazard class:
 * the normal path, a comma and quotes inside one answer, a blank optional answer, a
 * non-Latin script, an apostrophe, and the blank name. Thirteen cases would make the Run
 * animation run past a minute and a half without teaching a seventh thing.
 *
 * `category` carries the plan, because that is what the narration below reads back.
 * `urgency` is required by the schema and has no meaning here; it tracks the plan tier so
 * it is at least not misleading. `from` and `subject` read as "who this came from" and
 * "what it says" — the form's answers, summarised the way the submission would look.
 */
export const sampleCases = [
  {
    id: 'aarav',
    from: 'aarav@example.com',
    subject: 'Pro plan · found you through Google search',
    category: 'Pro',
    urgency: 'HIGH',
    branch: null,
    reply: 'welcome email',
  },
  {
    // A comma AND a pair of quotes inside one answer. Nothing about this is special once
    // the value is mapped whole; it only breaks if something tries to split it up.
    id: 'bella',
    from: 'bella@example.com',
    subject: 'Plus plan · referral: A friend said "best gear ever", so I joined',
    category: 'Plus',
    urgency: 'MEDIUM',
    branch: null,
    reply: 'welcome email',
  },
  {
    // A blank optional answer. The row still lands, with one empty cell.
    id: 'chen',
    from: 'chen@example.com',
    subject: 'Basic plan · referral left empty',
    category: 'Basic',
    urgency: 'LOW',
    branch: null,
    reply: 'welcome email',
  },
  {
    id: 'hiro',
    from: 'hiro@example.com',
    subject: 'Plus plan · referral: 友達の紹介',
    category: 'Plus',
    urgency: 'MEDIUM',
    branch: null,
    reply: 'welcome email',
  },
  {
    id: 'ivy',
    from: 'ivy.obrien@example.com',
    subject: "Pro plan · referral: O'Brien family discount",
    category: 'Pro',
    urgency: 'HIGH',
    branch: null,
    reply: 'welcome email',
  },
  {
    // THE DEGRADED PATH. No name, and a plus-alias address that is perfectly valid and
    // looks wrong to people who have not met one. Both have to survive: a row with an
    // empty Name cell and the other four columns where they belong, and a welcome mail
    // that reads properly without a name in it.
    id: 'noname',
    from: 'dana+trial@example.com',
    subject: 'Basic plan · name box left empty · referral: No name given',
    category: 'Basic',
    urgency: 'LOW',
    branch: null,
    reply: 'welcome email',
  },
];

/**
 * Narration overrides for the Run.
 *
 * The engine's defaults are written for email triage — "New email from…", a category and
 * an urgency, a Switch taking a branch. None of that applies, so the lines this flow can
 * actually reach are reworded here. Nothing about the walk changes.
 *
 * `parse` is the passthrough line, and the rate fetch is the only passthrough node in this
 * flow. `actionSend` fires on the FIRST action-category node the walk reaches, which the
 * flow order guarantees is the sheet.
 */
export const simulation = {
  onNew: 'A new signup arrives from {from} — {subject}',
  noTrigger: 'Nothing is listening for a form submission, so the flow never starts.',
  trigger: '{label} fires the moment the form is submitted.',
  parse: '{label} asks the rate service what a dollar is worth in rupees today.',
  actionSend: '{targetLabel} writes the row for {from} on the {category} plan, rate included.',
  action: 'Row written.',
  deadEnd: 'The flow stops here, so this signup is never logged and the person never hears back.',
};

/**
 * Stress Testing: behaviour at the edges, not recall.
 *
 * One question per gap worth knowing about — the signup that arrives with a field empty,
 * a setting whose name suggests the opposite of what it does, and what happens when the
 * order is wrong. None can be answered by remembering which node went where.
 *
 * Graded against `correctIndex`, so the screen shuffles display order per session and
 * each option carries its authored index. Authored at 2, 3 and 1.
 */
export const evalQuestions = [
  {
    id: 'blank-name',
    caseId: 'noname',
    prompt:
      'The last signup of the batch comes in with the name box empty. Everything else is filled in. What does your flow do with it?',
    options: [
      'The other three answers slide up a column, so the referral text lands under the plan heading',
      'The append fails on the missing value, the run stops, and the signup is lost with nobody told',
      'The row lands with an empty Name cell, the other columns where they belong, and the welcome email still goes out',
      'The row lands, but no welcome email is sent, because there is nobody to address it to',
    ],
    correctIndex: 2,
    explanation:
      'A blank optional answer is still a value — an empty one. Every column is mapped by heading, not by position, so nothing shifts: the Name cell is simply empty and Email, Plan, Referral Source and the rate all sit where they should. Nothing errors, because nothing was required. And the greeting was written to fall back when there is no name, so the mail goes out reading properly. That is what handling a blank looks like: the signup still lands and the person still hears back. A flow that treats the blank as a failure loses a trial and tells nobody it did.',
  },
  {
    id: 'execute-once',
    prompt:
      'Thirteen signups move through together. You switch on Execute Once on the node that fetches the rate, so it only calls the rate service once. What ends up on the sheet?',
    options: [
      'Thirteen rows, all carrying the same rate — which is what you wanted',
      'Thirteen rows, twelve of them with an empty rate column',
      'Thirteen rows, each with a slightly different rate, because the service is still called per signup',
      'One row. The node runs on the first signup only and passes one item on, so the other twelve never reach the sheet',
    ],
    correctIndex: 3,
    explanation:
      'Execute Once does not mean "fetch once and share the answer". It means run this node using only the first input item, and its output is that one item — so everything after it sees one signup. Twelve people get no row and no welcome mail, and nothing errors, so nothing tells you. Leaving it off costs thirteen small API calls, which for a signup form is nothing, and every signup gets its row and its rate.',
  },
  {
    id: 'row-before-rate',
    prompt:
      'Suppose you wire the sheet straight after the form and hang the rate fetch off the end instead. Every node is configured correctly. What does the Signups sheet look like?',
    options: [
      'Every row complete. The rate fetch fills that column in once it finishes',
      'Every row has its four form answers and an empty USD_INR_Rate, because the row was written before the rate existed',
      'No rows at all, because the append fails with nothing to put in the rate column',
      'One row per signup, each carrying the rate fetched for the signup before it',
    ],
    correctIndex: 1,
    explanation:
      'A node can only use what the nodes before it handed over. Append the row first and there is no rate in the item yet, so the expression for that column resolves to nothing and the cell comes out blank — quietly, because an empty cell is not an error. Nothing goes back to fill it in afterwards; the row was written and the flow moved on. Order is not decoration here. It is the only reason the rate is in the item at all.',
  },
];
