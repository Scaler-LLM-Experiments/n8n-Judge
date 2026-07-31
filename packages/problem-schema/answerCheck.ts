// Server-side answer checking.
//
// The client no longer knows which answer is right, so every verdict comes
// from here. One function covers all four surfaces, because they are the same
// operation with different shapes.
//
// The endpoint that calls this MUST record the attempt. A check that is
// side-effect-free is a free oracle: three options, three requests, done —
// brute-forcing would be cheaper than reading the answers ever was. Recording
// turns that into a graded signal instead: guessing is allowed, and it scores
// like guessing, because `firstTry` is what Understanding is built on.

import { parseRuleAspectId, gradeRuleAspect, gradeListItems, whyForAspect } from './ruleList.ts';

type Rec = Record<string, unknown>;

export type CheckKind = 'dissection' | 'field' | 'setting' | 'probe' | 'stress' | 'placement';

export interface CheckRequest {
  kind: CheckKind;
  /** dissection/stress: question id. field/setting: `${nodeType}:${fieldKey}`. probe: node type. */
  id: string;
  /** What the learner chose. A value, an index, a boolean, or typed text. */
  answer: unknown;
}

export interface CheckResult {
  correct: boolean;
  /** Explanation for the CHOSEN answer only — never the full set. */
  why?: string;
  /** Misconception recorded for the report; withheld from the response. */
  misconception?: string;
  /** dissection only: node types this correct answer unlocks. */
  unlocks?: string[];
  /** Set when the id doesn't exist — a probable tampering attempt. */
  unknown?: boolean;
  /**
   * List fields only: this aspect's verdict per ENTRY the learner built, in their
   * order, so the feedback can sit on the branch it is about instead of stacking
   * three list-wide messages underneath. Absent for `count` and for every other
   * kind of field. Scoring is unaffected — the aspect is still one scored item.
   */
  items?: boolean[];
  /** List fields only: how many expected entries are absent. A count, never the names. */
  missing?: number;
}

const norm = (v: unknown) =>
  String(v ?? '')
    .trim()
    .replace(/\{\{\s*/g, '{{ ')
    .replace(/\s*\}\}/g, ' }}');

/**
 * A resourceLocator answer arrives as n8n's `{ __rl: true, mode, value }`.
 * Only `value` is graded — the resource, not the route taken to it. Mirrors
 * `resourceValue` in FieldControl.jsx; the two are kept in sync deliberately.
 */
function resourceValue(v: unknown): unknown {
  return v && typeof v === 'object' && '__rl' in (v as Rec) ? (v as Rec).value : v;
}

/** Mirrors FieldControl.isCorrectValue — kept in sync deliberately, see tests. */
function fieldIsCorrect(field: Rec, answer: unknown): boolean {
  const kind = (field.kind as string) ?? 'select';
  if (kind === 'select') {
    return Boolean(((field.options as Rec[]) ?? []).find((o) => o.value === answer)?.correct);
  }
  if (kind === 'boolean') return Boolean(answer) === Boolean(field.correct);
  if (kind === 'number') return Number(answer) === Number(field.correct);
  if (kind === 'resourceLocator') {
    const picked = resourceValue(answer);
    const accepts = field.accepts as string[] | undefined;
    if (Array.isArray(accepts)) return accepts.some((a) => String(a) === String(picked ?? ''));
    return String(field.correct) === String(picked ?? '');
  }
  const accepts = field.accepts as string[] | undefined;
  if (Array.isArray(accepts)) return accepts.some((a) => norm(a) === norm(answer));
  return norm(field.correct) === norm(answer);
}

/** Every node type the problem's build phases ask for. */
function requiredNodeTypes(problem: Rec): string[] {
  const out = new Set<string>();
  for (const phase of (problem.buildPhases as Rec[]) ?? []) {
    for (const type of (phase.nodeTypes as string[]) ?? []) out.add(type);
  }
  return [...out];
}

