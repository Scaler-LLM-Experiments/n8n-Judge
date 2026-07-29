import { describe, it, expect } from 'vitest';
import { problems } from '@judge/problems';
import { balanceProblemOptions } from './balanceOptions.ts';
import { toPublicProblem } from './publicProjection.ts';

type Rec = Record<string, any>;
const all = Object.values(problems) as Rec[];

/** Where the correct option sits, per graded list, after balancing. */
function positions(p: Rec) {
  const fields: number[] = [];
  const diss: number[] = [];
  const probes: number[] = [];

  for (const q of p.dissection ?? []) {
    diss.push((q.options ?? []).findIndex((o: Rec) => o.type === q.correctType));
  }
  for (const setup of Object.values(p.nodeSetup ?? {}) as Rec[]) {
    for (const f of setup.fields ?? []) {
      if (!f.options) continue;
      fields.push(f.options.findIndex((o: Rec) => o.correct === true));
    }
  }
  for (const probe of Object.values(p.nodeProbes ?? {}) as Rec[]) {
    probes.push((probe.options ?? []).findIndex((o: Rec) => o.correct === true));
  }
  return { fields, diss, probes };
}

describe('the authored data really is biased — this is what we are fixing', () => {
  it('puts the correct option first in every graded list', () => {
    for (const p of all) {
      const { fields, diss, probes } = positions(p);
      expect(fields.every((i) => i === 0)).toBe(true);
      expect(diss.every((i) => i === 0)).toBe(true);
      expect(probes.every((i) => i === 0)).toBe(true);
    }
  });
});

describe('balanceProblemOptions', () => {
  it('does not leave every answer at index 0', () => {
    for (const p of all) {
      const b = positions(balanceProblemOptions(p));
      // A node may legitimately have one field, so per-problem we assert the
      // aggregate rather than demanding spread inside every last group.
      expect(b.fields.some((i) => i !== 0)).toBe(true);
      expect(b.diss.some((i) => i !== 0)).toBe(true);
    }
  });

  // The guarantee that the old client-side shuffle could not give: no single
  // arrangement stacks the answers. With targets assigned by rotation, a group
  // of k questions over n options can have at most ceil(k / n) in any one slot.
  it('caps how many of a node’s fields can share a position', () => {
    for (const p of all) {
      for (const setup of Object.values(balanceProblemOptions(p).nodeSetup ?? {}) as Rec[]) {
        const withOptions = (setup.fields ?? []).filter((f: Rec) => Array.isArray(f.options));
        if (withOptions.length < 2) continue;
        const counts: Record<number, number> = {};
        for (const f of withOptions) {
          const i = f.options.findIndex((o: Rec) => o.correct === true);
          counts[i] = (counts[i] ?? 0) + 1;
        }
        const n = Math.min(...withOptions.map((f: Rec) => f.options.length));
        expect(Math.max(...Object.values(counts))).toBeLessThanOrEqual(Math.ceil(withOptions.length / n));
      }
    }
  });

  it('spreads dissection answers across positions', () => {
    for (const p of all) {
      const diss = positions(balanceProblemOptions(p)).diss;
      if (diss.length < 3) continue;
      expect(new Set(diss).size).toBeGreaterThan(1);
    }
  });

  // A reorder that loses or duplicates an option would be a grading disaster.
  it('preserves every option exactly once', () => {
    for (const p of all) {
      const b = balanceProblemOptions(p) as Rec;
      for (const [type, setup] of Object.entries(b.nodeSetup ?? {}) as [string, Rec][]) {
        const before = (p.nodeSetup[type].fields ?? []) as Rec[];
        const after = (setup.fields ?? []) as Rec[];
        expect(after).toHaveLength(before.length);
        // Sort by a stable string key — Array#sort on objects coerces every
        // entry to "[object Object]" and compares nothing.
        const canon = (opts: Rec[]) => opts.map((o) => JSON.stringify(o)).sort();
        before.forEach((f, i) => {
          if (!f.options) return;
          expect(canon(after[i].options)).toEqual(canon(f.options));
          expect(after[i].options.filter((o: Rec) => o.correct === true)).toHaveLength(1);
        });
      }
    }
  });

  it('is deterministic — the same problem always balances the same way', () => {
    for (const p of all) {
      expect(positions(balanceProblemOptions(p))).toEqual(positions(balanceProblemOptions(p)));
    }
  });

  it('leaves the input untouched (a ProblemVersion is immutable)', () => {
    const p = all[0];
    const snapshot = JSON.stringify(p);
    balanceProblemOptions(p);
    expect(JSON.stringify(p)).toBe(snapshot);
  });

  it('leaves stress questions alone — correctIndex points into the authored order', () => {
    for (const p of all) {
      expect(balanceProblemOptions(p).evalQuestions).toEqual(p.evalQuestions);
    }
  });
});

describe('the projection still hides everything it did before', () => {
  it('ships no correctness marker on a balanced problem', () => {
    for (const p of all) {
      const pub = JSON.stringify(toPublicProblem(p));
      expect(pub).not.toContain('"correct":true');
      expect(pub).not.toContain('"correctType"');
    }
  });
});
