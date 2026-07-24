import { NODE_CATALOG } from '@judge/catalog';
import { problemSchema, type Problem } from './types.ts';

export interface ProblemIssue {
  level: 'error' | 'warning';
  path: string;
  message: string;
}

export interface ValidateProblemResult {
  valid: boolean;
  issues: ProblemIssue[];
  problem?: Problem;
}

// The categories every problem must cover, in canonical walk order. The engine's
// simulate.js walk is hardcoded to trigger → ai(+model) → parse → switch → action,
// so until it is generalized we reject problems that deviate (plan risk #1).
const CANONICAL_REQUIRED_TYPES = ['parse', 'switch'] as const;
const CANONICAL_REQUIRED_CATEGORIES = ['trigger', 'ai', 'model', 'action'] as const;

export function validateProblem(input: unknown): ValidateProblemResult {
  const issues: ProblemIssue[] = [];

  const parsed = problemSchema.safeParse(input);
  if (!parsed.success) {
    for (const e of parsed.error.errors) {
      issues.push({ level: 'error', path: e.path.join('.'), message: e.message });
    }
    return { valid: false, issues };
  }
  const p = parsed.data;

  const err = (path: string, message: string) => issues.push({ level: 'error', path, message });
  const warn = (path: string, message: string) => issues.push({ level: 'warning', path, message });

  const catalogTypes = new Set(Object.keys(NODE_CATALOG));
  const paletteByType = new Map(p.nodePalette.map((n) => [n.type, n]));
  const requiredTypes = new Set(p.nodePalette.filter((n) => !n.isDistractor).map((n) => n.type));
  const branchIds = new Set(p.branches.map((b) => b.id));

  // --- Vocabulary membership. Two tiers:
  // (a) STRICT catalog membership for types that get configured or executed —
  //     the NDV/run engine can only handle types in @judge/catalog.
  // (b) catalog-OR-palette membership for distractor-ish contexts (dissection
  //     options, probe keys, pickable) — distractors render from palette
  //     metadata + nodeIcons and are removed after the probe, so they don't
  //     need full catalog entries.
  const strictTypes = new Set<string>([
    ...p.referenceGraph.nodes.map((n) => n.type),
    ...p.buildPhases.flatMap((ph) => ph.nodeTypes),
    ...Object.keys(p.nodeSetup),
    ...p.flow.start,
    ...Object.keys(p.flow.next),
    ...Object.values(p.flow.next).flat(),
    ...p.flow.branchNext,
    ...p.flow.modelNext,
    ...p.dissection.flatMap((d) => [d.correctType, ...d.unlocks]),
    ...p.flowSummary.steps.map((s) => s.type),
  ]);
  for (const t of strictTypes) {
    if (!catalogTypes.has(t)) err('nodeTypes', `Node type "${t}" is not in the editor catalog`);
  }
  // Distractor-ish types (palette entries, pickable offers, probe keys) may
  // live outside the catalog — they render from palette/nodeIcons metadata and
  // are removed after the probe. Warn so the author verifies an icon mapping.
  const pickableTypes = new Set(p.buildPhases.flatMap((ph) => ph.pickable));
  const looseKnown = new Set<string>([...catalogTypes, ...paletteByType.keys(), ...pickableTypes]);
  for (const t of new Set([...p.nodePalette.map((n) => n.type), ...pickableTypes])) {
    if (!catalogTypes.has(t)) {
      warn('nodeTypes', `"${t}" is not in the catalog — it renders from nodeIcons metadata only; verify an icon/category mapping exists`);
    }
  }
  // Probe keys must at least be droppable (palette or pickable) or catalog types.
  for (const t of Object.keys(p.nodeProbes)) {
    if (!looseKnown.has(t)) {
      err('nodeProbes', `Probe key "${t}" is not in the catalog, palette, or any phase's pickable list`);
    }
  }
  // Dissection option types are quiz answers, never rendered as nodes — no check.

  // --- Canonical topology coverage (until engine/simulate.js is generalized).
  const requiredCategories = new Set(
    [...requiredTypes].map((t) => paletteByType.get(t)?.category).filter(Boolean)
  );
  for (const cat of CANONICAL_REQUIRED_CATEGORIES) {
    if (!requiredCategories.has(cat)) {
      err('nodePalette', `Palette must require at least one "${cat}"-category node (canonical topology)`);
    }
  }
  for (const t of CANONICAL_REQUIRED_TYPES) {
    if (!requiredTypes.has(t)) {
      err('nodePalette', `Palette must require the "${t}" node (canonical topology)`);
    }
  }

  // --- Palette must include at least one distractor (wrong-pick probes need bait).
  if (!p.nodePalette.some((n) => n.isDistractor)) {
    err('nodePalette', 'Palette must include at least one distractor node');
  }

  // --- Build phases must collectively cover every required palette type.
  const phaseTypes = new Set(p.buildPhases.flatMap((ph) => ph.nodeTypes));
  for (const t of requiredTypes) {
    if (!phaseTypes.has(t)) err('buildPhases', `Required node type "${t}" is not covered by any build phase`);
  }

  // --- Every phase's required types must be pickable in that phase — except
  // 'model'-category types, which are added via the AI node's chat-model slot
  // (flow.modelNext), never through the picker.
  for (const ph of p.buildPhases) {
    for (const t of ph.nodeTypes) {
      const category = paletteByType.get(t)?.category;
      if (category === 'model') continue;
      if (!ph.pickable.includes(t)) {
        err(`buildPhases.${ph.id}`, `Phase requires "${t}" but does not offer it in pickable`);
      }
    }
  }

  // --- NDV setup: exactly one correct option per field.
  for (const [type, setup] of Object.entries(p.nodeSetup)) {
    for (const field of setup.fields ?? []) {
      const correct = field.options.filter((o) => o.correct);
      if (correct.length !== 1) {
        err(`nodeSetup.${type}.${field.key}`, `Field must have exactly one correct option (has ${correct.length})`);
      }
    }
  }

  // --- Probes: exactly one correct option; misconception codes must be labeled.
  for (const [type, probe] of Object.entries(p.nodeProbes)) {
    const correct = probe.options.filter((o) => o.correct);
    if (correct.length !== 1) {
      err(`nodeProbes.${type}`, `Probe must have exactly one correct option (has ${correct.length})`);
    }
    for (const o of probe.options) {
      if (o.misconception && !p.misconceptionLabels[o.misconception]) {
        err(`nodeProbes.${type}`, `Misconception code "${o.misconception}" has no entry in misconceptionLabels`);
      }
    }
  }

  // --- Eval questions: correctIndex in range; caseId must reference a sample case.
  const caseIds = new Set(p.sampleCases.map((c) => c.id));
  for (const q of p.evalQuestions) {
    if (q.correctIndex >= q.options.length) {
      err(`evalQuestions.${q.id}`, `correctIndex ${q.correctIndex} out of range for ${q.options.length} options`);
    }
    if (q.caseId && !caseIds.has(q.caseId)) {
      err(`evalQuestions.${q.id}`, `caseId "${q.caseId}" does not match any sample case`);
    }
  }

  // --- Branch consistency.
  for (const c of p.sampleCases) {
    if (c.branch !== null && !branchIds.has(c.branch)) {
      err(`sampleCases.${c.id}`, `branch "${c.branch}" is not a declared branch id`);
    }
  }
  for (const e of p.referenceGraph.edges) {
    if (e.branch && !branchIds.has(e.branch)) {
      err('referenceGraph', `edge branch "${e.branch}" is not a declared branch id`);
    }
  }
  for (const tc of p.testCases) {
    for (const e of tc.checks.requiredEdges ?? []) {
      if (e.branch && !branchIds.has(e.branch)) {
        err(`testCases.${tc.id}`, `required edge branch "${e.branch}" is not a declared branch id`);
      }
    }
  }
  const coveredBranches = new Set(
    p.referenceGraph.edges.filter((e) => e.branch).map((e) => e.branch as string)
  );
  for (const b of p.branches) {
    if (!coveredBranches.has(b.id)) {
      warn('referenceGraph', `Branch "${b.id}" is never wired in the reference graph`);
    }
  }

  // --- Dissection: correctType must be among the options.
  for (const d of p.dissection) {
    if (!d.options.some((o) => o.type === d.correctType)) {
      err(`dissection.${d.id}`, `correctType "${d.correctType}" is not one of the options`);
    }
  }

  // --- Reference graph edges must reference declared node ids.
  const refNodeIds = new Set(p.referenceGraph.nodes.map((n) => n.id));
  for (const e of p.referenceGraph.edges) {
    if (!refNodeIds.has(e.source)) err('referenceGraph', `edge source "${e.source}" is not a graph node id`);
    if (!refNodeIds.has(e.target)) err('referenceGraph', `edge target "${e.target}" is not a graph node id`);
  }

  // --- Informational: intentional fall-through cases.
  const fallThrough = p.sampleCases.filter((c) => c.branch === null);
  if (fallThrough.length > 0) {
    warn('sampleCases', `${fallThrough.length} case(s) intentionally fall through (branch: null) — verify this is deliberate`);
  }

  const valid = !issues.some((i) => i.level === 'error');
  return { valid, issues, problem: valid ? p : undefined };
}
