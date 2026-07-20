import { describe, it, expect } from 'vitest';
import { validateGraph } from './validateGraph.js';
import { emailTriage } from '../data/problems/emailTriage.js';

function buildCorrectGraph() {
  return {
    nodes: [
      { id: 'n1', type: 'trigger' },
      { id: 'n2', type: 'classify' },
      { id: 'n3', type: 'parse' },
      { id: 'n4', type: 'route' },
      { id: 'n5', type: 'action' },
      { id: 'n6', type: 'action' },
      { id: 'n7', type: 'action' },
      { id: 'n8', type: 'complete' },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5', sourceHandle: 'bug_report' },
      { id: 'e5', source: 'n4', target: 'n6', sourceHandle: 'feature_request' },
      { id: 'e6', source: 'n4', target: 'n7', sourceHandle: 'urgent_complaint' },
      { id: 'e7', source: 'n5', target: 'n8' },
      { id: 'e8', source: 'n6', target: 'n8' },
      { id: 'e9', source: 'n7', target: 'n8' },
    ],
  };
}

describe('validateGraph', () => {
  it('passes every test case for a fully correct graph', () => {
    const result = validateGraph(buildCorrectGraph(), emailTriage);
    expect(result.allPassed).toBe(true);
    expect(result.results.every((r) => r.passed)).toBe(true);
  });

  it('fails the trigger check when no trigger node exists', () => {
    const graph = buildCorrectGraph();
    graph.nodes = graph.nodes.filter((n) => n.type !== 'trigger');
    const result = validateGraph(graph, emailTriage);
    expect(result.allPassed).toBe(false);
    expect(result.results.find((r) => r.id === 'trigger-present').passed).toBe(false);
  });

  it('fails the route-connection check when parse does not feed into route', () => {
    const graph = buildCorrectGraph();
    graph.edges = graph.edges.filter((e) => e.id !== 'e3');
    const result = validateGraph(graph, emailTriage);
    expect(result.results.find((r) => r.id === 'route-present-with-branches').passed).toBe(false);
  });

  it('fails the branch check when the urgent complaint branch is missing', () => {
    const graph = buildCorrectGraph();
    graph.edges = graph.edges.filter((e) => e.sourceHandle !== 'urgent_complaint');
    const result = validateGraph(graph, emailTriage);
    const failed = result.results.find((r) => r.id === 'each-branch-sends-reply');
    expect(failed.passed).toBe(false);
    expect(failed.reason).toContain('urgent_complaint');
  });

  it('fails the path check when a branch action does not reach Complete', () => {
    const graph = buildCorrectGraph();
    graph.edges = graph.edges.filter((e) => e.id !== 'e8');
    const result = validateGraph(graph, emailTriage);
    expect(result.results.find((r) => r.id === 'all-paths-complete').passed).toBe(false);
  });

  it('ignores distractor nodes present in the student graph', () => {
    const graph = buildCorrectGraph();
    graph.nodes.push({ id: 'n9', type: 'slack-message' });
    const result = validateGraph(graph, emailTriage);
    expect(result.allPassed).toBe(true);
  });
});
