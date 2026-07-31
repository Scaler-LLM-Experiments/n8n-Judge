// The NDV (node detail view), per node TYPE — not per instance.
//
// Keyed by type, which has a consequence worth planning around: using the same type
// twice in one problem gives both instances the SAME panel and grades one decision that
// may only make sense for one of them. Use each type once unless the same configuration
// really is correct everywhere.
//
// A node is configured in two ordered stages: Parameters must verify green before the
// Settings tab unlocks, and setup needs both. Every field is graded server-side by
// `checkAnswer()` — the browser is never told which option is correct.
//
// Field kinds: select | text | number | boolean | expression | resourceLocator |
// ruleList | assignmentList. The last three are n8n's structurally-different shapes:
//   - resourceLocator grades `value` only, not the lookup mode used to reach it;
//   - ruleList / assignmentList are lists the learner BUILDS, so the authored answer
//     lives in `expect.rules` / `expect.assignments`, not in `correct`. Each is always
//     exactly three scored items (count, categories, conditions) — a variable-length
//     answer has no option count to decay against.
//
// `why` on each option is what Iris explains after a verify, for the option the learner
// actually chose. Write it for the wrong ones too; that is where the teaching is.
export const nodeSetup = {
  'TODO-catalog-type': {
    credential: 'TODO Account (pre-connected, shown locked)',
    /**
     * Rendered at real n8n defaults but not editable — fidelity without grading noise.
     * `{ label, value }`, exactly as the NDV shows it.
     */
    locked: [{ label: 'TODO Param', value: 'TODO fixed value' }],
    fields: [
      {
        key: 'TODO-field-key',
        label: 'TODO Field Label',
        kind: 'select',
        options: [
          { value: 'TODO-wrong', label: 'TODO Wrong', correct: false, why: 'TODO why this is wrong.' },
          { value: 'TODO-right', label: 'TODO Right', correct: true, why: 'TODO why this is right.' },
        ],
      },
    ],
    /**
     * Graded settings. Only what you list here is editable; the rest of SETTINGS_SPEC
     * renders at n8n defaults and locked. `onError` and `alwaysOutputData` change what a
     * Run narrates, so they are real decisions, not decoration.
     */
    settings: [
      {
        key: 'onError',
        options: [
          { value: 'stopWorkflow', correct: true, why: 'TODO why stopping is right here.' },
          { value: 'continueRegularOutput', correct: false, why: 'TODO what breaks if it continues.' },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // A ROUTER. Delete this whole block if your problem is linear.
  // ---------------------------------------------------------------------------
  // A `ruleList` is n8n's real Switch `rules` — a repeatable group the learner BUILDS, so
  // the node's shape becomes a consequence of its configuration: add a rule, get an
  // output. It is the most n8n-ish control in the product and the least like the others,
  // which is why it has its own slot here rather than a line in a comment.
  //
  // Three things differ from a `select`:
  //   1. The answer lives in `expect.rules`, not in `correct`. `validateProblem()` errors
  //      if `expect` names a key the options never offer — the learner could not build it.
  //   2. It is graded as exactly THREE items (count / categories / conditions), whatever
  //      the learner builds, because a variable-length answer has no option count to decay
  //      against. So `why` is a per-aspect map, and each aspect needs BOTH sides.
  //   3. Feedback is shown per ROW (which branch is wrong), derived from the same three
  //      verdicts server-side. Nothing to author for that — but it is why the `why` text
  //      should read as advice about one branch, not a summary of the list.
  //
  // `assignmentList` (Edit Fields `assignments`) is the same shape with `nameOptions` /
  // `valueOptions`, `expect.assignments`, and aspects `count / names / values`.
  'TODO-router-type': {
    fields: [
      {
        key: 'rules',
        label: 'TODO Routing rules',
        kind: 'ruleList',
        addLabel: 'Add Routing Rule',
        subtitle: 'TODO. One rule per branch, in the learner’s language.',
        /** The branch each rule can name. `value` must be a `branches[].id` from build.js. */
        branchOptions: [
          { value: 'TODO_branch_id', label: 'TODO Branch Label', correct: true, why: 'TODO why this is a real category.' },
          { value: 'TODO_never_produced', label: 'TODO Plausible Wrong', correct: false, why: 'TODO. Nothing upstream produces this label, so the branch could never fire.' },
        ],
        /** What each rule tests: the field, the operator, the value. */
        leftOptions: [
          { value: 'TODO-right-field', label: '{{ $json.TODO }}', correct: true, why: 'TODO why this is the value to split on.' },
          { value: 'TODO-wrong-field', label: '{{ $json.TODO }}', correct: false, why: 'TODO why this is the wrong signal.' },
        ],
        operatorOptions: [
          { value: 'equals', label: 'is equal to', correct: true, why: 'TODO why an exact match is right here.' },
          { value: 'contains', label: 'contains', correct: false, why: 'TODO what a looser match would also catch.' },
        ],
        rightOptions: [
          { value: 'TODO Label', label: 'TODO Label', correct: true, why: 'TODO why this matches what the AI produces.' },
          { value: 'TODO Wrong', label: 'TODO Wrong', correct: false, why: 'TODO why this never matches.' },
        ],
        /** The correct list. One entry per branch, and every key must be offered above. */
        expect: {
          rules: [
            { outputKey: 'TODO_branch_id', left: 'TODO-right-field', operator: 'equals', right: 'TODO Label' },
          ],
        },
        /** One per aspect, both verdicts. A missing side is a verdict with nothing to say. */
        why: {
          count: {
            correct: 'TODO. Why this number of branches is exactly right.',
            wrong: 'TODO. What to count — and what happens to an email with nowhere to go.',
          },
          categories: {
            correct: 'TODO. Why these are the names.',
            wrong: 'TODO. Where the real category names come from, without listing them.',
          },
          conditions: {
            correct: 'TODO. Why each branch tests this.',
            wrong: 'TODO. What to look at upstream, without naming the field.',
          },
        },
      },
      /**
       * CONDITIONAL fields: n8n's `displayOptions.show`, authored as `showWhen`.
       *
       * A map of other-field-key → accepted values. Every key must match and any listed
       * value satisfies a key. Built and tested (`fieldVisibility.ts`); no shipped problem
       * uses it yet, so this is the example rather than a precedent.
       *
       * It changes GRADING, not just rendering, because n8n's own rule is that a required
       * parameter only counts as missing while it is displayed:
       *   - "Verify setup" must only require fields the learner can currently see;
       *   - the rubric must not score a hidden field against them;
       *   - a field that becomes hidden has its VALUE DROPPED — n8n stores only displayed
       *     parameters, so keeping it would submit an answer to a question no longer asked.
       * All three are handled for you. Delete this field if you do not need it.
       */
      {
        key: 'TODO-follow-up-key',
        label: 'TODO Only Asked Sometimes',
        kind: 'select',
        showWhen: { 'TODO-field-key': ['TODO-right'] },
        options: [
          { value: 'TODO-right', label: 'TODO Right', correct: true, why: 'TODO.' },
          { value: 'TODO-wrong', label: 'TODO Wrong', correct: false, why: 'TODO.' },
        ],
      },
    ],
  },
};
