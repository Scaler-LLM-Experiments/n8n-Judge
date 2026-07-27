// Walks one sample case through the student's actual wiring and produces an
// ordered list of narrative steps. Reveals gaps (no model, unwired branch,
// unmatched route) as dead-ends rather than pass/fail rows.
//
// The walk is METADATA-DRIVEN, not hard-coded to a fixed chain. Each node's
// role is resolved from the catalog (@judge/catalog): trigger / ai / router /
// action / passthrough. This lets a problem use any topology — a linear
// trigger → ai → action, a router with multi-node branches, multiple actions,
// alternative trigger/ai/action node types — as long as each node declares its
// role via catalog metadata (`category`, `needsModel`, `branches`).
//
// Narration is templated: a problem may override any line via `problem.simulation`
// (placeholders like {from}, {category}, {label}, {reply} are filled per step).

import { NODE_CATALOG } from '@judge/catalog';

const DEFAULT_NARRATION = {
  onNew: 'New email from {from} — "{subject}"',
  noTrigger: 'There is no trigger, so the flow never starts.',
  trigger: '{label} trigger fires.',
  aiNoModel: '{label} has no Chat Model connected — it can’t run.',
  aiRead: '{label} reads it as {category} · {urgency}.',
  parse: '{label} → { category: "{category}", urgency: "{urgency}" }',
  switchNoMatch: 'Switch: "{category}" matches none of the branches — this email goes unanswered.',
  switchUnwired: 'Switch wants the {reply} branch, but it isn’t wired — this email goes unanswered.',
  switchTake: '{label} takes the {reply} branch.',
  branchNoAction: 'That branch doesn’t reach a reply — the email goes unanswered.',
  actionSend: '{targetLabel} sends the reply to {from}.',
  action: 'Reply sent.',
  deadEnd: 'The flow dead-ends here — nothing is connected next.',
};

const fill = (tpl, ctx) => String(tpl).replace(/\{(\w+)\}/g, (_, k) => (ctx[k] ?? ''));

const meta = (type) => NODE_CATALOG[type] || {};

// Resolve a node's structural role from catalog metadata (never from a
// hard-coded type string), so new node vocabularies work as pure data.
export function roleOf(type) {
  const m = meta(type);
  if (m.category === 'trigger') return 'trigger';
  if (m.category === 'action') return 'action';
  if (m.category === 'ai') return 'ai';
  if (Array.isArray(m.branches) && m.branches.length > 0) return 'router';
  return 'passthrough'; // core (parse, code, …); 'model' sub-nodes never enter the main walk
}

// Main-flow out-edges: exclude AI sub-node connectors (ai_model, ai_tool, …).
function mainOut(graph, id) {
  return graph.edges.filter((e) => e.source === id && !String(e.targetHandle || '').startsWith('ai_'));
}

export function simulateCase(graph, c, sim = {}) {
  const t = { ...DEFAULT_NARRATION, ...sim };
  const steps = [];
  const nodeById = (id) => graph.nodes.find((n) => n.id === id);
  const ctx = (extra) => ({ from: c.from, subject: c.subject, category: c.category, urgency: c.urgency, reply: c.reply, ...extra });

  steps.push({ iconType: 'email', status: 'ok', text: fill(t.onNew, ctx()) });

  const trigger = graph.nodes.find((n) => roleOf(n.type) === 'trigger');
  if (!trigger) {
    steps.push({ iconType: 'dead', status: 'dead', text: fill(t.noTrigger, ctx()) });
    return { steps, delivered: false };
  }

  let current = trigger;
  const visited = new Set();

  while (current) {
    if (visited.has(current.id)) break;
    visited.add(current.id);
    const label = current.data?.label || current.type;
    const role = roleOf(current.type);

    if (role === 'trigger') {
      steps.push({ nodeId: current.id, iconType: current.type, status: 'ok', text: fill(t.trigger, ctx({ label })) });
    } else if (role === 'ai') {
      if (meta(current.type).needsModel) {
        const hasModel = graph.edges.some((e) => e.target === current.id && e.targetHandle === 'ai_model');
        if (!hasModel) {
          steps.push({ nodeId: current.id, iconType: 'dead', status: 'dead', text: fill(t.aiNoModel, ctx({ label })) });
          return { steps, delivered: false };
        }
      }
      steps.push({ nodeId: current.id, iconType: current.type, status: 'ok', text: fill(t.aiRead, ctx({ label })) });
    } else if (role === 'router') {
      if (!c.branch) {
        steps.push({ nodeId: current.id, iconType: 'dead', status: 'dead', text: fill(t.switchNoMatch, ctx({ label })) });
        return { steps, delivered: false };
      }
      const branchEdge = mainOut(graph, current.id).find((e) => e.sourceHandle === c.branch);
      if (!branchEdge) {
        steps.push({ nodeId: current.id, iconType: 'dead', status: 'dead', text: fill(t.switchUnwired, ctx({ label })) });
        return { steps, delivered: false };
      }
      steps.push({ nodeId: current.id, edgeId: branchEdge.id, iconType: current.type, status: 'ok', text: fill(t.switchTake, ctx({ label })) });
      const target = nodeById(branchEdge.target);
      if (!target) {
        steps.push({ iconType: 'dead', status: 'dead', text: fill(t.branchNoAction, ctx()) });
        return { steps, delivered: false };
      }
      current = target; // continue the generic walk down the chosen branch
      continue;
    } else if (role === 'action') {
      steps.push({ nodeId: current.id, iconType: current.type, status: 'done', text: fill(t.actionSend, ctx({ targetLabel: label })) });
      return { steps, delivered: true };
    } else {
      // passthrough (core nodes like parse/code)
      steps.push({ nodeId: current.id, iconType: current.type, status: 'ok', text: fill(t.parse, ctx({ label })) });
    }

    const next = mainOut(graph, current.id)[0];
    if (!next) {
      steps.push({ iconType: 'dead', status: 'dead', text: fill(t.deadEnd, ctx()) });
      return { steps, delivered: false };
    }
    current = nodeById(next.target);
  }

  return { steps, delivered: false };
}

export function simulateAll(graph, problem) {
  const sim = problem.simulation || {};
  const cases = problem.sampleCases.map((c) => ({ case: c, ...simulateCase(graph, c, sim) }));
  // Success = every case that is expected to deliver, delivers. Router problems
  // mark intentional fall-through with branch:null (not required); problems
  // without routing expect every case to deliver.
  const withBranch = cases.filter((r) => r.case.branch !== null && r.case.branch !== undefined);
  const required = withBranch.length ? withBranch : cases;
  const success = required.length > 0 && required.every((r) => r.delivered);
  return { cases, success };
}
