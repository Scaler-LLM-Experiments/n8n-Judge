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

  it('rejects a palette missing the switch node (canonical topology)', () => {
    const p = base();
    p.nodePalette = p.nodePalette.filter((n: { type: string }) => n.type !== 'switch');
    // remove other references so only the topology error fires meaningfully
    const result = validateProblem(p);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes('"switch"'))).toBe(true);
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
});
