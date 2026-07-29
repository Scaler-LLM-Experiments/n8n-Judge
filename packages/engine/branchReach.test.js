import { describe, it, expect } from 'vitest';
import { branchReachesReply, allBranchesWired, openBranchIds } from './branchReach.js';

// A problem with two branches, where `code` is graded (so it must be configured)
// and `action` / `slack-message` are the replies.
const problem = {
  branches: [{ id: 'left', label: 'Left' }, { id: 'right', label: 'Right' }],
  nodeSetup: {
    code: { fields: [{ key: 'js' }] },
    action: { fields: [{ key: 'to' }] },
    'slack-message': { fields: [{ key: 'channel' }] },
    filter: {}, // present but nothing to set
  },
};

const node = (id, type, configured = true) => ({ id, type, data: { configured } });

describe('branchReachesReply', () => {
  it('accepts a branch wired straight to a configured reply', () => {
    const graph = {
      nodes: [node('sw', 'switch'), node('a', 'action')],
      edges: [{ source: 'sw', sourceHandle: 'left', target: 'a' }],
    };
    expect(branchReachesReply(graph, problem, 'left')).toBe(true);
  });

  it('accepts a reply that is action-CATEGORY but not type "action"', () => {
    // The bug this module exists for: Slack ends a run, and the old inline check
    // demanded type === 'action', so this branch could never complete.
    const graph = {
      nodes: [node('sw', 'switch'), node('s', 'slack-message')],
      edges: [{ source: 'sw', sourceHandle: 'left', target: 's' }],
    };
    expect(branchReachesReply(graph, problem, 'left')).toBe(true);
  });

  it('follows a branch THROUGH a passthrough node to the reply', () => {
    const graph = {
      nodes: [node('sw', 'switch'), node('c', 'code'), node('a', 'action')],
      edges: [
        { source: 'sw', sourceHandle: 'left', target: 'c' },
        { source: 'c', target: 'a' },
      ],
    };
    expect(branchReachesReply(graph, problem, 'left')).toBe(true);
  });

  it('rejects when a node on the path is not configured', () => {
    // Reaching a reply through a node the learner never set up is not finished —
    // the flow would not run.
    const graph = {
      nodes: [node('sw', 'switch'), node('c', 'code', false), node('a', 'action')],
      edges: [
        { source: 'sw', sourceHandle: 'left', target: 'c' },
        { source: 'c', target: 'a' },
      ],
    };
    expect(branchReachesReply(graph, problem, 'left')).toBe(false);
  });

  it('treats a node with nothing to configure as complete', () => {
    const graph = {
      nodes: [node('sw', 'switch'), node('f', 'filter', false), node('a', 'action')],
      edges: [
        { source: 'sw', sourceHandle: 'left', target: 'f' },
        { source: 'f', target: 'a' },
      ],
    };
    expect(branchReachesReply(graph, problem, 'left')).toBe(true);
  });

  it('rejects an unconfigured reply', () => {
    const graph = {
      nodes: [node('sw', 'switch'), node('a', 'action', false)],
      edges: [{ source: 'sw', sourceHandle: 'left', target: 'a' }],
    };
    expect(branchReachesReply(graph, problem, 'left')).toBe(false);
  });

  it('rejects a branch that dead-ends', () => {
    const graph = {
      nodes: [node('sw', 'switch'), node('c', 'code')],
      edges: [{ source: 'sw', sourceHandle: 'left', target: 'c' }],
    };
    expect(branchReachesReply(graph, problem, 'left')).toBe(false);
  });

  it('rejects an unwired branch', () => {
    const graph = { nodes: [node('sw', 'switch')], edges: [] };
    expect(branchReachesReply(graph, problem, 'left')).toBe(false);
  });

  it('does not follow ai_* sub-node attachments as flow', () => {
    // A Chat Model hangs off the AI node over a typed connector. Treating it as the
    // successor would walk away from the main path.
    const graph = {
      nodes: [node('sw', 'switch'), node('ai', 'classify'), node('m', 'chat-gemini')],
      edges: [
        { source: 'sw', sourceHandle: 'left', target: 'ai' },
        { source: 'm', target: 'ai', targetHandle: 'ai_model' },
      ],
    };
    expect(branchReachesReply(graph, problem, 'left')).toBe(false);
  });

  it('terminates on a cycle instead of hanging', () => {
    const graph = {
      nodes: [node('sw', 'switch'), node('c1', 'code'), node('c2', 'code')],
      edges: [
        { source: 'sw', sourceHandle: 'left', target: 'c1' },
        { source: 'c1', target: 'c2' },
        { source: 'c2', target: 'c1' },
      ],
    };
    expect(branchReachesReply(graph, problem, 'left')).toBe(false);
  });

  it('requires a router to be present', () => {
    const graph = { nodes: [node('a', 'action')], edges: [] };
    expect(branchReachesReply(graph, problem, 'left')).toBe(false);
  });
});

describe('allBranchesWired / openBranchIds', () => {
  const graph = {
    nodes: [node('sw', 'switch'), node('a', 'action'), node('c', 'code'), node('s', 'slack-message')],
    edges: [
      { source: 'sw', sourceHandle: 'left', target: 'a' },
      { source: 'sw', sourceHandle: 'right', target: 'c' },
      { source: 'c', target: 's' },
    ],
  };

  it('passes only when every branch reaches a reply', () => {
    expect(allBranchesWired(graph, problem)).toBe(true);
    expect(openBranchIds(graph, problem)).toEqual([]);
  });

  it('names the branches still open', () => {
    const partial = { nodes: graph.nodes, edges: [graph.edges[0]] };
    expect(allBranchesWired(partial, problem)).toBe(false);
    expect(openBranchIds(partial, problem)).toEqual(['right']);
  });

  it('is vacuously true for a problem with no branches', () => {
    expect(allBranchesWired({ nodes: [], edges: [] }, { branches: [] })).toBe(true);
  });
});
