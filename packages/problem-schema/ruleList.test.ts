import { describe, it, expect } from 'vitest';
import {
  RULE_ASPECTS,
  ruleAspectId,
  parseRuleAspectId,
  asRules,
  isRuleComplete,
  rulesReady,
  gradeRuleAspect,
  gradeListItems,
  whyForAspect,
} from './ruleList.ts';
import { checkAnswer } from './answerCheck.ts';
import { toPublicProblem } from './publicProjection.ts';

const field = {
  key: 'rules',
  label: 'Routing rules',
  kind: 'ruleList',
  expect: {
    rules: [
      { outputKey: 'Bug Report', left: 'category', operator: 'equals', right: 'Bug Report' },
      { outputKey: 'Feature Request', left: 'category', operator: 'equals', right: 'Feature Request' },
    ],
  },
  why: {
    count: { correct: 'Two branches, two categories.', wrong: 'Count the categories the flow has to handle.' },
    categories: { correct: 'Right names.', wrong: 'These names are what appear on the canvas.' },
    conditions: { correct: 'Each branch tests the label the AI assigned.', wrong: 'Look at what the AI actually produces.' },
  },
};

const right = {
  values: [
    { outputKey: 'Bug Report', left: 'category', operator: 'equals', right: 'Bug Report' },
    { outputKey: 'Feature Request', left: 'category', operator: 'equals', right: 'Feature Request' },
  ],
};

describe('ids', () => {
  it('round-trips an aspect id', () => {
    const id = ruleAspectId('switch', 'rules', 'count');
    expect(id).toBe('switch:rules#count');
    // The check route splits on the FIRST colon, so the aspect travels with the key.
    expect(parseRuleAspectId('rules#count')).toEqual({ fieldKey: 'rules', aspect: 'count' });
  });

  it('rejects a plain field key', () => {
    expect(parseRuleAspectId('rules')).toBe(null);
  });

  it('rejects an unknown aspect, so a forged id cannot earn credit', () => {
    expect(parseRuleAspectId('rules#everything')).toBe(null);
  });
});

describe('reading the value', () => {
  it('accepts n8n’s { values: [...] } shape and a bare array', () => {
    expect(asRules(right)).toHaveLength(2);
    expect(asRules(right.values)).toHaveLength(2);
    expect(asRules(null)).toEqual([]);
    expect(asRules({})).toEqual([]);
  });

  it('knows when a rule is still half-filled', () => {
    expect(isRuleComplete({ outputKey: 'A', left: 'category', operator: 'equals', right: 'A' })).toBe(true);
    expect(isRuleComplete({ outputKey: 'A', left: '', operator: 'equals', right: 'A' })).toBe(false);
  });

  it('is not ready with zero rules, or with an incomplete one', () => {
    expect(rulesReady({ values: [] })).toBe(false);
    expect(rulesReady({ values: [{ outputKey: 'A' }] })).toBe(false);
    expect(rulesReady(right)).toBe(true);
  });
});

describe('grading — count', () => {
  it('passes on the right number', () => {
    expect(gradeRuleAspect(field, 'count', right)).toBe(true);
  });
  it('fails on too few and too many', () => {
    expect(gradeRuleAspect(field, 'count', { values: right.values.slice(0, 1) })).toBe(false);
    expect(gradeRuleAspect(field, 'count', { values: [...right.values, { outputKey: 'Extra', left: 'category', operator: 'equals', right: 'Extra' }] })).toBe(false);
  });
});

describe('grading — categories', () => {
  it('ignores order, because equality conditions route the same either way', () => {
    expect(gradeRuleAspect(field, 'categories', { values: [...right.values].reverse() })).toBe(true);
  });

  it('is case- and whitespace-insensitive', () => {
    expect(gradeRuleAspect(field, 'categories', {
      values: [{ outputKey: ' bug report ' }, { outputKey: 'FEATURE REQUEST' }],
    })).toBe(true);
  });

  it('rejects a duplicate standing in for a missing branch', () => {
    expect(gradeRuleAspect(field, 'categories', {
      values: [{ outputKey: 'Bug Report' }, { outputKey: 'Bug Report' }],
    })).toBe(false);
  });

  it('rejects a wrong name', () => {
    expect(gradeRuleAspect(field, 'categories', {
      values: [{ outputKey: 'Bug Report' }, { outputKey: 'Complaint' }],
    })).toBe(false);
  });
});

describe('grading — conditions', () => {
  it('pairs by branch name, not position', () => {
    expect(gradeRuleAspect(field, 'conditions', { values: [...right.values].reverse() })).toBe(true);
  });

  it('fails when a branch tests the wrong field', () => {
    const wrong = { values: [{ ...right.values[0], left: 'urgency' }, right.values[1]] };
    expect(gradeRuleAspect(field, 'conditions', wrong)).toBe(false);
  });

  it('fails when a branch uses the wrong operator', () => {
    const wrong = { values: [{ ...right.values[0], operator: 'contains' }, right.values[1]] };
    expect(gradeRuleAspect(field, 'conditions', wrong)).toBe(false);
  });

  it('fails when a required branch is missing entirely', () => {
    expect(gradeRuleAspect(field, 'conditions', { values: [right.values[0]] })).toBe(false);
  });
});

// The browser never has `expect` — it is stripped at the API boundary. So the
// client's fallback must say "cannot judge", never guess. Guessing WRONG made
// right answers red; guessing CORRECT turned every option green.
describe('grading with no answer key', () => {
  it('returns null rather than a verdict', () => {
    const served = { key: 'rules', kind: 'ruleList' };
    for (const aspect of RULE_ASPECTS) {
      expect(gradeRuleAspect(served, aspect, right)).toBe(null);
    }
  });
});

