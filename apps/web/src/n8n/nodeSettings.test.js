import { describe, it, expect } from 'vitest';
import {
  SETTINGS_SPEC,
  SETTINGS_BY_KEY,
  settingsSpecFor,
  isVisible,
  defaultSettings,
} from './nodeSettings.js';

// These assertions are against real n8n, read from
// packages/frontend/editor-ui/src/features/ndv/shared/ndv.utils.ts at v2.33.0.
// See docs/n8n-reference/00-how-n8n-actually-works.md §5.
describe('SETTINGS_SPEC matches real n8n', () => {
  it('has n8n’s rows, in n8n’s order', () => {
    expect(SETTINGS_SPEC.map((s) => s.key)).toEqual([
      'alwaysOutputData',
      'executeOnce',
      'retryOnFail',
      'maxTries',
      'waitBetweenTries',
      'onError',
      'notes',
      'notesInFlow',
    ]);
  });

  it('starts every setting at n8n’s default', () => {
    expect(defaultSettings()).toEqual({
      alwaysOutputData: false,
      executeOnce: false,
      retryOnFail: false,
      maxTries: 3,
      waitBetweenTries: 1000,
      onError: 'stopWorkflow',
      notes: '',
      notesInFlow: false,
    });
  });

  // The engine clamps these identically (workflow-execute.ts:1797), so the form
  // must not offer a value the engine would silently rewrite.
  it('clamps retry values the way the engine does', () => {
    expect(SETTINGS_BY_KEY.maxTries.min).toBe(2);
    expect(SETTINGS_BY_KEY.maxTries.max).toBe(5);
    expect(SETTINGS_BY_KEY.waitBetweenTries.min).toBe(0);
    expect(SETTINGS_BY_KEY.waitBetweenTries.max).toBe(5000);
  });

  // This one was a real bug: the label said the opposite of what n8n does.
  // n8n passes the ERROR as an item on the regular output — it does not carry
  // the last valid data forward.
  it('uses n8n’s On Error labels', () => {
    expect(SETTINGS_BY_KEY.onError.options.map((o) => [o.value, o.label])).toEqual([
      ['stopWorkflow', 'Stop Workflow'],
      ['continueRegularOutput', 'Continue'],
      ['continueErrorOutput', 'Continue (using error output)'],
    ]);
  });
});

describe('settingsSpecFor — sub-nodes', () => {
  it('gives a regular node the full set', () => {
    expect(settingsSpecFor({ subNode: false })).toHaveLength(SETTINGS_SPEC.length);
  });

  // createCommonNodeSettings(isToolOrModelNode) emits only Notes for these.
  it('gives a sub-node only the note rows', () => {
    expect(settingsSpecFor({ subNode: true }).map((s) => s.key)).toEqual(['notes', 'notesInFlow']);
  });
});

describe('isVisible — n8n hides dependents, it does not dim them', () => {
  const maxTries = SETTINGS_BY_KEY.maxTries;

  it('hides Max Tries until Retry On Fail is on', () => {
    expect(isVisible(maxTries, { retryOnFail: false })).toBe(false);
    expect(isVisible(maxTries, { retryOnFail: true })).toBe(true);
  });

  it('always shows an unconditional row', () => {
    expect(isVisible(SETTINGS_BY_KEY.onError, {})).toBe(true);
  });

  // n8n declares no displayOptions on "Display Note in Flow?", so it shows even
  // with an empty note. We used to gate it on `notes`.
  it('shows Display Note in Flow with no note written', () => {
    expect(isVisible(SETTINGS_BY_KEY.notesInFlow, { notes: '' })).toBe(true);
  });

  // Grading something the learner cannot see is the hidden-required-field trap,
  // and here it would also deadlock the Settings stage.
  it('keeps a graded row visible even when its parent is off', () => {
    expect(isVisible(maxTries, { retryOnFail: false }, new Set(['maxTries']))).toBe(true);
  });
});
