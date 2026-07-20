/**
 * Which reference-graph nodes should render as ghost placeholders because
 * the student hasn't placed a matching node type yet. Matching is by type +
 * count only (not identity): if the reference graph needs 3 nodes of type
 * 'action' and the student has placed 1, the first reference 'action' node
 * (in authored order) is treated as covered and the remaining 2 are
 * returned as ghosts.
 */
export function computeMissingReferenceNodes(studentGraph, referenceGraph) {
  const studentCounts = countByType(studentGraph.nodes);
  const coveredSoFar = new Map();
  const missing = [];

  for (const refNode of referenceGraph.nodes) {
    const covered = coveredSoFar.get(refNode.type) || 0;
    const available = studentCounts.get(refNode.type) || 0;
    if (covered < available) {
      coveredSoFar.set(refNode.type, covered + 1);
    } else {
      missing.push(refNode);
    }
  }

  return missing;
}

export function countPendingNodes(studentGraph, referenceGraph) {
  return computeMissingReferenceNodes(studentGraph, referenceGraph).length;
}

function countByType(nodes) {
  const counts = new Map();
  for (const node of nodes) {
    counts.set(node.type, (counts.get(node.type) || 0) + 1);
  }
  return counts;
}
