// Where a learner actually got to, read out of their own trace.
//
// This is the whole of "Continue where you left off". It lives here, pure and
// tested, rather than inline in the route, because the route cannot be unit
// tested (auth + Prisma) and getting this wrong is invisible: a resume that is
// merely close to the right place still looks like a working feature.
//
// Read from the trace, NOT from `Session.currentScreen` / `builtGraphSnapshot`.
// Those columns exist and look authoritative, but nothing writes them until a
// session COMPLETES, so trusting them offers every learner a resume to screen
// one with an empty canvas.
//
// The trace holds progress at four granularities, and the resume used to carry
// only the first two:
//
//   screen_transition  which of the four screens        → `screen`
//   graph_mutation     the canvas, in full, every time  → `graph`
//   phase_transition   which Build phase                → `phaseId`
//   decision           which questions were answered    → `answered`
//
// Without the last two, a learner who had built two thirds of the flow came back
// to phase one and clicked through every phase-clear celebration they had already
// earned, and a learner half way through a quiz answered every question again.

/** One trace row, as the route selects it. */
export type TraceRow = { type: string; payload: unknown };

export type ResumePoint = {
  /** Journey screen: statement | dashboard | eval | report. */
  screen: string;
  /** `buildPhases[].id` the learner had reached, or null if Build never started. */
  phaseId: string | null;
  /** Quiz question ids already answered, so those questions are not asked twice. */
  answered: { dissection: string[]; stress: string[] };
  /**
   * Understand questions answered CORRECTLY at some point. Narrower than
   * `answered` on purpose: the toolkit on the Understand summary is built from
   * what a right answer unlocked, so a resumed learner who got three of five
   * right must come back with three nodes, not five and not none.
   */
  solved: { dissection: string[] };
  /** The canvas they left behind, or null when it cannot safely seed React Flow. */
  graph: unknown | null;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : null;

/**
 * A traced graph, but only if it can actually seed the canvas.
 *
 * Every node needs a numeric `position` — React Flow reads `position.x` while
 * building its internals and throws on the way in, which takes the whole Build
 * screen down rather than degrading. Graphs recorded before the tracer started
 * carrying positions have none, so this is not hypothetical: without the check,
 * turning resume on would have crashed every learner mid-flight.
 *
 * Returning null costs the learner their canvas and nothing else: they resume onto
 * the right screen and rebuild, and their recorded marks are untouched.
 */
export function restorableGraph(graph: unknown): unknown | null {
  const g = asRecord(graph);
  if (!g) return null;
  const nodes = g.nodes;
  if (!Array.isArray(nodes) || !nodes.length) return null;
  const everyNodePlaceable = nodes.every((n) => {
    const pos = asRecord(n)?.position as { x?: unknown; y?: unknown } | undefined;
    return pos && typeof pos.x === 'number' && typeof pos.y === 'number';
  });
  return everyNodePlaceable ? graph : null;
}

/**
 * @param newestFirst This session's trace, ordered by `seq` DESCENDING — the
 * order the route reads it in, and what makes "the first one found is the latest"
 * true below.
 */
export function resumePointFromTrace(newestFirst: TraceRow[]): ResumePoint {
  const dissection: string[] = [];
  const stress: string[] = [];
  const solvedDissection = new Set<string>();
  const seen = new Set<string>();
  let screen: string | null = null;
  let phaseId: string | null = null;
  let graph: unknown | null = null;

  for (const row of newestFirst) {
    const payload = asRecord(row.payload);

    // First hit wins for these two: the list is newest-first, so that IS the
    // latest one. Not `break`ing, because the decisions below are spread through
    // the whole window.
    if (row.type === 'screen_transition' && screen === null) {
      const to = payload?.to;
      if (typeof to === 'string') screen = to;
      continue;
    }
    if (row.type === 'phase_transition' && phaseId === null) {
      const id = payload?.phaseId;
      if (typeof id === 'string') phaseId = id;
      continue;
    }
    if (row.type === 'graph_mutation' && graph === null) {
      graph = restorableGraph(payload?.graph);
      continue;
    }
    if (row.type !== 'decision') continue;

    // A question counts as answered whether it was answered RIGHT or WRONG:
    // both quizzes advance on any settled verdict. Requiring a correct answer
    // would re-ask a question the learner had moved past, which hands them a
    // fresh attempt at something already recorded — reloading must not be a way
    // to improve a score.
    const kind = payload?.kind;
    const id = payload?.id;
    if (typeof kind !== 'string' || typeof id !== 'string') continue;

    // Every attempt is scanned for this, not just the latest, because a learner
    // who missed once and then got it right has earned the unlock.
    if (kind === 'dissection' && payload?.correct === true) solvedDissection.add(id);

    const key = `${kind}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (kind === 'dissection') dissection.push(id);
    else if (kind === 'stress') stress.push(id);
  }

  return {
    // No transition yet means they never left the first screen, which is Understand.
    screen: screen ?? 'statement',
    phaseId,
    answered: { dissection, stress },
    solved: { dissection: [...solvedDissection] },
    graph,
  };
}
