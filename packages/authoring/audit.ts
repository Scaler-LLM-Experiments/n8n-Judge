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
 * `apps/web/src/n8n/N8nEditor.jsx`'s `seedNodes` (line 97) / `seedEdges` (line 161) do
 * this exact conversion for the app (reading `branch ?? sourceHandle`, defaulting
 * `configured` to `true` when a node carries no `data` at all — "everything on it is
 * meant to be set up" — because a referenceGraph node is the answer key, not a
 * learner's half-built canvas). This is the same conversion, kept local rather than
 * imported from the app: packages depend on packages, not on `apps/web`.
 *
 * One deliberate divergence from `seedNodes`, and it does not bite today: `seedNodes`
 * dedupes by id, keeping the LAST node (a real production trace once held two nodes
 * sharing one id). This adapter keeps every node as authored — a referenceGraph is
 * never replayed from a trace, so there is nothing to dedupe — and `branchReach.js`'s
 * `.find()` for the router and for edge targets takes the FIRST match either way, so
 * a referenceGraph that somehow repeated an id would resolve differently here than in
 * the app. No shipped referenceGraph does.
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
    // (apps/web/src/n8n/N8nEditor.jsx, NodePickerDrawer.jsx).
    //
    // BUT the exemption is not a free pass: the model still has to be reachable
    // SOMEWHERE, and for a model type that "somewhere" is `flow.modelOptions ??
    // flow.modelNext`, not `pickable`. Skipping the check outright (rather than
    // redirecting it) hid a real defect: rename the required model in
    // `buildPhases[].nodeTypes` while leaving `flow.modelNext` naming the old one,
    // and the drawer would offer only the old model, `expectedNext()` would grade
    // the new one wrong, and the phase could never complete — with this rule
    // reporting nothing.
    if ((NODE_CATALOG as Record<string, any>)[type]?.category === 'model') {
      const modelMenu: string[] = problem.flow?.modelOptions ?? problem.flow?.modelNext ?? [];
      if (!modelMenu.includes(type)) {
        blocker('not-pickable', 'flow.modelNext', `"${type}" is required but no Chat Model slot offers it`);
      }
      continue;
    }
    if (!(problem.buildPhases ?? []).some((p: any) => (p.pickable ?? []).includes(type))) {
      blocker(
        'not-pickable',
        'buildPhases[].pickable',
        `"${type}" is required but no phase offers it in the picker`
      );
    }
  }

  // --- every nodeSetup entry is a node the learner actually places
  //
  // The other direction of the rule above, and the one with a scoring consequence.
  // `rubric.ts` (scoreSession → enumerateItems) builds the CONFIG denominator from
  // every key in `nodeSetup`, while placements come from `buildPhases[].nodeTypes`.
  // So a `nodeSetup` entry for a type no phase requires is never placed, never opened
  // in the NDV, and never answered — its fields sit in the denominator as decisions
  // nobody can earn, and every learner is capped below 100% by an authoring slip.
  //
  // `validateProblem()` does not catch this: it only asserts the key is a type the
  // catalog knows (validateProblem.ts's `strictTypes`), which an orphan still is.
  // Neither does the review round — this is exactly the kind of arithmetic a blind
  // solve cannot see, because the learner-visible projection still carries the node.
  const requiredForBuild = new Set(requiredTypes(problem));
  const modelMenu = new Set<string>([
    ...(problem.flow?.modelOptions ?? []),
    ...(problem.flow?.modelNext ?? []),
  ]);
  for (const type of Object.keys(problem.nodeSetup ?? {})) {
    if (requiredForBuild.has(type)) continue;
    // Same exemption as `pickable` above, for the same reason: a model is placed
    // through its parent node's Chat Model slot, so a model the slot offers IS
    // reachable and its setup IS earnable, whether or not a phase names it.
    if ((NODE_CATALOG as Record<string, any>)[type]?.category === 'model' && modelMenu.has(type)) continue;
    const graded = (problem.nodeSetup[type].fields ?? []).length + (problem.nodeSetup[type].settings ?? []).length;
    blocker(
      'nodesetup-orphan',
      `nodeSetup.${type}`,
      `no build phase requires "${type}", so the learner never places it or opens its NDV — but the rubric counts its ${graded} graded decision(s) in the config denominator, capping every learner below 100%`
    );
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
