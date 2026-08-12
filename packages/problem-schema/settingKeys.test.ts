import { describe, it, expect } from 'vitest';
import { SETTINGS_SPEC } from '../../apps/web/src/n8n/nodeSettings.js';
import { GRADED_SETTING_KEYS } from './settingKeys.ts';

describe('GRADED_SETTING_KEYS', () => {
  it('matches the settings the NDV can actually render', () => {
    // The editor renders SETTINGS_SPEC. A problem grading a key absent from it asks
    // a question the learner is never shown, so the two lists must agree exactly.
    expect([...GRADED_SETTING_KEYS].sort()).toEqual(SETTINGS_SPEC.map((s) => s.key).sort());
  });
});
