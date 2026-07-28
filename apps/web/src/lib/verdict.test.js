import { describe, it, expect } from 'vitest';
import { resolveServerVerdict } from './verdict.js';

// The rule this exists to enforce: when the server does not answer, we do not
// know the verdict, and we must not invent one.
//
// Both directions were shipped and both were wrong. The NDV invented "wrong", so
// a right answer was marked wrong with no explanation. Understand and Stress
// Testing invented "correct" — so every option a learner clicked came back green,
// which is the worse of the two by a distance: it teaches the wrong thing and
// hands out a score nobody earned.

describe('resolveServerVerdict', () => {
  it('uses the server verdict when there is one', () => {
    expect(resolveServerVerdict({ correct: true, why: 'because' })).toEqual({
      correct: true,
      why: 'because',
      unlocks: [],
      verified: true,
    });
    expect(resolveServerVerdict({ correct: false, why: 'no' }).correct).toBe(false);
  });

  it('passes through unlocks', () => {
    expect(resolveServerVerdict({ correct: true, unlocks: ['trigger'] }).unlocks).toEqual(['trigger']);
  });

  it('returns correct: null when the server did not answer', () => {
    const v = resolveServerVerdict(null);
    expect(v.correct).toBe(null);
    expect(v.verified).toBe(false);
  });

  it('never returns true for an unanswered check', () => {
    // The specific bug: `correct: true` here marked every option green.
    expect(resolveServerVerdict(null).correct).not.toBe(true);
  });

  it('never returns false for an unanswered check either', () => {
    // The mirror-image bug: `correct: false` marked a right answer wrong.
    expect(resolveServerVerdict(null).correct).not.toBe(false);
  });

  it('has no explanation to offer when unverified', () => {
    expect(resolveServerVerdict(null).why).toBe(null);
  });

  it('unlocks nothing when unverified — progress is not granted on a guess', () => {
    expect(resolveServerVerdict(null).unlocks).toEqual([]);
  });

  it('treats a server response missing `correct` as unverified, not as false', () => {
    // A malformed or partial response is "we do not know", the same as silence.
    expect(resolveServerVerdict({ why: 'hm' }).correct).toBe(null);
  });
});
