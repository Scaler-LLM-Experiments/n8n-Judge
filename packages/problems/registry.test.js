import { describe, it, expect } from 'vitest';
import { problemList, problems, getProblem, defaultProblem } from './index.js';
import { validateProblem, plainLanguageIssues } from '@judge/problem-schema';

// Registry-wide invariants. Every shipped problem must clear the authoring
// validator with zero errors AND zero warnings — warnings mean an author-facing
// smell (e.g. a palette type with no catalog entry) that we don't want to ship.
describe('problem registry', () => {
  // Plain language, on every shipped case. This began as a guard on a PLAIN_LANGUAGE_DEBT
  // bypass, which existed while the six cases carrying 455 violations were rewritten. The
  // list reached empty, so the bypass is gone and this is the plain invariant.
  //
  // validateProblem raises these as errors, so the suite above already fails on a
  // regression. This states it separately because the message is what an author needs:
  // the surface, the count and the cap, rather than one line in a list of issues.
  it.each(problemList.map((p) => [p.id, p]))('%s reads as plain language', (_id, problem) => {
    const issues = plainLanguageIssues(problem);
    expect(
      issues.map((i) => `${i.path}: ${i.message}`),
      'run `npm run case:copy -- <slug> --verbose` to work through these'
    ).toEqual([]);
  });

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
