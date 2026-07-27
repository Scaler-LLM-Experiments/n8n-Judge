// The canonical workflow model, shaped like real n8n.
//
// Judge previously modelled a flow the way React Flow draws it: a flat `edges`
// array of {source, target, sourceHandle, targetHandle}. That is a rendering
// detail, not how n8n thinks. Real n8n keys connections by the SOURCE NODE'S
// NAME, and `main` is an array-of-arrays — one inner array per output — which
// is exactly how IF (2 outputs), Switch (N outputs) and Loop (loop/done)
// express branching. Sub-nodes attach over separately typed connectors
// (ai_languageModel, ai_memory, ai_tool, ai_outputParser) rather than the grey
// main wire.
//
// Getting this shape right is what lets a problem round-trip with real n8n
// JSON, and it is the structure the grading worker will replay. See
// docs/research/n8n-core-architecture.md §1.

/** Connections reference nodes by name, so names must be unique in a workflow. */
export type NodeName = string;

/**
 * Connector types. `main` is the grey wire that carries items. The `ai_*`
 * connectors attach cluster sub-nodes to a root node (AI Agent, Basic LLM
 * Chain, Text Classifier…) and carry capability, not items.
 */
export const CONNECTION_TYPES = [
  'main',
  'ai_languageModel',
  'ai_memory',
  'ai_tool',
  'ai_outputParser',
  'ai_embedding',
  'ai_document',
  'ai_textSplitter',
  'ai_retriever',
] as const;

export type ConnectionType = (typeof CONNECTION_TYPES)[number];

export function isAiConnection(type: string): boolean {
  return type.startsWith('ai_');
}

export interface N8nNode {
  /** Stable internal id. n8n uses a UUID; connections never reference it. */
  id: string;
  /** Display name and the key connections use. Unique within a workflow. */
  name: NodeName;
  /** Node type. Judge catalog key today; `n8n-nodes-base.*` once aligned. */
  type: string;
  /** Parameter-schema version of that node type. */
  typeVersion: number;
  /** Canvas coordinates, `[x, y]` — a tuple in n8n, not an object. */
  position: [number, number];
  parameters?: Record<string, unknown>;
  credentials?: Record<string, { id?: string; name: string }>;
  disabled?: boolean;
}

/** One edge: which node receives, over which connector, into which input. */
export interface Connection {
  node: NodeName;
  type: ConnectionType;
  /** Which INPUT of the target receives this. 0 unless the target is a Merge. */
  index: number;
}

/**
 * Keyed by source node name. For each connector type, an array of arrays:
 * outer index = which OUTPUT of the source, inner array = every target wired
 * to that output (an output may fan out to several nodes).
 *
 *   "Switch": { main: [ [ {node:"Bug reply",…} ], [ {node:"Feature reply",…} ] ] }
 *              output 0 ────────┘               output 1 ────────┘
 */
export type Connections = Record<NodeName, Partial<Record<ConnectionType, Connection[][]>>>;

export interface N8nWorkflow {
  name?: string;
  nodes: N8nNode[];
  connections: Connections;
  settings?: Record<string, unknown>;
}

/** The React Flow shape the editor renders. Converted at the boundary. */
export interface EditorNode {
  id: string;
  type: string;
  position?: { x: number; y: number };
  data?: { label?: string; [k: string]: unknown };
  [k: string]: unknown;
}

export interface EditorEdge {
  id?: string;
  source: string;
  target: string;
  /** Branch id for a router output, else undefined. */
  sourceHandle?: string | null;
  /** `ai_model` etc. for sub-node attachment, else undefined. */
  targetHandle?: string | null;
  /** Authored reference graphs use `branch` where the editor uses sourceHandle. */
  branch?: string;
  [k: string]: unknown;
}

export interface EditorGraph {
  nodes: EditorNode[];
  edges: EditorEdge[];
}

/** A problem's branch list; its order defines Switch output indices. */
export interface BranchDef {
  id: string;
  label?: string;
}
