import { describe, it, expect } from 'vitest';
import { problems } from '@judge/problems';
import {
  itemScore,
  enumerateItems,
  scoreSession,
  scoreBand,
  problemComplexity,
  phaseBreakdown,
  attemptsFromTrace,
  DEFAULT_WEIGHTS,
} from './rubric.ts';

/** Every item answered correctly on attempt `n`. */
function allAt(problem: any, n: number | null) {
  const items = enumerateItems(problem);
  const out: Record<string, number | null> = {};
  for (const bucket of Object.values(items)) for (const it of bucket as any[]) out[it.id] = n;
  return out;
}

// The decay curve. The property that matters: the LAST possible attempt on a
// closed-option question is worth ZERO, because on an N-option question the
// Nth attempt is forced correct by elimination — that is exhaustion, not
// knowledge. Everything else follows from that.
describe('itemScore — attempt decay', () => {
  it('gives full credit on the first attempt', () => {
    expect(itemScore(1, 4)).toBe(1);
  });

  it('decays a 4-option question 100 → 66 → 33 → 0', () => {
    expect(itemScore(1, 4)).toBeCloseTo(1);
    expect(itemScore(2, 4)).toBeCloseTo(2 / 3);
    expect(itemScore(3, 4)).toBeCloseTo(1 / 3);
    expect(itemScore(4, 4)).toBe(0);
  });

  it('decays a 3-option question 100 → 50 → 0', () => {
    expect(itemScore(1, 3)).toBeCloseTo(1);
    expect(itemScore(2, 3)).toBeCloseTo(0.5);
    expect(itemScore(3, 3)).toBe(0);
  });

  it('gives a 2-option question nothing on the second attempt', () => {
    expect(itemScore(2, 2)).toBe(0);
  });

  it('scores an open-ended item (no options) on a fixed 100 → 50 → 0 curve', () => {
    expect(itemScore(1, null)).toBeCloseTo(1);
    expect(itemScore(2, null)).toBeCloseTo(0.5);
    expect(itemScore(3, null)).toBe(0);
  });

  it('never goes negative, however many attempts were burned', () => {
    expect(itemScore(9, 4)).toBe(0);
    expect(itemScore(9, null)).toBe(0);
  });

  it('scores an item that was never answered correctly as zero', () => {
    expect(itemScore(null, 4)).toBe(0);
  });
});

// The denominator is every decision the problem REQUIRES, derived from problem
// data — not the subset the learner happened to touch. Abandoning half the
// build has to cost something, and it cannot cost anything if the items never
// enter the denominator.
describe('enumerateItems', () => {
  const emailTriage = problems['email-triage'];

  it('finds the four scoring buckets for email-triage', () => {
    const items = enumerateItems(emailTriage);
    expect(items.understand).toHaveLength(5);
    expect(items.placement).toHaveLength(6);
    expect(items.config).toHaveLength(13); // 11 graded fields + 2 graded settings
    expect(items.stress).toHaveLength(2);
  });

  it('uses ids that match the recorded decision keys, so a trace can be replayed', () => {
    const items = enumerateItems(emailTriage);
    expect(items.understand.map((i) => i.id)).toContain('dissection:trigger');
    expect(items.placement.map((i) => i.id)).toContain('nodePick:switch');
    expect(items.config.map((i) => i.id)).toContain('classify:text');
    expect(items.config.map((i) => i.id)).toContain('switch:settings.alwaysOutputData');
  });

  it('reads the option count off each question', () => {
    const items = enumerateItems(emailTriage);
    expect(items.understand.every((i) => i.optionCount === 4)).toBe(true);
    expect(items.stress.every((i) => i.optionCount === 4)).toBe(true);
  });

  it('treats node placement as open-ended — the palette is not a shortlist', () => {
    const items = enumerateItems(emailTriage);
    expect(items.placement.every((i) => i.optionCount === null)).toBe(true);
  });

  it('treats expression and number fields as open-ended, and select fields by option count', () => {
    const byId = Object.fromEntries(enumerateItems(emailTriage).config.map((i) => [i.id, i]));
    expect(byId['classify:text'].optionCount).toBe(null); // expression
    expect(byId['chat-gemini:temperature'].optionCount).toBe(null); // number
    expect(byId['switch:routeOn'].optionCount).toBe(3); // select
  });

  it('derives a setting option count from its authored explanations', () => {
    const byId = Object.fromEntries(enumerateItems(emailTriage).config.map((i) => [i.id, i]));
    expect(byId['switch:settings.alwaysOutputData'].optionCount).toBe(2); // boolean
    expect(byId['classify:settings.onError'].optionCount).toBe(3); // three-way select
  });

  it('handles a linear problem with no settings and fewer nodes', () => {
    const items = enumerateItems(problems['meeting-notes']);
    expect(items.understand).toHaveLength(3);
    expect(items.placement).toHaveLength(4);
    expect(items.config).toHaveLength(5);
    expect(items.stress).toHaveLength(2);
  });
});

