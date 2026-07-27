import {
  type BranchDef,
  type Connection,
  type ConnectionType,
  type Connections,
  type EditorEdge,
  type EditorGraph,
  type N8nNode,
  type N8nWorkflow,
  type NodeName,
  isAiConnection,
} from './types.ts';

// Conversion between the editor's React Flow graph and the canonical n8n
// workflow. The editor keeps drawing flat edges — that is what React Flow
// needs — but everything that reasons about a flow (engine, validation,
// grading replay, persistence) works on the n8n shape.

/**
 * The editor marks a sub-node attachment with `targetHandle: 'ai_model'`.
 * Real n8n names that connector `ai_languageModel`. Map the editor's handles
 * onto the real connector names so the canonical form is faithful.
 */
const HANDLE_TO_CONNECTOR: Record<string, ConnectionType> = {
  ai_model: 'ai_languageModel',
  ai_languageModel: 'ai_languageModel',
  ai_memory: 'ai_memory',
  ai_tool: 'ai_tool',
  ai_outputParser: 'ai_outputParser',
  ai_embedding: 'ai_embedding',
  ai_document: 'ai_document',
  ai_textSplitter: 'ai_textSplitter',
  ai_retriever: 'ai_retriever',
};

/** Inverse of the above, for rendering back onto the canvas. */
const CONNECTOR_TO_HANDLE: Partial<Record<ConnectionType, string>> = {
  ai_languageModel: 'ai_model',
};

const DEFAULT_TYPE_VERSION = 1;

/**
 * n8n requires unique node names because connections reference them. Authored
 * graphs frequently reuse a label ("Send Reply" three times, once per branch),
 * so disambiguate the way n8n itself does: append an incrementing counter.
 */
function uniqueName(desired: string, taken: Set<string>): string {
  const base = (desired || 'Node').trim() || 'Node';
  if (!taken.has(base)) {
    taken.add(base);
    return base;
  }
  for (let i = 1; ; i++) {
    const candidate = `${base}${i}`;
    if (!taken.has(candidate)) {
      taken.add(candidate);
      return candidate;
    }
  }
}

function displayLabel(node: EditorGraph['nodes'][number]): string {
  const data = node.data as { label?: string } | undefined;
  const authored = (node as { requiredLabel?: string }).requiredLabel;
  return data?.label ?? authored ?? node.type;
}

/** The editor uses `sourceHandle`; authored reference graphs use `branch`. */
function branchOf(edge: EditorEdge): string | undefined {
  return edge.branch ?? edge.sourceHandle ?? undefined;
}

/**
 * Which output index a main edge leaves from. A router's outputs are ordered
 * by the problem's `branches` list — that ordering IS the contract, the same
 * way an IF node's true output is 0 and false is 1. Anything unrecognised
 * falls back to output 0 rather than silently vanishing.
 */
function outputIndexFor(edge: EditorEdge, branches: BranchDef[]): number {
  const branch = branchOf(edge);
  if (!branch) return 0;
  const i = branches.findIndex((b) => b.id === branch);
  return i >= 0 ? i : 0;
}

function pushConnection(
  connections: Connections,
  from: NodeName,
  type: ConnectionType,
  outputIndex: number,
  connection: Connection,
  minOutputs = 0
): void {
  const byType = (connections[from] ??= {});
  const outputs = (byType[type] ??= []);
  // Outputs are positional: an output with nothing wired to it must still
  // exist as an empty array so later outputs keep their index.
  //
  // `minOutputs` widens a router to its full branch count even when only some
  // branches are wired. That width is how a router is later told apart from a
  // single-output node — n8n stores no branch names, only positions, so a
  // router with just branch 0 wired would otherwise be indistinguishable from
  // a linear node and would lose its port on the way back to the canvas.
  while (outputs.length < minOutputs) outputs.push([]);
  while (outputs.length <= outputIndex) outputs.push([]);
  outputs[outputIndex].push(connection);
}

export interface ToWorkflowOptions {
  branches?: BranchDef[];
  name?: string;
}

