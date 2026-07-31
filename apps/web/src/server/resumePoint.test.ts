import { describe, it, expect } from 'vitest';
import { resumePointFromTrace } from './resumePoint.ts';

// Events as the route reads them: newest first (`orderBy: { seq: 'desc' }`).
const ev = (type: string, payload: unknown) => ({ type, payload });
const decision = (kind: string, id: string, correct = true) =>
  ev('decision', { key: `${kind}:${id}`, kind, id, correct });

const graph = {
  nodes: [{ id: 'trigger-1', type: 'trigger', position: { x: 0, y: 180 } }],
  edges: [],
};

describe('resumePointFromTrace', () => {
  it('starts at the first screen when nothing has been recorded', () => {
    expect(resumePointFromTrace([])).toEqual({
      screen: 'statement',
      phaseId: null,
      answered: { dissection: [], stress: [] },
      solved: { dissection: [] },
      graph: null,
    });
  });

  it('separates answered from solved — the toolkit is built from the right answers only', () => {
    const point = resumePointFromTrace([
      decision('dissection', 'classify', false),
      decision('dissection', 'trigger', true),
    ]);
    expect(point.answered.dissection.sort()).toEqual(['classify', 'trigger']);
    expect(point.solved.dissection).toEqual(['trigger']);
  });

  it('counts a question solved when a LATER attempt got it right', () => {
    const point = resumePointFromTrace([
      decision('dissection', 'switch', true), // newest
      decision('dissection', 'switch', false),
    ]);
    expect(point.solved.dissection).toEqual(['switch']);
  });

  it('takes the screen from the newest transition, not the oldest', () => {
    const point = resumePointFromTrace([
      ev('screen_transition', { from: 'dashboard', to: 'eval' }),
      ev('screen_transition', { from: 'statement', to: 'dashboard' }),
    ]);
    expect(point.screen).toBe('eval');
  });

  it('carries the Build phase the learner reached — the whole point of this fix', () => {
    const point = resumePointFromTrace([
      ev('phase_transition', { phaseId: 'route', label: 'Route & reply' }),
      ev('phase_transition', { phaseId: 'brain', label: 'Give it a brain' }),
      ev('screen_transition', { from: 'statement', to: 'dashboard' }),
    ]);
    expect(point.phaseId).toBe('route');
  });

  it('leaves the phase null when Build was never entered, so the screen keeps its own default', () => {
    expect(resumePointFromTrace([decision('dissection', 'trigger')]).phaseId).toBeNull();
  });

  it('lists the quiz questions already answered, by kind', () => {
    const point = resumePointFromTrace([
      decision('stress', 'onerror-continue'),
      decision('dissection', 'classify'),
      decision('dissection', 'trigger'),
    ]);
    expect(point.answered.dissection.sort()).toEqual(['classify', 'trigger']);
    expect(point.answered.stress).toEqual(['onerror-continue']);
  });

  it('counts a WRONG answer as answered — the quiz advances either way', () => {
    // Requiring a correct answer here would re-ask a question the learner moved
    // past, handing them a second attempt at something already graded. Reloading
    // must not be a way to improve a score.
    const point = resumePointFromTrace([decision('dissection', 'switch', false)]);
    expect(point.answered.dissection).toEqual(['switch']);
  });

  it('answers each question once, however many attempts it took', () => {
    const point = resumePointFromTrace([
      decision('dissection', 'switch', true),
      decision('dissection', 'switch', false),
      decision('dissection', 'switch', false),
    ]);
    expect(point.answered.dissection).toEqual(['switch']);
  });

  it('ignores decisions that are not quiz questions', () => {
    const point = resumePointFromTrace([
      decision('field', 'classify:categories'),
      decision('placement', 'trigger'),
      decision('probe', 'web-search'),
      decision('setting', 'classify:onError'),
    ]);
    expect(point.answered).toEqual({ dissection: [], stress: [] });
    expect(point.solved).toEqual({ dissection: [] });
  });

  it('restores the canvas from the newest graph mutation', () => {
    const point = resumePointFromTrace([
      ev('graph_mutation', { op: 'add_node', graph }),
      ev('graph_mutation', { op: 'add_node', graph: { nodes: [], edges: [] } }),
    ]);
    expect(point.graph).toEqual(graph);
  });

  it('refuses a graph whose nodes have no position — React Flow throws on the way in', () => {
    const point = resumePointFromTrace([
      ev('graph_mutation', { op: 'add_node', graph: { nodes: [{ id: 'a', type: 'trigger' }], edges: [] } }),
    ]);
    expect(point.graph).toBeNull();
  });

  it('refuses an empty or malformed graph rather than seeding a broken canvas', () => {
    expect(resumePointFromTrace([ev('graph_mutation', { op: 'add_node', graph: { nodes: [], edges: [] } })]).graph).toBeNull();
    expect(resumePointFromTrace([ev('graph_mutation', { op: 'add_node', graph: null })]).graph).toBeNull();
    expect(resumePointFromTrace([ev('graph_mutation', {})]).graph).toBeNull();
  });

  it('survives a payload that is not an object at all', () => {
    const point = resumePointFromTrace([ev('screen_transition', null), ev('phase_transition', 'nope')]);
    expect(point.screen).toBe('statement');
    expect(point.phaseId).toBeNull();
  });
});
