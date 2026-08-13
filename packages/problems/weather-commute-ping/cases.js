// The finished flow, and everything the Run and Stress Testing measure against.
//
// `referenceGraph` is the correct build (it seeds the #run-story dev route).
// `sampleCases` stream through the learner's own graph during the Run.
// `evalQuestions` grade against `correctIndex`, so the display order is shuffled per
// session and each option carries its authored index.

export const referenceGraph = {
  nodes: [
    { id: 'schedule-1', type: 'schedule', position: { x: 0, y: 200 }, requiredLabel: 'Schedule Trigger' },
    // No `values` needed on any node here. That line exists on cases where an app node
    // is configured to READ mid-flow (`passthroughWhen`), because otherwise the engine
    // resolves it as a terminal. `http-request` and `edit-fields` are both `core`, which
    // resolves to passthrough whatever they are configured to do, and only Slack is an
    // `action` — so this chain walks all four nodes with nothing declared.
    { id: 'http-1', type: 'http-request', position: { x: 280, y: 200 }, requiredLabel: 'HTTP Request' },
    { id: 'set-1', type: 'edit-fields', position: { x: 560, y: 200 }, requiredLabel: 'Edit Fields (Set)' },
    { id: 'slack-1', type: 'slack', position: { x: 840, y: 200 }, requiredLabel: 'Slack' },
  ],
  edges: [
    { source: 'schedule-1', target: 'http-1' },
    { source: 'http-1', target: 'set-1' },
    { source: 'set-1', target: 'slack-1' },
  ],
};

// What "Run" checks structurally before it simulates. Each one is about one thing, and
// each description is shown to the learner as "what Run will check" — after the build, so
// naming the nodes here gives nothing away.
export const testCases = [
  {
    id: 'clock-starts-it',
    description: 'A Schedule Trigger starts the flow. Nothing has to arrive.',
    kind: 'structural',
    checks: { requiredNodeTypes: ['schedule'] },
  },
  {
    id: 'forecast-fetched',
    description: 'The schedule leads into an HTTP Request, so this morning\'s numbers come into the flow.',
    kind: 'structural',
    checks: {
      requiredNodeTypes: ['http-request'],
      requiredEdges: [{ sourceType: 'schedule', targetType: 'http-request' }],
    },
  },
  {
    id: 'numbers-become-words',
    description: 'The response reaches an Edit Fields node, where the two lines of the message are built.',
    kind: 'structural',
    checks: {
      requiredNodeTypes: ['edit-fields'],
      requiredEdges: [{ sourceType: 'http-request', targetType: 'edit-fields' }],
    },
  },
  {
    id: 'posted-once',
    description: 'The two built values reach Slack, and Slack is the last node.',
    kind: 'structural',
    checks: {
      requiredNodeTypes: ['slack'],
      requiredEdges: [{ sourceType: 'edit-fields', targetType: 'slack' }],
    },
  },
];

/**
 * The mornings the Run streams through the learner's own flow.
 *
 * `sampleCaseSchema` is still message-shaped — it wants `from`, `subject`, `category` and
 * `urgency` on every case — and a scheduled pull has no sender. So `from` is what is
 * being read and `subject` is what that answer says, which is what the Run narration
 * renders and is honest about what the case actually is. `urgency` is required by the
 * schema and nothing in this problem reads it.
 *
 * `branch: null` on ALL FOUR, because there is no router: the flow declares no branches,
 * so no case can select one and `simulateAll` falls back to requiring every case to
 * deliver — which is exactly right, since every morning has to produce a message.
 * `validateProblem()` warns about the fall-through and `case:audit` will warn
 * `gap-case-undecidable`; both warnings are correct and expected on a linear case, and
 * neither is the gap. **The gap is the thunderstorm below**: a perfectly valid response
 * carrying a code the mapping does not list, which fails by producing nothing rather than
 * by failing. It is graded in the build (the mapping's own value options) and asked again
 * in Stress Testing, from the symptom rather than the cause.
 *
 * All four are here, unlike the sample cases of the other scheduled case: nothing in this
 * flow turns on how many items there are — one response in, one message out — so the
 * engine can carry every one of them.
 */
export const sampleCases = [
  {
    id: 'clear-mild',
    from: 'Open-Meteo forecast',
    subject: 'Bangalore · 9:00 check · 24°C, weather code 0',
    category: 'weather_clear',
    urgency: 'LOW',
    branch: null,
    reply: 'the morning line goes out',
  },
  {
    id: 'light-rain',
    from: 'Open-Meteo forecast',
    subject: 'Bangalore · 9:00 check · 19°C, weather code 61',
    category: 'weather_rain',
    urgency: 'MEDIUM',
    branch: null,
    reply: 'the morning line goes out',
  },
  {
    // The same code as the first morning and a very different commute. Whether the
    // advice reads the temperature as well as the code is a graded decision, and this
    // is the morning that decides it.
    id: 'clear-hot',
    from: 'Open-Meteo forecast',
    subject: 'Bangalore · 9:00 check · 38°C, weather code 0',
    category: 'weather_heat',
    urgency: 'HIGH',
    branch: null,
    reply: 'the morning line goes out',
  },
  {
    // The awkward one. A valid answer from a service that did its job, carrying a code
    // that is not in the mapping — so the naive build produces a message with nothing
    // in half of it, and no error anywhere. The `reply` states the requirement and not
    // the mechanism.
    id: 'thunderstorm',
    from: 'Open-Meteo forecast',
    subject: 'Bangalore · 9:00 check · 27°C, weather code 95',
    category: 'weather_storm',
    urgency: 'MEDIUM',
    branch: null,
    reply: 'the morning line still goes out, and still says something',
  },
];