// Weighting. The point of the 50/50 build split is that a problem which happens
// to have many dropdowns does not become a dropdown exercise: placing nodes and
// configuring them are worth the same in aggregate, whatever the item counts.
describe('scoreSession', () => {
  const emailTriage = problems['email-triage'];

  it('gives 100 when every decision is right on the first attempt', () => {
    expect(scoreSession(emailTriage, allAt(emailTriage, 1)).total).toBe(100);
  });

  it('gives 0 when nothing was answered', () => {
    expect(scoreSession(emailTriage, {}).total).toBe(0);
  });

  it('counts unanswered items against the learner, not out of the denominator', () => {
    // Only the Understand phase done, perfectly. That is 30 of 100, not 100.
    const attempts: Record<string, number> = {};
    for (const i of enumerateItems(emailTriage).understand) attempts[i.id] = 1;
    expect(scoreSession(emailTriage, attempts).total).toBe(30);
  });

  it('splits the build pot equally between placing and configuring', () => {
    const { buckets } = scoreSession(emailTriage, allAt(emailTriage, 1));
    const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
    expect(byKey.placement.weight).toBe(25);
    expect(byKey.config.weight).toBe(25);
    expect(byKey.understand.weight).toBe(30);
    expect(byKey.stress.weight).toBe(20);
  });

  it('makes one node placement worth ~2.2 config items on email-triage', () => {
    const { buckets } = scoreSession(emailTriage, allAt(emailTriage, 1));
    const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
    expect(byKey.placement.pointsPerItem / byKey.config.pointsPerItem).toBeCloseTo(2.17, 1);
  });

  it('costs more to miss a placement than to miss a field', () => {
    const items = enumerateItems(emailTriage);
    const missPlacement = { ...allAt(emailTriage, 1), [items.placement[0].id]: null };
    const missConfig = { ...allAt(emailTriage, 1), [items.config[0].id]: null };
    const placementLoss = 100 - scoreSession(emailTriage, missPlacement).totalRaw;
    const configLoss = 100 - scoreSession(emailTriage, missConfig).totalRaw;
    expect(placementLoss).toBeGreaterThan(configLoss);
    expect(placementLoss / configLoss).toBeCloseTo(2.17, 1);
  });

  it('scores the documented worked example at 89', () => {
    const items = enumerateItems(emailTriage);
    const attempts = {
      ...allAt(emailTriage, 1),
      [items.understand[0].id]: 2, // 4 options → 2/3 credit
      [items.placement[0].id]: 2, // open-ended → 1/2 credit
      [items.stress[0].id]: 3, // 4 options → 1/3 credit
    };
    expect(scoreSession(emailTriage, attempts).total).toBe(89);
  });

  it('redistributes an empty bucket rather than capping the maximum', () => {
    // A problem with no stress questions must still be able to reach 100.
    const noStress = { ...emailTriage, evalQuestions: [] };
    expect(scoreSession(noStress, allAt(noStress, 1)).total).toBe(100);
  });

  it('reports each bucket so the UI can explain where points went', () => {
    const { buckets } = scoreSession(emailTriage, allAt(emailTriage, 2));
    const understand = buckets.find((b) => b.key === 'understand')!;
    expect(understand.itemCount).toBe(5);
    expect(understand.score).toBeCloseTo(66.7, 0); // 4 options, second attempt
  });

  it('accepts overridden weights', () => {
    const weights = { ...DEFAULT_WEIGHTS, understand: 100, placement: 0, config: 0, stress: 0 };
    const attempts: Record<string, number> = {};
    for (const i of enumerateItems(emailTriage).understand) attempts[i.id] = 1;
    expect(scoreSession(emailTriage, attempts, weights).total).toBe(100);
  });
});

// Bands exist so the report can say what the number MEANS. The number itself is
// engine arithmetic; the band is what Claude is told to explain.
describe('scoreBand', () => {
  it('names each band', () => {
    expect(scoreBand(92).band).toBe('strong');
    expect(scoreBand(78).band).toBe('solid');
    expect(scoreBand(58).band).toBe('developing');
    expect(scoreBand(21).band).toBe('needs-another-pass');
  });

  it('carries a plain-English definition of the number', () => {
    expect(scoreBand(92).definition).toMatch(/first/i);
    expect(scoreBand(21).definition.length).toBeGreaterThan(20);
  });

  it('is defined across the whole range including the edges', () => {
    for (const n of [0, 49, 50, 69, 70, 84, 85, 100]) {
      expect(scoreBand(n).band).toBeTruthy();
    }
  });
});

// "Easy problems first, bigger ones next" needs an ordering. It falls out of the
// decision count — no new authored field to keep in sync.
describe('problemComplexity', () => {
  it('ranks the linear problem below the two routing problems', () => {
    expect(problemComplexity(problems['meeting-notes'])).toBeLessThan(
      problemComplexity(problems['email-triage'])
    );
  });

  it('counts every required decision', () => {
    // meeting-notes: 3 understand + 4 placements + 5 config + 2 stress
    expect(problemComplexity(problems['meeting-notes'])).toBe(14);
  });
});

