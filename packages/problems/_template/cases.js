// The finished flow, and everything the Run and Stress Testing measure against.

/**
 * The CORRECT build. Positions matter — this seeds the #run-story dev route, so it should
 * lay out left-to-right the way a learner would build it. `requiredLabel` is what the
 * node must be for the Run to accept it.
 *
 * Edges use the readable vocabulary: `branch: 'id'` for a router output, `targetHandle:
 * 'ai_model'` for a model slot. `hasConnection()` translates that to n8n's real shape
 * (output index / connector name), so author the readable form.
 */
export const referenceGraph = {
  nodes: [
    { id: 'TODO-node-1', type: 'TODO-trigger-type', position: { x: 0, y: 180 }, requiredLabel: 'TODO Trigger Label' },
    { id: 'TODO-node-2', type: 'TODO-action-type', position: { x: 340, y: 180 }, requiredLabel: 'TODO Action Label' },
  ],
  edges: [
    { source: 'TODO-node-1', target: 'TODO-node-2' },
  ],
};

/** What "Run" checks structurally before it simulates. Keep each one about ONE thing. */
export const testCases = [
  {
    id: 'TODO-check-id',
    description: 'TODO. Stated as a fact about a correct build.',
    kind: 'structural',
    checks: { requiredNodeTypes: ['TODO-catalog-type'] },
  },
];

/**
 * The cases that stream through the learner's OWN graph during the Run, one at a time.
 *
 * `branch: null` marks a case that intentionally matches no rule — the gap Stress Testing
 * then asks about. Every problem worth its edge-case marks should have one.
 *
 * Iris narrates each of these (`run_case:<id>` in voice.js) and the line must open on the
 * TRIGGER — "a customer sends an email saying…" — because that is the node the learner
 * wired up. It must never name the destination; watching it land is the point.
 */
// Every field here is required by the schema. `urgency` is one of LOW | MEDIUM | HIGH,
// `branch` is a declared branch id or null, and `reply` is what that branch sends (null
// on a fall-through, because nothing is sent).
//
// `from` and `subject` are named for email because the first problem was email triage.
// A non-email challenge still fills them in — read them as "who this came from" and
// "what it says" — and they are what Iris's `run_case` line is written from.
export const sampleCases = [
  {
    id: 'TODO-case-id',
    from: 'TODO@example.com',
    subject: 'TODO. What arrives, in the sender’s own words.',
    category: 'TODO_CATEGORY',
    urgency: 'MEDIUM',
    branch: 'TODO_branch_id',
    reply: 'TODO Expected Reply',
  },
  {
    id: 'TODO-gap-case',
    from: 'TODO@example.com',
    subject: 'TODO. Something that matches none of the rules.',
    category: 'TODO_UNHANDLED',
    urgency: 'LOW',
    branch: null,
    reply: null,
  },
];

/**
 * Stress Testing: 2-4 questions about the flow the learner actually built.
 *
 * Graded against `correctIndex`, so the screen shuffles display order per session and
 * each option carries its authored index. `caseId` links a question to a sampleCase.
 *
 * Ask about BEHAVIOUR at the edges, not recall. The best ones point at the `branch: null`
 * case, at what a setting changes, or at what happens when something upstream fails.
 */
export const evalQuestions = [
  {
    id: 'TODO-question-id',
    caseId: 'TODO-gap-case',
    prompt: 'TODO. What happens when…?',
    options: ['TODO wrong', 'TODO wrong', 'TODO correct', 'TODO wrong'],
    correctIndex: 2,
    explanation: 'TODO. What really happens, and why that is the design.',
  },
];
