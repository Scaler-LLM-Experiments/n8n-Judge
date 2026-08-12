import { describe, it, expect } from 'vitest';
import { problemList } from '@judge/problems';
import { validateProblem } from './validateProblem.ts';

describe('validateProblem', () => {
  it('accepts both seed problems', () => {
    for (const problem of problemList) {
      const result = validateProblem(problem);
      const errors = result.issues.filter((i) => i.level === 'error');
      expect(errors, `${problem.id}: ${JSON.stringify(errors, null, 2)}`).toHaveLength(0);
      expect(result.valid).toBe(true);
    }
  });

  it('rejects a non-object', () => {
    expect(validateProblem(null).valid).toBe(false);
    expect(validateProblem('x').valid).toBe(false);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const base = (): any => JSON.parse(JSON.stringify(problemList[0]));

  it('rejects a field with two correct options', () => {
    const p = base();
    const type = Object.keys(p.nodeSetup).find((t) => p.nodeSetup[t].fields?.length)!;
    p.nodeSetup[type].fields[0].options.forEach((o: { correct: boolean }) => (o.correct = true));
    const result = validateProblem(p);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes('exactly one correct'))).toBe(true);
  });

  it('rejects a probe with no correct option', () => {
    const p = base();
    const type = Object.keys(p.nodeProbes)[0];
    p.nodeProbes[type].options.forEach((o: { correct: boolean }) => (o.correct = false));
    expect(validateProblem(p).valid).toBe(false);
  });

  // Probe-quality rules. Every probe used to end with an "Added it by mistake"
  // option flagged correct, so any probe could be dodged for a free correct
  // grading record with no misconception logged. These guard the fix.
  it('rejects an escape-hatch probe option', () => {
    for (const text of ['Added it by mistake', 'Oops, wrong one', 'Not sure', 'I clicked it accidentally']) {
      const p = base();
      const type = Object.keys(p.nodeProbes)[0];
      p.nodeProbes[type].options[0].text = text;
      const result = validateProblem(p);
      expect(result.valid, `"${text}" should be rejected`).toBe(false);
      expect(result.issues.some((i) => i.message.includes('escape hatch'))).toBe(true);
    }
  });

  it('rejects a probe with fewer than three options', () => {
    const p = base();
    const type = Object.keys(p.nodeProbes)[0];
    p.nodeProbes[type].options = p.nodeProbes[type].options.slice(0, 2);
    const result = validateProblem(p);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes('at least 3 options'))).toBe(true);
  });

  it('warns when a wrong probe option records no misconception', () => {
    const p = base();
    const type = Object.keys(p.nodeProbes)[0];
    const wrong = p.nodeProbes[type].options.find((o: { correct: boolean }) => !o.correct)!;
    delete wrong.misconception;
    const result = validateProblem(p);
    expect(result.issues.some((i) => i.level === 'warning' && i.message.includes('never surfaced'))).toBe(true);
  });

  it('does not flag ordinary option text as an escape hatch', () => {
    const p = base();
    const type = Object.keys(p.nodeProbes)[0];
    p.nodeProbes[type].options[0].text = 'It reacts the moment a message arrives';
    const result = validateProblem(p);
    expect(result.issues.some((i) => i.message.includes('escape hatch'))).toBe(false);
  });

  it('rejects an out-of-range correctIndex', () => {
    const p = base();
    p.evalQuestions[0].correctIndex = 99;
    expect(validateProblem(p).valid).toBe(false);
  });

  it('warns on a palette distractor outside the catalog, errors when a phase requires it', () => {
    const p = base();
    p.nodePalette.push({ type: 'quantum-teleport', label: 'Q', category: 'core', isDistractor: true });
    const asDistractor = validateProblem(p);
    expect(asDistractor.valid).toBe(true);
    expect(
      asDistractor.issues.some((i) => i.level === 'warning' && i.message.includes('quantum-teleport'))
    ).toBe(true);

    // ...but a type that must be CONFIGURED must exist in the catalog.
    p.buildPhases[0].nodeTypes.push('quantum-teleport');
    p.buildPhases[0].pickable.push('quantum-teleport');
    const asRequired = validateProblem(p);
    expect(asRequired.valid).toBe(false);
  });

  it('no longer enforces a canonical switch node — a de-routed palette is structurally valid', () => {
    const p = base();
    p.nodePalette = p.nodePalette.filter((n: { type: string }) => n.type !== 'switch');
    const result = validateProblem(p);
    const errors = result.issues.filter((i) => i.level === 'error');
    expect(errors, JSON.stringify(errors, null, 2)).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it('still requires a trigger and an action (a flow must start and finish)', () => {
    const noTrigger = base();
    noTrigger.nodePalette = noTrigger.nodePalette.filter((n: { category: string }) => n.category !== 'trigger');
    const r1 = validateProblem(noTrigger);
    expect(r1.valid).toBe(false);
    expect(r1.issues.some((i) => i.message.includes('trigger'))).toBe(true);

    const noAction = base();
    noAction.nodePalette = noAction.nodePalette.filter((n: { category: string }) => n.category !== 'action');
    const r2 = validateProblem(noAction);
    expect(r2.valid).toBe(false);
    expect(r2.issues.some((i) => i.message.includes('action'))).toBe(true);
  });

  it('rejects a sample case pointing at an undeclared branch', () => {
    const p = base();
    p.sampleCases[0].branch = 'no-such-branch';
    expect(validateProblem(p).valid).toBe(false);
  });

  it('rejects a probe misconception code missing from misconceptionLabels', () => {
    const p = base();
    const type = Object.keys(p.nodeProbes)[0];
    const wrongOpt = p.nodeProbes[type].options.find((o: { correct: boolean }) => !o.correct);
    wrongOpt.misconception = 'made-up-code';
    expect(validateProblem(p).valid).toBe(false);
  });

  it('warns (not errors) on intentional fall-through cases', () => {
    const p = base();
    const result = validateProblem(p);
    expect(result.valid).toBe(true);
    expect(result.issues.some((i) => i.level === 'warning' && i.path === 'sampleCases')).toBe(true);
  });
  // The Chat Model drawer is a MENU; `modelNext` is the answer key. Keeping them
  // separate is what lets a case offer several plausible brains and probe a wrong pick.
  // A menu that omits its own answer is the worst failure the editor can produce — it
  // shipped once, and the learner picked the only option offered and was marked wrong.
  describe('flow.modelOptions', () => {
    const withModels = (): any => {
      const p = base();
      p.flow.modelNext = ['openai-chat-model'];
      return p;
    };

    it('rejects a drawer that does not offer the model it grades as correct', () => {
      const p = withModels();
      p.flow.modelOptions = ['anthropic-chat-model', 'google-gemini-chat-model'];
      const result = validateProblem(p);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.path === 'flow.modelOptions' && i.message.includes('does not offer'))).toBe(true);
    });

    it('accepts a drawer offering the answer plus plausible alternatives', () => {
      const p = withModels();
      p.flow.modelOptions = ['openai-chat-model', 'anthropic-chat-model', 'google-gemini-chat-model'];
      const result = validateProblem(p);
      expect(result.issues.filter((i) => i.level === 'error' && i.path === 'flow.modelOptions')).toHaveLength(0);
    });

    it('warns when the drawer offers nothing but the answer', () => {
      const p = withModels();
      p.flow.modelOptions = ['openai-chat-model'];
      const result = validateProblem(p);
      expect(result.issues.some((i) => i.level === 'warning' && i.path === 'flow.modelOptions')).toBe(true);
    });

    it('is optional — omitting it leaves the problem valid', () => {
      const p = withModels();
      delete p.flow.modelOptions;
      expect(validateProblem(p).issues.some((i) => i.path === 'flow.modelOptions')).toBe(false);
    });
  });

  it('rejects the template settings shape, which silently marks every learner wrong', () => {
    const p = base();
    const type = Object.keys(p.nodeSetup)[0];
    p.nodeSetup[type].settings = [{ key: 'onError', options: [{ value: 'stopWorkflow', correct: true }] }];
    expect(validateProblem(p).valid).toBe(false);
  });

  it('rejects a graded setting the NDV cannot render', () => {
    const p = base();
    const type = Object.keys(p.nodeSetup)[0];
    p.nodeSetup[type].settings = [{ key: 'notARealSetting', correct: 'x', why: { x: 'because', y: 'no' } }];
    const errors = validateProblem(p).issues.filter((i) => i.level === 'error');
    expect(errors.some((e) => e.message.includes('notARealSetting'))).toBe(true);
  });

  it('rejects a correct setting value with no explanation of its own', () => {
    const p = base();
    const type = Object.keys(p.nodeSetup)[0];
    p.nodeSetup[type].settings = [
      { key: 'executeOnce', correct: false, why: { true: 'runs once per item' } },
    ];
    const errors = validateProblem(p).issues.filter((i) => i.level === 'error');
    expect(errors.some((e) => e.path.includes('executeOnce'))).toBe(true);
  });

  it('warns when only the correct value is explained, because the teaching is in the wrong ones', () => {
    const p = base();
    const type = Object.keys(p.nodeSetup)[0];
    p.nodeSetup[type].settings = [{ key: 'executeOnce', correct: false, why: { false: 'once per item' } }];
    const warnings = validateProblem(p).issues.filter((i) => i.level === 'warning');
    expect(warnings.some((w) => w.path.includes('executeOnce'))).toBe(true);
  });
});
