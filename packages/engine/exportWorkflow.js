// A problem's reference solution, as a workflow file that imports into real n8n.
//
//   const { workflow, warnings } = exportN8nWorkflow(problem);
//   const issues = validateN8nWorkflow(workflow);   // [] means structurally sound
//
// ---------------------------------------------------------------------------
// What this is for
// ---------------------------------------------------------------------------
// A learner who scores well has proved they can reason about the flow. The
// payoff is going and building it for real — so the Result screen offers this
// file, they import it into their own n8n, attach their own credentials, and
// press Execute.
//
// That sets the bar: **it has to actually import and actually run.** Producing
// something merely n8n-SHAPED is not the goal and is the easy trap, because
// `@judge/workflow` already gives us the right shape and the shape is the part
// that looks finished.
//
// ---------------------------------------------------------------------------
// Why it exports the REFERENCE graph, not the learner's canvas
// ---------------------------------------------------------------------------
// The download unlocks at a threshold, not at 100%, so a learner who qualifies
// still has some decisions wrong. Exporting their own build would hand them a
// workflow with genuinely misconfigured nodes and tell them it works. The
// reference solution is deterministic, committed per case, and checkable in CI,
// so "it imports and runs" is a property that can be tested rather than hoped
// for.
//
// ---------------------------------------------------------------------------
// The three things that make an export wrong in ways that still import
// ---------------------------------------------------------------------------
// 1. **The branch name lives in the node's parameters, never in `connections`**
//    (reference §2). A connection stores an output INDEX. Get this wrong and the
//    Switch imports with anonymous outputs.
// 2. **A sub-node owns its connection.** The Chat Model is the SOURCE and the
//    node using it is the target, even though the canvas draws the arrow upward.
// 3. **Node names are the join key**, so they must be unique — `toWorkflow()`
//    already disambiguates duplicates the way n8n does.
import { toWorkflow } from '@judge/workflow';
import { NODE_CATALOG } from '@judge/catalog';
import { N8N_NODE_SPECS, genericNodeSpec, n8nIdentity } from './n8nNodeSpecs.js';

/** n8n's own default for new workflows. v0 exists only for pre-change ones (§2). */
const WORKFLOW_SETTINGS = { executionOrder: 'v1' };

/**
 * Judge's graded node settings, mapped onto n8n's node-level properties.
 *
 * These are siblings of `parameters` on the node, not members of it (§2), and
 * they change how a run behaves — so carrying them across is part of exporting
 * the learner's actual lesson, not cosmetic.
 */
const SETTING_KEYS = ['onError', 'retryOnFail', 'maxTries', 'waitBetweenTries', 'alwaysOutputData', 'executeOnce'];

/**
 * The authored-correct value for each graded setting of a node type.
 *
 * `nodeSetup[type].settings` is `{ key, correct, why }` — see the authoring
 * skill. n8n stores a setting only when it differs from its default, so a
 * setting whose correct answer IS the default is deliberately omitted.
 */
const N8N_SETTING_DEFAULTS = {
  onError: 'stopWorkflow',
  retryOnFail: false,
  alwaysOutputData: false,
  executeOnce: false,
};

function nodeSettingsFor(setup) {
  const out = {};
  for (const s of setup?.settings ?? []) {
    if (!SETTING_KEYS.includes(s.key)) continue;
    if (s.correct === undefined) continue;
    if (N8N_SETTING_DEFAULTS[s.key] === s.correct) continue; // sparse, like n8n
    out[s.key] = s.correct;
  }
  return out;
}

/**
 * Rewrite `$json` references so they resolve against REAL n8n item lineage.
 *
 * ---------------------------------------------------------------------------
 * The single most important correction in this file
 * ---------------------------------------------------------------------------
 * Judge's teaching model is that **the item accumulates fields** down the chain,
 * so an authored expression two nodes past the trigger still says
 * `$json["Full Name"]`. Real n8n does not work that way: most nodes REPLACE the
 * item with their own output. After an HTTP Request, `$json` is the API's
 * response and the form's fields are simply gone — so `$json["Full Name"]`
 * evaluates to undefined and the spreadsheet cell lands empty. It imports
 * perfectly and quietly does the wrong thing, which is the worst failure mode
 * available.
 *
 * Both independent case reviews flagged this divergence as a platform-level
 * issue. It is not fixed by changing Judge's model — every shipped case relies on
 * accumulation and the product has no node-reference syntax. It is fixed HERE, at
 * the boundary where we claim to emit real n8n.
 *
 * The rule, using the catalog's own `output` samples as the source of truth for
 * which node produces which field:
 *
 *   - the immediate main predecessor produces the field  →  leave `$json.field`
 *   - an earlier ancestor produces it  →  `$('That Node').item.json.field`
 *   - nobody produces it  →  leave it alone and report a warning; guessing would
 *     be worse than an expression the learner can see and fix
 */
