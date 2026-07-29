// Spread the correct answer's position before the answer key is stripped away.
//
// The problem this solves, measured rather than assumed:
//
//   Authored data puts the correct option FIRST in 13/13 dissection items,
//   24/24 NDV fields and 18/18 probes across the three shipped problems. 100%.
//
// The previous defence was a client-side shuffle seeded per browser tab. It is
// uniform on average — over 400 simulated sessions the correct option landed at
// index 0/1/2 almost exactly a third each — but each field was drawn
// INDEPENDENTLY, so individual sessions could be degenerate. The unluckiest put
// the answer on top for 18 of 24 fields. A learner in that tab clears the build
// by always clicking the top option, and averages are no comfort to them: they
// only ever experience one session.
//
// It also could not work at all. `toPublicProblem` strips `correct` from every
// option, so the browser does not know which one is right and cannot balance
// anything even in principle. Only the server can — so it does, here, before the
// stripping.
//
// The arrangement is deterministic per problem: every learner sees the same
// order. That is a deliberate trade. Positional secrecy was never a real defence
// — the option TEXT is the answer, so anyone who wants to share an answer shares
// the text, not the slot. What matters is that no arrangement contains a
// positional tell, and a fixed balanced one has none.
//
// Grading is untouched: every surface records the chosen VALUE, TYPE or TEXT,
// never an index.

type Rec = Record<string, unknown>;

/** FNV-1a — small, fast, stable across runs and processes. */
function hash32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Move one item to `target`, keeping the others in their relative order.
 * A rotation would also spread positions, but it drags the distractors along in
 * lockstep; splicing keeps their order stable while only the answer moves.
 */
function placeAt<T>(items: T[], from: number, target: number): T[] {
  const rest = items.filter((_, i) => i !== from);
  rest.splice(target, 0, items[from]);
  return rest;
}

/**
 * Balance one group of questions.
 *
 * Question `i` in the group gets target `(offset + i) % n`, so consecutive
 * questions never share a target and no group can stack its answers in one
 * slot. `offset` is derived from the group key, so different nodes start at
 * different points and the whole problem doesn't march in step.
 *
 * @param items    questions, in authored order (mutated copies are returned)
 * @param groupKey stable key for this group, e.g. `email-triage:switch`
 * @param correctIndexOf which option is correct, or -1 if unknowable
 * @param setOptions rebuild the item with its reordered options
 */
export function balanceGroup<T>(
  items: T[],
  groupKey: string,
  correctIndexOf: (item: T) => number,
  setOptions: (item: T, options: unknown[]) => T,
  optionsOf: (item: T) => unknown[] | undefined
): T[] {
  const offset = hash32(groupKey) % 997;

  // The cap, computed over the whole group before anything moves.
  //
  // `(offset + i) % options.length` alone does NOT guarantee distinct targets when
  // the items in a group have DIFFERENT option counts, because each one takes a
  // different modulus: a 4-option field at i=0 and a 3-option field at i=1 both
  // land on 2 whenever offset is 2 mod 4 and 1 mod 3. The three original problems
  // happened to give every field in a node the same number of options, so the
  // collision was invisible until a problem mixed 3-option and 4-option fields on
  // one node. Rotation is still what spreads the positions; this is what makes the
  // spread a guarantee rather than a tendency.
  const lengths = items
    .map((item) => {
      const options = optionsOf(item);
      if (!Array.isArray(options) || options.length < 2) return 0;
      const from = correctIndexOf(item);
      return from >= 0 && from < options.length ? options.length : 0;
    })
    .filter((n) => n > 0);
  const cap = lengths.length ? Math.ceil(lengths.length / Math.min(...lengths)) : 1;
  const used = new Map<number, number>();

  return items.map((item, i) => {
    const options = optionsOf(item);
    if (!Array.isArray(options) || options.length < 2) return item;
    const from = correctIndexOf(item);
    // Nothing identifiable as correct (a neutrally-rendered probe, or data we
    // don't understand): leave the order exactly as authored rather than
    // inventing a position and risking a silent mis-grade.
    if (from < 0 || from >= options.length) return item;

    // Walk forward from the rotated position until this slot is not over the cap.
    // Always terminates: cap * options.length >= cap * min(lengths) >= the number of
    // items being placed, so some slot has room.
    let target = (offset + i) % options.length;
    for (let step = 0; step < options.length && (used.get(target) ?? 0) >= cap; step += 1) {
      target = (target + 1) % options.length;
    }
    used.set(target, (used.get(target) ?? 0) + 1);

    if (target === from) return item;
    return setOptions(item, placeAt(options, from, target));
  });
}

/**
 * Reorder every graded option list in a problem so answer positions are spread.
 *
 * MUST run before `toPublicProblem` strips the correctness markers — afterwards
 * the information needed to do it is gone. Returns a new object; the input is
 * untouched, because a `ProblemVersion` is immutable by construction.
 */
export function balanceProblemOptions(problem: Rec): Rec {
  const slug = String(problem.slug ?? problem.id ?? 'problem');
  const out: Rec = { ...problem };

  // Understand: correctness is by `type` matching the question's `correctType`.
  if (Array.isArray(problem.dissection)) {
    out.dissection = balanceGroup(
      problem.dissection as Rec[],
      `${slug}:dissection`,
      (q) => ((q.options as Rec[]) ?? []).findIndex((o) => o.type === q.correctType),
      (q, options) => ({ ...q, options }),
      (q) => q.options as unknown[] | undefined
    );
  }

  // NDV parameters, balanced per node so one node's fields never agree.
  if (problem.nodeSetup && typeof problem.nodeSetup === 'object') {
    const setups = problem.nodeSetup as Record<string, Rec>;
    const nextSetups: Record<string, Rec> = {};
    for (const [type, setup] of Object.entries(setups)) {
      if (!Array.isArray(setup.fields)) {
        nextSetups[type] = setup;
        continue;
      }
      nextSetups[type] = {
        ...setup,
        fields: balanceGroup(
          setup.fields as Rec[],
          `${slug}:${type}`,
          (f) => ((f.options as Rec[]) ?? []).findIndex((o) => o.correct === true),
          (f, options) => ({ ...f, options }),
          (f) => f.options as unknown[] | undefined
        ),
      };
    }
    out.nodeSetup = nextSetups;
  }

  // Probes. Keyed by node type, so build a stable list to index into.
  if (problem.nodeProbes && typeof problem.nodeProbes === 'object') {
    const probes = problem.nodeProbes as Record<string, Rec>;
    const entries = Object.entries(probes);
    const balanced = balanceGroup(
      entries.map(([, probe]) => probe),
      `${slug}:probes`,
      (probe) => ((probe.options as Rec[]) ?? []).findIndex((o) => o.correct === true),
      (probe, options) => ({ ...probe, options }),
      (probe) => probe.options as unknown[] | undefined
    );
    out.nodeProbes = Object.fromEntries(entries.map(([type], i) => [type, balanced[i]]));
  }

  // Stress questions are NOT touched. Their `correctIndex` points into the
  // authored array and `scoreEval` grades against it, so moving options here
  // would silently mark the wrong answer correct. They are also already spread
  // (authored at index 1 and 2), and EvalScreen shuffles them per session while
  // carrying `originalIndex` through.
  return out;
}
