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

  if (checks.requiresPath && !hasPathToComplete(studentGraph)) {
    return fail(testCase, 'No connected path reaches a Complete node');
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

function hasPathToComplete(studentGraph) {
  const triggerNodes = studentGraph.nodes.filter((n) => n.type === 'trigger');
  if (triggerNodes.length === 0) return false;

  const adjacency = buildAdjacency(studentGraph.edges);

  const routeNodes = studentGraph.nodes.filter((n) => n.type === 'route');
  for (const route of routeNodes) {
    const branchEdges = studentGraph.edges.filter((e) => e.source === route.id);
    const branches = new Set(branchEdges.map((e) => e.sourceHandle).filter(Boolean));
    for (const branch of branches) {
      const targets = branchEdges.filter((e) => e.sourceHandle === branch).map((e) => e.target);
      const reaches = targets.some((start) => canReachComplete(start, adjacency, studentGraph.nodes));
      if (!reaches) return false;
    }
  }

  return triggerNodes.some((t) => canReachComplete(t.id, adjacency, studentGraph.nodes));
}

function buildAdjacency(edges) {
  const adjacency = new Map();
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    adjacency.get(edge.source).push(edge.target);
  }
  return adjacency;
}

function canReachComplete(startId, adjacency, nodes) {
  const visited = new Set();
  const stack = [startId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (visited.has(current)) continue;
    visited.add(current);
    const node = nodes.find((n) => n.id === current);
    if (node && node.type === 'complete') return true;
    for (const next of adjacency.get(current) || []) stack.push(next);
  }
  return false;
}
