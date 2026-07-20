import { describe, it, expect } from 'vitest';
import { computeMissingReferenceNodes, countPendingNodes } from './xray.js';
import { emailTriage } from '../data/problems/emailTriage.js';

describe('xray engine', () => {
  it('reports every reference node missing on an empty canvas', () => {
    const empty = { nodes: [], edges: [] };
    const missing = computeMissingReferenceNodes(empty, emailTriage.referenceGraph);
    expect(missing).toHaveLength(emailTriage.referenceGraph.nodes.length);
    expect(countPendingNodes(empty, emailTriage.referenceGraph)).toBe(
      emailTriage.referenceGraph.nodes.length
    );
  });

  it('reports zero missing once every required type is placed the right number of times', () => {
    const studentGraph = {
      nodes: [
        { id: 's1', type: 'trigger' },
        { id: 's2', type: 'classify' },
        { id: 's3', type: 'parse' },
        { id: 's4', type: 'route' },
        { id: 's5', type: 'action' },
        { id: 's6', type: 'action' },
        { id: 's7', type: 'action' },
        { id: 's8', type: 'complete' },
      ],
      edges: [],
    };
    expect(countPendingNodes(studentGraph, emailTriage.referenceGraph)).toBe(0);
  });

  it('reports 2 missing action ghosts when only 1 of 3 action nodes is placed', () => {
    const studentGraph = {
      nodes: [
        { id: 's1', type: 'trigger' },
        { id: 's2', type: 'classify' },
        { id: 's3', type: 'parse' },
        { id: 's4', type: 'route' },
        { id: 's5', type: 'action' },
        { id: 's8', type: 'complete' },
      ],
      edges: [],
    };
    const missing = computeMissingReferenceNodes(studentGraph, emailTriage.referenceGraph);
    expect(missing.filter((n) => n.type === 'action')).toHaveLength(2);
  });

  it('ignores distractor nodes the student has placed', () => {
    const studentGraph = { nodes: [{ id: 'x', type: 'slack-message' }], edges: [] };
    expect(countPendingNodes(studentGraph, emailTriage.referenceGraph)).toBe(
      emailTriage.referenceGraph.nodes.length
    );
  });
});
