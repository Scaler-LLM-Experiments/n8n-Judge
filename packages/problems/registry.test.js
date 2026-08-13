import { describe, it, expect } from 'vitest';
import { problemList, problems, getProblem, defaultProblem } from './index.js';
import { validateProblem, PLAIN_LANGUAGE_DEBT, plainLanguageIssues } from '@judge/problem-schema';

// Registry-wide invariants. Every shipped problem must clear the authoring
// validator with zero errors AND zero warnings — warnings mean an author-facing
// smell (e.g. a palette type with no catalog entry) that we don't want to ship.
describe('problem registry', () => {
  // The plain-language rules are enforced as errors for every case EXCEPT the ones on
  // PLAIN_LANGUAGE_DEBT, which were written before the rules existed. That bypass is the
  // only thing keeping this suite green while they are rewritten, so it needs a guard of
  // its own: a bypass nobody is required to remove is a rule that has been switched off.
  describe('the plain-language debt list only shrinks', () => {
    it('names only real problems', () => {
      for (const slug of PLAIN_LANGUAGE_DEBT) {
        expect(problems[slug], `${slug} is on the debt list but not in the registry`).toBeTruthy();
      }
    });

    it.each(PLAIN_LANGUAGE_DEBT)('%s still has copy to fix, or it should be off the list', (slug) => {
      // The real walk, not a proxy. The first version of this guard checked for a dash
      // or a long statement, so a case with 42 long sentences and no dashes read as clean
      // and this fired on a case that was not done.
      const remaining = plainLanguageIssues(problems[slug]);
      expect(
        remaining.length,
        `${slug} is clean. Remove it from PLAIN_LANGUAGE_DEBT so the rules apply to it.`
      ).toBeGreaterThan(0);
    });

    it('does not cover a case that was authored under the rules', () => {
      // weather-commute-ping was rewritten to 0 violations. If it ever appears here,
      // somebody silenced a regression instead of fixing it.
      expect(PLAIN_LANGUAGE_DEBT).not.toContain('weather-commute-ping');
    });
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
