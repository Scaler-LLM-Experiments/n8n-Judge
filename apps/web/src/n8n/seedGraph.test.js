import { describe, it, expect } from 'vitest';
import { seedEdges, seedNodes, nextNodeId } from './N8nEditor.jsx';
import { traceableGraph } from '../lib/traceGraph.js';

// Seeding the canvas serves two callers that speak DIFFERENT dialects, and the
// resumed learner is the one that was never tested:
//
//   authored referenceGraph   { source, target, branch: 'bug_report' }
//   the editor / the tracer   { source, target, sourceHandle: 'bug_report' }
//
// Both bugs below were reported as one symptom — "come back to a build and nodes
// have vanished and the wiring is a mess".

describe('seedEdges — the dialect a resumed graph is recorded in', () => {
  it('keeps a branch handle recorded by the tracer', () => {
    // What `traceableGraph` actually writes for a router exit.
    const [edge] = seedEdges({
      nodes: [],
      edges: [{ id: 'en5', source: 'n4', target: 'n5', sourceHandle: 'urgent_complaint' }],
    });
    expect(edge.sourceHandle).toBe('urgent_complaint');
  });

  it('keeps every exit distinct, so branch wires do not collapse onto output 0', () => {
    // React Flow's getHandle() falls back to bounds[0] when sourceHandle is
    // undefined, so losing the handle draws every branch out of the first exit —
    // and `asWorkflow`/`branchReach` then see no branch at all, which refuses a
    // phase the learner had already completed.
    const graph = traceableGraph(
      [
        { id: 'n1', type: 'switch', position: { x: 0, y: 0 }, data: {} },
        { id: 'n2', type: 'slack', position: { x: 300, y: 0 }, data: {} },
        { id: 'n3', type: 'gmail', position: { x: 300, y: 150 }, data: {} },
      ],
      [
        { id: 'en2', source: 'n1', target: 'n2', sourceHandle: 'escalate' },
        { id: 'en3', source: 'n1', target: 'n3', sourceHandle: 'reply' },
      ]
    );
    const handles = seedEdges(graph).map((e) => e.sourceHandle);
    expect(handles).toEqual(['escalate', 'reply']);
  });

  it('still honours an authored `branch` (the dev routes seed referenceGraph)', () => {
    const [edge] = seedEdges({ nodes: [], edges: [{ source: 'switch-1', target: 'action-bug', branch: 'bug_report' }] });
    expect(edge.sourceHandle).toBe('bug_report');
  });

  it('rebuilds the model stem as a model stem', () => {
    const [edge] = seedEdges({ nodes: [], edges: [{ source: 'n2', target: 'n1', targetHandle: 'ai_model' }] });
    expect(edge).toMatchObject({ sourceHandle: 'ai_out', targetHandle: 'ai_model', type: 'aiModel' });
  });

  it('leaves a plain main wire without a handle', () => {
    const [edge] = seedEdges({ nodes: [], edges: [{ source: 'n1', target: 'n2' }] });
    expect(edge.sourceHandle).toBeUndefined();
  });
});

describe('seedNodes — a trace already holding a duplicate id must not poison the canvas', () => {
  // Production really did record this (session cmsoibwsi…, seq 37, 2026-08-11):
  // `[{id:'n2',type:'trigger'}, {id:'n2',type:'chat-gemini'}]`, written by the
  // counter bug before it was fixed. Those rows are immutable, so seeding has to
  // cope: React Flow keeps the LAST node per id, so two entries render as one
  // while both sit in React state — and one removeNode then deletes both.
  const corrupt = {
    nodes: [
      { id: 'n2', type: 'trigger', position: { x: 0, y: 0 }, data: { configured: true } },
      { id: 'n2', type: 'chat-gemini', position: { x: 100, y: 200 }, data: { configured: false } },
    ],
    edges: [],
  };

  it('keeps one node per id', () => {
    const seeded = seedNodes(corrupt, {});
    expect(seeded.map((n) => n.id)).toEqual(['n2']);
  });

  it('keeps the LAST one, which is what React Flow rendered', () => {
    // Anything else would move the canvas out of step with what the learner saw
    // before the reload.
    expect(seedNodes(corrupt, {})[0].type).toBe('chat-gemini');
  });

  it('leaves a clean graph exactly as it was', () => {
    const clean = {
      nodes: [
        { id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} },
        { id: 'n2', type: 'chat-gemini', position: { x: 10, y: 20 }, data: {} },
      ],
      edges: [],
    };
    expect(seedNodes(clean, {}).map((n) => `${n.id}:${n.type}`)).toEqual(['n1:trigger', 'n2:chat-gemini']);
  });

  it('and the surviving node is still what the next id is computed from', () => {
    // The dedupe must not hide an id from nextNodeId, or the collision comes back.
    expect(nextNodeId(seedNodes(corrupt, {}))).toBe('n3');
  });
});

describe('nextNodeId — ids must not collide with a restored canvas', () => {
  // The id counter used to be a module-level `let idc = 0`, which a reload reset
  // while the restored nodes kept their original ids. The next node the learner
  // placed was therefore a DUPLICATE: React Flow keys its internals by id and
  // keeps the last, so the restored node vanished from the canvas, its wires
  // re-routed to the impostor, and removing either deleted both.
  it('does not hand back an id the canvas already holds', () => {
    const restored = [{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }];
    const id = nextNodeId(restored);
    expect(restored.map((n) => n.id)).not.toContain(id);
  });

  it('continues past the highest restored id rather than restarting at 1', () => {
    expect(nextNodeId([{ id: 'n1' }, { id: 'n5' }, { id: 'n2' }])).toBe('n6');
  });

  it('starts at n1 on an empty canvas', () => {
    expect(nextNodeId([])).toBe('n1');
  });

  it('ignores ids from an authored referenceGraph', () => {
    // The dev routes seed `trigger-1` / `classify-1`, which are not in the n<N>
    // space at all and must not be parsed as one.
    expect(nextNodeId([{ id: 'trigger-1' }, { id: 'classify-1' }])).toBe('n1');
  });

  it('is stable while the canvas is, and moves when a node is added', () => {
    const nodes = [{ id: 'n1' }];
    const first = nextNodeId(nodes);
    expect(nextNodeId(nodes)).toBe(first);
    expect(nextNodeId(nodes.concat({ id: first }))).not.toBe(first);
  });
});
