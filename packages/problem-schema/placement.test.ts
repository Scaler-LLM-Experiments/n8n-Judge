import { describe, it, expect } from 'vitest';
import { problems } from '@judge/problems';
import { checkAnswer } from './answerCheck.ts';

// Placement was the one graded surface with no server check at all: a correct
// pick recorded nothing, so the Build score had no data source. `id` is the slot
// the learner was filling; `answer` is the node type they dropped into it.
describe('checkAnswer — placement', () => {
  const p = problems['email-triage'];

  it('accepts a node type the workflow actually requires', () => {
    expect(checkAnswer(p, { kind: 'placement', id: 'switch', answer: 'switch' }).correct).toBe(true);
  });

  it('rejects a node the workflow does not need at all', () => {
    const res = checkAnswer(p, { kind: 'placement', id: 'switch', answer: 'google-docs' });
    expect(res.correct).toBe(false);
    // A wrong answer, NOT tampering — it has to record as a scorable decision,
    // because `suspicious_check` events are excluded from the score.
    expect(res.unknown).toBeFalsy();
  });

  it('rejects a required node dropped into the wrong slot', () => {
    // `action` is needed by this problem, but not where a Switch belongs.
    const res = checkAnswer(p, { kind: 'placement', id: 'switch', answer: 'action' });
    expect(res.correct).toBe(false);
    expect(res.unknown).toBeFalsy();
  });

  it('flags a slot the problem never declared as tampering, not as a wrong answer', () => {
    expect(checkAnswer(p, { kind: 'placement', id: 'not-a-node', answer: 'not-a-node' }).unknown).toBe(true);
  });
});
