import { describe, it, expect } from 'vitest';
import { isCorrectValue, expressionFor, whyForField } from './FieldControl.jsx';
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
