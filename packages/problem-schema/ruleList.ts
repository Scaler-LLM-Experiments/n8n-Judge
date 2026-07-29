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

// ---------------------------------------------------------------------------
// Two kinds of structured list, one algorithm.
// ---------------------------------------------------------------------------
// n8n has several repeatable-group parameters and they differ only in what each
// entry holds:
//
//   ruleList        (Switch `rules`)      outputKey + a condition
//   assignmentList  (Edit Fields `fields`) name + value
//
// Grading is the same question three times over in both cases — how many, which
// keys, and is each key's detail right — so the comparison lives once here and
// each kind supplies only its field names and its wording. Aspect NAMES stay
// per-kind because they end up in the report, and "Branch names" and "Field
// names" are not the same sentence.

interface ListSpec {
  /** Where the entries live in the stored value, mirroring n8n. */
  itemsKey: string;
  /** Where the authored answer lives under `expect`. */
  expectKey: string;
  /** The property that identifies an entry. */
  keyOf: string;
  /** The properties that make up an entry's detail. */
  detailOf: string[];
  /** Scored aspects, in the order shown. */
  aspects: readonly string[];
  labels: Record<string, string>;
}

export const LIST_SPECS: Record<string, ListSpec> = {
  ruleList: {
    itemsKey: 'values',
    expectKey: 'rules',
    keyOf: 'outputKey',
    detailOf: ['left', 'operator', 'right'],
    aspects: ['count', 'categories', 'conditions'],
    labels: {
      count: 'Number of branches',
      categories: 'Branch names',
      conditions: 'What each branch tests',
    },
  },
  assignmentList: {
    itemsKey: 'assignments',
    expectKey: 'assignments',
    keyOf: 'name',
    detailOf: ['value'],
    aspects: ['count', 'names', 'values'],
    labels: {
      count: 'Number of fields',
      names: 'Field names',
      values: 'Where each value comes from',
    },
  },
};

/** Is this field kind a structured list? */
export function isListKind(kind: unknown): boolean {
  return typeof kind === 'string' && kind in LIST_SPECS;
}

/** The scored aspects for a field kind. */
export function aspectsFor(kind: string): readonly string[] {
  return LIST_SPECS[kind]?.aspects ?? [];
}

/** Human label for one aspect of one kind — used in the NDV and the report. */
export function aspectLabel(kind: string, aspect: string): string {
  return LIST_SPECS[kind]?.labels[aspect] ?? aspect;
}

/** Back-compat: the rule list's aspects, which most callers still want by name. */
export const RULE_ASPECTS = LIST_SPECS.ruleList.aspects;
export const RULE_ASPECT_LABEL = LIST_SPECS.ruleList.labels;

export interface LearnerRule {
  outputKey?: string;
  left?: string;
  operator?: string;
  right?: string;
}

export interface LearnerAssignment {
  name?: string;
  value?: string;
}

/**
 * The graded item / check id for one aspect. `#` separates it from the field key
 * because a field key may legitimately contain a dot (n8n uses dots for nested
 * parameter paths), and `:` already separates the node type.
 */
export function ruleAspectId(nodeType: string, fieldKey: string, aspect: string): string {
  return `${nodeType}:${fieldKey}#${aspect}`;
}

/**
 * Split an aspect id back apart. Returns null when it isn't one, so a forged or
 * misspelled aspect records as suspicious rather than earning credit.
 *
 * The aspect is validated against EVERY kind's list, because the id alone does
 * not say which kind of field it belongs to — the caller looks the field up and
 * grades against that field's own spec.
 */
export function parseRuleAspectId(id: string): { fieldKey: string; aspect: string } | null {
  const hash = id.indexOf('#');
  if (hash < 0) return null;
  const aspect = id.slice(hash + 1);
  const known = Object.values(LIST_SPECS).some((spec) => spec.aspects.includes(aspect));
  if (!known) return null;
  return { fieldKey: id.slice(0, hash), aspect };
}

/** Read the entries out of a stored value, tolerating a bare array. */
export function asListItems(kind: string, value: unknown): Rec[] {
  if (Array.isArray(value)) return value as Rec[];
  const key = LIST_SPECS[kind]?.itemsKey;
  if (!key) return [];
  const items = (value as Rec | null)?.[key];
  return Array.isArray(items) ? (items as Rec[]) : [];
}

/** Back-compat helper for rule lists specifically. */
export function asRules(value: unknown): LearnerRule[] {
  return asListItems('ruleList', value) as LearnerRule[];
}

/** An empty entry, for the "Add …" button. */
export function emptyListItem(kind: string): Rec {
  const spec = LIST_SPECS[kind];
  if (!spec) return {};
  const out: Rec = { [spec.keyOf]: '' };
  for (const d of spec.detailOf) out[d] = '';
  return out;
}

/** Back-compat: an empty rule. */
export function emptyRule(): LearnerRule {
  return emptyListItem('ruleList') as LearnerRule;
}

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

/** Has the learner filled an entry in enough to submit it? */
export function isListItemComplete(kind: string, item: Rec): boolean {
  const spec = LIST_SPECS[kind];
  if (!spec) return false;
  return [spec.keyOf, ...spec.detailOf].every((k) => norm(item[k]));
}

export function isRuleComplete(rule: LearnerRule): boolean {
  return isListItemComplete('ruleList', rule as Rec);
}

/** Every entry filled in, and at least one of them. */
export function listReady(kind: string, value: unknown): boolean {
  const items = asListItems(kind, value);
  return items.length > 0 && items.every((i) => isListItemComplete(kind, i));
}

export function rulesReady(value: unknown): boolean {
  return listReady('ruleList', value);
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
export function gradeListAspect(field: Rec, aspect: string, value: unknown): boolean | null {
  const kind = String(field.kind ?? '');
  const spec = LIST_SPECS[kind];
  if (!spec) return null;
  const expected = (field.expect as Rec | undefined)?.[spec.expectKey] as Rec[] | undefined;
  if (!Array.isArray(expected)) return null;

  const items = asListItems(kind, value);
  const [countA, keysA] = spec.aspects;

  if (aspect === countA) return items.length === expected.length;

  if (aspect === keysA) {
    // A SET comparison. With distinct keys the behaviour is the same whichever
    // order the entries sit in, so ordering is not what this item asks about.
    // Duplicates still fail — two entries with one name is not two entries.
    const got = items.map((i) => norm(i[spec.keyOf])).filter(Boolean).sort();
    const want = expected.map((i) => norm(i[spec.keyOf])).sort();
    return got.length === want.length && got.every((g, idx) => g === want[idx]);
  }

  // Detail: each EXPECTED entry must exist and match. Paired by key rather than
  // by position, so someone who built the right entries in a different order is
  // not marked down twice for one ordering choice.
  return expected.every((want) => {
    const got = items.find((i) => norm(i[spec.keyOf]) === norm(want[spec.keyOf]));
    if (!got) return false;
    return spec.detailOf.every((d) => norm(got[d]) === norm(want[d]));
  });
}

/** Back-compat alias. */
export function gradeRuleAspect(field: Rec, aspect: string, value: unknown): boolean | null {
  return gradeListAspect(field, aspect, value);
}

/** The explanation for one aspect's verdict, if the problem authored one. */
export function whyForAspect(field: Rec, aspect: string, correct: boolean): string | undefined {
  const why = (field.why as Rec | undefined)?.[aspect] as Rec | string | undefined;
  if (!why) return undefined;
  if (typeof why === 'string') return why;
  return (correct ? why.correct : why.wrong) as string | undefined;
}

export type RuleAspect = string;
