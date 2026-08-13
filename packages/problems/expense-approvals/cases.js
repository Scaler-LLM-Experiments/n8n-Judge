// The finished flow, and everything the Run and Stress Testing measure against.
//
// `referenceGraph` is the correct build (it seeds the #run-story dev route).
// `sampleCases` stream through the learner's own graph during the Run — `branch: null`
// marks the case that intentionally matches no rule, which is what Stress Testing then
// asks about. `evalQuestions` grade against `correctIndex`, so the display order is
// shuffled per session and each option carries its authored index.

export const referenceGraph = {
  nodes: [
    { id: 'trigger-1', type: 'trigger', position: { x: 0, y: 180 }, requiredLabel: 'New Email' },
    { id: 'classify-1', type: 'classify', position: { x: 260, y: 180 }, requiredLabel: 'Classify with AI' },
    { id: 'model-1', type: 'chat-gemini', position: { x: 275, y: 340 }, requiredLabel: 'Gemini Chat Model' },
    { id: 'parse-1', type: 'parse', position: { x: 540, y: 180 }, requiredLabel: 'Parse Result' },
    { id: 'switch-1', type: 'switch', position: { x: 800, y: 180 }, requiredLabel: 'Switch' },
    // Three instances of ONE node type, which is why `nodeSetup.action` is shared: the
    // reply goes to the claimant on all three paths and only its wording differs.
    { id: 'action-approve', type: 'action', position: { x: 1080, y: 40 }, requiredLabel: 'Send Reply. Approved' },
    { id: 'action-manager', type: 'action', position: { x: 1080, y: 180 }, requiredLabel: 'Send Reply. With a Manager' },
    { id: 'action-missing', type: 'action', position: { x: 1080, y: 320 }, requiredLabel: 'Send Reply. Need More Detail' },
  ],
  edges: [
    { source: 'model-1', target: 'classify-1', targetHandle: 'ai_model' },
    { source: 'trigger-1', target: 'classify-1' },
    { source: 'classify-1', target: 'parse-1' },
    { source: 'parse-1', target: 'switch-1' },
    { source: 'switch-1', target: 'action-approve', branch: 'auto_approve' },
    { source: 'switch-1', target: 'action-manager', branch: 'manager_approval' },
    { source: 'switch-1', target: 'action-missing', branch: 'missing_info' },
  ],
};

// What "Run" checks structurally before it simulates. Each one is about one thing, and
// each description is shown to the learner as "what Run will check".
export const testCases = [
  {
    id: 'trigger-present',
    description: 'A New Email trigger starts the flow.',
    kind: 'structural',
    checks: { requiredNodeTypes: ['trigger'] },
  },
  {
    id: 'model-connected',
    description: 'A Chat Model is plugged into the Classify with AI node.',
    kind: 'structural',
    checks: {
      requiredNodeTypes: ['classify'],
      requiredEdges: [{ sourceCategory: 'model', targetType: 'classify', targetHandle: 'ai_model' }],
    },
  },
  {
    id: 'judge-then-parse',
    description: 'Each claim is judged by AI, and the answer is parsed into fields.',
    kind: 'structural',
    checks: {
      requiredNodeTypes: ['classify', 'parse'],
      requiredEdges: [
        { sourceType: 'trigger', targetType: 'classify' },
        { sourceType: 'classify', targetType: 'parse' },
      ],
    },
  },
  {
    id: 'split-on-the-decision',
    description: 'A Switch node splits the parsed claim by the decision it was given.',
    kind: 'structural',
    checks: {
      requiredNodeTypes: ['switch'],
      requiredEdges: [{ sourceType: 'parse', targetType: 'switch' }],
    },
  },
  {
    id: 'every-outcome-replies',
    description: 'All three outcomes reach a reply of their own (Auto Approve, Manager Approval, Missing Info).',
    kind: 'structural',
    checks: {
      requiredEdges: [
        { sourceType: 'switch', targetType: 'action', branch: 'auto_approve' },
        { sourceType: 'switch', targetType: 'action', branch: 'manager_approval' },
        { sourceType: 'switch', targetType: 'action', branch: 'missing_info' },
      ],
    },
  },
];

