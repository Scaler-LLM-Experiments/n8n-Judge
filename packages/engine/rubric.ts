// The scoring rubric: how a session becomes a number.
//
// Two defects in the old model drove this. First, every decision was weighted
// equally, so a problem with 13 dropdowns and 6 node placements scored mostly
// as a dropdown exercise. Second, only first-try correctness counted, which
// meant a learner clicking through a 3-option field until it went green earned
// nothing — but also lost nothing traceable, and the report could not tell
// "understood it" from "found it".
//
// The fix is attempt decay tied to the OPTION COUNT. On an N-option question
// the Nth attempt is forced correct by elimination, so it is worth zero:
// exhaustion is not knowledge. That single property is what stops guessing from
// paying, and it holds at any option count without re-tuning.

/** Item value curve for items with no closed option set. */
const OPEN_ENDED_STEP = 0.5;

/**
 * What one item is worth, 0..1, given the attempt it was first answered
 * correctly on (1-based).
 *
 * @param attempt      1-based attempt number, or null if never answered right
 * @param optionCount  number of options, or null for open-ended (expression,
 *                     number, node placement) where elimination doesn't apply
 */
export function itemScore(attempt: number | null | undefined, optionCount: number | null): number {
  if (attempt == null || attempt < 1) return 0;

  // Open-ended: there is nothing to eliminate, so a fixed curve. Guessing an
  // expression or a node out of a full palette is not a viable strategy, so the
  // decay is gentler than the elimination curve and floors at the third try.
  if (optionCount == null) return Math.max(0, 1 - OPEN_ENDED_STEP * (attempt - 1));

  // A single-option item carries no signal at all; credit only an immediate hit.
  if (optionCount <= 1) return attempt === 1 ? 1 : 0;

  // Elimination curve: zero on attempt N, because attempt N is forced.
  return Math.max(0, (optionCount - attempt) / (optionCount - 1));
}

type Rec = Record<string, any>;

export interface RubricItem {
  /** Matches the recorded decision key, so a trace replays without a mapping. */
  id: string;
  label: string;
  /** null = open-ended (expression, number, node placement). */
  optionCount: number | null;
}

export interface RubricItems {
  understand: RubricItem[];
  placement: RubricItem[];
  config: RubricItem[];
  stress: RubricItem[];
}

/** Closed option sets are countable; expressions and numbers are not. */
function fieldOptionCount(field: Rec): number | null {
  const kind = field.kind ?? 'select';
  if (kind === 'select') return field.options?.length ?? null;
  if (kind === 'boolean') return 2;
  return null; // expression, number, text — nothing to eliminate
}

/**
 * A setting's option set is whatever its authored `why` map explains — one
 * entry per value the learner can choose. Reading it from there keeps the
 * engine independent of the UI's SETTINGS_SPEC, which lives in apps/web.
 */
function settingOptionCount(setting: Rec): number | null {
  const n = Object.keys(setting.why ?? {}).length;
  return n > 0 ? n : null;
}

/**
 * Every decision the problem requires, grouped into the four scoring buckets.
 *
 * Note what is NOT here: probes. A probe fires only after a wrong placement, so
 * its count is unknowable up front — and the wrong placement has already been
 * paid for through the placement decay. Scoring the probe too would charge the
 * same mistake twice. It stays a teaching moment, not a scored item.
 */
export function enumerateItems(problem: Rec): RubricItems {
  const understand: RubricItem[] = (problem.dissection ?? []).map((q: Rec) => ({
    id: `dissection:${q.id}`,
    label: q.prompt ?? q.id,
    optionCount: q.options?.length ?? null,
  }));

  // Distinct node types the build phases ask for, in the order they are asked.
  const seen = new Set<string>();
  const placement: RubricItem[] = [];
  for (const phase of problem.buildPhases ?? []) {
    for (const type of phase.nodeTypes ?? []) {
      if (seen.has(type)) continue;
      seen.add(type);
      placement.push({ id: `nodePick:${type}`, label: type, optionCount: null });
    }
  }

  const config: RubricItem[] = [];
  for (const [type, setup] of Object.entries((problem.nodeSetup ?? {}) as Record<string, Rec>)) {
    for (const field of setup.fields ?? []) {
      config.push({
        id: `${type}:${field.key}`,
        label: `${type} — ${field.label ?? field.key}`,
        optionCount: fieldOptionCount(field),
      });
    }
    for (const setting of setup.settings ?? []) {
      config.push({
        id: `${type}:settings.${setting.key}`,
        label: `${type} — ${setting.key}`,
        optionCount: settingOptionCount(setting),
      });
    }
  }

  const stress: RubricItem[] = (problem.evalQuestions ?? []).map((q: Rec) => ({
    id: `stress:${q.id}`,
    label: q.prompt ?? q.id,
    optionCount: q.options?.length ?? null,
  }));

  return { understand, placement, config, stress };
}

