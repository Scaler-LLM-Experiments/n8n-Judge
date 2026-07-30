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
    /** Rendered at real n8n defaults but not editable — fidelity without grading noise. */
    locked: ['TODO-param-key'],
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
};
