import { describe, it, expect } from 'vitest';
import { problemList } from '@judge/problems';
import { toPublicProblem, findLeakedAnswers, KNOWN_REMAINING_LEAKS } from './publicProjection.ts';
import { checkAnswer } from './answerCheck.ts';

const emailTriage = problemList.find((p) => p.id === 'email-triage')!;

describe('toPublicProblem', () => {
  const pub = toPublicProblem(emailTriage as never) as Record<string, never>;

  it('strips every marker of a correct answer', () => {
    // Blunt string scan on purpose: a structural assertion would miss a new
    // answer-bearing field that a future author adds.
    expect(findLeakedAnswers(pub)).toEqual([]);
  });

  it('is materially smaller, though size is not the security property', () => {
    // ~24.7KB -> ~14.8KB, about 40%. Less than a naive per-field tally
    // suggests, because the bulk of nodeSetup/nodeProbes/dissection is prompts
    // and option TEXT, which the client legitimately needs to render. What
    // matters is the leak test above: answer markers are gone entirely.
    // Leakage is binary, not a percentage.
    const before = JSON.stringify(emailTriage).length;
    const after = JSON.stringify(pub).length;
    expect(after).toBeLessThan(before * 0.7);
    expect(after).toBeGreaterThan(0);
  });

  it('keeps everything the UI needs to render a question', () => {
    const q = (pub.dissection as unknown as Record<string, unknown>[])[0];
    expect(q.prompt).toBeTruthy();
    expect((q.options as unknown[]).length).toBeGreaterThan(1);
    // …but not which one is right, nor the explanation, nor what it unlocks.
    expect(q.correctType).toBeUndefined();
    expect(q.explanation).toBeUndefined();
    expect(q.unlocks).toBeUndefined();
  });

  it('keeps node setup renderable: labels, kinds and option text survive', () => {
    const setup = (pub.nodeSetup as Record<string, Record<string, unknown>>).classify;
    const fields = setup.fields as Record<string, unknown>[];
    const temp = ((pub.nodeSetup as Record<string, Record<string, unknown>>)['chat-gemini'].fields as Record<string, unknown>[])[0];
    expect(fields[0].label).toBeTruthy();
    expect(temp.kind).toBe('number');
    // The bounds are needed to render the input; the answer is not.
    expect(temp.max).toBe(1);
    expect(temp.correct).toBeUndefined();
    expect(temp.whyCorrect).toBeUndefined();
  });

  it('keeps WHICH settings are graded but not their answers', () => {
    const sw = (pub.nodeSetup as Record<string, Record<string, unknown>>).switch;
    const settings = sw.settings as Record<string, unknown>[];
    expect(settings[0].key).toBe('alwaysOutputData'); // the "Set this" badge needs this
    expect(settings[0].correct).toBeUndefined();
    expect(settings[0].why).toBeUndefined();
  });

  it('keeps probe prompts and option text, drops correctness and misconception codes', () => {
    const probe = (pub.nodeProbes as Record<string, Record<string, unknown>>)['chat-trigger'];
    const opts = probe.options as Record<string, unknown>[];
    expect(probe.prompt).toBeTruthy();
    expect(opts.every((o) => typeof o.text === 'string')).toBe(true);
    expect(opts.every((o) => o.correct === undefined && o.misconception === undefined && o.response === undefined)).toBe(true);
  });

  it('does not mutate the problem it was handed', () => {
    const copy = JSON.parse(JSON.stringify(emailTriage));
    toPublicProblem(emailTriage as never);
    expect(JSON.parse(JSON.stringify(emailTriage))).toEqual(copy);
  });

  it('documents what it knowingly still leaks, rather than pretending to be complete', () => {
    // These four are answer material and still shipped, because the Run is
    // still client-side. The test exists so the list cannot quietly grow.
    for (const key of KNOWN_REMAINING_LEAKS) expect(pub[key]).toBeDefined();
    expect(KNOWN_REMAINING_LEAKS).toHaveLength(4);
  });

  it('works on every shipped problem', () => {
    for (const p of problemList) expect(findLeakedAnswers(toPublicProblem(p as never))).toEqual([]);
  });
});

