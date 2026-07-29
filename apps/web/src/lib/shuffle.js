// Deterministic option shuffling — now used ONLY by the Stress Testing screen.
//
// It used to shuffle the NDV fields, the Understand quiz and the probes too.
// That is gone, and the reason is worth keeping: the browser cannot see which
// option is correct (`toPublicProblem` strips `correct` and `correctType`), so
// shuffling here was randomising blind. It could not balance anything, and
// because each list was drawn independently, a single tab session could put the
// answer on top of nearly every question at once — measured at 18 of 24 fields
// in the unluckiest of 400 simulated sessions. Averages don't help a learner who
// only ever sees one session.
//
// Those three surfaces are now arranged server-side, before the answer key is
// stripped, by `balanceProblemOptions` in @judge/problem-schema. Stress
// questions stay here because their `correctIndex` points into the authored
// array and `scoreEval` grades against it — reordering them server-side would
// silently mark the wrong answer correct — so they are shuffled per session with
// `originalIndex` carried through instead.
//
// Why deterministic rather than Math.random per render: the order must be stable
// for the life of a question. A plain random shuffle re-runs on every React
// re-render, so options would reorder under the learner's cursor while they read.
//
// Grading is unaffected: decisions record the chosen *value*, never an index.

const SEED_STORAGE_KEY = 'judge.optionSeed';

// One seed per browser tab session. sessionStorage (not localStorage) so a new
// tab is a new arrangement, and a reload keeps the current one.
function sessionSeed() {
  if (typeof window === 'undefined') return 'ssr';
  try {
    let seed = window.sessionStorage.getItem(SEED_STORAGE_KEY);
    if (!seed) {
      seed = Math.random().toString(36).slice(2);
      window.sessionStorage.setItem(SEED_STORAGE_KEY, seed);
    }
    return seed;
  } catch {
    return 'no-storage';
  }
}

// FNV-1a — small, fast, good enough spread for seeding a PRNG.
function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// mulberry32: compact seeded PRNG, uniform enough for shuffling 2–6 items.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher–Yates against a seeded PRNG. Returns a new array; inputs untouched.
export function seededShuffle(items, key) {
  const list = Array.isArray(items) ? [...items] : [];
  if (list.length < 2) return list;
  const rand = mulberry32(hash32(`${sessionSeed()}:${key}`));
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// Eval questions store `options` as plain strings plus a `correctIndex` that
// points into the original array — shuffling those in place would silently
// mark the wrong answer correct. Normalise to objects that carry their own
// correctness first, then shuffle.
// `originalIndex` is carried through because scoreEval() grades by comparing
// the recorded answer index against the question's `correctIndex` — that is
// the authored order, not what the learner saw. Record the original index and
// grading keeps working untouched.
export function shuffledEvalOptions(question, key) {
  const tagged = (question.options ?? []).map((label, i) => ({
    label,
    originalIndex: i,
    correct: i === question.correctIndex,
  }));
  return seededShuffle(tagged, key);
}
