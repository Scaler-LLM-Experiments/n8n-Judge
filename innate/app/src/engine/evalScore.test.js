import { describe, it, expect } from 'vitest';
import { scoreEval } from './evalScore.js';
import { emailTriage } from '../data/problems/emailTriage/index.js';

describe('scoreEval', () => {
  it('scores all correct answers as fully correct', () => {
    const answers = {};
    for (const q of emailTriage.evalQuestions) answers[q.id] = q.correctIndex;
    const result = scoreEval(answers, emailTriage.evalQuestions);
    expect(result.correctCount).toBe(emailTriage.evalQuestions.length);
    expect(result.total).toBe(emailTriage.evalQuestions.length);
    expect(result.results.every((r) => r.correct)).toBe(true);
  });

  it('marks a wrong answer as incorrect without affecting other questions', () => {
    const answers = {};
    emailTriage.evalQuestions.forEach((q, i) => {
      answers[q.id] = i === 0 ? (q.correctIndex + 1) % q.options.length : q.correctIndex;
    });
    const result = scoreEval(answers, emailTriage.evalQuestions);
    expect(result.results[0].correct).toBe(false);
    expect(result.results.slice(1).every((r) => r.correct)).toBe(true);
  });

  it('treats an unanswered question as incorrect', () => {
    const result = scoreEval({}, emailTriage.evalQuestions);
    expect(result.correctCount).toBe(0);
  });
});
