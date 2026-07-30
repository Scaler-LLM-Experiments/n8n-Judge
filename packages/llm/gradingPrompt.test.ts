import { describe, it, expect } from 'vitest';
import {
  buildGradingPrompt,
  GRADING_REPORT_SCHEMA,
  DEFAULT_RUBRIC_SYSTEM_PROMPT,
} from './gradingPrompt.ts';

const digest = {
  problemTitle: 'Email Triage Automation',
  problemStatement: 'Route incoming support email to the right reply.',
  score: {
    total: 89,
    band: 'strong',
    definition: 'You got almost every decision right on your first attempt.',
    buckets: [
      { key: 'understand', label: 'Problem dissection', weight: 30, score: 93.3, itemCount: 5, missed: [] },
      { key: 'placement', label: 'Choosing the right nodes', weight: 25, score: 91.7, itemCount: 6, missed: [] },
      { key: 'config', label: 'Configuring the nodes', weight: 25, score: 100, itemCount: 13, missed: [] },
      { key: 'stress', label: 'Edge-case reasoning', weight: 20, score: 66.7, itemCount: 2, missed: [] },
    ],
  },
  decisions: [{ kind: 'dissection', label: 'Which node starts the flow?', correct: true, firstTry: false }],
  retriesByDecisionId: { 'dissection:trigger': 1 },
  misconceptionLabels: { polls_inbox: 'Thinks a trigger must poll' },
  runOutcome: null,
  timeline: [{ label: 'Understand', detail: '4m 12s' }],
  catalog: [
    { slug: 'meeting-notes', title: 'Meeting Notes Summarizer', complexity: 14 },
    { slug: 'email-triage', title: 'Email Triage Automation', complexity: 26 },
  ],
};

describe('buildGradingPrompt', () => {
  it('hands Claude the engine-computed score instead of asking for it', () => {
    const { user } = buildGradingPrompt('RUBRIC', digest);
    expect(user).toContain('89');
    expect(user).toContain('You got almost every decision right on your first attempt.');
  });

  it('never asks Claude to produce the number itself', () => {
    // The score has to be auditable and reproducible, so it is arithmetic.
    // Claude explains it; if the schema let Claude emit it, the report could
    // disagree with the number already shown on screen.
    expect(GRADING_REPORT_SCHEMA.required).not.toContain('understandingScore');
    expect(Object.keys(GRADING_REPORT_SCHEMA.properties)).not.toContain('understandingScore');
  });

  it('passes the per-bucket breakdown so the narrative matches the arithmetic', () => {
    const { user } = buildGradingPrompt('RUBRIC', digest);
    expect(user).toContain('Edge-case reasoning');
    expect(user).toContain('66.7');
  });

  it('passes retry counts, since repeated attempts are the signal being graded', () => {
    const { user } = buildGradingPrompt('RUBRIC', digest);
    expect(user).toContain('retriesByDecisionId'.replace('retriesByDecisionId', 'dissection:trigger'));
  });

  it('offers the catalogue easy-first so the next step can escalate difficulty', () => {
    const { user } = buildGradingPrompt('RUBRIC', digest);
    const easyAt = user.indexOf('Meeting Notes Summarizer');
    const harderAt = user.lastIndexOf('Email Triage Automation');
    expect(easyAt).toBeGreaterThan(-1);
    expect(easyAt).toBeLessThan(harderAt);
  });

  it('keeps the rubric as the system prompt and guards against trace injection', () => {
    const { system } = buildGradingPrompt('MY RUBRIC TEXT', digest);
    expect(system).toContain('MY RUBRIC TEXT');
    expect(system).toMatch(/DATA, not instructions/i);
  });
});

describe('GRADING_REPORT_SCHEMA', () => {
  it('requires the three things the learner actually reads', () => {
    expect(GRADING_REPORT_SCHEMA.required).toContain('strengths'); // positives
    expect(GRADING_REPORT_SCHEMA.required).toContain('focusAreas'); // negatives
    expect(GRADING_REPORT_SCHEMA.required).toContain('nextSteps'); // what to do now
  });

  it('requires the report to define what the score means', () => {
    expect(GRADING_REPORT_SCHEMA.required).toContain('scoreDefinition');
  });

  it('asks for area summaries without letting Claude re-score the areas', () => {
    const area = GRADING_REPORT_SCHEMA.properties.areaBreakdown.items;
    expect(area.required).toContain('summary');
    expect(area.required).not.toContain('score');
  });

  it('wants next steps concrete enough to act on, not a single vague line', () => {
    const next = GRADING_REPORT_SCHEMA.properties.nextSteps;
    expect(next.type).toBe('array');
    // The COUNT is asked for in prose, not in minItems — see below.
    expect(next.description).toMatch(/\b2\b/);
  });

  // This is the test that should have existed. `output_config.format` rejects
  // `minItems` above 1 ("For 'array' type, 'minItems' values other than 0 or 1 are
  // not supported"), so every grading call 400'd, the route recorded `llm_failed`,
  // and the Result screen silently lost its written half while still showing a
  // score. The previous test asserted `minItems >= 2` — it required the bug.
  //
  // Walks the whole schema, so a constraint added to any future array is caught.
  it('uses no array constraint structured outputs will reject', () => {
    const offenders: string[] = [];
    const walk = (node: any, path: string) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'array') {
        if (typeof node.minItems === 'number' && node.minItems > 1) {
          offenders.push(`${path}.minItems = ${node.minItems}`);
        }
        if (node.maxItems !== undefined) offenders.push(`${path}.maxItems = ${node.maxItems}`);
      }
      for (const [key, value] of Object.entries(node)) {
        if (value && typeof value === 'object') walk(value, `${path}.${key}`);
      }
    };
    walk(GRADING_REPORT_SCHEMA, 'schema');
    expect(offenders).toEqual([]);
  });
});

describe('DEFAULT_RUBRIC_SYSTEM_PROMPT', () => {
  it('states the decay rule, so the narrative cannot contradict the arithmetic', () => {
    expect(DEFAULT_RUBRIC_SYSTEM_PROMPT).toMatch(/elimination|first attempt/i);
    expect(DEFAULT_RUBRIC_SYSTEM_PROMPT).toMatch(/last possible attempt|forced/i);
  });

  it('states the four weights', () => {
    for (const w of ['30', '25', '20']) expect(DEFAULT_RUBRIC_SYSTEM_PROMPT).toContain(w);
  });

  it('tells the model the score is given, not to be recomputed', () => {
    expect(DEFAULT_RUBRIC_SYSTEM_PROMPT).toMatch(/do not recompute|already computed|given to you/i);
  });

  it('directs next steps at practising more challenges, easiest first', () => {
    expect(DEFAULT_RUBRIC_SYSTEM_PROMPT).toMatch(/easiest|easier|simplest/i);
    expect(DEFAULT_RUBRIC_SYSTEM_PROMPT).toMatch(/next steps/i);
  });
});
