import { describe, it, expect } from 'vitest';
import { valuesFor } from './valuesFor.js';

const line1 = { value: 'line.mapped', label: 'temp and words', forName: 'weather_line', correct: true, why: 'x' };
const line2 = { value: 'line.raw', label: 'temp and number', forName: 'weather_line', correct: false, why: 'x' };
const note1 = { value: 'note.mapped', label: 'heat then code', forName: 'commute_note', correct: true, why: 'x' };
const note2 = { value: 'note.bare', label: 'heat then code, no fallback', forName: 'commute_note', correct: false, why: 'x' };
const anywhere = { value: 'blank', label: 'leave it empty', correct: false, why: 'x' };

const pool = [line1, note1, line2, note2, anywhere];

describe('a row offers the values that belong to it', () => {
  it('hides the other row\'s answers', () => {
    // The bug: a two-row list offered all seven options on both rows, so the row named
    // weather_line presented four advice lines belonging to commute_note. Those are not
    // wrong answers, they are answers to a different question.
    expect(valuesFor(pool, 'weather_line').map((o) => o.value)).toEqual(['line.mapped', 'line.raw', 'blank']);
    expect(valuesFor(pool, 'commute_note').map((o) => o.value)).toEqual(['note.mapped', 'note.bare', 'blank']);
  });

  it('keeps an option with no forName on every row', () => {
    for (const name of ['weather_line', 'commute_note']) {
      expect(valuesFor(pool, name)).toContain(anywhere);
    }
  });

  it('shows everything while the row has no name yet', () => {
    // Nothing to filter by. An empty dropdown here reads as a broken control.
    expect(valuesFor(pool, '')).toEqual(pool);
    expect(valuesFor(pool, undefined)).toEqual(pool);
  });

  it('shows everything rather than nothing when a name claims no options', () => {
    // An authoring mistake, and an empty menu hides it while stranding the learner.
    const onlyClaimed = [line1, note1];
    expect(valuesFor(onlyClaimed, 'something_else')).toEqual(onlyClaimed);
  });

  it('leaves a list that uses no forName completely untouched', () => {
    // Every shipped case except one is in this position, and none of them may change.
    const flat = [{ value: 'a', label: 'A', correct: true, why: 'x' }, { value: 'b', label: 'B', correct: false, why: 'x' }];
    expect(valuesFor(flat, 'Full Name')).toEqual(flat);
  });
});