/**
 * Narration overrides for the Run.
 *
 * The engine's defaults are written for email triage — "New email from…", "reads it as
 * {category} · {urgency}" — and none of those are this problem's words. Wording only: the
 * walk itself is unchanged.
 *
 * `parse` is the line for every passthrough step, and this flow has two of them (the
 * call and the mapping), so it has to be true of both. That is a limit of the engine's
 * narration rather than a choice.
 */
export const simulation = {
  onNew: '{from}. {subject}',
  noTrigger: 'Nothing starts this flow, so 9:00 comes and goes.',
  trigger: '{label} fires. Nothing had to arrive for it to.',
  parse: '{label} runs, and hands what it produced to the next step.',
  deadEnd: 'Nothing is wired after this, so the line stops here and he never sees it.',
  actionSend: '{targetLabel} puts the line where he will read it.',
  action: 'The morning line is posted.',
};

/**
 * Stress Testing: behaviour at the edges, not recall.
 *
 * Three questions, which is what the decision budget allows and what the case has to
 * say. Each one is about something the Run cannot show:
 *
 *   1. the morning the mapping has no answer — asked from the SYMPTOM, so a learner who
 *      built the fallback still has to explain why it was needed;
 *   2. the morning the service does not answer at all, which is what the one graded
 *      setting on the call buys, and which is also the argument against "only send when
 *      the weather matters";
 *   3. the extra path that breaks nothing, which is the strongest wrong instinct in the
 *      case and the only one that survives a green Run.
 *
 * Two rules were applied to all three. Nothing here can be answered by reciting earlier
 * copy: the probes on `filter` and `if` deliberately stop at the mechanism and ask the
 * question rather than answering it, and the statement states requirements rather than
 * outcomes. And no question rests on a mechanism this repo cannot verify — in particular
 * none of them turns on how n8n RENDERS a value that resolved to nothing, only on the
 * fact that the lookup produced nothing to render.
 */
export const evalQuestions = [
  {
    id: 'blank-note',
    // A colleague's flow, not the learner's own. A learner cannot finish the build phase
    // until the mapping verifies green WITH its fallback arm, so the symptom described
    // here cannot occur in the flow they were just graded on.
    prompt:
      'A colleague builds the same flow. It runs green for three weeks. Then one morning their post shows the temperature and nothing else. The next morning it is fine again. What happened?',
    // Word counts are 27 / 23 / 25 correct / 23. Kept deliberately close, and the correct
    // one is not the longest: these were 33 to 40 words with the correct answer longest in
    // every question, so "pick the longest" scored full marks on the whole 20% edge-case
    // weight without understanding anything.
    options: [
      'The send step reads field names that were never created, so it posts whatever it can find. Fix it in the send step, which decides the message',
      'The service answered too late, after the message had already gone out, so the values arrived unused. Fix it with a longer timeout',
      'The service sent a code the mapping does not list, so the lookup produced nothing. Fix it in the step that builds the two lines',
      'The service changed the shape of its response, so the mapping reads a field that has moved. Re-point it at the new one',
    ],
    correctIndex: 2,
    explanation:
      'A lookup table is a list of the cases you thought of. This one covers the codes he sees most mornings, and the world has more. When a code is not in it, the lookup returns nothing: no error, no failed run, just a message with a hole in it. That is why three green weeks proved nothing. The fix is a second arm on the mapping, so an unlisted code still produces a line he can act on.',
  },
  {
    id: 'service-down',
    // A hypothetical, because the learner's own build grades retryOnFail at true. Stated
    // as "suppose it had been left off" rather than as a fact about their flow.
    prompt:
      'A Tuesday. The forecast service answers the 9:00 call with a 503. Suppose Retry On Fail had been left off. What does he see, and why does that matter?',
    // 22 correct / 24 / 25 / 21.
    options: [
      'Nothing at all. The run stops at the failed call, so no message is sent, and nothing on his phone says so',
      'The flow carries on with empty values, because a node that cannot answer hands an empty item onward, so the message arrives with blanks',
      'n8n marks the run failed and picks it up again by itself, the way a queue retries a job, so the message is only late',
      'He gets the error in the channel instead of the weather, because a failed run still posts what it managed to produce',
    ],
    correctIndex: 0,
    explanation:
      'A node that errors ends the run. Everything after it never executes. There is no message, and no note explaining why. n8n records the failed execution, but he is not looking at n8n at ten past nine. The part worth carrying further is what the silence means. This flow posts every morning, however dull the weather, so a missing message is information: something is wrong. Build it to post only when the weather is worth mentioning and you throw that away.',
  },
  {
    id: 'two-paths',
    // "What do you tell them?" rather than "What is wrong with it?". The old wording
    // presupposed a fault, which eliminated the intended near-miss on grammar rather than
    // on understanding.
    prompt:
      'A colleague adds an If after the step that builds the two lines, to split rainy from clear mornings. Both paths end at their own send, same channel. It passes.',
    // 20 / 23 / 20 / 21 correct.
    options: [
      'The clear-morning path never fires, because an If only sends items out of its true output, so he gets nothing',
      'Both sends fire every run, because an If passes the item down both of its outputs, so he gets two messages every morning',
      'Nothing. Splitting the two situations makes the flow easier for whoever inherits it to read, and duplication is a fair price',
      'Nothing breaks, which is the trap. Two sends now have to stay in step for a difference the text already makes',
    ],
    correctIndex: 3,
    explanation:
      'Nothing breaks, and that is what makes it worth arguing about. The If is doing no routing. Both exits end in the same place, so the branch buys nothing the message text was not already saying. What it costs is upkeep. Every wording change is two edits now, and the first morning somebody makes only one of them, half the mornings are quietly wrong. A branch that ends where its sibling ends was never a branch.',
  },
];