/** React Flow graph → canonical n8n workflow. */
export function toWorkflow(graph: EditorGraph | null | undefined, opts: ToWorkflowOptions = {}): N8nWorkflow {
  const branches = opts.branches ?? [];
  const inNodes = graph?.nodes ?? [];
  const inEdges = graph?.edges ?? [];

  const taken = new Set<string>();
  const nameById = new Map<string, string>();

  const nodes: N8nNode[] = inNodes.map((n) => {
    const name = uniqueName(displayLabel(n), taken);
    nameById.set(n.id, name);
    const pos = (n.position ?? { x: 0, y: 0 }) as { x: number; y: number };
    const node: N8nNode = {
      id: n.id,
      name,
      type: n.type,
      typeVersion: (n as { typeVersion?: number }).typeVersion ?? DEFAULT_TYPE_VERSION,
      position: [pos.x ?? 0, pos.y ?? 0],
    };
    const params = (n as { parameters?: Record<string, unknown> }).parameters;
    if (params) node.parameters = params;
    // Node-level settings (onError, alwaysOutputData, …) are n8n node
    // properties, not parameters — the editor stores them on `data`.
    const settings = (n.data as { settings?: Record<string, unknown> } | undefined)?.settings
      ?? (n as { settings?: Record<string, unknown> }).settings;
    if (settings) node.settings = settings;
    return node;
  });

  const connections: Connections = {};
  for (const edge of inEdges) {
    const from = nameById.get(edge.source);
    const to = nameById.get(edge.target);
    // An edge naming a node that isn't on the canvas is not representable;
    // dropping it keeps the workflow well-formed rather than half-broken.
    if (!from || !to) continue;

    const handle = edge.targetHandle ?? undefined;
    const connector = handle ? HANDLE_TO_CONNECTOR[handle] : undefined;

    if (connector && isAiConnection(connector)) {
      // Sub-node attachment. In n8n these are keyed by the SUB-NODE's name and
      // point at the root node — the same direction the editor draws them.
      pushConnection(connections, from, connector, 0, { node: to, type: connector, index: 0 });
      continue;
    }

    // A branch handle means the source is a router: widen it to the full
    // branch count so the shape itself records that, wired or not.
    const isRouterEdge = Boolean(branchOf(edge)) && branches.length > 0;
    pushConnection(
      connections,
      from,
      'main',
      outputIndexFor(edge, branches),
      { node: to, type: 'main', index: 0 },
      isRouterEdge ? branches.length : 0
    );
  }

  const wf: N8nWorkflow = { nodes, connections };
  if (opts.name) wf.name = opts.name;
  return wf;
}

/** Canonical n8n workflow → React Flow graph, for the canvas. */
export function toEditorGraph(wf: N8nWorkflow | null | undefined, opts: ToWorkflowOptions = {}): EditorGraph {
  const branches = opts.branches ?? [];
  const nodes = wf?.nodes ?? [];
  const idByName = new Map<string, string>(nodes.map((n) => [n.name, n.id]));

  const edges: EditorGraph['edges'] = [];
  for (const [fromName, byType] of Object.entries(wf?.connections ?? {})) {
    const fromId = idByName.get(fromName);
    if (!fromId) continue;

    for (const [type, outputs] of Object.entries(byType ?? {})) {
      (outputs ?? []).forEach((targets, outputIndex) => {
        for (const conn of targets ?? []) {
          const toId = idByName.get(conn.node);
          if (!toId) continue;

          if (isAiConnection(type)) {
            edges.push({
              id: `${fromId}-${toId}-${type}`,
              source: fromId,
              target: toId,
              targetHandle: CONNECTOR_TO_HANDLE[type as ConnectionType] ?? type,
            });
            continue;
          }

          // Only a router carries a branch handle. A node with a single main
          // output is linear — tagging its one output with branches[0] would
          // turn every trigger→next wire into a branch.
          const isRouter = (outputs ?? []).length > 1;
          const branch = isRouter ? branches[outputIndex]?.id : undefined;
          edges.push({
            id: `${fromId}-${toId}-${outputIndex}`,
            source: fromId,
            target: toId,
            ...(branch ? { sourceHandle: branch } : {}),
          });
        }
      });
    }
  }

  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: { x: n.position[0], y: n.position[1] },
      data: { label: n.name },
    })),
    edges,
  };
}

// ---- Read helpers. Everything downstream should go through these rather than
// reaching into `connections` and re-deriving the array-of-arrays each time.

export function nodeByName(wf: N8nWorkflow, name: NodeName): N8nNode | undefined {
  return wf.nodes.find((n) => n.name === name);
}

export function nodeById(wf: N8nWorkflow, id: string): N8nNode | undefined {
  return wf.nodes.find((n) => n.id === id);
}

/** Outputs of a node on one connector: outer index = output number. */
export function outputsOf(wf: N8nWorkflow, name: NodeName, type: ConnectionType = 'main'): Connection[][] {
  return wf.connections[name]?.[type] ?? [];
}

/** Every main target of a node, flattened. Pass `outputIndex` for one output. */
export function mainTargets(wf: N8nWorkflow, name: NodeName, outputIndex?: number): NodeName[] {
  const outputs = outputsOf(wf, name, 'main');
  const chosen = outputIndex === undefined ? outputs.flat() : (outputs[outputIndex] ?? []);
  return chosen.map((c) => c.node);
}

/** Sub-nodes attached to a root node over a given ai_* connector. */
export function subNodesOf(wf: N8nWorkflow, rootName: NodeName, type: ConnectionType): N8nNode[] {
  const out: N8nNode[] = [];
  for (const [fromName, byType] of Object.entries(wf.connections)) {
    for (const conn of (byType?.[type] ?? []).flat()) {
      if (conn.node === rootName) {
        const node = nodeByName(wf, fromName);
        if (node) out.push(node);
      }
    }
  }
  return out;
}

/** Nodes with no incoming `main` connection — where a walk can start. */
export function entryNodes(wf: N8nWorkflow): N8nNode[] {
  const targeted = new Set<NodeName>();
  for (const byType of Object.values(wf.connections)) {
    for (const conn of (byType?.main ?? []).flat()) targeted.add(conn.node);
  }
  return wf.nodes.filter((n) => !targeted.has(n.name));
}
