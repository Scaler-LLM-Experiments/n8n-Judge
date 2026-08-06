// The finished flow, and everything the Run and Stress Testing measure against.
//
// `referenceGraph` is the correct build (it seeds the #run-story dev route and is what
// the importable n8n workflow is generated from). `sampleCases` stream through the
// learner's OWN graph during the Run — `branch: null` marks the request that
// intentionally matches no rule, which is what Stress Testing then asks about.
// `evalQuestions` grade against `correctIndex`, so display order is shuffled per session
// and each option carries its authored index.

/**
 * The CORRECT build, laid out left to right the way a learner builds it.
 *
 * Seven nodes, one per type. Three branches, each ending at exactly one terminal: the
 * simulator returns at the first action-category node it reaches, so a chained second
 * terminal would never appear in a run, and `nodeSetup` is keyed by type, so a second
 * Gmail would share one answer key with the first.
 *
 * Edges use the readable vocabulary — `branch: 'id'` for a router output, `targetHandle:
 * 'ai_model'` for the model slot — and `hasConnection()` translates that into n8n's real
 * shape (output index / connector name).
 */
export const referenceGraph = {
  nodes: [
    { id: 'form-1', type: 'form-trigger', position: { x: 0, y: 200 }, requiredLabel: 'On form submission' },
    { id: 'extract-1', type: 'information-extractor', position: { x: 300, y: 200 }, requiredLabel: 'Information Extractor' },
    { id: 'model-1', type: 'openai-chat-model', position: { x: 315, y: 400 }, requiredLabel: 'OpenAI Chat Model' },
    { id: 'switch-1', type: 'switch', position: { x: 660, y: 200 }, requiredLabel: 'Switch' },
    { id: 'sheets-1', type: 'google-sheets', position: { x: 1020, y: 50 }, requiredLabel: 'Google Sheets' },
    { id: 'gmail-1', type: 'gmail', position: { x: 1020, y: 200 }, requiredLabel: 'Gmail' },
    { id: 'slack-1', type: 'slack', position: { x: 1020, y: 350 }, requiredLabel: 'Slack' },
  ],
  edges: [
    { source: 'model-1', target: 'extract-1', targetHandle: 'ai_model' },
    { source: 'form-1', target: 'extract-1' },
    { source: 'extract-1', target: 'switch-1' },
    { source: 'switch-1', target: 'sheets-1', branch: 'log' },
    { source: 'switch-1', target: 'gmail-1', branch: 'email' },
    { source: 'switch-1', target: 'slack-1', branch: 'needs_human' },
  ],
};

/**
 * What "Run" checks structurally before it simulates. Each one is about one thing, and
 * each description is shown to the learner as "what Run will check" — so they state
 * structure and never a graded parameter answer.
 */
export const testCases = [
  {
    id: 'trigger-present',
    description: 'A form submission starts the flow.',
    kind: 'structural',
    checks: { requiredNodeTypes: ['form-trigger'] },
  },
  {
    id: 'model-connected',
    description: 'A language model is plugged into the reading step.',
    kind: 'structural',
    checks: {
      requiredNodeTypes: ['information-extractor'],
      requiredEdges: [{ sourceCategory: 'model', targetType: 'information-extractor', targetHandle: 'ai_model' }],
    },
  },
  {
    id: 'read-then-split',
    description: 'Each submission is read into named values, and those values reach the split.',
    kind: 'structural',
    checks: {
      requiredNodeTypes: ['information-extractor', 'switch'],
      requiredEdges: [
        { sourceType: 'form-trigger', targetType: 'information-extractor' },
        { sourceType: 'information-extractor', targetType: 'switch' },
      ],
    },
  },
  {
    id: 'log-path',
    description: 'The Log only way out reaches the Ops Log spreadsheet.',
    kind: 'structural',
    checks: {
      requiredEdges: [{ sourceType: 'switch', targetType: 'google-sheets', branch: 'log' }],
    },
  },
  {
    id: 'email-path',
    description: 'The Email only way out reaches the mail step.',
    kind: 'structural',
    checks: {
      requiredEdges: [{ sourceType: 'switch', targetType: 'gmail', branch: 'email' }],
    },
  },
  {
    id: 'human-path',
    description: 'The Needs a human way out reaches Slack, and nothing else happens on it.',
    kind: 'structural',
    checks: {
      requiredEdges: [{ sourceType: 'switch', targetType: 'slack', branch: 'needs_human' }],
    },
  },
];

