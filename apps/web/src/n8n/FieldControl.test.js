import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FieldControl, isCorrectValue, expressionFor, whyForField, resourceValue, emptyResource, fieldIsVisible, initialFixedCollectionRow, pruneInvisibleValues, visibilityValuesForFields } from './FieldControl.jsx';
import { toPublicProblem } from '@judge/problem-schema';
import { problems } from '@judge/problems';

// Every parameter used to be a 3-option dropdown, so grading was just
// "option.correct". With typed fields the comparison is per-kind, and getting
// it wrong marks a right answer wrong — the worst failure a grading tool has.

describe('select (the original kind)', () => {
  const f = { options: [{ value: 'a', correct: false }, { value: 'b', correct: true }] };
  it('matches the flagged option', () => {
    expect(isCorrectValue(f, 'b')).toBe(true);
    expect(isCorrectValue(f, 'a')).toBe(false);
    expect(isCorrectValue(f, undefined)).toBe(false);
  });
});

describe('boolean', () => {
  it('treats a correct answer of false as a real answer, not an empty one', () => {
    const f = { kind: 'boolean', correct: false };
    expect(isCorrectValue(f, false)).toBe(true);
    expect(isCorrectValue(f, true)).toBe(false);
    // undefined is "never touched" — Boolean(undefined) is false, and that
    // coincidentally matches. Documented rather than pretended away: the NDV
    // gates on hasValue() so an untouched toggle can't be submitted.
    expect(isCorrectValue(f, undefined)).toBe(true);
  });
});

describe('number', () => {
  const f = { kind: 'number', correct: 0 };
  it('accepts 0 and compares numerically, not as a string', () => {
    expect(isCorrectValue(f, 0)).toBe(true);
    expect(isCorrectValue(f, '0')).toBe(true);
    expect(isCorrectValue(f, 0.7)).toBe(false);
  });
});

describe('expression', () => {
  const f = { kind: 'expression', correct: '{{ $json.body }}' };

  it('ignores brace spacing — the same answer typed two ways', () => {
    expect(isCorrectValue(f, '{{ $json.body }}')).toBe(true);
    expect(isCorrectValue(f, '{{$json.body}}')).toBe(true);
    expect(isCorrectValue(f, '  {{  $json.body  }}  ')).toBe(true);
  });

  it('still rejects the wrong field, and rejects a hardcoded value', () => {
    expect(isCorrectValue(f, '{{ $json.subject }}')).toBe(false);
    // Hardcoding instead of referencing is a top-listed n8n misconception —
    // it must not pass.
    expect(isCorrectValue(f, 'This is the third time I am writing.')).toBe(false);
  });

  it('accepts any of several valid phrasings when `accepts` is given', () => {
    const g = { kind: 'expression', correct: '{{ $json.body }}', accepts: ['{{ $json.body }}', '{{ $json["body"] }}'] };
    expect(isCorrectValue(g, '{{ $json["body"] }}')).toBe(true);
    expect(isCorrectValue(g, '{{ $json.nope }}')).toBe(false);
  });
});

describe('text', () => {
  it('trims but is otherwise exact', () => {
    const f = { kind: 'text', correct: 'INBOX' };
    expect(isCorrectValue(f, '  INBOX ')).toBe(true);
    expect(isCorrectValue(f, 'inbox')).toBe(false);
  });
});

describe('expressionFor', () => {
  it('writes what n8n writes when you drag a field in', () => {
    expect(expressionFor('body')).toBe('{{ $json.body }}');
  });

  // A form trigger's keys ARE the questions the form asked, so spaces and
  // punctuation are the norm, not the edge case. Dot notation there is invalid
  // in real n8n and never matches the authored answer — which left the learner
  // stuck on a field whose only discoverable control wrote a wrong value.
  it('brackets any key that is not a plain identifier', () => {
    expect(expressionFor('What do you need?')).toBe('{{ $json["What do you need?"] }}');
    expect(expressionFor('Your name')).toBe('{{ $json["Your name"] }}');
    expect(expressionFor('request-type')).toBe('{{ $json["request-type"] }}');
    expect(expressionFor('2ndChoice')).toBe('{{ $json["2ndChoice"] }}');
  });

  it('keeps dot notation for keys that are valid identifiers', () => {
    for (const key of ['request_type', '$node', '_private', 'subjectEmail']) {
      expect(expressionFor(key)).toBe(`{{ $json.${key} }}`);
    }
  });
});

