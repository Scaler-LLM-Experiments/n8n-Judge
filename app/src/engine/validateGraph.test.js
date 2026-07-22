import { describe, it, expect } from 'vitest';
import { validateGraph } from './validateGraph.js';
import { emailTriage } from '../data/problems/emailTriage/index.js';

function buildCorrectGraph() {
  return {
    nodes: [
      { id: 'n1', type: 'trigger' },
      { id: 'n2', type: 'classify' },
      { id: 'nm', type: 'chat-gemini' },
      { id: 'n3', type: 'parse' },
      { id: 'n4', type: 'switch' },
      { id: 'n5', type: 'action' },
      { id: 'n6', type: 'action' },
      { id: 'n7', type: 'action' },
    ],
    edges: [
      { id: 'em', source: 'nm', target: 'n2', targetHandle: 'ai_model' },
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5', sourceHandle: 'bug_report' },
      { id: 'e5', source: 'n4', target: 'n6', sourceHandle: 'feature_request' },
      { id: 'e6', source: 'n4', target: 'n7', sourceHandle: 'urgent_complaint' },
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

  it('fails the model-connected check when no chat model is wired into classify', () => {
    const graph = buildCorrectGraph();
    graph.edges = graph.edges.filter((e) => e.id !== 'em');
    const result = validateGraph(graph, emailTriage);
    expect(result.results.find((r) => r.id === 'model-connected').passed).toBe(false);
  });

  it('fails the model-connected check when the model edge is on the wrong port', () => {
    const graph = buildCorrectGraph();
    graph.edges = graph.edges.map((e) => (e.id === 'em' ? { ...e, targetHandle: undefined } : e));
    const result = validateGraph(graph, emailTriage);
    expect(result.results.find((r) => r.id === 'model-connected').passed).toBe(false);
  });

  it('fails the switch-connection check when parse does not feed into switch', () => {
    const graph = buildCorrectGraph();
    graph.edges = graph.edges.filter((e) => e.id !== 'e3');
    const result = validateGraph(graph, emailTriage);
    expect(result.results.find((r) => r.id === 'switch-present-with-branches').passed).toBe(false);
  });

  it('fails the branch check when the urgent complaint branch is missing', () => {
    const graph = buildCorrectGraph();
    graph.edges = graph.edges.filter((e) => e.sourceHandle !== 'urgent_complaint');
    const result = validateGraph(graph, emailTriage);
    const failed = result.results.find((r) => r.id === 'each-branch-sends-reply');
    expect(failed.passed).toBe(false);
    expect(failed.reason).toContain('urgent_complaint');
  });

  it('ignores distractor nodes present in the student graph', () => {
    const graph = buildCorrectGraph();
    graph.nodes.push({ id: 'nx', type: 'slack-message' });
    const result = validateGraph(graph, emailTriage);
    expect(result.allPassed).toBe(true);
  });
});