// The claims the Run streams through the learner's own flow, one after another.
// `branch` is the output each should take; null means it matches none.
//
// `urgency` is required by the schema and has no meaning in this problem — it was named
// for email triage, where it was a second thing the AI returned. Nothing here reads it:
// the `simulation` overrides below narrate the decision instead, and the figure a learner
// needs to reason about is in the subject line where they can see it. Values are set
// low-to-high with the amount so they are at least not misleading.
export const sampleCases = [
  {
    id: 'cab',
    from: 'ravi@scaler.com',
    subject: 'Cab to the Andheri office on Tuesday, 480 rupees, receipt below',
    category: 'Auto Approve',
    urgency: 'LOW',
    branch: 'auto_approve',
    reply: 'Auto Approve',
  },
  {
    id: 'laptop',
    from: 'meena@scaler.com',
    subject: 'Laptop for the new design hire, 92,400 rupees, invoice attached',
    category: 'Manager Approval',
    urgency: 'HIGH',
    branch: 'manager_approval',
    reply: 'Manager Approval',
  },
  {
    id: 'vague',
    from: 'arjun@scaler.com',
    subject: 'Please reimburse my travel from last week',
    category: 'Missing Info',
    urgency: 'MEDIUM',
    branch: 'missing_info',
    reply: 'Missing Info',
  },
  {
    // The deliberate gap. Somebody emails the claims address with something that is not
    // a claim at all, so the AI has no decision to give it and no branch matches. This is
    // what the first stress question is about, and it is the reason `fallback` is graded.
    id: 'payroll',
    from: 'nikhil@scaler.com',
    subject: 'Quick question, when does the July payroll actually run?',
    // Not one of the three decisions, on purpose: it is what the Run has to narrate for
    // mail the flow has no answer for, and it is the word the split fails to match.
    category: 'Unclear',
    urgency: 'LOW',
    branch: null,
    reply: null,
  },
];

/**
 * Narration overrides for the Run.
 *
 * The engine's defaults are written for email triage: they say "New email from…" and
 * print `{ category, urgency }`, which are not this problem's fields. Every placeholder
 * is filled from the sample case above, so this is wording only — the walk itself is
 * unchanged.
 */
export const simulation = {
  // "New mail", not "new claim": the fourth case is deliberately not a claim, and this
  // one line narrates all four.
  onNew: 'New mail from {from}. "{subject}"',
  trigger: '{label} fires the moment it lands.',
  aiRead: '{label} reads it and calls it {category}.',
  parse: '{label} → { decision: "{category}" }',
  switchNoMatch: '"{category}" matches none of the branches, so this one goes unanswered.',
  switchUnwired: 'The {reply} branch is the right one, but nothing is wired to it. This claim goes unanswered.',
  switchTake: '{label} sends it down the {reply} branch.',
  branchNoAction: 'That branch never reaches a reply, so the claimant hears nothing.',
  actionSend: '{targetLabel} answers {from}.',
  emptyReply: '{targetLabel} builds a reply from an empty item, so {from} gets a blank message.',
  switchAlwaysOutput:
    'Nothing matched, but Always Output Data is on. An empty item is pushed down the first branch anyway.',
  aiNoModelContinue:
    '{label} has no Chat Model, and On Error says continue. So the claim carries on with no decision on it.',
  aiNoModelErrorOutput:
    '{label} has no Chat Model, so it fails to its error output. Nothing is wired there, so this claim stops here, visibly.',
};

/**
 * Stress Testing: behaviour at the edges, not recall.
 *
 * One question per gap worth knowing about — the mail that matches nothing, the shortcut
 * of routing on the amount, and what a graded setting actually does when the node under
 * it fails. None of them can be answered by remembering which node went where.
 */
export const evalQuestions = [
  {
    id: 'not-a-claim',
    caseId: 'payroll',
    prompt:
      'Somebody emails the claims address to ask when payroll runs. It is not an expense claim at all. What does your flow do with it?',
    options: [
      'It is approved automatically, because the amount is under the limit',
      'It matches none of the three rules, so nothing is sent and nobody is told',
      'The flow errors and stops, and the claims behind it wait',
      'It goes to a manager, because the flow could not decide',
    ],
    correctIndex: 1,
    explanation:
      'Your split has three branches, one for each decision finance actually acts on. Mail that is not a claim at all fits none of them, so it matches nothing, falls through silently, and gets no reply. A real finance flow needs a catch-all branch, or a person watching the inbox for exactly this.',
  },
  {
    id: 'route-on-amount',
    prompt:
      'Suppose you split on the amount instead: 5,000 and over goes for sign off, everything else is approved. Which claim now goes the wrong way?',
    options: [
      'None. The amount and the decision always agree, so the result is the same',
      'A claim that never says how much it was for, because with no amount it reads as under the limit and gets approved',
      'Every claim, because an amount is text and cannot be compared as a number',
      'The ones with a receipt attached, because the figure is on the receipt and not in the text',
    ],
    correctIndex: 1,
    explanation:
      'The policy has two halves: is the claim complete, and is it under the limit. An amount comparison only answers the second one, and a claim with no amount at all quietly passes it. That is money going out on a claim nobody could check. The decision the AI already made carries both halves, which is why the split reads it and not the figure behind it.',
  },
  {
    id: 'model-pulled-out',
    prompt:
      'The Chat Model is disconnected, so Classify fails. Its On Error is set to Continue. What does the claimant get?',
    options: [
      'A reply approving the claim, because an empty decision falls to the first branch',
      'Nothing yet. The flow stops at the failed node and holds every claim behind it',
      'Nothing at all. The claim goes on with no decision, matches no branch, and no reply is sent',
      'A reply, eventually, because the node keeps retrying until the model is back',
    ],
    correctIndex: 2,
    explanation:
      'Continue passes the failure along as data rather than stopping, so the claim reaches the split carrying no decision. Nothing matches, and it disappears without a word to anybody. That is why the error output is worth the extra branch: a claim that failed should be visible somewhere, not silently gone.',
  },
];