/**
 * The requests the Run streams through the learner's own flow, one after another.
 * `branch` is the way out each should take; null means it matches none.
 *
 * `from` and `subject` are named for email because the first problem was email triage.
 * Read them here as "who submitted it" and "what they typed into the box". `urgency` is
 * required by the schema and nothing in this problem reads it — the `simulation`
 * overrides below narrate the type instead.
 *
 * Two of these are deliberately near-identical in shape and different in what they
 * expose: `quote` sends to an outside domain, so wiring the wrong address is visible;
 * `audit` sends to a colleague at the same company, so the same wiring bug looks
 * perfectly normal. Keep both — the contrast is the teaching.
 */
export const sampleCases = [
  {
    id: 'lead',
    from: 'arjun@fernwoodrobotics.com',
    subject:
      'Log a new distributor lead — Riya Kapoor at Kapoor Automation, she’s interested in the Pro plan. riya@kapoorautomation.in',
    category: 'log',
    urgency: 'MEDIUM',
    branch: 'log',
    reply: 'Log only',
  },
  {
    id: 'feedback',
    from: 'deepa@fernwoodrobotics.com',
    subject:
      'Record feedback from Sean O’Brien: onboarding was smooth, the docs were thin, and the packaging was, frankly, excellent.',
    category: 'log',
    urgency: 'LOW',
    branch: 'log',
    reply: 'Log only',
  },
  {
    id: 'quote',
    from: 'deepa@fernwoodrobotics.com',
    subject: 'Email Riya Kapoor at riya@kapoorautomation.in and let her know the Pro plan quote is ready.',
    category: 'email',
    urgency: 'MEDIUM',
    branch: 'email',
    reply: 'Email only',
  },
  {
    id: 'audit',
    from: 'neha@fernwoodrobotics.com',
    subject: 'Email alex@fernwoodrobotics.com and remind him the Q3 parts audit is due this Friday.',
    category: 'email',
    urgency: 'HIGH',
    branch: 'email',
    reply: 'Email only',
  },
  {
    id: 'question',
    from: 'tom@fernwoodrobotics.com',
    subject: 'What kinds of things can the ops desk actually do for me?',
    category: 'needs_human',
    urgency: 'LOW',
    branch: 'needs_human',
    reply: 'Needs a human',
  },
  {
    id: 'deletion',
    from: 'arjun@fernwoodrobotics.com',
    subject:
      'Please delete Riya Kapoor’s row from the Ops Log — she emailed this morning to say she isn’t interested and wants her details removed.',
    category: 'needs_human',
    urgency: 'HIGH',
    branch: 'needs_human',
    reply: 'Needs a human',
  },
  {
    // The deliberate gap. Somebody asks for two things in one sentence, and the reading
    // step is asked for exactly one type — so it answers with something that is not one
    // of the three, and no rule claims it. This is what the first stress question is
    // about, and it is why `alwaysOutputData` on the split is worth grading.
    id: 'both-at-once',
    from: 'meera@fernwoodrobotics.com',
    subject: 'Log Riya Kapoor’s new number and email her to confirm we’ve got it.',
    category: 'both',
    urgency: 'MEDIUM',
    branch: null,
    reply: null,
  },
];

/**
 * Narration overrides for the Run.
 *
 * The engine's defaults are written for email triage — they say "New email from…" and
 * print `{ category, urgency }`, neither of which is this problem's vocabulary. Every
 * placeholder is filled from the sample case above, so this is wording only; the walk
 * itself is unchanged.
 *
 * The reading step narrates through `parse`, not `aiRead`: its catalog category is core,
 * so the engine walks it as a passthrough rather than as an AI node.
 */
