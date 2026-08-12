/**
 * The node settings a problem may grade.
 *
 * This mirrors `SETTINGS_SPEC` in `apps/web/src/n8n/nodeSettings.js`, which is what
 * the NDV actually renders. A package cannot import from `apps/`, so the list is
 * duplicated here and pinned by `settingKeys.test.ts` — a problem grading a key the
 * editor does not render asks a question the learner is never shown.
 */
export const GRADED_SETTING_KEYS = Object.freeze([
  'alwaysOutputData',
  'executeOnce',
  'retryOnFail',
  'maxTries',
  'waitBetweenTries',
  'onError',
  'notes',
  'notesInFlow',
]);
