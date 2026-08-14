import { describe, it, expect } from 'vitest';
import { whyForField } from './FieldControl.jsx';

// Iris arriving with an empty bubble reads as the app breaking, not as an answer being
// wrong. Every path through this has to produce words.
describe('whyForField always has something to say', () => {
  const field = {
    options: [
      { value: 'a', correct: true, why: 'Right, because A.' },
      { value: 'b', correct: false, why: 'Not B, because…' },
    ],
    whyWrong: 'Field-level fallback.',
  };

  it('explains the option the learner chose', () => {
    expect(whyForField(field, 'b', 'wrong')).toBe('Not B, because…');
  });

  it('explains a correct answer from the correct option', () => {
    expect(whyForField(field, 'a', 'correct')).toBe('Right, because A.');
  });

  it('falls back when the value matches no option at all', () => {
    // The reported bug: a native catalog text box wrote a URL into a graded select, so no
    // option matched and the bubble came out empty.
    expect(whyForField(field, 'https://typed-by-hand.example', 'wrong')).toBe('Field-level fallback.');
  });

  it('stays quiet when the option exists but its why was stripped', () => {
    // Not the same case. `toPublicProblem()` removes explanations, so the browser cannot
    // know why a real option is wrong, and the server's text is what the NDV shows.
    const stripped = { options: [{ value: 'a' }, { value: 'b' }] };
    expect(whyForField(stripped, 'b', 'wrong')).toBeUndefined();
  });

  it('still speaks when the field carries no fallback either', () => {
    const bare = { options: [{ value: 'a', correct: true, why: 'yes' }] };
    const why = whyForField(bare, 'nonsense', 'wrong');
    expect(why).toBeTruthy();
    expect(why).toMatch(/pick from the list/i);
  });

  it('uses whyCorrect/whyWrong for a typed field', () => {
    const typed = { whyCorrect: 'good', whyWrong: 'bad' };
    expect(whyForField(typed, 9, 'correct')).toBe('good');
    expect(whyForField(typed, 8, 'wrong')).toBe('bad');
  });
});