function relinkExpressions(nodes, connections, judgeTypeByName, warnings) {
  // Immediate main predecessor, by node name.
  const predecessor = new Map();
  for (const [from, byType] of Object.entries(connections)) {
    for (const targets of byType.main ?? []) {
      for (const c of targets ?? []) if (!predecessor.has(c.node)) predecessor.set(c.node, from);
    }
  }

  /** Root-level field names a node's catalog sample output offers. */
  const producedBy = (name) => {
    const judgeType = judgeTypeByName.get(name);
    const output = NODE_CATALOG[judgeType]?.output;
    return output && typeof output === 'object' ? new Set(Object.keys(output)) : new Set();
  };

  /** Walk back from `name` for the nearest ancestor producing `field`. */
  const ownerOf = (name, field) => {
    const seen = new Set();
    let at = predecessor.get(name);
    while (at && !seen.has(at)) {
      seen.add(at);
      if (producedBy(at).has(field)) return at;
      at = predecessor.get(at);
    }
    return null;
  };

  // `$json.foo`, `$json["foo"]`, `$json['foo']` — captures the root field only.
  const REF = /\$json(?:\.([A-Za-z_$][\w$]*)|\[\s*(['"])(.*?)\2\s*\])/g;

  const rewriteString = (s, nodeName) =>
    s.replace(REF, (whole, dotted, _q, bracketed) => {
      const field = dotted ?? bracketed;
      const immediate = predecessor.get(nodeName);
      if (!immediate) return whole; // a trigger has no upstream to disambiguate
      if (producedBy(immediate).has(field)) return whole; // already correct
      const owner = ownerOf(nodeName, field);
      if (!owner) {
        warnings.push(`${nodeName}: "${field}" is not produced by any upstream node — expression left as authored`);
        return whole;
      }
      // Bracket form throughout: field names in these cases contain spaces
      // ("Full Name"), and dot access on those is a syntax error in n8n.
      return `$('${owner}').item.json['${field}']`;
    });

  const walk = (value, nodeName) => {
    if (typeof value === 'string') return rewriteString(value, nodeName);
    if (Array.isArray(value)) return value.map((v) => walk(v, nodeName));
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v, nodeName)]));
    }
    return value;
  };

  for (const n of nodes) {
    if (n.parameters) n.parameters = walk(n.parameters, n.name);
  }
}

/**
 * Build the importable workflow for a problem's reference solution.
 *
 * @returns {{ workflow: object, warnings: string[], unsupported: string[] }}
 *   `unsupported` lists node types with no export spec. It is non-empty only
 *   when a case uses a type nobody has mapped yet, and the caller should treat
 *   that as a failure rather than shipping a partial file.
 */
export function exportN8nWorkflow(problem) {
  const warnings = [];
  const unsupported = [];

  const graph = problem?.referenceGraph;
  if (!graph?.nodes?.length) {
    return { workflow: null, warnings: ['the problem has no referenceGraph to export'], unsupported: [] };
  }

  // Reuse the canonical conversion for TOPOLOGY only — it already gets unique
  // names, positional outputs, and sub-node direction right, and reimplementing
  // that here is how the two would drift.
  const canonical = toWorkflow(graph, {
    branches: problem.branches ?? [],
    name: problem.title ?? problem.id,
  });

  const nodes = canonical.nodes.map((n) => {
    const judgeType = n.type;
    const spec = N8N_NODE_SPECS[judgeType] ?? genericNodeSpec(judgeType);
    const { type, typeVersion, overrideReason } = n8nIdentity(judgeType);

    if (!spec) {
      unsupported.push(judgeType);
      return null;
    }
    if (!type || typeof typeVersion !== 'number') {
      unsupported.push(judgeType);
      return null;
    }
    if (overrideReason) {
      warnings.push(
        `${n.name}: exported as ${type} rather than the catalog's ${NODE_CATALOG[judgeType]?.n8nType} — ${overrideReason}`
      );
    }

    const setup = problem.nodeSetup?.[judgeType];
    const ctx = { node: graph.nodes.find((g) => g.id === n.id) ?? {}, problem, setup, branches: problem.branches ?? [] };

    const out = {
      id: n.id,
      name: n.name,
      type,
      typeVersion,
      position: n.position,
      parameters: spec.parameters ? spec.parameters(ctx) : {},
    };

    const creds = spec.credentials ? spec.credentials(ctx) : null;
    if (creds) out.credentials = creds;

    // Node-level settings sit alongside `parameters`, so they are spread onto the
    // node rather than nested — nesting them is a silent no-op in n8n.
    Object.assign(out, nodeSettingsFor(setup));

    return out;
  });

  if (unsupported.length) {
    return { workflow: null, warnings, unsupported: [...new Set(unsupported)] };
  }

  // Judge's authored expressions assume an accumulating item; n8n replaces it.
  // Correct them against real lineage before anything is written out.
  relinkExpressions(
    nodes,
    canonical.connections,
    new Map(canonical.nodes.map((n) => [n.name, n.type])),
    warnings
  );

  const workflow = {
    name: problem.title ?? problem.id,
    nodes,
    connections: canonical.connections,
    settings: WORKFLOW_SETTINGS,
    // n8n writes these on export and tolerates them on import. `instanceId` is
    // deliberately absent: it identifies the instance that produced the file, and
    // we are not one.
    meta: { templateCredsSetupCompleted: false },
    pinData: {},
  };

  // A router whose branches are not all wired means an item can reach a dead end.
  // Judge's own phase completion already forbids that, so it is a warning about
  // the authored graph rather than about the export.
  for (const [from, byType] of Object.entries(workflow.connections)) {
    (byType.main ?? []).forEach((targets, i) => {
      if (!targets?.length) warnings.push(`${from}: main output ${i} has nothing wired to it`);
    });
  }

  return { workflow, warnings, unsupported: [] };
}

