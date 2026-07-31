import { describe, it, expect } from 'vitest';
import { traceableGraph } from './traceGraph.js';

// React Flow nodes, as the editor hands them to `onGraphChange`.
const nodes = [
  {
    id: 'n1',
    type: 'trigger',
    position: { x: 220, y: 180 },
    // The editor stores far more than this on a node — catalog params, sample
    // output, the per-render cue flags. Only what a resume needs is traced.
    data: {
      nodeType: 'trigger',
      label: 'New Email',
      configured: true,
      wrong: false,
      values: { pollTimes: 'everyMinute' },
      settings: { onError: 'stopWorkflow', alwaysOutputData: false },
      params: [{ key: 'pollTimes' }],
      output: { subject: 'Hi' },
      needsSetup: false,
    },
  },
  { id: 'n2', type: 'classify', position: { x: 560, y: 180 }, data: { configured: false, wrong: false } },
];
const edges = [{ id: 'e1', source: 'n1', target: 'n2', sourceHandle: null, targetHandle: null }];

describe('traceableGraph', () => {
  it('carries every node position — without one, React Flow throws while seeding a resumed canvas', () => {
    const g = traceableGraph(nodes, edges);
    expect(g.nodes.map((n) => n.position)).toEqual([{ x: 220, y: 180 }, { x: 560, y: 180 }]);
  });

  it('carries the field values and settings the learner entered, so a resumed node is not blank', () => {
    const [first] = traceableGraph(nodes, edges).nodes;
    expect(first.data.values).toEqual({ pollTimes: 'everyMinute' });
    expect(first.data.settings).toEqual({ onError: 'stopWorkflow', alwaysOutputData: false });
  });

  it('carries whether each node was configured, and whether it was a wrong pick', () => {
    const g = traceableGraph(nodes, edges);
    expect(g.nodes.map((n) => n.data.configured)).toEqual([true, false]);
    expect(g.nodes.map((n) => n.data.wrong)).toEqual([false, false]);
  });

  it('leaves out what the catalog already knows — this payload is written on every change', () => {
    const [first] = traceableGraph(nodes, edges).nodes;
    expect(first.data.params).toBeUndefined();
    expect(first.data.output).toBeUndefined();
    expect(first.data.label).toBeUndefined();
    // Per-render cue flags say nothing about what the learner did.
    expect(first.data.needsSetup).toBeUndefined();
  });

  it('keeps the connections, handles included — a branch IS its handle', () => {
    const g = traceableGraph(nodes, [
      { id: 'e2', source: 'n1', target: 'n2', sourceHandle: 'bug_report', targetHandle: 'ai_model' },
    ]);
    expect(g.edges).toEqual([
      { id: 'e2', source: 'n1', target: 'n2', sourceHandle: 'bug_report', targetHandle: 'ai_model' },
    ]);
  });

  it('normalises a node with no values or settings yet to empty, not undefined', () => {
    const [, second] = traceableGraph(nodes, edges).nodes;
    expect(second.data.values).toEqual({});
    expect(second.data.settings).toEqual({});
  });

  it('survives a node with no data at all', () => {
    const g = traceableGraph([{ id: 'x', type: 'trigger', position: { x: 0, y: 0 } }], []);
    expect(g.nodes[0].data).toEqual({ configured: false, wrong: false, values: {}, settings: {} });
  });
});
