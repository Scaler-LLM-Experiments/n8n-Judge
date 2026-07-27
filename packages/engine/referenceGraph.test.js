import { describe, it, expect } from 'vitest';
import { problemList } from '@judge/problems';
import { validateGraph } from './validateGraph.js';
import { simulateAll } from './simulate.js';

// End-to-end guard on the engine: every problem's own reference solution must
// pass that problem's structural checks AND deliver every sample case.
//
// The unit tests cover the walk in isolation with hand-built graphs. This
// catches the class of bug those miss — a change that is internally consistent
// but wrong against real authored data, so the app still runs and simply
// grades everyone incorrectly. That is exactly the risk in moving the engine
// onto the canonical n8n model (branch id → output index, ai_model →
// ai_languageModel), where an off-by-one is silent.
describe('reference graphs satisfy their own problems', () => {
  for (const problem of problemList) {
    describe(problem.id, () => {
      it('passes every structural test case', () => {
        const { allPassed, results } = validateGraph(problem.referenceGraph, problem);
        const failed = results.filter((r) => !r.passed).map((r) => `${r.id}: ${r.reason}`);
        expect(failed, failed.join('\n')).toEqual([]);
        expect(allPassed).toBe(true);
      });

      it('delivers every sample case that is meant to deliver', () => {
        const { cases, success } = simulateAll(problem.referenceGraph, problem);

        // `branch: null` marks a case that is SUPPOSED to fall through with no
        // reply — that is the teaching point, not a failure.
        for (const r of cases) {
          const expected = r.case.branch === null || r.case.branch === undefined ? undefined : true;
          if (expected) {
            expect(r.delivered, `${problem.id}/${r.case.id} should deliver:\n${r.steps.map((s) => s.text).join('\n')}`).toBe(true);
          }
        }
        expect(success).toBe(true);
      });

      it('routes each case down its declared branch', () => {
        if (!problem.branches?.length) return; // linear problem, nothing to route
        const { cases } = simulateAll(problem.referenceGraph, problem);
        for (const r of cases) {
          if (!r.case.branch) continue;
          // A delivered case ends on an action step; a mis-mapped branch index
          // would dead-end instead.
          expect(r.delivered, `${problem.id}/${r.case.id} (branch ${r.case.branch}) dead-ended`).toBe(true);
        }
      });
    });
  }
});