/**
 * Phase weights, out of 100.
 *
 * Build is 50, split evenly between placing nodes and configuring them. That
 * even split is the whole point: email-triage has 6 placements and 13 config
 * items, so without it config would carry 13/19ths of the build score purely
 * because the problem happens to have more dropdowns. Choosing the right node
 * and setting it up correctly are worth the same in aggregate.
 *
 * A consequence worth knowing: because the pots are fixed and the item counts
 * are not, one placement is worth ~2.2 config items on email-triage and ~1.25
 * on meeting-notes. Within a problem that is intended. ACROSS problems it means
 * two equal scores are not quite the same mix of skills.
 */
export const DEFAULT_WEIGHTS = { understand: 30, placement: 25, config: 25, stress: 20 };

export type BucketKey = keyof typeof DEFAULT_WEIGHTS;

const BUCKET_LABELS: Record<BucketKey, string> = {
  understand: 'Problem dissection',
  placement: 'Choosing the right nodes',
  config: 'Configuring the nodes',
  stress: 'Edge-case reasoning',
};

const BUCKET_ORDER: BucketKey[] = ['understand', 'placement', 'config', 'stress'];

export interface ScoredBucket {
  key: BucketKey;
  label: string;
  /** Effective weight out of 100, after redistributing empty buckets. */
  weight: number;
  itemCount: number;
  /** What one item in this bucket is worth, in final score points. */
  pointsPerItem: number;
  /** Points earned, out of `weight`. */
  earned: number;
  /** 0-100 within this bucket alone. */
  score: number;
  /** Items scoring below full credit, worst first — the report's evidence. */
  missed: Array<{ id: string; label: string; attempt: number | null; credit: number }>;
}

export interface SessionScore {
  total: number;
  /** Unrounded, for arithmetic that must not accumulate rounding error. */
  totalRaw: number;
  buckets: ScoredBucket[];
}

/**
 * Score a session from the attempt number each item was first answered
 * correctly on. `null`/absent means never answered correctly — which costs, so
 * abandoning the build halfway cannot look like a perfect short session.
 *
 * Pure arithmetic, deliberately: the number has to be auditable, reproducible,
 * and cheap to re-run when weights change. Claude explains it; Claude does not
 * compute it.
 */
export function scoreSession(
  problem: Rec,
  attempts: Record<string, number | null | undefined>,
  weights: Record<BucketKey, number> = DEFAULT_WEIGHTS
): SessionScore {
  const items = enumerateItems(problem);

  // A bucket with no items must not silently cap the maximum — a problem with
  // no stress questions has to still be able to reach 100. Redistribute its
  // weight across the buckets that do have items.
  const active = BUCKET_ORDER.filter((k) => items[k].length > 0 && weights[k] > 0);
  const activeWeight = active.reduce((sum, k) => sum + weights[k], 0);

  const buckets: ScoredBucket[] = BUCKET_ORDER.map((key) => {
    const list = items[key];
    const weight = active.includes(key) && activeWeight > 0 ? (weights[key] / activeWeight) * 100 : 0;

    const credits = list.map((item) => ({
      item,
      attempt: attempts[item.id] ?? null,
      credit: itemScore(attempts[item.id], item.optionCount),
    }));

    const ratio = list.length ? credits.reduce((s, c) => s + c.credit, 0) / list.length : 0;

    return {
      key,
      label: BUCKET_LABELS[key],
      weight,
      itemCount: list.length,
      pointsPerItem: list.length ? weight / list.length : 0,
      earned: ratio * weight,
      score: ratio * 100,
      missed: credits
        .filter((c) => c.credit < 1)
        .sort((a, b) => a.credit - b.credit)
        .map((c) => ({ id: c.item.id, label: c.item.label, attempt: c.attempt, credit: c.credit })),
    };
  });

  const totalRaw = buckets.reduce((sum, b) => sum + b.earned, 0);
  return { total: Math.round(totalRaw), totalRaw, buckets };
}

export interface Band {
  band: 'strong' | 'solid' | 'developing' | 'needs-another-pass';
  definition: string;
}

/**
 * What the number MEANS, in plain English. The report has to define its own
 * score — a bare percentage tells a learner nothing about what to do next.
 * Simple English, no idioms: most learners here are non-native speakers.
 */
