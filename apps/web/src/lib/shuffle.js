// Deterministic option shuffling.
//
// Why: an audit of the three shipped problems found the correct option at
// index 0 in 25/25 NDV fields and 13/13 dissection items, and never at index 0
// in any probe. Always clicking the top option scored 38/38 on the two
// surfaces that gate the build. Shuffling removes the positional tell without
// asking every author to remember to vary it.
//
// Why deterministic rather than Math.random per render: the order must be
// stable for the life of a question. A plain random shuffle re-runs on every
// React re-render, so options would reorder under the learner's cursor while
// they read. Seeding by (session, questionKey) also means a reload inside the
// same tab shows the same order, and — once sessions are persisted (M2) — the
// admin session map can reconstruct exactly what the learner saw.
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
