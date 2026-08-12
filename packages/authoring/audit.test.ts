import { describe, it, expect } from 'vitest';
import { problemList } from '@judge/problems';
import { auditProblem } from './audit.ts';

/** A deep clone, so each test can break exactly one thing. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const base = (): any => JSON.parse(JSON.stringify(problemList[0]));

describe('auditProblem', () => {
  it('finds no blocker in any shipped case', () => {
    for (const p of problemList) {
      const blockers = auditProblem(p).filter((f) => f.level === 'blocker');
      expect(blockers, `${p.id}: ${JSON.stringify(blockers, null, 2)}`).toEqual([]);
    }
  });

  it('blocks a probe misconception code with no label', () => {
    const p = base();
    const probe = Object.values<any>(p.nodeProbes).find((pr: any) => pr.options.some((o: any) => o.misconception));
    probe.options.find((o: any) => o.misconception).misconception = 'invented-code-with-no-label';
    expect(auditProblem(p)).toContainEqual(
      expect.objectContaining({ level: 'blocker', rule: 'misconception-unlabelled' })
    );
  });

  it('blocks a wrong field option with no `why` to teach from', () => {
    const p = base();
    const type = Object.keys(p.nodeSetup).find((t) => p.nodeSetup[t].fields?.some((f: any) => f.options)) as string;
    const field = p.nodeSetup[type].fields.find((f: any) => f.options);
    delete field.options.find((o: any) => !o.correct).why;
    expect(auditProblem(p)).toContainEqual(
      expect.objectContaining({ level: 'blocker', rule: 'why-missing' })
    );
  });

  it('blocks a probe option with no response, because the probe teaches through it', () => {
    const p = base();
    delete Object.values<any>(p.nodeProbes)[0].options[0].response;
    expect(auditProblem(p)).toContainEqual(
      expect.objectContaining({ level: 'blocker', rule: 'response-missing' })
    );
  });

  it('blocks a dissection question whose correctType matches no option', () => {
    const p = base();
    p.dissection[0].correctType = 'a-type-no-option-offers';
    expect(auditProblem(p)).toContainEqual(
      expect.objectContaining({ level: 'blocker', rule: 'correct-type-unreachable' })
    );
  });

  it('blocks when the deliberate gap case is missing', () => {
    const p = base();
    for (const c of p.sampleCases) if (c.branch === null) c.branch = p.branches[0].id;
    expect(auditProblem(p)).toContainEqual(expect.objectContaining({ level: 'blocker', rule: 'gap-case' }));
  });

  it('blocks a required node type the Understand quiz never unlocks', () => {
    const p = base();
    for (const d of p.dissection) d.unlocks = [];
    expect(auditProblem(p)).toContainEqual(
      expect.objectContaining({ level: 'blocker', rule: 'unlocks-incomplete' })
    );
  });

  it('blocks a required node type no phase makes pickable', () => {
    const p = base();
    for (const phase of p.buildPhases) phase.pickable = [];
    expect(auditProblem(p)).toContainEqual(expect.objectContaining({ level: 'blocker', rule: 'not-pickable' }));
  });

  it('blocks a reference graph the simulator cannot deliver', () => {
    const p = base();
    p.referenceGraph.edges = [];
    expect(auditProblem(p)).toContainEqual(
      expect.objectContaining({ level: 'blocker', rule: 'simulate-all' })
    );
  });

  it('notes an answer key clustered at the top of every list', () => {
    const p = base();
    const toFront = (options: any[], isCorrect: (o: any) => boolean) => {
      const at = options.findIndex(isCorrect);
      if (at > 0) options.unshift(...options.splice(at, 1));
    };
    for (const d of p.dissection) toFront(d.options, (o: any) => o.type === d.correctType);
    for (const setup of Object.values<any>(p.nodeSetup)) {
      for (const f of setup.fields ?? []) {
        if (Array.isArray(f.options)) toFront(f.options, (o: any) => o.correct);
      }
    }
    for (const probe of Object.values<any>(p.nodeProbes ?? {})) toFront(probe.options, (o: any) => o.correct);
    expect(auditProblem(p)).toContainEqual(expect.objectContaining({ level: 'note', rule: 'option-spread' }));
  });
});
