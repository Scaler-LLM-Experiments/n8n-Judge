import { simulateAll, enumerateItems } from '@judge/engine';
import { openBranchIds } from '@judge/engine/branchReach.js';
import { NODE_CATALOG } from '@judge/catalog';

export interface AuditFinding {
  rule: string;
  level: 'blocker' | 'note';
  where: string;
  message: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- problem data is typed by validateProblem, not here */
type Problem = any;

/** Every node type some build phase requires the learner to place. */
function requiredTypes(problem: Problem): string[] {
  return [...new Set((problem.buildPhases ?? []).flatMap((p: any) => p.nodeTypes ?? []))] as string[];
}

/**
 * `openBranchIds` (packages/engine/branchReach.js) is documented, in its own header
 * comment, to operate on "the EDITOR's flat graph" — nodes carrying `data.configured`,
 * edges keyed by `sourceHandle` — because that is what the Build stage holds at
 * runtime. `problem.referenceGraph` is authored in a different, older dialect: edges
 * carry `branch` instead of `sourceHandle`, and nodes carry no `data` at all (see
 * cases.js in any shipped problem). Calling `openBranchIds` on the raw authored shape
 * makes every branch look "open" regardless of whether the reference build is
 * correct — `e.sourceHandle` never equals `e.branch` — which is a graph-shape
 * mismatch, not a defect in the reference graph.
 *
 * `apps/web/src/n8n/N8nEditor.jsx`'s `seedNodes`/`seedEdges` do this exact
 * conversion for the app (reading `branch ?? sourceHandle`, defaulting `configured`
 * to `true` when a node carries no `data` at all — "everything on it is meant to be
 * set up" — because a referenceGraph node is the answer key, not a learner's
 * half-built canvas). This is the same conversion, kept local rather than imported
 * from the app: packages depend on packages, not on `apps/web`.
 */
function asBranchReachGraph(graph: Problem): { nodes: any[]; edges: any[] } {
  return {
    nodes: (graph?.nodes ?? []).map((n: any) => ({
      ...n,
      data: { ...n.data, configured: n.data ? Boolean(n.data.configured) : true },
    })),
    edges: (graph?.edges ?? []).map((e: any) => ({ ...e, sourceHandle: e.branch ?? e.sourceHandle })),
  };
}

/**
 * The mechanical half of a case review.
 *
 * Every rule here was previously applied by an agent reading a checklist, at ~29
 * minutes a round. None of them need judgement, so none of them should cost a
 * revision cycle. What is deliberately NOT here: whether a question is answerable
 * from what the learner is shown, and whether the authored answer is right. Those
 * are why `case_review` still exists.
 */
export function auditProblem(problem: Problem): AuditFinding[] {
  const out: AuditFinding[] = [];
  const blocker = (rule: string, where: string, message: string) =>
    out.push({ rule, level: 'blocker', where, message });
  const note = (rule: string, where: string, message: string) =>
    out.push({ rule, level: 'note', where, message });

  const labels = new Set(Object.keys(problem.misconceptionLabels ?? {}));

  /**
   * The three graded option lists have three DIFFERENT shapes, verified against all
   * five shipped cases on 2026-08-11. Treating them alike is how an audit reports
   * defects that are not there:
   *
   *   dissection  { label, type }                    correctness is the question's `correctType`;
   *                                                  the teaching is question-level `wrongHint` + `explanation`
   *   field       { value, label, correct, why }     per-option boolean and per-option explanation
   *   probe       { text, correct, response,         `response` is the teaching, `misconception` the code
   *                 misconception? }
   *
   * `positions` collects where the correct answer sits in each list, for the balance
   * note at the end — one accumulator, because the rule is the same for all three.
   */
  const positions: number[] = [];

  // --- Understand: the correct answer must be reachable, and the teaching must exist
  for (const [i, q] of (problem.dissection ?? []).entries()) {
    const where = `dissection[${i}] (${q.id ?? ''})`;
    const at = (q.options ?? []).findIndex((o: any) => o.type === q.correctType);
    if (at === -1) {
      blocker(
        'correct-type-unreachable',
        where,
        `correctType "${q.correctType}" matches no option, so the question cannot be answered correctly`
      );
    } else {
      positions.push(at);
    }
    if (!q.wrongHint || !q.explanation) {
      blocker('why-missing', where, 'a dissection question needs both `wrongHint` and `explanation` — they are the whole teaching');
    }
  }

  // --- Build config: exactly one correct option, and every option explained
  for (const [type, setup] of Object.entries<any>(problem.nodeSetup ?? {})) {
    for (const f of setup.fields ?? []) {
      if (!Array.isArray(f.options)) continue; // text/number/expression carry their own explanations
      const where = `nodeSetup.${type}.${f.key}`;
      const correct = f.options.filter((o: any) => o.correct);
      if (correct.length !== 1) {
        blocker('no-correct-option', where, `${correct.length} options are marked correct — exactly one must be`);
      } else {
        positions.push(f.options.findIndex((o: any) => o.correct));
      }
      for (const [i, o] of f.options.entries()) {
        if (!o.why) {
          blocker(
            'why-missing',
            `${where}.options[${i}]`,
            `option "${o.label ?? o.value}" has no \`why\` — Iris reads back the explanation for whatever was chosen`
          );
        }
      }
    }
    for (const s of setup.settings ?? []) {
      if (!s.why?.[String(s.correct)]) {
        blocker(
          'why-missing',
          `nodeSetup.${type}.settings.${s.key}`,
          `no \`why\` for the correct value "${String(s.correct)}"`
        );
      }
    }
  }

  // --- Probes: every option is answered, and every wrong one names a misconception
  for (const [type, probe] of Object.entries<any>(problem.nodeProbes ?? {})) {
    const where = `nodeProbes.${type}`;
    const options = probe.options ?? [];
    if (options.filter((o: any) => o.correct).length !== 1) {
      blocker('no-correct-option', where, 'a probe needs exactly one correct option');
    } else {
      positions.push(options.findIndex((o: any) => o.correct));
    }
    for (const [i, o] of options.entries()) {
      if (!o.response) {
        blocker('response-missing', `${where}.options[${i}]`, `option "${o.text}" has no \`response\`, which is how a probe teaches`);
      }
      if (!o.correct && !o.misconception) {
        blocker(
          'misconception-missing',
          `${where}.options[${i}]`,
          `wrong option "${o.text}" names no misconception, so the belief behind it never reaches the report`
        );
      }
      if (o.misconception && !labels.has(o.misconception)) {
        blocker(
          'misconception-unlabelled',
          `${where}.options[${i}]`,
          `misconception "${o.misconception}" has no misconceptionLabels entry, so it can never reach the report`
        );
      }
    }
  }

  // --- the deliberate gap: exactly one sample case matching no branch
  if ((problem.branches ?? []).length) {
    const gaps = (problem.sampleCases ?? []).filter((c: any) => c.branch === null);
    if (gaps.length !== 1) {
      blocker(
        'gap-case',
        'sampleCases',
        `${gaps.length} sample case(s) carry branch:null — Stress Testing is built from exactly one`
      );
    }
  }

  // --- the learner can actually get every node they need
  const unlocked = new Set((problem.dissection ?? []).flatMap((d: any) => d.unlocks ?? []));
  for (const type of requiredTypes(problem)) {
    if (!unlocked.has(type)) {
      blocker(
        'unlocks-incomplete',
        'dissection[].unlocks',
        `no dissection answer unlocks "${type}", which a build phase requires`
      );
    }
    // A 'model'-category type (the AI Chat Model attached to a node that
    // `needsModel`) is exempt from `pickable` — it is added through that node's own
    // Chat Model slot (`flow.modelNext`), never through a phase's drawer.
    // ops-request-desk's build.js documents this exemption in exactly those words;
    // requiring it in `pickable` reported a defect against three of five shipped
    // cases (email-triage, expense-approvals, ops-request-desk) that were correct
    // as authored — verified against the app's own picker wiring
    // (apps/web/src/n8n/N8nEditor.jsx, NodePickerDrawer.jsx), not weakened to make
    // the fixtures pass.
    if ((NODE_CATALOG as Record<string, any>)[type]?.category === 'model') continue;
    if (!(problem.buildPhases ?? []).some((p: any) => (p.pickable ?? []).includes(type))) {
      blocker(
        'not-pickable',
        'buildPhases[].pickable',
        `"${type}" is required but no phase offers it in the picker`
      );
    }
  }

  // --- the reference solution actually works
  const sim = simulateAll(problem.referenceGraph, problem);
  if (!sim.success) {
    const failed = sim.cases
      .filter((c: any) => c.case.branch !== null && !c.delivered)
      .map((c: any) => c.case.id ?? c.case.branch);
    blocker(
      'simulate-all',
      'referenceGraph',
      `simulateAll does not deliver for: ${failed.join(', ') || 'an unnamed case'}`
    );
  }
  const open = openBranchIds(asBranchReachGraph(problem.referenceGraph), problem);
  if (open.length) {
    blocker(
      'branch-dead-end',
      'referenceGraph',
      `branch(es) ${open.join(', ')} reach no configured terminal, so a correct flow cannot complete its phase`
    );
  }

  // --- balance: a note, because balanceProblemOptions spreads answers server-side
  const atTop = positions.filter((p) => p === 0).length;
  if (positions.length && atTop / positions.length > 0.6) {
    note(
      'option-spread',
      'every graded list',
      `${atTop} of ${positions.length} correct options sit at index 0 — the sign nobody thought about the distractors`
    );
  }

  // --- size, so difficulty is not taste
  const items = enumerateItems(problem);
  const total = Object.values<any>(items).reduce((a: number, v: any) => a + v.length, 0);
  if (total < 12) note('too-small', 'the whole case', `${total} scored decisions is thin for a graded challenge`);

  return out;
}