// The bug: the same answer graded correct sometimes and wrong other times, with
// Iris appearing and then having nothing to say.
//
// Root cause: the browser does not receive `correct`, `why`, `accepts`,
// `whyCorrect` or `whyWrong` — toPublicProblem strips all of them at the API
// boundary. So whenever the server check is unavailable and the NDV falls back
// to local grading, it grades against data with no answers in it, concludes
// "wrong", and has no explanation to show. It must report that it CANNOT judge,
// which is a different thing from judging the answer wrong.
describe('grading a problem as the browser actually receives it', () => {
  const publicProblem = toPublicProblem(problems['email-triage']);
  const selectField = publicProblem.nodeSetup.classify.fields.find((f) => f.key === 'output');
  const exprField = publicProblem.nodeSetup.classify.fields.find((f) => f.key === 'text');

  it('never calls the correct answer wrong', () => {
    // 'json' is the right answer to "How should it return the answer?"
    expect(isCorrectValue(selectField, 'json')).not.toBe(false);
  });

  it('reports "cannot determine" for a select whose correctness was stripped', () => {
    expect(isCorrectValue(selectField, 'json')).toBe(null);
    expect(isCorrectValue(selectField, 'word')).toBe(null);
  });

  it('reports "cannot determine" for a typed field too', () => {
    expect(isCorrectValue(exprField, '{{ $json.body }}')).toBe(null);
  });

  it('still grades normally when the answers ARE present (server-side data)', () => {
    const authored = problems['email-triage'].nodeSetup.classify.fields.find((f) => f.key === 'output');
    expect(isCorrectValue(authored, 'json')).toBe(true);
    expect(isCorrectValue(authored, 'word')).toBe(false);
  });

  it('has no explanation to offer — this is the empty Iris bubble in the report', () => {
    expect(whyForField(selectField, 'word', 'wrong')).toBeUndefined();
  });
});

// resourceLocator — n8n's "which record?" control. The stored value is
// `{ __rl: true, mode, value }`: the resource PLUS how it was chosen.
describe('resourceLocator', () => {
  const field = {
    key: 'mailbox',
    label: 'Mailbox',
    kind: 'resourceLocator',
    modes: ['list', 'id'],
    correct: 'INBOX',
    options: [{ value: 'INBOX', label: 'Inbox' }, { value: 'SPAM', label: 'Spam' }],
  };

  it('unwraps the value', () => {
    expect(resourceValue({ __rl: true, mode: 'list', value: 'INBOX' })).toBe('INBOX');
  });

  it('passes a plain value straight through', () => {
    expect(resourceValue('INBOX')).toBe('INBOX');
    expect(resourceValue(undefined)).toBe(undefined);
  });

  // The MODE is not graded. Picking the inbox off a list and pasting its ID are
  // the same answer; marking one wrong would test picker familiarity, not
  // understanding.
  it('grades the resource, not the route to it', () => {
    expect(isCorrectValue(field, { __rl: true, mode: 'list', value: 'INBOX' })).toBe(true);
    expect(isCorrectValue(field, { __rl: true, mode: 'id', value: 'INBOX' })).toBe(true);
  });

  it('marks the wrong resource wrong whatever the mode', () => {
    expect(isCorrectValue(field, { __rl: true, mode: 'list', value: 'SPAM' })).toBe(false);
    expect(isCorrectValue(field, { __rl: true, mode: 'id', value: 'SPAM' })).toBe(false);
  });

  it('treats an untouched locator as not-yet-answered, not wrong', () => {
    const empty = emptyResource(field);
    expect(empty).toEqual({ __rl: true, mode: 'list', value: '' });
    expect(isCorrectValue(field, empty)).toBe(false);
  });

  it('accepts alternatives via `accepts`', () => {
    const f = { ...field, correct: undefined, accepts: ['INBOX', 'Inbox'] };
    expect(isCorrectValue(f, { __rl: true, mode: 'id', value: 'Inbox' })).toBe(true);
  });

  // The browser holds no answer key for a served problem, so it must say "cannot
  // judge" rather than guessing wrong — the bug that made right answers red.
  it('returns null when the answer key was stripped', () => {
    const served = { key: 'mailbox', kind: 'resourceLocator', modes: ['list'], options: [{ value: 'INBOX', label: 'Inbox' }] };
    expect(isCorrectValue(served, { __rl: true, mode: 'list', value: 'INBOX' })).toBe(null);
  });
});

