import { describe, it, expect } from 'vitest';
import {
  PLAIN_LANGUAGE,
  sentencesOf,
  wordsOf,
  longSentences,
  dashIssues,
  statementIssues,
  optionLabelIssues,
  capWords,
} from './plainLanguage.js';

describe('sentence splitting survives this domain', () => {
  it('does not split inside a time, a decimal or an abbreviation', () => {
    // Every one of these appears in a shipped case, and a naive split on "." reports
    // a 3-word sentence and lets a 40-word one through.
    expect(sentencesOf('It fires at 9:00 a.m. every day. He reads it later.')).toEqual([
      'It fires at 9:00 a.m. every day.',
      'He reads it later.',
    ]);
    expect(sentencesOf('The level is 12.97 today. Nothing else changed.')).toHaveLength(2);
  });

  it('counts words without counting whitespace', () => {
    expect(wordsOf('  one   two three ')).toBe(3);
    expect(wordsOf('')).toBe(0);
  });
});

describe('long sentences are reported', () => {
  const long =
    'This one sentence keeps going and going because it adds another clause every time it might have stopped, ' +
    'and then another, until nobody reading it can say what it was about in the first place at all.';

  it('flags a sentence past the ASD-STE100 descriptive limit', () => {
    const issues = longSentences('statement', long);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toMatch(/word sentence/);
    expect(issues[0].message).toMatch(String(PLAIN_LANGUAGE.MAX_SENTENCE_WORDS));
  });

  it('leaves a short sentence alone', () => {
    expect(longSentences('statement', 'The clock starts it. Nobody has to remember.')).toEqual([]);
  });

  it('skips a sentence carrying an expression or a URL', () => {
    // These are one token to a reader however long they are, and the option-label cap
    // is what governs them. Splitting them would make the copy worse, not better.
    const withExpr =
      'Set it to {{ $json.current.temperature_2m }} degrees plus a note that says what the day needs and what he should carry with him today.';
    const withUrl =
      'Call https://api.open-meteo.com/v1/forecast?latitude=12.97&longitude=77.59&current=temperature_2m and read the number back off the response body.';
    expect(longSentences('x', withExpr)).toEqual([]);
    expect(longSentences('x', withUrl)).toEqual([]);
  });
});

describe('dashes are banned outright, not rationed', () => {
  it('flags a single em dash', () => {
    // One dash is where a sentence goes to avoid ending. There is always a full stop
    // available, and a dash does not read aloud, so spoken and written copy agree.
    expect(dashIssues('statement', 'He checks the sky — it tells him nothing.')).toHaveLength(1);
  });

  it('flags an en dash and a typed double hyphen', () => {
    expect(dashIssues('x', 'codes 61–65 are rain')).toHaveLength(1);
    expect(dashIssues('x', 'he leaves -- usually late')).toHaveLength(1);
  });

  it('passes copy that uses full stops instead', () => {
    expect(dashIssues('x', 'He checks the sky. It tells him nothing.')).toEqual([]);
  });

  it('does not flag a hyphenated word or a negative number', () => {
    expect(dashIssues('x', 'a well-known low-stock report at -3 degrees')).toEqual([]);
  });

  it('is applied by statementIssues', () => {
    expect(statementIssues('He left — late. Again.').some((i) => /dash/.test(i.message))).toBe(true);
  });
});

describe('statement rules', () => {
  const sentence = (n: number) => `${Array.from({ length: n - 1 }, () => 'word').join(' ')} end.`;

  it('accepts a short, plain statement', () => {
    expect(statementIssues('A clock starts it. It asks for the weather. It posts one line.')).toEqual([]);
  });

  it('flags a statement past the word cap', () => {
    const tooLong = Array.from({ length: 20 }, () => sentence(9)).join(' ');
    expect(statementIssues(tooLong).some((i) => /keep it under 150/i.test(i.message))).toBe(true);
  });

  it('flags too many sentences even when each is short', () => {
    // The failure mode is not one long sentence. It is fifteen short ones, which is
    // what the 270-word case actually was.
    const many = Array.from({ length: PLAIN_LANGUAGE.MAX_STATEMENT_SENTENCES + 3 }, () => 'It does a thing.').join(' ');
    expect(statementIssues(many).some((i) => /sentences\. Keep it to/.test(i.message))).toBe(true);
  });
});

