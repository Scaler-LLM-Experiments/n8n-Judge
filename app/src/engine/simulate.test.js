import { describe, it, expect } from 'vitest';
import { simulateAll, simulateCase } from './simulate.js';
import { emailTriage } from '../data/problems/emailTriage/index.js';

function correctGraph() {
  return {
    nodes: [
      { id: 't', type: 'trigger', data: { label: 'New Email' } },
      { id: 'c', type: 'classify', data: { label: 'Classify with AI' } },
      { id: 'm', type: 'chat-gemini', data: { label: 'Gemini Chat Model' } },
      { id: 'p', type: 'parse', data: { label: 'Parse Result' } },
      { id: 's', type: 'switch', data: { label: 'Switch' } },
      { id: 'ab', type: 'action', data: { label: 'Send Reply' } },
      { id: 'af', type: 'action', data: { label: 'Send Reply' } },
      { id: 'au', type: 'action', data: { label: 'Send Reply' } },
    ],
    edges: [
      { id: 'em', source: 'm', target: 'c', targetHandle: 'ai_model' },
      { id: 'e1', source: 't', target: 'c' },
      { id: 'e2', source: 'c', target: 'p' },
      { id: 'e3', source: 'p', target: 's' },
      { id: 'e4', source: 's', target: 'ab', sourceHandle: 'bug_report' },
      { id: 'e5', source: 's', target: 'af', sourceHandle: 'feature_request' },
      { id: 'e6', source: 's', target: 'au', sourceHandle: 'urgent_complaint' },
    ],
  };
}

describe('simulate', () => {
  it('delivers all three categorised emails on a correct graph and succeeds', () => {
    const { cases, success } = simulateAll(correctGraph(), emailTriage);
    expect(success).toBe(true);
    expect(cases.find((r) => r.case.id === 'bug').delivered).toBe(true);
    expect(cases.find((r) => r.case.id === 'feature').delivered).toBe(true);
    expect(cases.find((r) => r.case.id === 'urgent').delivered).toBe(true);
  });

  it('lets the general-question email dead-end at the Switch (by design)', () => {
    const q = emailTriage.sampleCases.find((c) => c.id === 'question');
    const { delivered, steps } = simulateCase(correctGraph(), q);
    expect(delivered).toBe(false);
    expect(steps.some((s) => s.status === 'dead')).toBe(true);
  });

  it('fails when no chat model is connected to classify', () => {
    const g = correctGraph();
    g.edges = g.edges.filter((e) => e.id !== 'em');
    const { success } = simulateAll(g, emailTriage);
    expect(success).toBe(false);
  });

  it('fails when a branch is not wired to a reply', () => {
    const g = correctGraph();
    g.edges = g.edges.filter((e) => e.id !== 'e6');
    const { cases, success } = simulateAll(g, emailTriage);
    expect(success).toBe(false);
    expect(cases.find((r) => r.case.id === 'urgent').delivered).toBe(false);
  });
});
