import { describe, it, expect } from 'vitest';
import { branchNextFor, hasPerBranchNext, allBranchTargets } from './N8nEditor.jsx';

// `flow.branchNext` grew a second shape. The array form is what every problem had:
// one list shared by every exit, which can only ask "is this a destination at all?".
// On a problem whose exits end at DIFFERENT node types that is not enough — the
// spreadsheet on the escalation exit was accepted, the build phase went green, and the
// mistake only surfaced later as a failing Run.
describe('branchNextFor', () => {
  it('gives every exit the same list when one array is authored', () => {
    const flow = { branchNext: ['action'] };
    expect(branchNextFor(flow, 'bug_report')).toEqual(['action']);
    expect(branchNextFor(flow, 'anything-at-all')).toEqual(['action']);
  });

  it('scopes each exit separately when a record is authored', () => {
    const flow = {
      branchNext: { log: ['google-sheets'], email: ['gmail'], needs_human: ['slack'] },
    };
    expect(branchNextFor(flow, 'log')).toEqual(['google-sheets']);
    expect(branchNextFor(flow, 'email')).toEqual(['gmail']);
    expect(branchNextFor(flow, 'needs_human')).toEqual(['slack']);
  });

  // The whole point: a legal destination somewhere is NOT legal everywhere.
  it('rejects the right node on the wrong exit', () => {
    const flow = { branchNext: { log: ['google-sheets'], needs_human: ['slack'] } };
    expect(branchNextFor(flow, 'needs_human')).not.toContain('google-sheets');
  });

  it('returns an empty list for an exit the record does not name, and for no flow', () => {
    expect(branchNextFor({ branchNext: { log: ['google-sheets'] } }, 'unknown')).toEqual([]);
    expect(branchNextFor({}, 'log')).toEqual([]);
    expect(branchNextFor(undefined, 'log')).toEqual([]);
  });
});

describe('hasPerBranchNext', () => {
  it('is true only for the record form', () => {
    expect(hasPerBranchNext({ branchNext: { log: ['google-sheets'] } })).toBe(true);
    expect(hasPerBranchNext({ branchNext: ['action'] })).toBe(false);
    expect(hasPerBranchNext({})).toBe(false);
    expect(hasPerBranchNext(undefined)).toBe(false);
  });
});

// This is what separates "that is not a destination at all" from "right destination,
// wrong exit". They are different mistakes and get different probes: the sequence probe
// asks what has to be true before a node can RUN, which is the wrong question for a node
// that would run perfectly well one exit over.
describe('allBranchTargets', () => {
  it('collects every type that is a destination on some exit, deduplicated', () => {
    const flow = {
      branchNext: { log: ['google-sheets'], email: ['gmail'], both: ['gmail', 'google-sheets'] },
    };
    expect([...allBranchTargets(flow)].sort()).toEqual(['gmail', 'google-sheets']);
  });

  it('passes the array form straight through', () => {
    expect(allBranchTargets({ branchNext: ['action'] })).toEqual(['action']);
  });

  it('is empty when nothing is authored', () => {
    expect(allBranchTargets({})).toEqual([]);
    expect(allBranchTargets(undefined)).toEqual([]);
  });
});