describe('optional fixed-collection attributes', () => {
  it('starts with required fields and exposes optional attributes on demand', () => {
    expect(initialFixedCollectionRow({
      hideOptionalFields: true,
      fields: [
        { key: 'type', value: 'text', required: true },
        { key: 'label', value: '', showEvenWhenOptional: true },
        { key: 'placeholder', value: '' },
      ],
    })).toEqual({ type: 'text', label: '' });
  });
});

describe('conditional collection fields', () => {
  it('supports n8n substring conditions against resource locators', () => {
    const field = { showWhen: { model: { includes: 'imagen' } } };
    expect(fieldIsVisible(field, { model: { __rl: true, mode: 'list', value: 'models/imagen-4' } })).toBe(true);
    expect(fieldIsVisible(field, { model: { __rl: true, mode: 'list', value: 'models/gemini-flash' } })).toBe(false);
  });

  it('supports hide conditions inside collections', () => {
    expect(fieldIsVisible({ hideWhen: { mode: ['hidden'] } }, { mode: 'shown' })).toBe(true);
    expect(fieldIsVisible({ hideWhen: { mode: ['hidden'] } }, { mode: 'hidden' })).toBe(false);
  });

  it('supports n8n exists conditions inside collections', () => {
    const field = { showWhen: { queryParameters: { exists: true } } };
    expect(fieldIsVisible(field, {})).toBe(false);
    expect(fieldIsVisible(field, { queryParameters: '' })).toBe(true);
  });

  it('matches multi-option selections and negative conditions', () => {
    expect(fieldIsVisible({ showWhen: { trigger: ['message'] } }, { trigger: ['reaction_added', 'message'] })).toBe(true);
    expect(fieldIsVisible({ showWhen: { watchAll: { not: true } } }, {})).toBe(true);
    expect(fieldIsVisible({ showWhen: { watchAll: { not: true } } }, { watchAll: true })).toBe(false);
  });

  it('resolves conditions through a sibling collection value', () => {
    const field = { showWhen: { 'columns.mappingMode': ['autoMapInputData'] } };
    expect(fieldIsVisible(field, { columns: { mappingMode: 'autoMapInputData' } })).toBe(true);
    expect(fieldIsVisible(field, { columns: { mappingMode: 'defineBelow' } })).toBe(false);
  });

  it('aliases the visible duplicate source field for dependent conditions', () => {
    const fields = [
      { key: 'condition', n8nKey: 'condition', showWhen: { type: ['checkbox'] } },
      { key: 'condition2', n8nKey: 'condition', showWhen: { type: ['text'] } },
    ];
    const scoped = visibilityValuesForFields(fields, {
      type: 'text', condition: 'equals', condition2: 'is_empty',
    });
    expect(scoped.condition).toBe('is_empty');
    expect(fieldIsVisible({ hideWhen: { condition: ['is_empty'] } }, scoped)).toBe(false);
  });

  it('drops a dependent collection value when its discriminator hides it', () => {
    const fields = [
      { key: 'mode' },
      { key: 'query', showWhen: { mode: ['search'] } },
    ];
    expect(pruneInvisibleValues(fields, { mode: 'list', query: 'stale' })).toEqual({ mode: 'list' });
  });
});

describe('locked controls', () => {
  const markup = (field, value, options = field.options ?? []) => renderToStaticMarkup(FieldControl({
    field,
    value,
    border: '#ddd',
    bg: '#fff',
    onChange: () => {},
    shuffledOptions: options,
  }));

  it('disables multi-select and both resource-locator selectors', () => {
    expect(markup({ key: 'events', label: 'Events', kind: 'multiSelect', locked: true }, [])).toContain('disabled=""');
    expect(markup({ key: 'sheet', label: 'Sheet', kind: 'resourceLocator', modes: ['list'], locked: true }, { __rl: true, mode: 'list', value: '' }).match(/<select[^>]*disabled=""/g)).toHaveLength(2);
  });

  it('makes locked text fields read-only', () => {
    expect(markup({ key: 'query', label: 'Query', kind: 'text', locked: true }, 'SELECT 1')).toContain('readOnly=""');
    expect(markup({ key: 'enabled', label: 'Enabled', kind: 'boolean', locked: true }, true)).toContain('aria-disabled="true"');
  });
});