/**
 * Structural checks against n8n's own invariants.
 *
 * Deliberately NOT a schema of every parameter — that would be a second copy of
 * n8n's node definitions and would rot. These are the rules that make a file
 * either load or fail to load, plus the two silent-wrongness traps above.
 *
 * @returns {string[]} empty when sound
 */
export function validateN8nWorkflow(wf) {
  const issues = [];
  if (!wf || typeof wf !== 'object') return ['not an object'];
  if (!Array.isArray(wf.nodes) || !wf.nodes.length) return ['nodes must be a non-empty array'];
  if (!wf.connections || typeof wf.connections !== 'object') issues.push('connections must be an object');

  const names = new Set();
  for (const n of wf.nodes) {
    const at = n?.name ?? '(unnamed)';
    // Connections reference nodes BY NAME, so a duplicate silently merges two
    // nodes' wiring and a missing name breaks every connection touching it.
    if (!n?.name) issues.push('a node has no name');
    else if (names.has(n.name)) issues.push(`duplicate node name "${n.name}" — connections key by name`);
    else names.add(n.name);

    if (!n?.id) issues.push(`${at}: no id`);
    if (!n?.type) issues.push(`${at}: no type`);
    // A Judge catalog key here is the whole bug this export exists to avoid.
    else if (!/^(n8n-nodes-base|@n8n\/n8n-nodes-langchain)\./.test(n.type)) {
      issues.push(`${at}: type "${n.type}" is not a real n8n node type`);
    }
    if (typeof n?.typeVersion !== 'number') issues.push(`${at}: typeVersion must be a number`);
    if (!Array.isArray(n?.position) || n.position.length !== 2 || n.position.some((v) => typeof v !== 'number')) {
      issues.push(`${at}: position must be [x, y] numbers`);
    }
    if (n?.parameters !== undefined && (typeof n.parameters !== 'object' || Array.isArray(n.parameters))) {
      issues.push(`${at}: parameters must be an object`);
    }
    // Settings on the node, never inside parameters.
    for (const k of SETTING_KEYS) {
      if (n?.parameters && k in n.parameters) issues.push(`${at}: "${k}" is a node property, not a parameter`);
    }
  }

  for (const [from, byType] of Object.entries(wf.connections ?? {})) {
    if (!names.has(from)) issues.push(`connections key "${from}" is not a node name`);
    for (const [type, outputs] of Object.entries(byType ?? {})) {
      if (!Array.isArray(outputs)) {
        issues.push(`${from}.${type}: outputs must be an array of arrays (one per output index)`);
        continue;
      }
      outputs.forEach((targets, i) => {
        // null is legal in n8n for "declared output, nothing wired" (§2).
        if (targets === null) return;
        if (!Array.isArray(targets)) {
          issues.push(`${from}.${type}[${i}]: must be an array of targets or null`);
          return;
        }
        for (const c of targets) {
          if (!c?.node) issues.push(`${from}.${type}[${i}]: a target has no node`);
          else if (!names.has(c.node)) issues.push(`${from}.${type}[${i}]: target "${c.node}" is not a node in this workflow`);
          if (c?.type !== type) issues.push(`${from}.${type}[${i}]: target type "${c?.type}" should be "${type}"`);
          if (typeof c?.index !== 'number') issues.push(`${from}.${type}[${i}]: target index must be a number`);
        }
      });
    }
  }

  // A Switch with named outputs must name as many as it has wired, or the learner
  // cannot tell the branches apart after import.
  for (const n of wf.nodes) {
    if (n?.type !== 'n8n-nodes-base.switch') continue;
    const values = n.parameters?.rules?.values;
    if (!Array.isArray(values) || !values.length) {
      issues.push(`${n.name}: a Switch with no rules.values has no outputs at all`);
      continue;
    }
    if (values.some((v) => v.outputKey && !v.renameOutput)) {
      issues.push(`${n.name}: outputKey is ignored unless renameOutput is true`);
    }
    const wired = (wf.connections?.[n.name]?.main ?? []).length;
    // `fallbackOutput: 'extra'` adds one output beyond the rules.
    const declared = values.length + (n.parameters?.options?.fallbackOutput === 'extra' ? 1 : 0);
    if (wired > declared) issues.push(`${n.name}: ${wired} outputs wired but only ${declared} declared by its parameters`);
  }

  return issues;
}

/** The filename a download should use. */
export function workflowFileName(problem) {
  return `${problem?.id ?? 'workflow'}.n8n.json`;
}

/** Pretty JSON with a trailing newline, which is what n8n's own export writes. */
export function serializeWorkflow(workflow) {
  return `${JSON.stringify(workflow, null, 2)}\n`;
}