// The Result screen shows the learner's three PHASES (Understand / Build /
// Stress Testing), not the four scoring buckets — Build is placing nodes and
// configuring them together. Grouping happens here so the UI never re-derives
// weights and drifts from the arithmetic.
describe('phaseBreakdown', () => {
  const emailTriage = problems['email-triage'];

  it('reports the three journey phases the learner actually walked', () => {
    const phases = phaseBreakdown(scoreSession(emailTriage, allAt(emailTriage, 1)));
    expect(phases.map((p) => p.key)).toEqual(['understand', 'build', 'stress']);
    expect(phases.map((p) => p.label)).toEqual(['Understand', 'Build', 'Stress Testing']);
  });

  it('folds placing and configuring into one Build phase worth 50', () => {
    const phases = phaseBreakdown(scoreSession(emailTriage, allAt(emailTriage, 1)));
    const build = phases.find((p) => p.key === 'build')!;
    expect(build.weight).toBe(50);
    expect(build.earned).toBeCloseTo(50);
  });

  it('adds up to the session total', () => {
    const score = scoreSession(emailTriage, allAt(emailTriage, 2));
    const phases = phaseBreakdown(score);
    const summed = phases.reduce((s, p) => s + p.earned, 0);
    expect(summed).toBeCloseTo(score.totalRaw);
  });

  it('scores a phase out of its own weight, so a half-done Build reads 50%', () => {
    const items = enumerateItems(emailTriage);
    // Every placement right, no configuration done at all.
    const attempts: Record<string, number> = {};
    for (const i of items.placement) attempts[i.id] = 1;
    const build = phaseBreakdown(scoreSession(emailTriage, attempts)).find((p) => p.key === 'build')!;
    expect(build.score).toBeCloseTo(50);
  });

  it('keeps the underlying buckets available for a deeper drill-down', () => {
    const phases = phaseBreakdown(scoreSession(emailTriage, allAt(emailTriage, 1)));
    const build = phases.find((p) => p.key === 'build')!;
    expect(build.buckets.map((b) => b.key)).toEqual(['placement', 'config']);
  });
});

// Replaying the server's own record. The check endpoint stores one `decision`
// event per attempt, with the server-assigned attempt number — so the score can
// be rebuilt from Postgres without trusting anything the browser said.
describe('attemptsFromTrace', () => {
  const ev = (kind: string, id: string, correct: boolean, attempt: number) => ({
    type: 'decision',
    payload: { kind, id, correct, attempt },
  });

  it('keys a dissection answer to its rubric item', () => {
    expect(attemptsFromTrace([ev('dissection', 'trigger', true, 1)])['dissection:trigger']).toBe(1);
  });

  it('keys a field answer to its rubric item', () => {
    expect(attemptsFromTrace([ev('field', 'classify:text', true, 2)])['classify:text']).toBe(2);
  });

  it('rewrites a setting key into the rubric form', () => {
    // recorded as `setting:classify:onError`; the rubric calls it
    // `classify:settings.onError`
    const out = attemptsFromTrace([ev('setting', 'classify:onError', true, 1)]);
    expect(out['classify:settings.onError']).toBe(1);
  });

  it('keys a placement to its node-pick item', () => {
    expect(attemptsFromTrace([ev('placement', 'switch', true, 3)])['nodePick:switch']).toBe(3);
  });

  it('takes the attempt on which the answer first became correct', () => {
    const out = attemptsFromTrace([
      ev('dissection', 'trigger', false, 1),
      ev('dissection', 'trigger', false, 2),
      ev('dissection', 'trigger', true, 3),
    ]);
    expect(out['dissection:trigger']).toBe(3);
  });

  it('leaves an item that was never right absent, so it scores zero', () => {
    const out = attemptsFromTrace([ev('stress', 'q1', false, 1), ev('stress', 'q1', false, 2)]);
    expect(out['stress:q1']).toBeUndefined();
  });

  it('ignores probes — they are teaching, not a scored item', () => {
    expect(attemptsFromTrace([ev('probe', 'gmail', true, 1)])['nodePick:gmail']).toBeUndefined();
  });

  it('ignores non-decision events and tampering attempts', () => {
    const out = attemptsFromTrace([
      { type: 'suspicious_check', payload: { kind: 'dissection', id: 'fake', correct: true, attempt: 1 } },
      { type: 'screen_transition', payload: { to: 'report' } },
    ]);
    expect(Object.keys(out)).toHaveLength(0);
  });

  it('rebuilds a full perfect session into a 100 score', () => {
    const p = problems['meeting-notes'];
    const events = Object.entries(enumerateItems(p)).flatMap(([bucket, items]) =>
      (items as any[]).map((i) => {
        if (bucket === 'understand') return ev('dissection', i.id.replace('dissection:', ''), true, 1);
        if (bucket === 'stress') return ev('stress', i.id.replace('stress:', ''), true, 1);
        if (bucket === 'placement') return ev('placement', i.id.replace('nodePick:', ''), true, 1);
        return ev('field', i.id, true, 1);
      })
    );
    expect(scoreSession(p, attemptsFromTrace(events)).total).toBe(100);
  });
});