describe('every surface has a cap, set from the hand-written case', () => {
  const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');

  it('passes the hand-written case measurements on every surface', () => {
    // These are email-triage's real numbers, the only case a human wrote. If a cap ever
    // stops admitting them, the cap moved away from the reference rather than the copy
    // moving toward it.
    expect(capWords('q', words(18), PLAIN_LANGUAGE.MAX_QUESTION_WORDS, 'a question')).toEqual([]);
    expect(capWords('a', words(22), PLAIN_LANGUAGE.MAX_ANSWER_WORDS, 'an answer')).toEqual([]);
    expect(capWords('e', words(52), PLAIN_LANGUAGE.MAX_EXPLANATION_WORDS, 'an explanation')).toEqual([]);
    expect(capWords('r', words(34), PLAIN_LANGUAGE.MAX_RESPONSE_WORDS, 'a response')).toEqual([]);
  });

  it('rejects the worst agent-authored measurements on every surface', () => {
    // And these are weather-commute-ping's, before this work.
    expect(capWords('q', words(64), PLAIN_LANGUAGE.MAX_QUESTION_WORDS, 'a question')).toHaveLength(1);
    expect(capWords('a', words(52), PLAIN_LANGUAGE.MAX_ANSWER_WORDS, 'an answer')).toHaveLength(1);
    expect(capWords('e', words(187), PLAIN_LANGUAGE.MAX_EXPLANATION_WORDS, 'an explanation')).toHaveLength(1);
    expect(capWords('r', words(71), PLAIN_LANGUAGE.MAX_RESPONSE_WORDS, 'a response')).toHaveLength(1);
  });

  it('names the surface in the learner\'s terms and says what to do', () => {
    const [issue] = capWords('evalQuestions[0].explanation', words(200), 90, 'a Stress Testing explanation');
    expect(issue.message).toContain('a Stress Testing explanation');
    expect(issue.message).toMatch(/Cut what the learner does not need/);
  });

  it('keeps answers short enough that length cannot be a tell', () => {
    // The bug this closes: in one case the correct option was the longest in all three
    // questions, so "pick the longest" scored 3/3 without understanding anything. The
    // first repair lengthened the distractors, which was the wrong direction.
    expect(PLAIN_LANGUAGE.MAX_ANSWER_WORDS).toBeLessThanOrEqual(30);
  });
});

describe('option labels have to read on one line', () => {
  it('passes a short option', () => {
    expect(optionLabelIssues('f', 'Append Row')).toEqual([]);
  });

  it('passes a real expression that stays short', () => {
    expect(optionLabelIssues('f', '{{ $json.weather_line }}. {{ $json.commute_note }}')).toEqual([]);
  });

  it('flags the 296-character inline ternary that started this rule', () => {
    const monster =
      '{{ $json.current.temperature_2m >= 35 ? "Extreme heat. Carry water." : ' +
      '({0:"Easy commute.",1:"Easy commute.",2:"Easy commute.",3:"Easy commute.",' +
      '61:"Grab an umbrella.",63:"Grab an umbrella.",65:"Grab an umbrella."}' +
      '[$json.current.weather_code] || "Unusual conditions today. Check the forecast before you leave.") }}';
    expect(monster.length).toBeGreaterThan(PLAIN_LANGUAGE.MAX_OPTION_LABEL_CHARS);
    const issues = optionLabelIssues('edit-fields.fields', monster);
    expect(issues).toHaveLength(1);
    // The message has to say what to DO, because "too long" on a required expression
    // reads as an impossible instruction.
    expect(issues[0].message).toMatch(/locked row/);
  });
});
