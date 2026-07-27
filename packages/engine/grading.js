// Session grading store — accumulates every gradable decision the learner makes
// across dissection, node picks, field choices, wrong-drop probes, and stress
// testing. Pure functions; the UI holds one store in state and appends to it.
//
// A decision:
//   { id, kind: 'dissection'|'nodePick'|'field'|'probe'|'stress',
//     label, correct: bool, firstTry: bool, misconception?: string }

export function createStore() {
  return { decisions: [] };
}

// Append a decision. If one with the same id already exists, keep the earliest
// (so re-answering never inflates or overwrites the original first-try signal).
export function recordDecision(store, decision) {
  if (store.decisions.some((d) => d.id === decision.id)) return store;
  return { ...store, decisions: [...store.decisions, decision] };
}

// Understanding = share of decisions the learner got right on the FIRST try.
// That's the signal we actually grade ("they knew it"), not eventual correctness.
export function understandingScore(store) {
  const total = store.decisions.length;
  if (total === 0) return null;
  const firstTryCorrect = store.decisions.filter((d) => d.correct && d.firstTry).length;
  return Math.round((firstTryCorrect / total) * 100);
}

export function countsByKind(store) {
  const out = {};
  for (const d of store.decisions) {
    const k = out[d.kind] || (out[d.kind] = { total: 0, firstTryCorrect: 0 });
    k.total += 1;
    if (d.correct && d.firstTry) k.firstTryCorrect += 1;
  }
  return out;
}

// The specific misconceptions the learner hit (deduped), for a richer report.
export function misconceptionsHit(store) {
  return [...new Set(store.decisions.filter((d) => d.misconception).map((d) => d.misconception))];
}