export function checkAnswer(problem: Rec, req: CheckRequest): CheckResult {
  switch (req.kind) {
    case 'dissection': {
      const q = ((problem.dissection as Rec[]) ?? []).find((x) => x.id === req.id);
      if (!q) return { correct: false, unknown: true };
      const correct = req.answer === q.correctType;
      return {
        correct,
        // The explanation is the reward for getting it right; the hint is what
        // a wrong answer gets. Never both — handing over the explanation on a
        // wrong answer is what the probe rewrite set out to stop.
        why: correct ? (q.explanation as string) : (q.wrongHint as string),
        unlocks: correct ? ((q.unlocks as string[]) ?? []) : undefined,
      };
    }

    case 'field': {
      const [type, key] = req.id.split(':');
      const fields = ((problem.nodeSetup as Record<string, Rec>) ?? {})[type]?.fields as Rec[] | undefined;

      // A RULE LIST is graded as three separate items — count, categories,
      // conditions — so its checks arrive as `<type>:<fieldKey>#<aspect>`. Each
      // one is its own scored decision with its own attempt count, which is what
      // keeps a variable-length structure gradable without the denominator moving.
      const aspectId = parseRuleAspectId(key ?? '');
      if (aspectId) {
        const ruleField = fields?.find((f) => f.key === aspectId.fieldKey);
        if (!ruleField) return { correct: false, unknown: true };
        const verdict = gradeRuleAspect(ruleField, aspectId.aspect, req.answer);
        if (verdict === null) return { correct: false, unknown: true };
        // The same judgement, per entry, so the NDV can put each message on the
        // branch it belongs to. Feedback only — the aspect above is the score.
        const perRow = gradeListItems(ruleField, aspectId.aspect, req.answer);
        return {
          correct: verdict,
          why: whyForAspect(ruleField, aspectId.aspect, verdict),
          ...(perRow.items ? { items: perRow.items, missing: perRow.missing } : {}),
        };
      }

      const field = fields?.find((f) => f.key === key);
      if (!field) return { correct: false, unknown: true };
      const correct = fieldIsCorrect(field, req.answer);
      const chosen = ((field.options as Rec[]) ?? []).find((o) => o.value === req.answer);
      return {
        correct,
        why: field.options
          ? (chosen?.why as string)
          : correct
            ? (field.whyCorrect as string)
            : (field.whyWrong as string),
      };
    }

    case 'setting': {
      const [type, key] = req.id.split(':');
      const graded = (((problem.nodeSetup as Record<string, Rec>) ?? {})[type]?.settings as Rec[] | undefined)?.find(
        (s) => s.key === key
      );
      if (!graded) return { correct: false, unknown: true };
      const correct = req.answer === graded.correct;
      const why = graded.why as string | Record<string, string> | undefined;
      return {
        correct,
        why: typeof why === 'string' ? why : why?.[String(req.answer)],
      };
    }

    case 'probe': {
      const probe = ((problem.nodeProbes as Record<string, Rec>) ?? {})[req.id];
      if (!probe) return { correct: false, unknown: true };
      // The client sends the option TEXT, not an index — indices are shuffled
      // per session, so an index would mean the server had to know the
      // learner's display order.
      const chosen = ((probe.options as Rec[]) ?? []).find((o) => o.text === req.answer);
      if (!chosen) return { correct: false, unknown: true };
      return {
        correct: Boolean(chosen.correct),
        why: chosen.response as string,
        misconception: chosen.misconception as string | undefined,
      };
    }

    case 'stress': {
      const q = ((problem.evalQuestions as Rec[]) ?? []).find((x) => x.id === req.id);
      if (!q) return { correct: false, unknown: true };
      // Also the option text, for the same reason as probes.
      const options = (q.options as string[]) ?? [];
      const index = options.indexOf(String(req.answer));
      if (index < 0) return { correct: false, unknown: true };
      return { correct: index === q.correctIndex, why: q.explanation as string };
    }

    case 'placement': {
      // `id` is the slot being filled — the node type the flow expects at that
      // point. `answer` is what the learner actually dropped in.
      //
      // Placement had no server check before this, which is why the Build score
      // had no data: a correct pick recorded nothing at all, and only wrong
      // picks showed up (via the probe).
      const required = requiredNodeTypes(problem);
      if (!required.includes(String(req.id))) {
        // A slot this problem never declares was never offered to this learner.
        return { correct: false, unknown: true };
      }
      const placed = String(req.answer);
      // Correct only if the node belongs to this workflow AND went where the
      // flow expects it. Ordering is asserted by the client (it owns `flow`
      // traversal); what the server independently enforces is that the type is
      // one this problem actually needs, which is what catches a distractor.
      const correct = required.includes(placed) && placed === String(req.id);
      return { correct };
    }

    default:
      return { correct: false, unknown: true };
  }
}
