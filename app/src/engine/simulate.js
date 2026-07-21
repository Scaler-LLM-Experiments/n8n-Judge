// Walks one sample email through the student's actual wiring and produces an
// ordered list of narrative steps. Reveals gaps (no model, unwired branch,
// unmatched category) as dead-ends rather than pass/fail rows.

function mainOut(graph, id) {
  return graph.edges.filter((e) => e.source === id && e.targetHandle !== 'ai_model');
}

export function simulateCase(graph, c) {
  const steps = [];
  const nodeById = (id) => graph.nodes.find((n) => n.id === id);

  const trigger = graph.nodes.find((n) => n.type === 'trigger');
  steps.push({ iconType: 'email', status: 'ok', text: `New email from ${c.from} — "${c.subject}"` });
  if (!trigger) {
    steps.push({ iconType: 'dead', status: 'dead', text: 'There is no trigger, so the flow never starts.' });
    return { steps, delivered: false };
  }

  let current = trigger;
  const visited = new Set();

  while (current) {
    if (visited.has(current.id)) break;
    visited.add(current.id);

    if (current.type === 'trigger') {
      steps.push({ nodeId: current.id, iconType: 'trigger', status: 'ok', text: 'New Email trigger fires.' });
    } else if (current.type === 'classify') {
      const hasModel = graph.edges.some((e) => e.target === current.id && e.targetHandle === 'ai_model');
      if (!hasModel) {
        steps.push({ nodeId: current.id, iconType: 'dead', status: 'dead', text: 'Classify with AI has no Chat Model connected — it can’t classify.' });
        return { steps, delivered: false };
      }
      steps.push({ nodeId: current.id, iconType: 'classify', status: 'ok', text: `Classify with AI reads it as ${c.category} · ${c.urgency}.` });
    } else if (current.type === 'parse') {
      steps.push({ nodeId: current.id, iconType: 'parse', status: 'ok', text: `Parse Result → { category: "${c.category}", urgency: "${c.urgency}" }` });
    } else if (current.type === 'switch') {
      if (!c.branch) {
        steps.push({ nodeId: current.id, iconType: 'dead', status: 'dead', text: `Switch: "${c.category}" matches none of the 3 branches — this email goes unanswered.` });
        return { steps, delivered: false };
      }
      const branchEdge = mainOut(graph, current.id).find((e) => e.sourceHandle === c.branch);
      if (!branchEdge) {
        steps.push({ nodeId: current.id, iconType: 'dead', status: 'dead', text: `Switch wants the ${c.reply} branch, but it isn’t wired — this email goes unanswered.` });
        return { steps, delivered: false };
      }
      const target = nodeById(branchEdge.target);
      steps.push({ nodeId: current.id, edgeId: branchEdge.id, iconType: 'switch', status: 'ok', text: `Switch takes the ${c.reply} branch.` });
      if (!target || target.type !== 'action') {
        steps.push({ iconType: 'dead', status: 'dead', text: 'That branch doesn’t reach a Send Reply — the email goes unanswered.' });
        return { steps, delivered: false };
      }
      steps.push({ nodeId: target.id, iconType: 'action', status: 'done', text: `${target.data?.label || 'Send Reply'} sends the reply to ${c.from}.` });
      return { steps, delivered: true };
    } else if (current.type === 'action') {
      steps.push({ nodeId: current.id, iconType: 'action', status: 'done', text: 'Reply sent.' });
      return { steps, delivered: true };
    }

    const next = mainOut(graph, current.id)[0];
    if (!next) {
      steps.push({ iconType: 'dead', status: 'dead', text: 'The flow dead-ends here — nothing is connected next.' });
      return { steps, delivered: false };
    }
    current = nodeById(next.target);
  }

  return { steps, delivered: false };
}

export function simulateAll(graph, problem) {
  const cases = problem.sampleCases.map((c) => ({ case: c, ...simulateCase(graph, c) }));
  // Success = every categorised email (one with a defined branch) is delivered.
  const required = cases.filter((r) => r.case.branch);
  const success = required.length > 0 && required.every((r) => r.delivered);
  return { cases, success };
}
