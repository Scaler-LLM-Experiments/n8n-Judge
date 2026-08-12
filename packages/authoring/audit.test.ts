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

  // --- added after independent review of this task: the model exemption below was a
  // whole-category skip, which hid a real defect, and several rules had no test at all.

  it('blocks a required model type no Chat Model slot offers, even though it is a model-category exemption', () => {
    const p = base();
    // Rename the required model everywhere EXCEPT `flow.modelNext`, which is exactly
    // the counterfactual independent review reproduced: the drawer's Chat Model slot
    // still only offers the old model, `expectedNext()` grades the new one wrong, and
    // the phase can never complete — a blanket `continue` on `category === 'model'`
    // reported nothing here.
    for (const phase of p.buildPhases) {
      phase.nodeTypes = phase.nodeTypes.map((t: string) => (t === 'chat-gemini' ? 'openai-chat-model' : t));
    }
    for (const d of p.dissection) {
      d.unlocks = (d.unlocks ?? []).map((t: string) => (t === 'chat-gemini' ? 'openai-chat-model' : t));
    }
    expect(auditProblem(p)).toContainEqual(
      expect.objectContaining({ level: 'blocker', rule: 'not-pickable', where: 'flow.modelNext' })
    );
  });

  it('blocks a branch whose referenceGraph edge is simply missing', () => {
    // The rule this task changed (`branch-dead-end`) had no test of its own — only
    // deleting the graph-shape adapter entirely was caught (by test 1, via a false
    // "open" on every branch). An over-permissive adapter that never reports an open
    // branch would pass silently. Dropping one branch's edge forces the real topology
    // walk to fail, which only a faithful adapter reports correctly.
    const p = base();
    const branchId = p.branches[0].id;
    p.referenceGraph.edges = p.referenceGraph.edges.filter((e: any) => e.branch !== branchId);
    expect(auditProblem(p)).toContainEqual(expect.objectContaining({ level: 'blocker', rule: 'branch-dead-end' }));
  });

  it('blocks a wrong probe option that names no misconception at all', () => {
    const p = base();
    const probe = Object.values<any>(p.nodeProbes).find((pr: any) => pr.options.some((o: any) => !o.correct));
    const wrong = probe.options.find((o: any) => !o.correct);
    delete wrong.misconception;
    expect(auditProblem(p)).toContainEqual(
      expect.objectContaining({ level: 'blocker', rule: 'misconception-missing' })
    );
  });

  it('blocks a field option list with no option marked correct', () => {
    const p = base();
    const type = Object.keys(p.nodeSetup).find((t) => p.nodeSetup[t].fields?.some((f: any) => f.options)) as string;
    const field = p.nodeSetup[type].fields.find((f: any) => f.options);
    for (const o of field.options) o.correct = false;
    expect(auditProblem(p)).toContainEqual(expect.objectContaining({ level: 'blocker', rule: 'no-correct-option' }));
  });

  it('notes a case with too few scored decisions', () => {
    const p = base();
    p.dissection = [];
    p.nodeSetup = {};
    p.nodeProbes = {};
    p.evalQuestions = [];
    expect(auditProblem(p)).toContainEqual(expect.objectContaining({ level: 'note', rule: 'too-small' }));
  });

  it('blocks a dissection question missing wrongHint or explanation', () => {
    const p = base();
    delete p.dissection[0].wrongHint;
    expect(auditProblem(p)).toContainEqual(
      expect.objectContaining({ level: 'blocker', rule: 'why-missing', where: expect.stringContaining('dissection[0]') })
    );
  });

  it('blocks a node setting missing the `why` for its correct value', () => {
    const p = base();
    const type = Object.keys(p.nodeSetup).find((t) => p.nodeSetup[t].settings?.length) as string;
    const setting = p.nodeSetup[type].settings[0];
    delete setting.why[String(setting.correct)];
    expect(auditProblem(p)).toContainEqual(
      expect.objectContaining({ level: 'blocker', rule: 'why-missing', where: `nodeSetup.${type}.settings.${setting.key}` })
    );
  });
});
