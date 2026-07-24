// Shared edge matcher for structural checks. Both validateGraph.js and
// connections.js used to carry near-identical private copies of this —
// keep the single source of truth here.
export function edgeMatches(edge, req, nodes, typeCategory) {
  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);
  if (!sourceNode || !targetNode) return false;

  if (req.sourceType && sourceNode.type !== req.sourceType) return false;
  if (req.sourceCategory && typeCategory[sourceNode.type] !== req.sourceCategory) return false;
  if (req.targetType && targetNode.type !== req.targetType) return false;
  if (req.branch && edge.sourceHandle !== req.branch) return false;
  if (req.targetHandle && edge.targetHandle !== req.targetHandle) return false;
  return true;
}