export function scoreBand(total: number): Band {
  if (total >= 85)
    return {
      band: 'strong',
      definition:
        'You got almost every decision right on your first attempt. That means you understood the shape of the workflow before you started building it, not while you were building it.',
    };
  if (total >= 70)
    return {
      band: 'solid',
      definition:
        'You reached the right answer nearly everywhere, but needed a second try on several decisions. The understanding is there; the details are still settling.',
    };
  if (total >= 50)
    return {
      band: 'developing',
      definition:
        'You got there in the end, but often after two or three tries. That usually means you were choosing by elimination rather than working from what each node does.',
    };
  return {
    band: 'needs-another-pass',
    definition:
      'Most decisions took several attempts, or were left unfinished. This challenge is worth running again from the start — the goal is to recognise each step, not to find it.',
  };
}

/**
 * How much work a problem asks for, as a count of required decisions. Used to
 * order the catalogue easy-first when recommending what to try next, so no
 * authored `difficulty` field has to be kept in sync with the content.
 */
export function problemComplexity(problem: Rec): number {
  const items = enumerateItems(problem);
  return BUCKET_ORDER.reduce((sum, k) => sum + items[k].length, 0);
}

/**
 * The three phases the learner actually walked, for the Result screen.
 *
 * Build is the placement and config buckets added together: the learner
 * experienced one Build stage, not two. Grouping lives here rather than in the
 * UI so there is exactly one place where weights are known, and a phase can
 * never quietly disagree with the total.
 */
export interface ScoredPhase {
  key: 'understand' | 'build' | 'stress';
  label: string;
  /** Share of the final score this phase carries. */
  weight: number;
  /** Points earned, out of `weight`. */
  earned: number;
  /** 0-100 within this phase alone. */
  score: number;
  buckets: ScoredBucket[];
}

const PHASE_MAP: Array<{ key: ScoredPhase['key']; label: string; buckets: BucketKey[] }> = [
  { key: 'understand', label: 'Understand', buckets: ['understand'] },
  { key: 'build', label: 'Build', buckets: ['placement', 'config'] },
  { key: 'stress', label: 'Stress Testing', buckets: ['stress'] },
];

export function phaseBreakdown(score: SessionScore): ScoredPhase[] {
  const byKey = Object.fromEntries(score.buckets.map((b) => [b.key, b])) as Record<BucketKey, ScoredBucket>;

  return PHASE_MAP.map(({ key, label, buckets }) => {
    const members = buckets.map((k) => byKey[k]).filter(Boolean);
    const weight = members.reduce((s, b) => s + b.weight, 0);
    const earned = members.reduce((s, b) => s + b.earned, 0);
    return {
      key,
      label,
      weight,
      earned,
      score: weight > 0 ? (earned / weight) * 100 : 0,
      buckets: members,
    };
  });
}

/**
 * Rebuild the attempts map from recorded TraceEvents.
 *
 * This is what makes the score server-authoritative: the check endpoint already
 * persists one `decision` event per attempt with a SERVER-assigned attempt
 * number, so the whole score can be recomputed from Postgres without trusting
 * anything the browser reported. Replay is also why the score is arithmetic —
 * an admin changing a weight re-runs this, and every past session re-scores
 * identically.
 *
 * The recorded key and the rubric item id are not the same string, because the
 * check API groups by `kind` and the rubric groups by bucket. Translate here,
 * in one place.
 */
export function attemptsFromTrace(
  events: Array<{ type: string; payload: Rec }>
): Record<string, number> {
  const out: Record<string, number> = {};

  for (const event of events) {
    // Only real decisions. `suspicious_check` is a tampering signal — an id that
    // was never served to this learner — and must never earn credit.
    if (event.type !== 'decision') continue;

    const { kind, id, correct, attempt } = event.payload ?? {};
    if (!correct || !id || typeof attempt !== 'number') continue;

    const itemId = rubricItemId(String(kind), String(id));
    if (!itemId) continue;

    // First attempt that got it right wins, in case a client retried after
    // already being correct.
    if (out[itemId] == null || attempt < out[itemId]) out[itemId] = attempt;
  }

  return out;
}

/** Recorded `kind` + `id` → rubric item id, or null if it isn't a scored item. */
function rubricItemId(kind: string, id: string): string | null {
  switch (kind) {
    case 'dissection':
      return `dissection:${id}`;
    case 'stress':
      return `stress:${id}`;
    case 'placement':
      return `nodePick:${id}`;
    case 'field':
      // Already `<nodeType>:<fieldKey>`, which is the rubric's own form.
      return id;
    case 'setting': {
      // `<nodeType>:<settingKey>` → `<nodeType>:settings.<settingKey>`
      const cut = id.indexOf(':');
      if (cut < 0) return null;
      return `${id.slice(0, cut)}:settings.${id.slice(cut + 1)}`;
    }
    // Probes are deliberately unscored: the wrong placement they follow has
    // already been paid for through the placement decay.
    default:
      return null;
  }
}
