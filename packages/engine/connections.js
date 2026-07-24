import { edgeMatches } from './edgeMatches.js';

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
