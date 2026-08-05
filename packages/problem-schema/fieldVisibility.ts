// Which parameter fields are currently shown.
//
// Real n8n nodes reveal and hide parameters as you configure them, via
// `displayOptions.show` on each property. `showWhen` is the same idea in the
// same shape: a map of other-field-key → accepted values. Every named key must
// match (AND); a key matches if the current value is one of its listed values
// (OR).
//
// This is not cosmetic. It carries a grading rule that n8n states explicitly in
// `getParameterIssues` (node-helpers.ts:1532): a required parameter only counts
// as missing IF IT IS CURRENTLY DISPLAYED. Without that rule, any form with
// conditional fields could never be completed. So:
//
//   - "Verify setup" must only require the fields a learner can actually see.
//   - The rubric must not score a hidden field against them (rubric.ts).
//   - A field that becomes hidden must have its value dropped, because n8n
//     stores only displayed parameters — leaving it behind would submit an
//     answer to a question no longer being asked.
//
// See docs/n8n-reference/00-how-n8n-actually-works.md §4–§5.

type Values = Record<string, unknown>;
type ConditionalValue = string | number | boolean;
type Condition = ConditionalValue[] | { not?: unknown; notIn?: unknown[] };

export interface ConditionalField {
  key: string;
  showWhen?: Record<string, Condition>;
  hideWhen?: Record<string, Condition>;
}

/** Loose equality, so authored `true` matches a checkbox's `true` and `3` matches `'3'`. */
function same(actual: unknown, accepted: unknown): boolean {
  return accepted === actual || String(accepted) === String(actual ?? '');
}

function matches(actual: unknown, accepted: Condition): boolean {
  if (!Array.isArray(accepted)) {
    if ('not' in accepted) return !same(actual, accepted.not);
    if (accepted.notIn) return !accepted.notIn.some((value) => same(actual, value));
    return false;
  }
  const actualValues = Array.isArray(actual) ? actual : [actual];
  return actualValues.some((value) => accepted.some((candidate) => same(value, candidate)));
}

/** Is this field displayed, given the values chosen so far? */
export function isFieldVisible(field: ConditionalField, values: Values = {}): boolean {
  const shown = !field.showWhen || Object.entries(field.showWhen).every(([key, accepted]) => matches(values[key], accepted));
  const hidden = field.hideWhen && Object.entries(field.hideWhen).every(([key, accepted]) => matches(values[key], accepted));
  return shown && !hidden;
}

/** The subset of `fields` currently displayed — the only ones setup may demand. */
export function visibleFields<T extends ConditionalField>(fields: T[], values: Values = {}): T[] {
  return (fields ?? []).filter((f) => isFieldVisible(f, values));
}

/**
 * Drop values (and any cached per-field state) for fields that are no longer
 * shown. Returns a new object; never mutates.
 *
 * Applied after every change, because hiding a field mid-edit must also retract
 * the answer it held — otherwise a learner who switched away from a branch still
 * submits the follow-up they filled in for the branch they abandoned.
 */
export function pruneHidden<V extends Values>(fields: ConditionalField[], values: V): V {
  let changed = false;
  const out: Values = { ...values };
  for (const f of fields ?? []) {
    if ((f.showWhen || f.hideWhen) && !isFieldVisible(f, values) && f.key in out) {
      delete out[f.key];
      changed = true;
    }
  }
  return (changed ? out : values) as V;
}
