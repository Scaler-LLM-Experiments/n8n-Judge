import { describe, it, expect } from 'vitest';
import { problemList } from '@judge/problems';
import {
  toWorkflow,
  toEditorGraph,
  outputsOf,
  mainTargets,
  subNodesOf,
  entryNodes,
  nodeByName,
} from './convert.ts';
import type { EditorGraph } from './types.ts';

// A router flow shaped like email-triage, in the editor's format.
const branches = [{ id: 'bug_report' }, { id: 'feature_request' }, { id: 'urgent_complaint' }];

const editorGraph: EditorGraph = {
  nodes: [
    { id: 't', type: 'trigger', position: { x: 0, y: 0 }, data: { label: 'New Email' } },
    { id: 'c', type: 'classify', position: { x: 260, y: 0 }, data: { label: 'Classify with AI' } },
    { id: 'm', type: 'chat-gemini', position: { x: 275, y: 160 }, data: { label: 'Gemini Chat Model' } },
    { id: 's', type: 'switch', position: { x: 520, y: 0 }, data: { label: 'Switch' } },
    { id: 'a1', type: 'action', position: { x: 800, y: -100 }, data: { label: 'Send Reply' } },
    { id: 'a2', type: 'action', position: { x: 800, y: 0 }, data: { label: 'Send Reply' } },
    { id: 'a3', type: 'action', position: { x: 800, y: 100 }, data: { label: 'Send Reply' } },
  ],
  edges: [
    { source: 'm', target: 'c', targetHandle: 'ai_model' },
    { source: 't', target: 'c' },
    { source: 'c', target: 's' },
    { source: 's', target: 'a1', sourceHandle: 'bug_report' },
    { source: 's', target: 'a2', sourceHandle: 'feature_request' },
    { source: 's', target: 'a3', sourceHandle: 'urgent_complaint' },
  ],
};

describe('toWorkflow', () => {
  const wf = toWorkflow(editorGraph, { branches });

  it('keys connections by source node NAME, not id', () => {
    expect(Object.keys(wf.connections)).toContain('New Email');
    expect(Object.keys(wf.connections)).not.toContain('t');
  });

  it('gives a router one main output per branch, in branch order', () => {
    const outputs = outputsOf(wf, 'Switch', 'main');
    expect(outputs).toHaveLength(3);
    expect(outputs[0][0].node).toBe('Send Reply');
    expect(outputs[1][0].node).toBe('Send Reply1');
    expect(outputs[2][0].node).toBe('Send Reply2');
  });

  it('deduplicates repeated labels, because connections reference names', () => {
    const names = wf.nodes.map((n) => n.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toContain('Send Reply');
    expect(names).toContain('Send Reply1');
  });

  it('maps the editor ai_model handle to the real ai_languageModel connector', () => {
    // Keyed by the SUB-node, pointing at the root — the n8n direction.
    expect(outputsOf(wf, 'Gemini Chat Model', 'ai_languageModel')[0][0].node).toBe('Classify with AI');
    // and it must NOT appear as a main wire
    expect(outputsOf(wf, 'Gemini Chat Model', 'main')).toHaveLength(0);
  });

  it('puts a single-output node on main output 0', () => {
    expect(mainTargets(wf, 'New Email')).toEqual(['Classify with AI']);
  });

  it('stores position as an [x, y] tuple', () => {
    expect(nodeByName(wf, 'Classify with AI')?.position).toEqual([260, 0]);
  });

  it('drops edges referencing nodes that are not on the canvas', () => {
    const wonky = toWorkflow(
      { nodes: [{ id: 'a', type: 'trigger', data: { label: 'A' } }], edges: [{ source: 'a', target: 'ghost' }] },
      {}
    );
    expect(wonky.connections.A?.main ?? []).toHaveLength(0);
  });

  it('keeps unwired outputs as empty arrays so later outputs keep their index', () => {
    const partial = toWorkflow(
      {
        nodes: [
          { id: 's', type: 'switch', data: { label: 'Switch' } },
          { id: 'a', type: 'action', data: { label: 'Reply' } },
        ],
        // only the THIRD branch is wired
        edges: [{ source: 's', target: 'a', sourceHandle: 'urgent_complaint' }],
      },
      { branches }
    );
    const outputs = outputsOf(partial, 'Switch', 'main');
    expect(outputs).toHaveLength(3);
    expect(outputs[0]).toEqual([]);
    expect(outputs[1]).toEqual([]);
    expect(outputs[2][0].node).toBe('Reply');
  });

  it('handles an empty or missing graph', () => {
    expect(toWorkflow(null).nodes).toEqual([]);
    expect(toWorkflow({ nodes: [], edges: [] }).connections).toEqual({});
  });
});

describe('read helpers', () => {
  const wf = toWorkflow(editorGraph, { branches });

  it('finds sub-nodes attached to a root over a connector', () => {
    const models = subNodesOf(wf, 'Classify with AI', 'ai_languageModel');
    expect(models.map((n) => n.name)).toEqual(['Gemini Chat Model']);
  });

  it('reports entry nodes — no incoming main connection', () => {
    // The chat model has no incoming main wire either; it attaches over ai_*.
    expect(entryNodes(wf).map((n) => n.name).sort()).toEqual(['Gemini Chat Model', 'New Email']);
  });

  it('returns one output of a router', () => {
    expect(mainTargets(wf, 'Switch', 1)).toEqual(['Send Reply1']);
  });
});

describe('round trip', () => {
  it('editor → workflow → editor preserves the wiring', () => {
    const wf = toWorkflow(editorGraph, { branches });
    const back = toEditorGraph(wf, { branches });

    expect(back.nodes.map((n) => n.id).sort()).toEqual(editorGraph.nodes.map((n) => n.id).sort());

    const key = (e: { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }) =>
      `${e.source}->${e.target}:${e.sourceHandle ?? ''}:${e.targetHandle ?? ''}`;
    expect(back.edges.map(key).sort()).toEqual(editorGraph.edges.map(key).sort());
  });

  // The real proof: every shipped problem's reference graph survives the trip.
  // These include a linear flow (meeting-notes) and two routers.
  for (const problem of problemList) {
    it(`${problem.id}: reference graph round-trips`, () => {
      const graph = problem.referenceGraph as EditorGraph;
      const opts = { branches: problem.branches ?? [] };
      const wf = toWorkflow(graph, opts);

      expect(wf.nodes).toHaveLength(graph.nodes.length);
      expect(new Set(wf.nodes.map((n) => n.name)).size).toBe(graph.nodes.length);

      const back = toEditorGraph(wf, opts);
      expect(back.edges).toHaveLength(graph.edges.length);

      const key = (e: { source: string; target: string; sourceHandle?: string | null; branch?: string; targetHandle?: string | null }) =>
        `${e.source}->${e.target}:${e.sourceHandle ?? e.branch ?? ''}:${e.targetHandle ?? ''}`;
      expect(back.edges.map(key).sort()).toEqual(graph.edges.map(key).sort());
    });
  }
});
