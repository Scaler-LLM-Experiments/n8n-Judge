// A learner-built list of routing rules — n8n's `fixedCollection` of `filter`s.
//
// This is the Switch node's real `rules` parameter. In n8n it is a repeatable,
// sortable group, and each entry holds an `outputKey` (the branch label you see
// on the canvas) plus a `conditions` filter:
//
//   rules
//   └── values[]
//       ├── outputKey: 'Bug Report'
//       └── conditions
//           ├── leftValue:  {{ $json.category }}
//           ├── operator:   { type: 'string', operation: 'equals' }
//           └── rightValue: 'Bug Report'
//
// Judge modelled the same node as two dropdowns with the branches hardcoded in
// problem data, so the learner never created a branch — they were already there.
// That skips the most n8n-ish idea in the product: **a node's shape is a
// consequence of its configuration.** Add a rule, get an output.
//
// ---------------------------------------------------------------------------
// Grading: fixed properties of the list, not one item per rule.
// ---------------------------------------------------------------------------
// Everything else Judge grades is one field with one correct value, and attempt
// decay is tied to the option count. A rule list breaks both: the answer is a
// variable-length structure, so "how many options?" has no answer, and scoring
// per rule would make the denominator move between attempts — one learner's
// Switch worth three items and another's worth five, with config quietly
// outweighing the rest of the problem.
//
// So a rule list always contributes exactly three scored items, whatever the
// learner builds:
//
//   count       — did you create the right number of branches?
//   categories  — are they the right categories?
//   conditions  — does each branch test the right thing?
//
// All three are open-ended (no fixed option count), so they decay 100/50/0 like
// an expression field. See `enumerateItems` in packages/engine/rubric.ts.
//
// One consequence worth stating: because setup must verify green before a phase
// completes, and green means the rules match what was authored, anything
// downstream (validateGraph, simulateAll, the canvas branch wiring) still sees
// exactly the branches the problem declares. The learner's list can be wrong
// while they work on it; it cannot be wrong once it matters.

type Rec = Record<string, unknown>;

/** The three things a rule list is scored on, in the order they are shown. */
export const RULE_ASPECTS = ['count', 'categories', 'conditions'] as const;
export type RuleAspect = (typeof RULE_ASPECTS)[number];

export interface LearnerRule {
  outputKey?: string;
  left?: string;
  operator?: string;
  right?: string;
}

/**
 * The graded item / check id for one aspect. `#` separates it from the field key
 * because a field key may legitimately contain a dot (n8n uses dots for nested
 * parameter paths), and `:` already separates the node type.
 */
export function ruleAspectId(nodeType: string, fieldKey: string, aspect: RuleAspect): string {
  return `${nodeType}:${fieldKey}#${aspect}`;
}

/** Split an aspect id back apart. Returns null when it isn't one. */
export function parseRuleAspectId(id: string): { fieldKey: string; aspect: RuleAspect } | null {
  const hash = id.indexOf('#');
  if (hash < 0) return null;
  const aspect = id.slice(hash + 1) as RuleAspect;
  if (!RULE_ASPECTS.includes(aspect)) return null;
  return { fieldKey: id.slice(0, hash), aspect };
}

/** Accept either `{ values: [...] }` (n8n's shape) or a bare array. */
export function asRules(value: unknown): LearnerRule[] {
  if (Array.isArray(value)) return value as LearnerRule[];
  const values = (value as Rec | null)?.values;
  return Array.isArray(values) ? (values as LearnerRule[]) : [];
}

/** An empty rule, for the "Add Routing Rule" button. */
export function emptyRule(): LearnerRule {
  return { outputKey: '', left: '', operator: '', right: '' };
}

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

/** Has the learner filled a rule in enough to submit it? */
export function isRuleComplete(rule: LearnerRule): boolean {
  return Boolean(norm(rule.outputKey) && norm(rule.left) && norm(rule.operator) && norm(rule.right));
}

/** Every rule filled in, and at least one of them. */
export function rulesReady(value: unknown): boolean {
  const rules = asRules(value);
  return rules.length > 0 && rules.every(isRuleComplete);
}

/**
 * Grade one aspect. Pure, and used by BOTH the server check and the client's
 * dev-route fallback — the two must never disagree, which is how the
 * "same answer, different verdict" bug happened.
 *
 * Returns null when the field carries no answer key, which is the normal case in
 * the browser: `toPublicProblem` strips `expect`. Callers must treat null as
 * "cannot judge here", never as wrong.
 */
export function gradeRuleAspect(field: Rec, aspect: RuleAspect, value: unknown): boolean | null {
  const expected = (field.expect as Rec | undefined)?.rules as LearnerRule[] | undefined;
  if (!Array.isArray(expected)) return null;

  const rules = asRules(value);

  if (aspect === 'count') return rules.length === expected.length;

  if (aspect === 'categories') {
    // A SET comparison: with distinct equality conditions the routing behaves the
    // same whichever order the rules sit in, so ordering is not what this item is
    // asking about. Duplicates are still wrong — two branches with one name is
    // not the same as two branches.
    const got = rules.map((r) => norm(r.outputKey)).filter(Boolean).sort();
    const want = expected.map((r) => norm(r.outputKey)).sort();
    return got.length === want.length && got.every((g, i) => g === want[i]);
  }

  // conditions: each EXPECTED branch must exist and test the right thing. Paired
  // by outputKey rather than by position, so a learner who built the right rules
  // in a different order is not marked down twice for the same ordering choice.
  return expected.every((want) => {
    const got = rules.find((r) => norm(r.outputKey) === norm(want.outputKey));
    if (!got) return false;
    return (
      norm(got.left) === norm(want.left) &&
      norm(got.operator) === norm(want.operator) &&
      norm(got.right) === norm(want.right)
    );
  });
}

/** The explanation for one aspect's verdict, if the problem authored one. */
export function whyForAspect(field: Rec, aspect: RuleAspect, correct: boolean): string | undefined {
  const why = (field.why as Rec | undefined)?.[aspect] as Rec | string | undefined;
  if (!why) return undefined;
  if (typeof why === 'string') return why;
  return (correct ? why.correct : why.wrong) as string | undefined;
}

/** Human label for an aspect, for the verdict rows in the NDV. */
export const RULE_ASPECT_LABEL: Record<RuleAspect, string> = {
  count: 'Number of branches',
  categories: 'Branch names',
  conditions: 'What each branch tests',
};
