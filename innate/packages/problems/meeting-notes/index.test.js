import { describe, it, expect } from 'vitest';
import { meetingNotes } from './index.js';
import { validateProblem } from '@judge/problem-schema';
import { simulateAll } from '@judge/engine';

// Build a runnable graph from the reference wiring (mirrors what the editor
// produces): edges carry the branch as sourceHandle and the model as ai_model.
function referenceGraph() {
  return {
    nodes: meetingNotes.referenceGraph.nodes.map((n) => ({ id: n.id, type: n.type, data: { label: n.requiredLabel } })),
    edges: meetingNotes.referenceGraph.edges.map((e, i) => ({
      id: `e${i}`,
      source: e.source,
      target: e.target,
      targetHandle: e.targetHandle,
      sourceHandle: e.branch,
    })),
  };
}

describe('meeting-notes problem spec', () => {
  it('passes validateProblem with no errors', () => {
    const result = validateProblem(meetingNotes);
    const errors = result.issues.filter((i) => i.level === 'error');
    expect(errors, JSON.stringify(errors, null, 2)).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it('is a linear (non-routing) flow — no branches, no branchNext', () => {
    expect(meetingNotes.branches).toHaveLength(0);
    expect(meetingNotes.flow.branchNext).toBeUndefined();
    expect(meetingNotes.nodePalette.some((n) => !n.isDistractor && n.category === 'trigger')).toBe(true);
    expect(meetingNotes.nodePalette.some((n) => !n.isDistractor && n.category === 'action')).toBe(true);
  });

  it('drops the dead legacy prototype fields', () => {
    expect(meetingNotes.buildSteps).toBeUndefined();
    expect(meetingNotes.connectionGuide).toBeUndefined();
    expect(meetingNotes.testCaseSummary).toBeUndefined();
  });

  it('delivers every transcript on the reference wiring', () => {
    const { success, cases } = simulateAll(referenceGraph(), meetingNotes);
    expect(success).toBe(true);
    expect(cases.every((c) => c.delivered)).toBe(true);
  });

  it('dead-ends when the Chat Model is not connected to Summarize', () => {
    const g = referenceGraph();
    g.edges = g.edges.filter((e) => e.targetHandle !== 'ai_model');
    const { success } = simulateAll(g, meetingNotes);
    expect(success).toBe(false);
  });

  it('every nodeSetup field and probe has exactly one correct option', () => {
    for (const setup of Object.values(meetingNotes.nodeSetup)) {
      for (const field of setup.fields ?? []) {
        expect(field.options.filter((o) => o.correct)).toHaveLength(1);
      }
    }
    for (const probe of Object.values(meetingNotes.nodeProbes)) {
      expect(probe.options.filter((o) => o.correct)).toHaveLength(1);
    }
  });
});
