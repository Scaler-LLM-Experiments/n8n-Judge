import { describe, it, expect } from 'vitest';
import { problems } from '@judge/problems';
import { NODE_CATALOG } from '@judge/catalog';
import { exportN8nWorkflow, validateN8nWorkflow, workflowFileName } from './exportWorkflow.js';
import { N8N_NODE_SPECS, EXPORTABLE_TYPES, n8nIdentity } from './n8nNodeSpecs.js';

const all = Object.entries(problems);

describe('every shipped case exports an importable workflow', () => {
  it.each(all)('%s exports and validates', (_slug, problem) => {
    const { workflow, unsupported } = exportN8nWorkflow(problem);
    expect(unsupported, 'a node type has no export spec').toEqual([]);
    expect(workflow).toBeTruthy();
    expect(validateN8nWorkflow(workflow)).toEqual([]);
  });

  it.each(all)('%s emits only real n8n node types', (_slug, problem) => {
    const { workflow } = exportN8nWorkflow(problem);
    for (const n of workflow.nodes) {
      // A Judge catalog key here is the bug the whole exporter exists to avoid.
      expect(n.type, n.name).toMatch(/^(n8n-nodes-base|@n8n\/n8n-nodes-langchain)\./);
      expect(NODE_CATALOG[n.type], `${n.type} must NOT be a Judge key`).toBeUndefined();
      expect(typeof n.typeVersion).toBe('number');
    }
  });

  it.each(all)('%s names every node uniquely, since connections key by name', (_slug, problem) => {
    const { workflow } = exportN8nWorkflow(problem);
    const names = workflow.nodes.map((n) => n.name);
    expect(new Set(names).size).toBe(names.length);
    for (const key of Object.keys(workflow.connections)) expect(names).toContain(key);
  });

  it.each(all)('%s wires every connection to a node that exists', (_slug, problem) => {
    const { workflow } = exportN8nWorkflow(problem);
    const names = new Set(workflow.nodes.map((n) => n.name));
    for (const byType of Object.values(workflow.connections)) {
      for (const outputs of Object.values(byType)) {
        for (const targets of outputs) for (const c of targets ?? []) expect(names).toContain(c.node);
      }
    }
  });
});

/**
 * The rules that separate "imports" from "imports and does the right thing".
 * Each of these was a real defect caught while building the exporter.
 */
describe('the traps that still import', () => {
  it.each(all)('%s leaves no Judge option token in a parameter', (_slug, problem) => {
    const { workflow } = exportN8nWorkflow(problem);
    // `expect.assignments` stores tokens like `form.name`; the real expression lives
    // in the matching option's label. Emitting the token writes the literal string
    // "form.name" into a spreadsheet cell — imports fine, silently wrong.
    const tokens = new Set();
    for (const setup of Object.values(problem.nodeSetup ?? {})) {
      for (const f of setup.fields ?? []) {
        for (const r of f.expect?.assignments ?? f.expect?.rules ?? []) {
          if (typeof r.value === 'string' && /^[a-z][\w]*\.[\w.]+$/.test(r.value)) tokens.add(r.value);
        }
      }
    }
    const json = JSON.stringify(workflow);
    for (const t of tokens) {
      expect(json.includes(`"${t}"`), `${t} is a Judge token, not an n8n expression`).toBe(false);
    }
  });

  it.each(all)('%s wraps every interpolation as an expression', (_slug, problem) => {
    const { workflow } = exportN8nWorkflow(problem);
    // n8n only evaluates a parameter that begins with `=`. A bare `{{ … }}` is a
    // literal string, which looks exactly like the expression not working.
    const bare = [];
    const walk = (v, path) => {
      if (typeof v === 'string') {
        if (v.includes('{{') && !v.startsWith('=')) bare.push(`${path}: ${v}`);
      } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
    };
    for (const n of workflow.nodes) walk(n.parameters ?? {}, n.name);
    expect(bare).toEqual([]);
  });

  it.each(all)('%s never puts a node setting inside parameters', (_slug, problem) => {
    const { workflow } = exportN8nWorkflow(problem);
    // onError/executeOnce/alwaysOutputData are siblings of `parameters` in n8n.
    // Nested, they are a silent no-op.
    for (const n of workflow.nodes) {
      for (const k of ['onError', 'executeOnce', 'alwaysOutputData', 'retryOnFail']) {
        expect(n.parameters ?? {}, `${n.name}.${k}`).not.toHaveProperty(k);
      }
    }
  });

  it('carries a graded node setting onto the node, when it differs from n8n default', () => {
    // expense-approvals grades classify.onError = continueErrorOutput, which is not
    // n8n's default (stopWorkflow), so it must appear ON the node.
    const { workflow } = exportN8nWorkflow(problems['expense-approvals']);
    const classify = workflow.nodes.find((n) => n.type.endsWith('chainLlm'));
    const graded = problems['expense-approvals'].nodeSetup?.classify?.settings ?? [];
    const onError = graded.find((s) => s.key === 'onError');
    if (onError && onError.correct !== 'stopWorkflow') {
      expect(classify.onError).toBe(onError.correct);
    }
  });

  it('names a Switch output, because connections only carry an index', () => {
    const { workflow } = exportN8nWorkflow(problems['email-triage']);
    const sw = workflow.nodes.find((n) => n.type === 'n8n-nodes-base.switch');
    const values = sw.parameters.rules.values;
    expect(values).toHaveLength(problems['email-triage'].branches.length);
    for (const v of values) {
      // outputKey is ignored unless renameOutput is true — a silent failure that
      // leaves the imported Switch showing "0, 1, 2".
      expect(v.renameOutput).toBe(true);
      expect(v.outputKey).toBeTruthy();
      expect(v.conditions.options.version, 'the v2 condition builder').toBe(2);
    }
  });

  it('points a sub-node connection FROM the model TO the node that uses it', () => {
    // The canvas draws the arrow upward into the root node, but in the JSON the
    // model owns the connection. Reversing it is the classic mistake.
    const { workflow } = exportN8nWorkflow(problems['email-triage']);
    const model = workflow.nodes.find((n) => n.type.endsWith('lmChatGoogleGemini'));
    const conns = workflow.connections[model.name];
    expect(conns, 'the model must be the connection SOURCE').toBeTruthy();
    expect(conns.ai_languageModel[0][0].type).toBe('ai_languageModel');
    const root = workflow.nodes.find((n) => n.name === conns.ai_languageModel[0][0].node);
    expect(root.type).toMatch(/langchain\.(chainLlm|textClassifier|agent)/);
  });

  it('rewrites a field that its immediate predecessor does not produce', () => {
    // Judge's model accumulates fields; real n8n replaces the item. After the HTTP
    // Request, the form's fields are gone from $json, so an authored
    // `$json["Full Name"]` must become a node reference or the cell lands empty.
    const { workflow } = exportN8nWorkflow(problems['trial-signup-desk']);
    const sheet = workflow.nodes.find((n) => n.type === 'n8n-nodes-base.googleSheets');
    const cols = sheet.parameters.columns.value;
    expect(cols['Full Name']).toContain("$('On form submission')");
    // …and must NOT rewrite one it does produce: the rate IS the current item.
    expect(cols.USD_INR_Rate).toBe('={{ $json.rates.INR }}');
  });
});