describe('checkAnswer', () => {
  const p = emailTriage as never as Record<string, unknown>;

  it('grades a dissection pick, and gives the explanation only when right', () => {
    const right = checkAnswer(p, { kind: 'dissection', id: 'trigger', answer: 'trigger' });
    expect(right.correct).toBe(true);
    expect(right.unlocks).toContain('trigger');
    expect(right.why).toMatch(/fires the moment/i);

    const wrong = checkAnswer(p, { kind: 'dissection', id: 'trigger', answer: 'chat-trigger' });
    expect(wrong.correct).toBe(false);
    expect(wrong.unlocks).toBeUndefined();
    // A hint, not the answer.
    expect(wrong.why).toMatch(/watching the inbox/i);
  });

  it('grades a select field and returns only the chosen option\'s why', () => {
    const r = checkAnswer(p, { kind: 'field', id: 'switch:routeOn', answer: 'category' });
    expect(r.correct).toBe(true);
    expect(typeof r.why).toBe('string');
  });

  it('grades a typed number field, including 0 as a real answer', () => {
    expect(checkAnswer(p, { kind: 'field', id: 'chat-gemini:temperature', answer: 0 }).correct).toBe(true);
    expect(checkAnswer(p, { kind: 'field', id: 'chat-gemini:temperature', answer: 0.7 }).correct).toBe(false);
  });

  it('grades an expression field, tolerating brace spacing but not hardcoding', () => {
    expect(checkAnswer(p, { kind: 'field', id: 'classify:text', answer: '{{$json.body}}' }).correct).toBe(true);
    expect(checkAnswer(p, { kind: 'field', id: 'classify:text', answer: 'the email body' }).correct).toBe(false);
  });

  it('grades a setting, including one whose correct answer is "leave it alone"', () => {
    expect(checkAnswer(p, { kind: 'setting', id: 'switch:alwaysOutputData', answer: false }).correct).toBe(true);
    const on = checkAnswer(p, { kind: 'setting', id: 'switch:alwaysOutputData', answer: true });
    expect(on.correct).toBe(false);
    expect(on.why).toMatch(/blank reply/i);
  });

  it('grades a probe by option text, since display order is shuffled per session', () => {
    const probe = (emailTriage as unknown as Record<string, Record<string, Record<string, unknown>>>).nodeProbes['chat-trigger'];
    const wrongOpt = (probe.options as Record<string, unknown>[]).find((o) => o.misconception)!;
    const r = checkAnswer(p, { kind: 'probe', id: 'chat-trigger', answer: wrongOpt.text });
    expect(r.correct).toBe(false);
    expect(r.misconception).toBe(wrongOpt.misconception);
  });

  it('grades a stress question by option text', () => {
    const q = (emailTriage as unknown as { evalQuestions: { id: string; options: string[]; correctIndex: number }[] }).evalQuestions[0];
    expect(checkAnswer(p, { kind: 'stress', id: q.id, answer: q.options[q.correctIndex] }).correct).toBe(true);
  });

  it('reports unknown ids instead of silently scoring them', () => {
    // A request for a question that was never served is a tampering signal,
    // not a wrong answer — the endpoint needs to tell them apart.
    for (const req of [
      { kind: 'dissection' as const, id: 'nope', answer: 'x' },
      { kind: 'field' as const, id: 'switch:nope', answer: 'x' },
      { kind: 'probe' as const, id: 'chat-trigger', answer: 'an option that was never offered' },
    ]) {
      const r = checkAnswer(p, req);
      expect(r.unknown, JSON.stringify(req)).toBe(true);
      expect(r.correct).toBe(false);
    }
  });
});
