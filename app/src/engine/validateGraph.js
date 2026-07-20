export function validateGraph(studentGraph, problem) {
  const results = problem.testCases.map((testCase) => runCheck(testCase, studentGraph));
  const allPassed = results.every((r) => r.passed);
  return { allPassed, results };
}

function runCheck(testCase, studentGraph) {
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
      const found = studentGraph.edges.some((edge) => edgeMatches(edge, req, studentGraph.nodes));
      if (!found) {
        const branchLabel = req.branch ? ` (branch: ${req.branch})` : '';
        return fail(testCase, `Missing connection: ${req.sourceType} → ${req.targetType}${branchLabel}`);
      }
    }
  }

  return { id: testCase.id, description: testCase.description, passed: true, reason: null };
}

function fail(testCase, reason) {
  return { id: testCase.id, description: testCase.description, passed: false, reason };
}

function edgeMatches(edge, req, nodes) {
  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);
  if (!sourceNode || !targetNode) return false;
  if (sourceNode.type !== req.sourceType || targetNode.type !== req.targetType) return false;
  if (req.branch && edge.sourceHandle !== req.branch) return false;
  return true;
}