describe('the export spec table', () => {
  it('covers every type any reference graph places', () => {
    const missing = new Set();
    for (const [, p] of all) {
      for (const n of p.referenceGraph?.nodes ?? []) {
        if (!N8N_NODE_SPECS[n.type]) missing.add(n.type);
      }
    }
    // Hard failure by design: a case using an unmapped type must not ship a
    // half-built workflow file. Add a spec in n8nNodeSpecs.js.
    expect([...missing], 'node types with no n8n export spec').toEqual([]);
  });

  it('only overrides the catalog type with a stated reason', () => {
    for (const [type, spec] of Object.entries(N8N_NODE_SPECS)) {
      if (!spec.n8nType) continue;
      const catalogType = NODE_CATALOG[type]?.n8nType;
      if (spec.n8nType === catalogType) continue;
      // Diverging from the catalog is allowed — Judge's `classify` is really a
      // Basic LLM Chain — but never silently.
      expect(spec.overrideReason, `${type} overrides ${catalogType} with no reason`).toBeTruthy();
      expect(spec.overrideReason.length).toBeGreaterThan(60);
    }
  });

  it('resolves identity from the catalog when not overridden', () => {
    const id = n8nIdentity('action');
    expect(id.type).toBe(NODE_CATALOG.action.n8nType);
    expect(id.typeVersion).toBe(NODE_CATALOG.action.n8nVersion);
    expect(id.overrideReason).toBeNull();
  });

  it('names every spec after a real catalog type', () => {
    for (const type of EXPORTABLE_TYPES) expect(NODE_CATALOG[type], type).toBeTruthy();
  });
});

describe('validateN8nWorkflow catches what it exists to catch', () => {
  const good = () => exportN8nWorkflow(problems['trial-signup-desk']).workflow;

  it('rejects a Judge catalog key as a node type', () => {
    const wf = good();
    wf.nodes[0].type = 'form-trigger';
    expect(validateN8nWorkflow(wf).join(' ')).toContain('not a real n8n node type');
  });

  it('rejects duplicate node names', () => {
    const wf = good();
    wf.nodes[1].name = wf.nodes[0].name;
    expect(validateN8nWorkflow(wf).join(' ')).toContain('duplicate node name');
  });

  it('rejects a connection to a node that is not in the workflow', () => {
    const wf = good();
    wf.connections[wf.nodes[0].name].main[0][0].node = 'Ghost';
    expect(validateN8nWorkflow(wf).join(' ')).toContain('is not a node in this workflow');
  });

  it('rejects a missing typeVersion', () => {
    const wf = good();
    delete wf.nodes[0].typeVersion;
    expect(validateN8nWorkflow(wf).join(' ')).toContain('typeVersion must be a number');
  });

  it('accepts null for a declared-but-unwired output, which n8n allows', () => {
    const wf = good();
    wf.connections[wf.nodes[0].name].main.push(null);
    expect(validateN8nWorkflow(wf)).toEqual([]);
  });

  it('flags outputKey without renameOutput', () => {
    const wf = exportN8nWorkflow(problems['email-triage']).workflow;
    wf.nodes.find((n) => n.type === 'n8n-nodes-base.switch').parameters.rules.values[0].renameOutput = false;
    expect(validateN8nWorkflow(wf).join(' ')).toContain('renameOutput');
  });
});

describe('workflow document shape', () => {
  it.each(all)('%s carries the fields n8n import expects', (_slug, problem) => {
    const { workflow } = exportN8nWorkflow(problem);
    expect(typeof workflow.name).toBe('string');
    expect(Array.isArray(workflow.nodes)).toBe(true);
    expect(workflow.connections).toBeTypeOf('object');
    // v1 is the ordering every workflow created since the change uses.
    expect(workflow.settings.executionOrder).toBe('v1');
  });

  it('names the download file after the slug', () => {
    expect(workflowFileName(problems['email-triage'])).toBe('email-triage.n8n.json');
  });

  it('returns a reason, not a throw, for a problem with no reference graph', () => {
    const { workflow, warnings } = exportN8nWorkflow({ id: 'x', referenceGraph: null });
    expect(workflow).toBeNull();
    expect(warnings.join(' ')).toContain('no referenceGraph');
  });
});
