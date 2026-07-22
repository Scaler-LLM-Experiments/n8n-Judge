// Walks one sample email through the student's actual wiring and produces an
// ordered list of narrative steps. Reveals gaps (no model, unwired branch,
// unmatched category) as dead-ends rather than pass/fail rows.
//
// Narration is templated: a problem may override any line via `problem.simulation`
// (placeholders like {from}, {category}, {label}, {reply} are filled per step).
// The walk assumes the canonical role types trigger → ai → parse → switch → action.

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

function mainOut(graph, id) {
  return graph.edges.filter((e) => e.source === id && e.targetHandle !== 'ai_model');
}

export function simulateCase(graph, c, sim = {}) {
  const t = { ...DEFAULT_NARRATION, ...sim };
  const steps = [];
  const nodeById = (id) => graph.nodes.find((n) => n.id === id);
  const ctx = (extra) => ({ from: c.from, subject: c.subject, category: c.category, urgency: c.urgency, reply: c.reply, ...extra });

  const trigger = graph.nodes.find((n) => n.type === 'trigger');
  steps.push({ iconType: 'email', status: 'ok', text: fill(t.onNew, ctx()) });
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

    if (current.type === 'trigger') {
      steps.push({ nodeId: current.id, iconType: 'trigger', status: 'ok', text: fill(t.trigger, ctx({ label })) });
    } else if (current.type === 'classify') {
      const hasModel = graph.edges.some((e) => e.target === current.id && e.targetHandle === 'ai_model');
      if (!hasModel) {
        steps.push({ nodeId: current.id, iconType: 'dead', status: 'dead', text: fill(t.aiNoModel, ctx({ label })) });
        return { steps, delivered: false };
      }
      steps.push({ nodeId: current.id, iconType: 'classify', status: 'ok', text: fill(t.aiRead, ctx({ label })) });
    } else if (current.type === 'parse') {
      steps.push({ nodeId: current.id, iconType: 'parse', status: 'ok', text: fill(t.parse, ctx({ label })) });
    } else if (current.type === 'switch') {
      if (!c.branch) {
        steps.push({ nodeId: current.id, iconType: 'dead', status: 'dead', text: fill(t.switchNoMatch, ctx({ label })) });
        return { steps, delivered: false };
      }
      const branchEdge = mainOut(graph, current.id).find((e) => e.sourceHandle === c.branch);
      if (!branchEdge) {
        steps.push({ nodeId: current.id, iconType: 'dead', status: 'dead', text: fill(t.switchUnwired, ctx({ label })) });
        return { steps, delivered: false };
      }
      const target = nodeById(branchEdge.target);
      steps.push({ nodeId: current.id, edgeId: branchEdge.id, iconType: 'switch', status: 'ok', text: fill(t.switchTake, ctx({ label })) });
      if (!target || target.type !== 'action') {
        steps.push({ iconType: 'dead', status: 'dead', text: fill(t.branchNoAction, ctx()) });
        return { steps, delivered: false };
      }
      steps.push({ nodeId: target.id, iconType: 'action', status: 'done', text: fill(t.actionSend, ctx({ targetLabel: target.data?.label || 'Send Reply' })) });
      return { steps, delivered: true };
    } else if (current.type === 'action') {
      steps.push({ nodeId: current.id, iconType: 'action', status: 'done', text: fill(t.action, ctx({ label })) });
      return { steps, delivered: true };
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
  // Success = every categorised email (one with a defined branch) is delivered.
  const required = cases.filter((r) => r.case.branch);
  const success = required.length > 0 && required.every((r) => r.delivered);
  return { cases, success };
}
