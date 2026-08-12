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

/**
 * Settings the NDV only lets a learner touch while another setting is switched ON — n8n's
 * `displayOptions.show`, and `SETTINGS_SPEC`'s `dependsOn`. Key → the setting it depends on.
 *
 * This exists because there is no `showWhen` for settings the way there is for fields
 * (`fieldVisibility.ts`), and `rubric.ts`'s `enumerateItems` puts **every** `nodeSetup[].settings`
 * entry in the config denominator unconditionally. So grading `maxTries` without also grading
 * `retryOnFail` at `true` asks for an answer the control never becomes editable to give: the
 * decision sits in the denominator, nobody can earn it, and every learner is capped below 100%
 * by an authoring slip — the same class of defect as `nodesetup-orphan`.
 *
 * Mirrored from `apps/web/src/n8n/nodeSettings.js` for the same reason as the list above (a
 * package cannot import from `apps/`), and pinned to it by `settingKeys.test.ts`.
 */
export const SETTING_DEPENDENCIES: Readonly<Record<string, string>> = Object.freeze({
  maxTries: 'retryOnFail',
  waitBetweenTries: 'retryOnFail',
});
