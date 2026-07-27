import { hasConnection } from './connectionMatches.js';
import { asWorkflow, inferBranches } from './asWorkflow.js';

export function validateGraph(studentGraph, problem) {
  const typeCategory = buildTypeCategory(problem);
  // Structural checks run against the canonical n8n workflow, so a "branch"
  // means an output index rather than a React Flow handle string.
  const branches = problem.branches?.length ? problem.branches : inferBranches(studentGraph);
  const wf = asWorkflow(studentGraph, { branches });
  const results = problem.testCases.map((testCase) => runCheck(testCase, wf, typeCategory, branches));
  const allPassed = results.every((r) => r.passed);
  return { allPassed, results };
}

function buildTypeCategory(problem) {
  const map = {};
  for (const n of problem.nodePalette) map[n.type] = n.category;
  return map;
}

function runCheck(testCase, wf, typeCategory, branches) {
  const { checks } = testCase;

  if (checks.requiredNodeTypes) {
    const missing = checks.requiredNodeTypes.filter(
      (type) => !wf.nodes.some((n) => n.type === type)
    );
    if (missing.length > 0) {
      return fail(testCase, `Missing node type(s): ${missing.join(', ')}`);
    }
  }

  if (checks.requiredEdges) {
    for (const req of checks.requiredEdges) {
      const found = hasConnection(wf, req, typeCategory, branches);
      if (!found) {
        return fail(testCase, describeMissingEdge(req));
      }
    }
  }

  return { id: testCase.id, description: testCase.description, passed: true, reason: null };
}

function fail(testCase, reason) {
  return { id: testCase.id, description: testCase.description, passed: false, reason };
}

function describeMissingEdge(req) {
  const src = req.sourceType || `${req.sourceCategory} node`;
  const branchLabel = req.branch ? ` (branch: ${req.branch})` : '';
  return `Missing connection: ${src} → ${req.targetType}${branchLabel}`;
}
