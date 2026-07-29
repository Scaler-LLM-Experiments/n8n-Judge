import { describe, it, expect } from 'vitest';
import { LINES, MOMENT_CLIP, captionFor, clipFor, fillLine, hasMoment, pickLine } from './voiceLines.js';

const allLines = Object.entries(LINES).flatMap(([moment, variants]) => variants.map((line) => ({ moment, line })));

// The writing rules ARE the feature, so they are enforced rather than trusted.
// Spoken copy drifts silently: nobody reads the phrase book, they just hear a
// line that does not sound like the rest.
describe('the copy rules', () => {
  it('never uses an em or en dash', () => {
    for (const { moment, line } of allLines) {
      expect(line, `${moment}: "${line}"`).not.toMatch(/[—–]/);
    }
  });

  it('keeps every line short enough to finish inside its moment', () => {
    for (const { moment, line } of allLines) {
      const words = captionFor(line).split(/\s+/).length;
      // ~22 words is about seven seconds spoken. Longer and the line is still
      // talking after the thing it described has passed.
      expect(words, `${moment} is ${words} words: "${captionFor(line)}"`).toBeLessThanOrEqual(22);
    }
  });

  it('avoids the cheerleader vocabulary', () => {
    // A calm colleague, not a hype machine. These read fine once and grate by the
    // fifth time, and a learner hears the verify lines on every single node.
    const banned = /\b(amazing|awesome|nailed it|brilliant|superb|fantastic|let's dive|crushed it|rockstar|perfect!)\b/i;
    for (const { moment, line } of allLines) {
      expect(line, `${moment}: "${line}"`).not.toMatch(banned);
    }
  });

  it('avoids exclamation marks', () => {
    for (const { moment, line } of allLines) {
      expect(line, `${moment}: "${line}"`).not.toMatch(/!/);
    }
  });

  // The rule is "never reveal an answer the learner has not given", which is
  // narrower than "never name a node". A verdict line naming what they just chose
  // is specific rather than leaky — they chose it, and it is already on screen.
  // A line that fires BEFORE a decision must give nothing away.
  // Every moment that plays while a question is still OPEN. These are the ones
  // that must give nothing away: the escalation and the idle nudge are pointers
  // toward the answer, which is precisely why they must not contain it.
  const PRE_DECISION = [
    'problem_intro', 'understand_start', 'build_start', 'node_wrong',
    'run_start', 'stress_start', 'welcome', 'answer_wrong_again', 'idle_nudge',
  ];

  it('gives nothing away in the lines that play before a decision', () => {
    const leaks = /\b(gmail trigger|chat trigger|schedule trigger|switch|edit fields|text classifier)\b/i;
    for (const moment of PRE_DECISION) {
      for (const line of LINES[moment] ?? []) {
        expect(line, `${moment}: "${line}"`).not.toMatch(leaks);
      }
    }
  });

  it('never contains an expression, which would be an answer read out loud', () => {
    for (const { moment, line } of allLines) {
      expect(line, `${moment}: "${line}"`).not.toMatch(/\{\{/);
    }
  });

  // The whole point of the rework: a verdict must be able to name what it is
  // talking about, or it is a glorified screen reader.
  it('makes the verdict lines specific to what the learner did', () => {
    for (const moment of ['answer_correct', 'answer_wrong']) {
      for (const line of LINES[moment]) {
        expect(line, `${moment} should name the choice`).toMatch(/\{answer\}/);
      }
    }
    for (const moment of ['verify_pass', 'verify_fail']) {
      for (const line of LINES[moment]) {
        expect(line, `${moment} should name the node`).toMatch(/\{node\}/);
      }
    }
  });

  // A second miss should say something DIFFERENT from the first, or the escalation
  // is just the same nudge again at the same volume.
  it('escalates rather than repeating itself on a second miss', () => {
    for (const a of LINES.answer_wrong) {
      for (const b of LINES.answer_wrong_again) {
        expect(captionFor(a), 'escalation duplicates the first miss').not.toBe(captionFor(b));
      }
    }
  });

  // The idle nudge is an offer, not a prod. A learner who is thinking should not
  // be told to hurry up.
  it('offers help when idle rather than rushing the learner', () => {
    const pushy = /\b(hurry|quick|come on|still waiting|running out|faster)\b/i;
    for (const line of LINES.idle_nudge) {
      expect(line, `idle_nudge: "${line}"`).not.toMatch(pushy);
    }
  });

  it('gives the repeated moments more than one wording', () => {
    // These fire many times per session. One fixed sentence is what makes
    // narration sound like a recording rather than a person.
    for (const moment of ['answer_correct', 'answer_wrong', 'verify_pass']) {
      expect(LINES[moment].length, moment).toBeGreaterThan(1);
    }
  });
});

describe('captions', () => {
  it('strips the audio tags, because they are direction and not speech', () => {
    expect(captionFor('[warm] That is right.')).toBe('That is right.');
    expect(captionFor('[calm] One. [thoughtful] Two.')).toBe('One. Two.');
  });

  it('leaves an untagged line alone', () => {
    expect(captionFor('That is right.')).toBe('That is right.');
  });

  it('produces a non-empty caption for every line', () => {
    for (const { moment, line } of allLines) {
      expect(captionFor(line).length, moment).toBeGreaterThan(3);
    }
  });

  it('never leaves a stray bracket in a caption', () => {
    for (const { moment } of allLines) {
      for (const line of LINES[moment]) expect(captionFor(line)).not.toMatch(/[[\]]/);
    }
  });
});

describe('placeholders', () => {
  it('fills a named variable', () => {
    expect(fillLine('Open {node} next.', { node: 'the Switch' })).toBe('Open the Switch next.');
  });

  // A missing value must collapse to nothing, never to the word "undefined"
  // spoken out loud.
  it('collapses a missing variable', () => {
    expect(fillLine('Open {node} next.', {})).toBe('Open  next.');
  });

  it('only uses placeholders the callers actually pass', () => {
    const used = new Set();
    for (const { line } of allLines) {
      for (const m of line.matchAll(/\{(\w+)\}/g)) used.add(m[1]);
    }
    // `{answer}` for verdicts on a choice, `{node}` for verdicts on a node.
    expect([...used].sort()).toEqual(['answer', 'node']);
  });
});

describe('picking a variant', () => {
  it('returns the exact variant asked for, so the caption matches the audio', () => {
    const first = pickLine('answer_correct', 0);
    expect(first.index).toBe(0);
    expect(first.line).toBe(LINES.answer_correct[0]);
  });

  it('wraps an out-of-range index instead of failing', () => {
    const n = LINES.answer_correct.length;
    expect(pickLine('answer_correct', n).index).toBe(0);
    expect(pickLine('answer_correct', -1).index).toBe(n - 1);
  });

  it('returns null for a moment that does not exist', () => {
    expect(pickLine('no_such_moment')).toBe(null);
    expect(hasMoment('no_such_moment')).toBe(false);
  });
});

describe('the mascot reacts to every moment', () => {
  it('maps each moment to a clip', () => {
    for (const moment of Object.keys(LINES)) {
      expect(MOMENT_CLIP[moment], moment).toBeTruthy();
    }
  });

  it('falls back to idle rather than breaking on an unknown moment', () => {
    expect(clipFor('no_such_moment')).toBe('idle');
  });

  it('uses only clips the mascot bundle actually has', () => {
    const available = new Set(['idle', 'hello', 'presenting', 'thinking', 'celebrate', 'correct', 'shake-no']);
    for (const [moment, clip] of Object.entries(MOMENT_CLIP)) {
      expect(available.has(clip), `${moment} wants "${clip}"`).toBe(true);
    }
  });
});
