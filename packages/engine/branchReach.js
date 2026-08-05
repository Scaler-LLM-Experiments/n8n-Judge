import { NODE_CATALOG } from '@judge/catalog';

// "Has every branch of the router been wired to something that actually replies?"
//
// This is the check that decides whether a routing build phase is complete, and it
// used to live inline in BuildStage as:
//
//   target && target.type === 'action' && target.data?.configured
//
// which asserted two things the rest of the engine does not believe:
//
//   1. That a branch's reply is literally the node type `action`. Slack, Notion,
//      Google Calendar and Google Docs are all `category: 'action'` in the catalog
//      and all end a run perfectly well — `simulate.js` resolves a terminal by
//      CATEGORY, not by type. So a problem whose bug-report branch posts to Slack
//      could never finish its build phase, while its Run passed.
//   2. That the reply is the branch's IMMEDIATE target. The simulator walks a
//      branch through any number of passthrough nodes before the terminal, so a
//      branch that formats a payload and then sends it was equally unfinishable.
//
// Both made "topology is data, not code" false in the one place a learner would
// notice: they could wire a correct flow and the stage would refuse to advance.
// So the walk lives here, next to the simulator's, and is driven by the same
// catalog metadata.
//
// Operates on the EDITOR's flat graph (`{nodes, edges}` with `sourceHandle`
// carrying the branch id), because that is what the Build stage holds. The
// canonical conversion happens later, at the Run.

/** A node that ends a path: anything the catalog files under `action`. */
const isTerminal = (type) => NODE_CATALOG[type]?.category === 'action';

/** The router: whichever node type the catalog says has branches. */
const isRouter = (type) => Boolean(
  NODE_CATALOG[type]?.router || (NODE_CATALOG[type]?.branches?.length ?? 0) > 0
);

/** Does this problem ask the learner to configure this node type at all? */
const isGraded = (problem, type) => (problem?.nodeSetup?.[type]?.fields?.length ?? 0) > 0;

/**
 * Configured, as the Build stage means it. A node with nothing to set is complete
 * by existing; anything else has to have been verified.
 *
 * The flag is read from both spots because the editor keeps it on `data` while
 * some callers hand over a flattened node.
 */
function isConfigured(node, problem) {
  if (!isGraded(problem, node.type)) return true;
  return Boolean(node.data?.configured ?? node.configured);
}

/** The single main-flow successor of a node, ignoring `ai_*` sub-node attachments. */
function mainSuccessor(graph, nodeId) {
  const edge = graph.edges.find(
    (e) => e.source === nodeId && !String(e.targetHandle ?? '').startsWith('ai_')
  );
  if (!edge) return null;
  return graph.nodes.find((n) => n.id === edge.target) ?? null;
}

/**
 * Whether one branch reaches a configured reply.
 *
 * Follows the branch out of the router, through any number of configured
 * passthrough nodes, to the first terminal. Every node on the way has to be
 * configured: a branch that reaches a reply through a node the learner never set
 * up is not finished, and letting it pass would advance the stage on a flow that
 * cannot run.
 *
 * @param {{nodes: Array, edges: Array}} graph the editor graph
 * @param {Record<string, any>} problem
 * @param {string} branchId
 * @param {number} [maxHops] cycle/runaway guard
 */
export function branchReachesReply(graph, problem, branchId, maxHops = 12) {
  const router = graph?.nodes?.find((n) => isRouter(n.type));
  if (!router) return false;

  const first = graph.edges.find((e) => e.source === router.id && e.sourceHandle === branchId);
  if (!first) return false;

  let node = graph.nodes.find((n) => n.id === first.target) ?? null;
  const seen = new Set();

  for (let hop = 0; node && hop < maxHops; hop += 1) {
    if (seen.has(node.id)) return false; // a loop never reaches a reply
    seen.add(node.id);
    if (!isConfigured(node, problem)) return false;
    if (isTerminal(node.type)) return true;
    node = mainSuccessor(graph, node.id);
  }
  return false;
}

/**
 * Whether EVERY declared branch reaches a configured reply. The routing phase's
 * completion test.
 */
export function allBranchesWired(graph, problem) {
  const branches = problem?.branches ?? [];
  if (!branches.length) return true;
  return branches.every((b) => branchReachesReply(graph, problem, b.id));
}

/** Which branches are still open, for a cue or a coach line. */
export function openBranchIds(graph, problem) {
  return (problem?.branches ?? [])
    .filter((b) => !branchReachesReply(graph, problem, b.id))
    .map((b) => b.id);
}
