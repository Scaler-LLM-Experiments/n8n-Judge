import { describe, it, expect } from 'vitest';
import { createStore, recordDecision, understandingScore, misconceptionsHit, countsByKind } from './grading.js';

describe('grading store', () => {
  it('starts empty with a null score', () => {
    const s = createStore();
    expect(s.decisions).toEqual([]);
    expect(understandingScore(s)).toBe(null);
  });

  it('scores by first-try correctness', () => {
    let s = createStore();
    s = recordDecision(s, { id: 'a', kind: 'field', correct: true, firstTry: true });
    s = recordDecision(s, { id: 'b', kind: 'field', correct: true, firstTry: false }); // got it, but not first try
    s = recordDecision(s, { id: 'c', kind: 'nodePick', correct: false, firstTry: false });
    expect(understandingScore(s)).toBe(33); // 1 of 3 first-try-correct
  });

  it('ignores duplicate decision ids (keeps the first)', () => {
    let s = createStore();
    s = recordDecision(s, { id: 'a', kind: 'field', correct: false, firstTry: false });
    s = recordDecision(s, { id: 'a', kind: 'field', correct: true, firstTry: true });
    expect(s.decisions).toHaveLength(1);
    expect(s.decisions[0].correct).toBe(false);
  });

  it('collects deduped misconceptions', () => {
    let s = createStore();
    s = recordDecision(s, { id: 'a', kind: 'probe', correct: false, firstTry: false, misconception: 'chat-trigger-is-email' });
    s = recordDecision(s, { id: 'b', kind: 'field', correct: false, firstTry: false, misconception: 'route-on-urgency' });
    s = recordDecision(s, { id: 'c', kind: 'field', correct: true, firstTry: true });
    expect(misconceptionsHit(s)).toEqual(['chat-trigger-is-email', 'route-on-urgency']);
  });

  it('breaks counts down by kind', () => {
    let s = createStore();
    s = recordDecision(s, { id: 'a', kind: 'field', correct: true, firstTry: true });
    s = recordDecision(s, { id: 'b', kind: 'field', correct: false, firstTry: false });
    s = recordDecision(s, { id: 'c', kind: 'dissection', correct: true, firstTry: true });
    const c = countsByKind(s);
    expect(c.field).toEqual({ total: 2, firstTryCorrect: 1 });
    expect(c.dissection).toEqual({ total: 1, firstTryCorrect: 1 });
  });
});
