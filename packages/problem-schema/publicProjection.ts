import { balanceProblemOptions } from './balanceOptions.ts';

// What a learner's browser is allowed to see.
//
// `GET /api/problems/[slug]` used to return `ProblemVersion.data` verbatim —
// about 25KB, of which ~24KB was answer material. Anyone could open devtools
// and read every correct option, every correctIndex, and the finished
// reference graph. Shuffling options did nothing about this; `correct: true`
// was right there in the payload.
//
// The answers already live in the backend. The bug was the projection, so this
// is the projection: one function, applied at the API boundary, that removes
// everything the client does not need in order to RENDER.
//
// Answers are checked by POST /api/sessions/[id]/check instead, which also
// records the attempt — see answerCheck.ts for why recording matters.

export interface PublicProblem {
  [key: string]: unknown;
}

/**
 * Fields still shipped to the client, and why they are not yet stripped:
 *
 *   referenceGraph  seeds the #run-story dev route
 *   testCases       the "what Run will check" panel, and the client-side Run
 *   flow            drives the editor's next-step cues in guided mode
 *   sampleCases     the client-side Run streams these through the graph
 *
 * All four are answer material. They can only go once validateGraph and
 * simulateAll move server-side, which is M3's server-authoritative grading —
 * the client cannot run a simulation without the expected outcomes. Removing
 * them before then would break the Run rather than secure it.
 */
export const KNOWN_REMAINING_LEAKS = ['referenceGraph', 'testCases', 'flow', 'sampleCases'] as const;

type Rec = Record<string, unknown>;

const omit = <T extends Rec>(obj: T, keys: string[]): Rec => {
  const out: Rec = {};
  for (const [k, v] of Object.entries(obj)) if (!keys.includes(k)) out[k] = v;
  return out;
};

export function toPublicProblem(problem: Rec): PublicProblem {
  // Spread the answer positions FIRST. This has to happen while the correctness
  // markers still exist — a moment later they are stripped and no one can tell
  // which option to move. Authored data puts the correct option first in every
  // graded list (13/13 dissection, 24/24 fields, 18/18 probes), which the client
  // cannot fix because it cannot see correctness. See balanceOptions.ts.
  const p = { ...balanceProblemOptions(problem) };

  // Understand: the option list is needed to render; which one is right, and
  // the explanation for it, are not. `unlocks` names the correct node type,
  // so it leaks the answer too — the check endpoint returns it on a correct
  // answer instead.
  p.dissection = ((p.dissection as Rec[]) ?? []).map((q) =>
    omit({ ...q, options: ((q.options as Rec[]) ?? []).map((o) => omit(o, ['correct'])) }, [
      'correctType',
      'explanation',
      'wrongHint',
      'unlocks',
    ])
  );

  // The palette flags which nodes are traps. Nothing in the UI reads it.
  p.nodePalette = ((p.nodePalette as Rec[]) ?? []).map((n) => omit(n, ['isDistractor']));

  // Node setup: keep labels, kinds, bounds and option TEXT. Drop every marker
  // of correctness and every explanation — the `why` copy gives the answer
  // away through tone alone, so only the chosen option's `why` is ever sent,
  // and only after the learner has committed to it.
  p.nodeSetup = Object.fromEntries(
    Object.entries((p.nodeSetup as Record<string, Rec>) ?? {}).map(([type, setup]) => [
      type,
      {
        ...omit(setup, ['fields', 'settings']),
        fields: ((setup.fields as Rec[]) ?? []).map((f) =>
          omit(
            {
              ...f,
              options: ((f.options as Rec[]) ?? []).map((o) => omit(o, ['correct', 'why'])),
            },
            // `expect` is a ruleList's whole answer key, and `why` its
            // per-aspect explanations — both must go the same way `correct` does.
            ['correct', 'accepts', 'whyCorrect', 'whyWrong', 'expect', 'why']
          )
        ),
        // Which settings are GRADED stays visible — that is the "Set this"
        // badge, and hiding it would just make the tab unusable. The correct
        // value and the reasoning do not.
        settings: ((setup.settings as Rec[]) ?? []).map((s) => omit(s, ['correct', 'why'])),
      },
    ])
  );

  // Probes: the misconception code is itself a hint ("chat-trigger-is-email"
  // tells you the option is wrong), so it goes with the rest.
  p.nodeProbes = Object.fromEntries(
    Object.entries((p.nodeProbes as Record<string, Rec>) ?? {}).map(([type, probe]) => [
      type,
      {
        ...probe,
        options: ((probe.options as Rec[]) ?? []).map((o) => omit(o, ['correct', 'misconception', 'response'])),
      },
    ])
  );

  // Stress testing.
  p.evalQuestions = ((p.evalQuestions as Rec[]) ?? []).map((q) => omit(q, ['correctIndex', 'explanation']));

  return p;
}

/**
 * Guard for tests and for the route: does this payload still contain anything
 * that marks a correct answer? Deliberately a blunt string scan — a structural
 * check would miss a new answer-bearing field added by a future author, which
 * is exactly the regression worth catching.
 */
export function findLeakedAnswers(payload: unknown): string[] {
  const json = JSON.stringify(payload) ?? '';
  const markers = ['"correct":true', '"correctType"', '"correctIndex"', '"isDistractor"', '"misconception"'];
  return markers.filter((m) => json.includes(m));
}
