import { describe, it, expect } from 'vitest';
import { problemList, problems, getProblem, defaultProblem } from './index.js';
import { validateProblem } from '@judge/problem-schema';

// Registry-wide invariants. Every shipped problem must clear the authoring
// validator with zero errors AND zero warnings — warnings mean an author-facing
// smell (e.g. a palette type with no catalog entry) that we don't want to ship.
describe('problem registry', () => {
  it('ships every problem keyed by its own id', () => {
    expect(problemList.length).toBeGreaterThanOrEqual(1);
    for (const [key, problem] of Object.entries(problems)) {
      expect(key).toBe(problem.id);
      expect(getProblem(key)).toBe(problem);
    }
    expect(getProblem('no-such-problem')).toBe(defaultProblem);
  });

  it.each(problemList.map((p) => [p.id, p]))('%s validates with no errors or warnings', (_id, problem) => {
    const { issues, valid } = validateProblem(problem);
    expect(issues, JSON.stringify(issues, null, 2)).toEqual(
      // intentional fall-through cases are an informational warning by design
      issues.filter((i) => i.level === 'warning' && i.path === 'sampleCases')
    );
    expect(valid).toBe(true);
  });

  // The dead DashboardScreen path and its fields were removed; "What Run will
  // check" is derived from testCases[].description. Guard against regression.
  it.each(problemList.map((p) => [p.id, p]))('%s carries no legacy prototype fields', (_id, problem) => {
    expect(problem.buildSteps).toBeUndefined();
    expect(problem.connectionGuide).toBeUndefined();
    expect(problem.testCaseSummary).toBeUndefined();
    // the replacement source must exist and be renderable
    expect(problem.testCases.length).toBeGreaterThan(0);
    for (const tc of problem.testCases) expect(typeof tc.description).toBe('string');
  });
});
