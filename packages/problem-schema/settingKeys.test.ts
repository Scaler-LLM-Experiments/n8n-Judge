import { describe, it, expect } from 'vitest';
import { SETTINGS_SPEC } from '../../apps/web/src/n8n/nodeSettings.js';
import { GRADED_SETTING_KEYS, SETTING_DEPENDENCIES } from './settingKeys.ts';

describe('GRADED_SETTING_KEYS', () => {
  it('matches the settings the NDV can actually render', () => {
    // The editor renders SETTINGS_SPEC. A problem grading a key absent from it asks
    // a question the learner is never shown, so the two lists must agree exactly.
    expect([...GRADED_SETTING_KEYS].sort()).toEqual(SETTINGS_SPEC.map((s) => s.key).sort());
  });
});

describe('SETTING_DEPENDENCIES', () => {
  it('matches the `dependsOn` the NDV actually gates on', () => {
    // Same contract as above and the same failure if it drifts: `validateProblem()` refuses a
    // graded dependent setting whose parent is not graded true, so a `dependsOn` added to
    // SETTINGS_SPEC and not mirrored here is a gradable-but-unanswerable decision this side
    // cannot see, and one removed there is a false rejection of a legitimate case.
    const fromSpec = Object.fromEntries(
      SETTINGS_SPEC.filter((s) => s.dependsOn).map((s) => [s.key, s.dependsOn])
    );
    expect({ ...SETTING_DEPENDENCIES }).toEqual(fromSpec);
  });
});
