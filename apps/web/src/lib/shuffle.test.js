import { describe, it, expect, beforeEach } from 'vitest';
import { seededShuffle, shuffledEvalOptions } from './shuffle.js';

// jsdom isn't configured for this project, so stand in a minimal
// sessionStorage — the module reads one to keep order stable across reloads.
beforeEach(() => {
  const store = new Map();
  globalThis.window = {
    sessionStorage: {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, v),
    },
  };
});

const opts = (n) => Array.from({ length: n }, (_, i) => ({ value: `v${i}`, correct: i === 0 }));

describe('seededShuffle', () => {
  it('is stable for the same key — options must not move while being read', () => {
    const a = seededShuffle(opts(5), 'ndv:trigger:mailbox');
    const b = seededShuffle(opts(5), 'ndv:trigger:mailbox');
    expect(a.map((o) => o.value)).toEqual(b.map((o) => o.value));
  });

  it('differs across keys, so every field is not permuted identically', () => {
    const orders = ['a', 'b', 'c', 'd', 'e', 'f'].map((k) =>
      seededShuffle(opts(4), k)
        .map((o) => o.value)
        .join()
    );
    expect(new Set(orders).size).toBeGreaterThan(1);
  });

  it('keeps every option exactly once', () => {
    const out = seededShuffle(opts(6), 'k');
    expect(out).toHaveLength(6);
    expect(new Set(out.map((o) => o.value)).size).toBe(6);
  });

  it('does not mutate the input', () => {
    const input = opts(4);
    const before = input.map((o) => o.value);
    seededShuffle(input, 'k');
    expect(input.map((o) => o.value)).toEqual(before);
  });

  it('handles empty and single-option lists', () => {
    expect(seededShuffle([], 'k')).toEqual([]);
    expect(seededShuffle(undefined, 'k')).toEqual([]);
    expect(seededShuffle([{ value: 'only' }], 'k')).toHaveLength(1);
  });

  // The whole point: the correct answer must not sit at index 0 every time.
  it('moves the correct option off index 0 across a spread of keys', () => {
    const firstIsCorrect = Array.from({ length: 40 }, (_, i) =>
      seededShuffle(opts(4), `q${i}`)[0].correct
    );
    expect(firstIsCorrect.some((x) => x === false)).toBe(true);
  });
});

describe('shuffledEvalOptions', () => {
  const q = {
    id: 'general-question-gap',
    options: ['wrong a', 'the right one', 'wrong b', 'wrong c'],
    correctIndex: 1,
  };

  it('marks exactly the authored correct option, wherever it lands', () => {
    const out = shuffledEvalOptions(q, 'stress:general-question-gap');
    const correct = out.filter((o) => o.correct);
    expect(correct).toHaveLength(1);
    expect(correct[0].label).toBe('the right one');
  });

  it('carries originalIndex so scoreEval still grades against correctIndex', () => {
    const out = shuffledEvalOptions(q, 'stress:general-question-gap');
    for (const o of out) {
      expect(q.options[o.originalIndex]).toBe(o.label);
      expect(o.correct).toBe(o.originalIndex === q.correctIndex);
    }
  });
});