export const simulation = {
  onNew: 'New Ops Desk request from {from} — "{subject}"',
  trigger: '{label} fires the moment they press submit.',
  parse: '{label} reads the box and calls it {category}.',
  switchNoMatch: '"{category}" matches none of the rules, so this request stops right here.',
  switchUnwired: 'The {reply} way out is the right one, but nothing is wired to it — this request goes nowhere.',
  switchTake: '{label} sends it out through {reply}.',
  branchNoAction: 'That way out never reaches anything, so nothing happens to this request.',
  actionSend: '{targetLabel} does its one job, and nothing else happens to this request.',
  emptyReply: '{targetLabel} runs on an empty item, so it acts on a request nobody made.',
  switchAlwaysOutput:
    'Nothing matched, but Always Output Data is on — an empty item is pushed down the first way out anyway.',
  deadEnd: 'The flow stops here — nothing is connected next.',
};

/**
 * Stress Testing: behaviour at the edges, not recall.
 *
 * One question per gap worth knowing about — the request no rule claims, the request the
 * desk cannot perform, and the wiring bug that half the test set hides. None of them can
 * be answered by remembering which node went where.
 */
export const evalQuestions = [
  {
    id: 'unmatched-type',
    caseId: 'both-at-once',
    prompt:
      'Meera asks for two things in one sentence. The reading step is asked for exactly one type, so it answers with something that is not one of your three. What does your flow do with that request?',
    options: [
      'It leaves through the first way out, because that is what an unmatched item defaults to',
      'The run stops with an error, and every request behind it waits',
      'Nothing at all: no row, no message, no error — and nobody finds out',
      'It goes to the channel, because anything unusual belongs in front of a person',
    ],
    correctIndex: 2,
    explanation:
      'Your three rules are exact matches on three exact values. A fourth value is claimed by none of them, so the request reaches the split and stops there — no row, no mail, no Slack message, and no failure to look at afterwards. The only trace is a form response nobody acted on. That is why being explicit with the reading step about what to answer when a request fits neither is worth a graded decision of its own: it is what stops a fourth value ever turning up.',
  },
  {
    id: 'deletion-as-log',
    caseId: 'deletion',
    prompt:
      'Arjun asks for Riya Kapoor’s row to be removed from the Ops Log. It names the Ops Log and it uses the word "emailed", so it reads like both of the other two. Suppose the reading step calls it a record-this. What lands?',
    options: [
      'Nothing — the flow cannot delete, so it skips the request',
      'A brand new row about Riya Kapoor is added, and it looks like every other row on the sheet',
      'Riya Kapoor’s existing row is overwritten with the new details',
      'The spreadsheet step fails, because removing a row is not something it can do',
    ],
    correctIndex: 1,
    explanation:
      'The path that runs is whichever one the type names, and that path only knows how to add. So a request to take somebody’s details off the sheet produces a second copy of them — the exact opposite of what was asked, with nothing to raise an alarm. This flow has no way to remove anything, and the honest answer to a request it cannot perform is to put it in front of a person rather than do the nearest thing it can.',
  },
  {
    id: 'requester-vs-subject',
    prompt:
      'Both of the send-it-on requests were submitted by one person asking that a message reach somebody else. Suppose the outgoing address were wired to the form’s "Your email" answer instead. What would you actually see?',
    options: [
      'Both would fail, because a form answer is not a valid recipient',
      'Both would still be right — the two addresses on a request always belong to the same person',
      'Only the one naming an outside address would be affected; the internal one would be unchanged',
      'Both would go out, both would be wrong, and only one of them would look wrong — the other lands on a colleague and reads like ordinary internal mail',
    ],
    correctIndex: 3,
    explanation:
      'Nothing errors. Deepa asked for a quote to reach Riya at kapoorautomation.in and gets it herself, which is visibly odd. Neha asked for a reminder to reach Alex and gets it herself too — and since both of them are at fernwoodrobotics.com, that one reads like any other internal mail and could run for months. The bug is not that it breaks; it is that it works, and half your test set hides it. That is what a request that crosses a company boundary is for.',
  },
];
