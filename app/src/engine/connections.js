// Which of the problem's required connections have been made yet.
export function connectionStatus(studentGraph, problem) {
  const typeCategory = {};
  problem.nodePalette.forEach((n) => {
    typeCategory[n.type] = n.category;
  });
  return problem.connectionGuide.map((c) => ({
    ...c,
    done: studentGraph.edges.some((e) => edgeMatches(e, c.match, studentGraph.nodes, typeCategory)),
  }));
}

function edgeMatches(edge, req, nodes, typeCategory) {
  const source = nodes.find((n) => n.id === edge.source);
  const target = nodes.find((n) => n.id === edge.target);
  if (!source || !target) return false;
  if (req.sourceType && source.type !== req.sourceType) return false;
  if (req.sourceCategory && typeCategory[source.type] !== req.sourceCategory) return false;
  if (req.targetType && target.type !== req.targetType) return false;
  if (req.branch && edge.sourceHandle !== req.branch) return false;
  if (req.targetHandle && edge.targetHandle !== req.targetHandle) return false;
  return true;
}
