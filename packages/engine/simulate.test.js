import { describe, it, expect } from 'vitest';
import { roleOf, simulateAll, simulateCase } from './simulate.js';
import { emailTriage } from '@judge/problems/email-triage/index.js';

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
  it('treats static multi-output nodes as routers', () => {
    expect(roleOf('if')).toBe('router');
    expect(roleOf('compare-datasets')).toBe('router');
  });

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

  // --- Generalized (non-canonical) topologies — proving the walk is metadata-driven.

  it('handles a linear flow with no router (trigger → ai(+model) → action)', () => {
    const graph = {
      nodes: [
        { id: 't', type: 'trigger', data: { label: 'New Email' } },
        { id: 'c', type: 'classify', data: { label: 'Classify' } },
        { id: 'm', type: 'chat-gemini', data: { label: 'Model' } },
        { id: 'a', type: 'action', data: { label: 'Send Reply' } },
      ],
      edges: [
        { id: 'em', source: 'm', target: 'c', targetHandle: 'ai_model' },
        { id: 'e1', source: 't', target: 'c' },
        { id: 'e2', source: 'c', target: 'a' },
      ],
    };
    const c = { id: 'x', from: 'a@b.co', subject: 'hi', category: 'ANY', urgency: 'LOW', branch: null, reply: null };
    const { delivered, steps } = simulateCase(graph, c);
    expect(delivered).toBe(true);
    expect(steps.some((s) => s.status === 'dead')).toBe(false);
  });

  it('routes through a multi-node branch (switch → passthrough → action)', () => {
    const graph = {
      nodes: [
        { id: 't', type: 'trigger', data: {} },
        { id: 'c', type: 'classify', data: {} },
        { id: 'm', type: 'chat-gemini', data: {} },
        { id: 's', type: 'switch', data: {} },
        { id: 'p2', type: 'parse', data: { label: 'Prep reply' } },
        { id: 'a', type: 'action', data: { label: 'Send' } },
      ],
      edges: [
        { id: 'em', source: 'm', target: 'c', targetHandle: 'ai_model' },
        { id: 'e1', source: 't', target: 'c' },
        { id: 'e2', source: 'c', target: 's' },
        { id: 'e3', source: 's', target: 'p2', sourceHandle: 'bug_report' },
        { id: 'e4', source: 'p2', target: 'a' },
      ],
    };
    const bug = emailTriage.sampleCases.find((x) => x.id === 'bug');
    const { delivered } = simulateCase(graph, bug);
    expect(delivered).toBe(true); // old hard-coded walk required switch→action directly
  });

  it('still requires a Chat Model on an AI node in a linear flow', () => {
    const graph = {
      nodes: [
        { id: 't', type: 'trigger', data: {} },
        { id: 'c', type: 'classify', data: {} },
        { id: 'a', type: 'action', data: {} },
      ],
      edges: [
        { id: 'e1', source: 't', target: 'c' },
        { id: 'e2', source: 'c', target: 'a' },
      ],
    };
    const c = { id: 'x', from: 'a@b.co', subject: 'hi', category: 'ANY', urgency: 'LOW', branch: null, reply: null };
    const { delivered, steps } = simulateCase(graph, c);
    expect(delivered).toBe(false);
    expect(steps.some((s) => s.status === 'dead')).toBe(true);
  });
});

// The Run walk ends at the first `action`-category node, which made the shape the
// authoring docs advertise as "Scheduled sync" unnarratable: `schedule → sheets
// read → filter → aggregate → slack` returned `delivered` at the sheet and the
// three nodes after it never lit up. A node's role now depends on the operation
// it is configured for, not on its category alone.
describe('an app node configured as a read is a step, not an ending', () => {
  const chain = (values) => ({
    nodes: [
      { id: 'sc', type: 'schedule', data: { label: 'Schedule Trigger' } },
      { id: 'gs', type: 'google-sheets', data: { label: 'Get row(s)', values } },
      { id: 'fl', type: 'filter', data: { label: 'Filter' } },
      { id: 'ag', type: 'aggregate', data: { label: 'Aggregate' } },
      { id: 'sl', type: 'slack', data: { label: 'Slack' } },
    ],
    edges: [
      { id: 'e1', source: 'sc', target: 'gs' },
      { id: 'e2', source: 'gs', target: 'fl' },
      { id: 'e3', source: 'fl', target: 'ag' },
      { id: 'e4', source: 'ag', target: 'sl' },
    ],
  });
  const sample = { id: 'sweep', from: 'Bean Inventory 2026', subject: '07:30 sweep' };

  it('walks the whole chain and delivers at the LAST node when the read is configured', () => {
    const { steps, delivered } = simulateCase(chain({ sheetOperation: 'read' }), sample, {}, []);
    expect(delivered).toBe(true);
    // every node on the canvas narrates, in order
    expect(steps.filter((s) => s.nodeId).map((s) => s.nodeId)).toEqual(['sc', 'gs', 'fl', 'ag', 'sl']);
    expect(steps.at(-1).status).toBe('done');
  });

  it('resolves the role from the configured operation', () => {
    expect(roleOf('google-sheets', { sheetOperation: 'read' })).toBe('passthrough');
    expect(roleOf('google-sheets', { sheetOperation: 'append' })).toBe('action');
  });

  it('is unchanged for a node with no configured operation', () => {
    // The safety property of the whole change: knowing only a type must give
    // exactly the answer it always gave, or every shipped case shifts under it.
    expect(roleOf('google-sheets')).toBe('action');
    const { steps, delivered } = simulateCase(chain(undefined), sample, {}, []);
    expect(delivered).toBe(true);
    expect(steps.filter((s) => s.nodeId).map((s) => s.nodeId)).toEqual(['sc', 'gs']);
  });
});
