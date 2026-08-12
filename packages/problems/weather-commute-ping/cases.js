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
    description: 'A Schedule Trigger starts the flow — nothing has to arrive.',
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
  onNew: '{from} — {subject}',
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
    prompt:
      'Three weeks of green runs and a correct message every morning. Then one morning the post arrives with the temperature and nothing else: no conditions in words, and no advice. The run is green, the service answered normally, and the next morning it is fine again. What happened, and where does the fix belong?',
    // Every option carries its own reason-why clause and they are within a few words of
    // each other in length. They were not: the correct one ran 35 words against a 22-word
    // maximum, so a learner who understood nothing could take all three of these questions
    // — the whole edge-case weight — by picking the longest. That is the same class of
    // defect as answer-position bias, and `balanceProblemOptions` deliberately does not
    // touch `evalQuestions`, so length has to be authored flat. The correct option was NOT
    // shortened to get there; the distractors were brought up into its register.
    options: [
      'The send step is reading field names that were never created, so it has been posting whatever it could find — and the fix belongs in the message, which is the only place that decides what actually goes out',
      'The service was slow and answered after the message had already gone out, so the values arrived too late to be used — and the fix is a longer timeout on the call, so it waits for a complete answer',
      'The service answered with a weather code the mapping does not list, so the lookup produced nothing — and the fix is another arm on the mapping, in the step that builds the two lines',
      'The forecast service changed the shape of its response, so the mapping is reading a field that has moved — and the fix is to call a different address that answers the way it used to',
    ],
    correctIndex: 2,
    explanation:
      'Nothing was broken. A lookup was asked for a key it does not have, and a lookup with nothing on the other side of it answers with nothing at all — no error, no warning, no failed run. The three mornings you built the mapping from were clear, cloudy and rainy, so those are the codes in the table; the world went on having other kinds of weather. The naive version looks perfect: three happy-path examples pass, the run is green, the message is well formed, and then one morning half of it simply is not there and he walks out into it. Your mapping table will never be exhaustive, because the world has more cases than your examples did. Planning for the gap is not defensive-programming pedantry; it is the difference between a workflow you can stop watching and one you cannot. The fix is one more arm on the same expression — when the code is not one you know, say so and name the number — and it belongs where the value is built, not in the send step, which faithfully posted what it was handed, and not at the service, which answered correctly.',
  },
  {
    id: 'service-down',
    // "Suppose Retry On Fail had been left off" rather than "is switched off": the learner
    // has just verified that setting green at `true`, so stating it as fact contradicts the
    // build they were graded on. It is a hypothetical, and it reads as one now.
    prompt:
      'A Tuesday. The forecast service is having a bad morning and answers the 9:00 call with a 503. Suppose Retry On Fail had been left off on that call. What does he see, and why does that matter more than it sounds?',
    // "nothing ON HIS PHONE tells him", not "nothing tells him". The failed execution really
    // does appear in n8n's own list, and a hosted instance may mail the owner about it — so
    // the unqualified claim was false about real n8n even though the explanation had it
    // right. An option has to be true on its own; nobody reads the explanation first.
    options: [
      'Nothing at all: the run stops at the failed call, no message is sent, and nothing on his phone tells him. The message arriving every morning is the only thing that could ever have told him something was wrong',
      'The flow carries on with the values empty, because a node that cannot answer hands an empty item to the one after it — so the message still arrives on time, with blanks in it where the weather should be',
      'The run is marked failed and n8n picks it up again by itself, the way a queue retries a failed job, so the message arrives a few minutes later than usual and he never notices the difference',
      'He gets the error in the channel instead of the weather, because a run that fails part-way still posts whatever it managed to produce before it stopped — so the channel tells him something went wrong',
    ],
    correctIndex: 0,
    explanation:
      'A node that errors ends the run, and everything after it never executes — so there is no message and no note explaining why. The failed execution is recorded in n8n\'s own list, and a hosted instance may even mail the owner about it, but he is not looking at either at ten past nine; he is looking at his phone. That is what the retry setting buys for the price of nothing: a service that blips is the ordinary case, this flow only gets one attempt a day, and two more tries a second apart turn a lost morning into a slightly slower one. The part worth carrying further is what the silence means. This flow posts every single morning, however dull the weather, so the absence of a message is information — it says something is wrong. Build it so that it only posts when the weather is worth mentioning and you throw that away: silence becomes the normal case, and a broken flow, an expired credential and a pleasant Tuesday all look identical from the outside. A daily message nobody strictly needs to read is also a heartbeat.',
  },
  {
    id: 'two-paths',
    // "What do you tell them?", not "What is wrong with it?". The old wording presupposed a
    // fault, which killed the strongest distractor — "Nothing at all…" — on grammar rather
    // than on understanding. The near-miss has to stay a live answer, because choosing
    // between "this is fine and readable" and "this is fine and will drift" IS the question.
    prompt:
      'A colleague builds the same flow, then adds an If after the step that builds the two lines, to separate rainy mornings from clear ones. Each path ends at its own send, both to the same channel. Their Run passes every case, and the messages are correct. They ask you to review it. What do you tell them?',
    options: [
      'The clear-morning path never fires, because an If only sends items out of its true output — so on a clear morning the item reaches the node and simply stops there, and he gets no message at all',
      'Both sends fire on every run, because an If passes the item down both of its outputs and lets each side decide what to do with it, so he gets two messages every morning and has to work out for himself which of the two applies today',
      'Nothing at all. Separating the two situations makes the flow easier to read for whoever inherits it, and either branch can be reworded on its own without disturbing the other, so a little duplication is a fair price to pay for that',
      'Nothing breaks — which is the trap. It is two sends to keep in step for a difference the message text already makes, so every wording change is now two edits, and the morning somebody makes only one of them, half the mornings are quietly wrong',
    ],
    correctIndex: 3,
    explanation:
      'This is the strongest wrong instinct in the case, because it is genuinely a branching thought: rain and heat and a clear sky are different situations, and it feels as though different situations want different paths. The test to apply is not "are these different?" but "does the DESTINATION change?" Here it does not. The message goes to the same channel every morning; what varies is the sentence, and sentences are built where values are built. So the If buys nothing and costs two things. It doubles the work every time the wording changes, and it invites the two copies to drift — which is the failure you cannot see, because both branches keep working, they just stop saying the same kind of thing. A branch that ends in the same place as its sibling was never really a branch. Worth knowing what would change the answer: if rain went to the channel and heat also had to reach somebody else, that is a real split, and then routing is exactly the right tool.',
  },
];
