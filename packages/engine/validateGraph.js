import { edgeMatches } from './edgeMatches.js';

export function validateGraph(studentGraph, problem) {
  const typeCategory = buildTypeCategory(problem);
  const results = problem.testCases.map((testCase) => runCheck(testCase, studentGraph, typeCategory));
  const allPassed = results.every((r) => r.passed);
  return { allPassed, results };
}

function buildTypeCategory(problem) {
  const map = {};
  for (const n of problem.nodePalette) map[n.type] = n.category;
  return map;
}

function runCheck(testCase, studentGraph, typeCategory) {
  const { checks } = testCase;

  if (checks.requiredNodeTypes) {
    const missing = checks.requiredNodeTypes.filter(
      (type) => !studentGraph.nodes.some((n) => n.type === type)
    );
    if (missing.length > 0) {
      return fail(testCase, `Missing node type(s): ${missing.join(', ')}`);
    }
  }

  if (checks.requiredEdges) {
    for (const req of checks.requiredEdges) {
      const found = studentGraph.edges.some((edge) => edgeMatches(edge, req, studentGraph.nodes, typeCategory));
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
