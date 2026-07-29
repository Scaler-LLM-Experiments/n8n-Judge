import { describe, it, expect } from 'vitest';
import { orderDesk } from './index.js';
import { validateProblem } from '../../problem-schema/validateProblem.ts';
import { simulateAll } from '../../engine/simulate.js';
import { validateGraph } from '../../engine/validateGraph.js';
import { allBranchesWired } from '../../engine/branchReach.js';
import { NODE_CATALOG } from '../../catalog/catalog.js';

/** The reference solution as the editor would hold it: placed, wired, configured. */
function referenceEditorGraph() {
  return {
    nodes: orderDesk.referenceGraph.nodes.map((n) => ({ ...n, data: { configured: true, values: {} } })),
    edges: orderDesk.referenceGraph.edges.map((e, i) => ({
      id: `e${i}`,
      source: e.source,
      target: e.target,
      sourceHandle: e.branch ?? undefined,
      targetHandle: e.targetHandle ?? undefined,
    })),
  };
}

describe('order-desk: authoring', () => {
  it('is a valid problem with no errors', () => {
    const { valid, issues } = validateProblem(orderDesk);
    expect(issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(valid).toBe(true);
  });

  it('is declared difficult, and says why', () => {
    expect(orderDesk.difficulty).toBe('difficult');
    expect(orderDesk.difficultyNote).toBeTruthy();
  });

  it('is actually large: 20+ nodes and 8 routes', () => {
    // The point of this problem. If a refactor quietly shrinks it, it stops being
    // the end-to-end exercise it exists to be.
    expect(orderDesk.referenceGraph.nodes.length).toBeGreaterThanOrEqual(20);
    expect(orderDesk.branches).toHaveLength(8);
  });

  it('has two AI nodes, each with its own model', () => {
    const ai = orderDesk.referenceGraph.nodes.filter((n) => NODE_CATALOG[n.type]?.category === 'ai');
    expect(ai).toHaveLength(2);
    for (const node of ai) {
      const model = orderDesk.referenceGraph.edges.find((e) => e.target === node.id && e.targetHandle === 'ai_model');
      expect(model, `${node.id} has no Chat Model`).toBeTruthy();
    }
  });

  it('grades On Error in OPPOSITE directions on the two AI nodes', () => {
    // The best teaching moment in the problem, and the one most likely to be
    // "tidied" into consistency by someone who has not read why.
    const onError = (type) => orderDesk.nodeSetup[type].settings.find((s) => s.key === 'onError');
    expect(onError('classify').correct).toBe('continueErrorOutput');
    expect(onError('summarize').correct).toBe('continueRegularOutput');
  });

  it('ends every route in a node the catalog calls an action', () => {
    for (const { id, label } of orderDesk.branches) {
      const first = orderDesk.referenceGraph.edges.find((e) => e.branch === id);
      expect(first, `${label} is not wired`).toBeTruthy();
      // Follow the chain to its terminal, which may be more than one hop.
      let nodeId = first.target;
      let terminal = null;
      for (let hop = 0; hop < 5 && nodeId; hop += 1) {
        const node = orderDesk.referenceGraph.nodes.find((n) => n.id === nodeId);
        if (NODE_CATALOG[node.type]?.category === 'action') {
          terminal = node;
          break;
        }
        nodeId = orderDesk.referenceGraph.edges.find((e) => e.source === node.id && !e.targetHandle)?.target;
      }
      expect(terminal, `${label} never reaches an action`).toBeTruthy();
    }
  });

  it('uses more than one kind of terminal', () => {
    // A problem where all eight routes end in Send Reply would not have exercised
    // the reachability-by-category fix at all.
    const terminals = new Set(
      orderDesk.referenceGraph.nodes.filter((n) => NODE_CATALOG[n.type]?.category === 'action').map((n) => n.type)
    );
    expect(terminals.size).toBeGreaterThanOrEqual(4);
  });

  it('routes one branch through a step before its reply', () => {
    // The "look something up, then answer" shape. This is what the old inline
    // immediate-target check made impossible.
    const throughStep = orderDesk.branches.some(({ id }) => {
      const first = orderDesk.referenceGraph.edges.find((e) => e.branch === id);
      const target = orderDesk.referenceGraph.nodes.find((n) => n.id === first?.target);
      return target && NODE_CATALOG[target.type]?.category !== 'action';
    });
    expect(throughStep).toBe(true);
  });

  it('offers every branch id the Switch answer needs', () => {
    const rules = orderDesk.nodeSetup.switch.fields.find((f) => f.key === 'rules');
    const declared = orderDesk.branches.map((b) => b.id).sort();
    expect(rules.expect.rules.map((r) => r.outputKey).sort()).toEqual(declared);
  });

  it('names a sample case for every branch, plus one that matches nothing', () => {
    const covered = orderDesk.sampleCases.filter((c) => c.branch).map((c) => c.branch).sort();
    expect(covered).toEqual(orderDesk.branches.map((b) => b.id).sort());
    expect(orderDesk.sampleCases.some((c) => c.branch === null)).toBe(true);
  });
});

describe('order-desk: the reference solution actually works', () => {
  it('passes every structural check', () => {
    const { allPassed, results } = validateGraph(referenceEditorGraph(), orderDesk);
    expect(results.filter((r) => !r.passed).map((r) => r.id)).toEqual([]);
    expect(allPassed).toBe(true);
  });

  it('completes the routing phase', () => {
    // Guards the build stage against the regression this problem exposed: a branch
    // ending in Slack, or passing through a lookup, used to leave the phase stuck.
    expect(allBranchesWired(referenceEditorGraph(), orderDesk)).toBe(true);
  });

  it('delivers every case that should deliver, and drops the one that should not', () => {
    const { cases, success } = simulateAll(referenceEditorGraph(), orderDesk);
    expect(success).toBe(true);
    for (const c of cases) {
      expect(c.delivered, `${c.case.id}`).toBe(c.case.branch !== null);
    }
  });

  it('narrates the fall-through as unanswered rather than as an error', () => {
    const { cases } = simulateAll(referenceEditorGraph(), orderDesk);
    const fell = cases.find((c) => c.case.branch === null);
    expect(fell.steps.at(-1).text).toMatch(/matches none|unanswered/i);
  });
});

describe('order-desk: voice', () => {
  it('has a line for every node type the learner places', () => {
    const placed = new Set(orderDesk.referenceGraph.nodes.map((n) => n.type));
    for (const type of placed) {
      expect(orderDesk.voice[`node_placed:${type}`], `no node_placed line for ${type}`).toBeTruthy();
    }
  });

  it('has a line for every build phase', () => {
    const last = orderDesk.buildPhases.at(-1).id;
    for (const phase of orderDesk.buildPhases) {
      // The final phase is celebrated by `build_complete` instead.
      const key = `phase_complete:${phase.id}`;
      if (phase.id === last) continue;
      expect(orderDesk.voice[key], `no line for ${key}`).toBeTruthy();
    }
    expect(orderDesk.voice.build_complete).toBeTruthy();
  });

  it('never reads an expression aloud, and never uses a dash that cannot be spoken', () => {
    for (const [moment, lines] of Object.entries(orderDesk.voice)) {
      for (const line of lines) {
        expect(line, moment).not.toMatch(/\{\{/);
        expect(line, moment).not.toMatch(/[—–]/);
        expect(line, moment).toMatch(/^\[[a-z]+\]/);
      }
    }
  });

  it('keeps every line inside about seven seconds spoken', () => {
    for (const [moment, lines] of Object.entries(orderDesk.voice)) {
      for (const line of lines) {
        const words = line.replace(/\[[^\]]*\]/g, '').trim().split(/\s+/).length;
        expect(words, `${moment}: "${line}"`).toBeLessThanOrEqual(22);
      }
    }
  });
});
