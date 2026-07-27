import { toWorkflow } from '@judge/workflow';

// The engine reasons in the canonical n8n shape (@judge/workflow): connections
// keyed by source node name, `main` as an array-per-output, sub-nodes on typed
// ai_* connectors. The editor still hands over a React Flow graph, and authored
// reference graphs are still written that way, so normalise at the boundary
// rather than making every caller convert.
//
// Accepting both shapes is deliberate and temporary: it lets the internals move
// to the real model without a flag-day rewrite of the editor and all three
// problems. Anything already in canonical form passes straight through.
export function asWorkflow(graph, problem) {
  if (!graph) return { nodes: [], connections: {} };
  if (graph.connections && !graph.edges) return graph;
  return toWorkflow(graph, { branches: problem?.branches ?? [] });
}

/**
 * Recover the branch order from an editor graph's own edges.
 *
 * A router's outputs are positional in n8n — the branch *names* live in the
 * problem definition, not the workflow. Callers that have the problem should
 * pass `problem.branches`. Callers that don't (a bare graph, as in the engine
 * tests) would otherwise be unable to resolve a branch id to an output index,
 * so derive the ordering from the order the handles appear on the edges.
 *
 * This is a fallback, not the contract: pass real branches when you have them,
 * because edge order is an accident of how the learner wired things.
 */
export function inferBranches(graph) {
  const seen = [];
  for (const edge of graph?.edges ?? []) {
    const id = edge.branch ?? edge.sourceHandle;
    if (id && !seen.includes(id)) seen.push(id);
  }
  return seen.map((id) => ({ id }));
}