describe('explanations', () => {
  it('gives the right side of the why per aspect', () => {
    expect(whyForAspect(field, 'count', true)).toMatch(/Two branches/);
    expect(whyForAspect(field, 'count', false)).toMatch(/Count the categories/);
  });

  it('tolerates a field with no why authored', () => {
    expect(whyForAspect({ key: 'rules' }, 'count', true)).toBeUndefined();
  });
});

describe('through the check endpoint', () => {
  const problem = { nodeSetup: { switch: { fields: [field] } } };
  const check = (id: string, answer: unknown) =>
    checkAnswer(problem as never, { kind: 'field', id, answer });

  it('grades each aspect independently', () => {
    expect(check('switch:rules#count', right).correct).toBe(true);
    expect(check('switch:rules#categories', right).correct).toBe(true);
    expect(check('switch:rules#conditions', right).correct).toBe(true);
  });

  it('can pass count while failing conditions — the point of splitting them', () => {
    const twoRulesWrongTests = {
      values: [
        { outputKey: 'Bug Report', left: 'urgency', operator: 'equals', right: 'Bug Report' },
        { outputKey: 'Feature Request', left: 'urgency', operator: 'equals', right: 'Feature Request' },
      ],
    };
    expect(check('switch:rules#count', twoRulesWrongTests).correct).toBe(true);
    expect(check('switch:rules#categories', twoRulesWrongTests).correct).toBe(true);
    expect(check('switch:rules#conditions', twoRulesWrongTests).correct).toBe(false);
  });

  it('returns the authored explanation for the verdict given', () => {
    expect(check('switch:rules#conditions', right).why).toMatch(/the label the AI assigned/);
  });

  it('flags an unknown field as suspicious rather than wrong', () => {
    expect(check('switch:nonsense#count', right).unknown).toBe(true);
  });
});

describe('per-entry attribution', () => {
  const twoWrongNames = {
    values: [
      { outputKey: 'Bug Report', left: 'category', operator: 'equals', right: 'Bug Report' },
      { outputKey: 'Complaints', left: 'category', operator: 'equals', right: 'Complaints' },
    ],
  };

  it('says WHICH row has the wrong name', () => {
    expect(gradeListItems(field, 'categories', twoWrongNames)).toEqual({ items: [true, false], missing: 1 });
  });

  it('says WHICH row tests the wrong thing', () => {
    const oneBadCondition = {
      values: [
        { outputKey: 'Bug Report', left: 'category', operator: 'equals', right: 'Bug Report' },
        { outputKey: 'Feature Request', left: 'urgency', operator: 'equals', right: 'Feature Request' },
      ],
    };
    expect(gradeListItems(field, 'conditions', oneBadCondition)).toEqual({ items: [true, false], missing: 0 });
  });

  it('agrees with the scored aspect — a row-level fail means the aspect failed', () => {
    for (const aspect of ['categories', 'conditions']) {
      const { items } = gradeListItems(field, aspect, twoWrongNames);
      expect(items?.every(Boolean) ?? null).toBe(gradeRuleAspect(field, aspect, twoWrongNames) === true);
    }
  });

  it('blames the REPEAT for a duplicate, not the first of the pair', () => {
    const dupe = {
      values: [
        { outputKey: 'Bug Report', left: 'category', operator: 'equals', right: 'Bug Report' },
        { outputKey: 'Bug Report', left: 'category', operator: 'equals', right: 'Bug Report' },
      ],
    };
    expect(gradeListItems(field, 'categories', dupe).items).toEqual([true, false]);
  });

  it('counts what is missing without naming it — that would be the answer', () => {
    const onlyOne = { values: [{ outputKey: 'Bug Report', left: 'category', operator: 'equals', right: 'Bug Report' }] };
    const out = gradeListItems(field, 'categories', onlyOne);
    expect(out).toEqual({ items: [true], missing: 1 });
    expect(JSON.stringify(out)).not.toMatch(/Feature Request/);
  });

  it('has nothing to attribute for count, which belongs to the list', () => {
    expect(gradeListItems(field, 'count', twoWrongNames)).toEqual({ items: null, missing: 0 });
  });

  it('cannot judge in the browser, where the answer key has been stripped', () => {
    const { expect: _dropped, ...served } = field;
    expect(gradeListItems(served, 'categories', twoWrongNames)).toEqual({ items: null, missing: 0 });
  });

  it('reaches the client through the check response', () => {
    const problem = { nodeSetup: { switch: { fields: [field] } } };
    const res = checkAnswer(problem as never, { kind: 'field', id: 'switch:rules#categories', answer: twoWrongNames });
    expect(res.correct).toBe(false);
    expect(res.items).toEqual([true, false]);
    expect(res.missing).toBe(1);
  });

  it('sends no per-row detail for an ordinary field', () => {
    const problem = { nodeSetup: { switch: { fields: [{ key: 'mode', options: [{ value: 'a', correct: true }] }] } } };
    const res = checkAnswer(problem as never, { kind: 'field', id: 'switch:mode', answer: 'a' });
    expect(res.items).toBeUndefined();
  });
});

describe('the answer key does not reach the browser', () => {
  it('strips expect and why from a ruleList field', () => {
    const pub = toPublicProblem({ nodeSetup: { switch: { fields: [field] } } } as never) as never;
    const served = (pub as any).nodeSetup.switch.fields[0];
    expect(served.expect).toBeUndefined();
    expect(served.why).toBeUndefined();
    // ...but the vocabulary needed to RENDER the control survives.
    expect(served.kind).toBe('ruleList');
    expect(served.label).toBe('Routing rules');
  });
});
