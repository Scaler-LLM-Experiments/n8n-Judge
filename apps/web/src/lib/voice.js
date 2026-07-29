// Iris speaking.
//
// The architecture is the one in docs/mascot-system-porting-guide.md §5 — a
// "moment" abstraction, a busy latch, a single-slot pending queue, silent
// degradation — but the audio source is different, and deliberately so.
//
// The guide's system pre-generates clips with a TTS vendor and serves them from
// S3 behind a backend. That is the right long-term answer (consistent voice,
// no per-play cost, name splicing) and it is also a project, not an afternoon.
// This uses the browser's own `speechSynthesis`: no key, no backend, no storage,
// works offline, ships today. The seam is the moment registry — swapping in
// fetched audio later means changing `speakNow()` and nothing else.
//
// Three rules, all from the guide and all load-bearing:
//
//   1. NEVER throw at the caller. Narration is the least important thing on the
//      page. A missing voice, a blocked autoplay, a browser without the API —
//      every one of them degrades to "no sound" or "caption only", never to a
//      broken screen. Callers do `speak('run_pass')` and forget it.
//   2. NEVER cut a line off mid-sentence for a newer one. Beats arrive in
//      bursts (a field verifies, the phase completes, the run starts). A new
//      moment parks in a SINGLE slot — latest wins, so a burst collapses to
//      "what is true now" instead of queueing three stale lines.
//   3. NEVER speak the answer. Same rule as Ask-AI: these lines narrate what
//      happened and what it means, never which option to pick.

const MUTE_KEY = 'judge.voice.muted';
const RATE_KEY = 'judge.voice.rate';

/**
 * Everything speakable, keyed by moment. An array means "pick one at random",
 * so a learner who verifies eight fields doesn't hear the same sentence eight
 * times — repetition is what makes narration feel canned.
 *
 * `{name}` interpolates from the vars passed to speak().
 *
 * Kept short on purpose: Chrome has historically cut long utterances off, and a
 * spoken line that outlasts the moment it describes is worse than no line.
 */
export const MOMENTS = {
  welcome: [
    "Hi, I'm Iris. I'll walk you through this one step at a time.",
    "I'm Iris. Let's build this together — I'll explain as we go.",
  ],
  problem_intro: "Here's today's problem. Read it, then we'll take it apart.",
  understand_start: "First, let's make sure you understand what this flow has to do.",

  answer_correct: [
    'That’s right.',
    'Exactly right.',
    'Good — that’s the one.',
  ],
  answer_wrong: [
    'Not quite. Read what I’ve written, then try again.',
    'That’s a reasonable guess, but no. Have a look at why.',
  ],

  build_start: 'Now the fun part — let’s build it on the canvas.',
  phase_intro: 'Next: {phase}.',
  node_placed: 'Good. Now open it and set it up.',
  node_wrong: 'That node can’t do what we need here. Let me show you why.',

  verify_pass: [
    'Set up correctly.',
    'That’s configured right.',
  ],
  verify_fail: 'Something in there isn’t right yet. Check what I’ve flagged.',

  run_start: 'Let’s run it against some real cases.',
  run_pass: 'Every case passed. That flow works.',
  run_fail: 'Some cases didn’t come out right. That’s useful — let’s see which.',

  stress_start: 'Now let’s see whether you know how what you built behaves.',
  report_ready: 'Here’s how you did, and what I’d work on next.',
};

/** Spoken duration estimate for the caption-only path, in ms. */
const estimate = (text) => Math.max(2200, text.split(/\s+/).length * 360);

const read = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* private mode / full storage must not break narration */
  }
};

const synth = () => (typeof window === 'undefined' ? null : window.speechSynthesis ?? null);

/** Pick a line for a moment and fill its vars. */
export function lineFor(moment, vars = {}, pick = Math.random) {
  const entry = MOMENTS[moment];
  if (!entry) return null;
  const raw = Array.isArray(entry) ? entry[Math.floor(pick() * entry.length) % entry.length] : entry;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '').trim());
}

/**
 * `speechSynthesis.getVoices()` is populated asynchronously and is empty on the
 * first call in most browsers, so a voice chosen eagerly is no voice at all.
 * Resolve lazily and cache once we actually get a list.
 */
let cachedVoice;
function preferredVoice() {
  const s = synth();
  if (!s) return null;
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = s.getVoices();
  if (!voices.length) return null; // try again next time; do not cache a miss

  const en = voices.filter((v) => /^en(-|_|$)/i.test(v.lang));
  const pool = en.length ? en : voices;
  // Prefer the higher-quality voices these engines ship, by name, then fall back
  // to whatever the platform gives us rather than refusing to speak.
  const nice = /samantha|serena|jenny|aria|sonia|natural|google us english|google uk english female/i;
  cachedVoice = pool.find((v) => nice.test(v.name)) ?? pool[0] ?? null;
  return cachedVoice;
}

export function createVoice({ speechSynthesis: injected } = {}) {
  const s = injected ?? synth();
  const supported = Boolean(s);

  let muted = read(MUTE_KEY, 'false') === 'true';
  let rate = Number(read(RATE_KEY, '1')) || 1;
  let speaking = false;
  let caption = null; // { moment, text, wordIndex }
  let pending = null; // single slot — latest wins
  let fallbackTimer = null;
  const listeners = new Set();

  const emit = () => {
    for (const fn of listeners) {
      try {
        fn({ speaking, caption, muted, rate, supported });
      } catch {
        /* a broken subscriber must not stop narration */
      }
    }
  };

  const finish = () => {
    speaking = false;
    caption = null;
    clearTimeout(fallbackTimer);
    const next = pending;
    pending = null;
    emit();
    if (next) speakNow(next.moment, next.vars);
  };

  function speakNow(moment, vars) {
    const text = lineFor(moment, vars);
    if (!text) return;

    speaking = true;
    caption = { moment, text, wordIndex: 0 };
    emit();

    // No API, or a voice list that hasn't loaded yet: show the line and time it
    // out. The guide calls this "the mascot still speaks" — the learner is never
    // left staring at a silent screen with no idea what just happened.
    if (!supported) {
      fallbackTimer = setTimeout(finish, estimate(text));
      return;
    }

    let u;
    try {
      u = new SpeechSynthesisUtterance(text);
    } catch {
      fallbackTimer = setTimeout(finish, estimate(text));
      return;
    }
    const voice = preferredVoice();
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = 1;
    // `onboundary` gives word-level progress where supported, which is what
    // drives caption highlighting. Where it doesn't fire, the caption simply
    // stays whole — degraded, not broken.
    u.onboundary = (e) => {
      if (e.name && e.name !== 'word') return;
      const upto = text.slice(0, e.charIndex ?? 0);
      caption = { moment, text, wordIndex: upto.trim() ? upto.trim().split(/\s+/).length : 0 };
      emit();
    };
    u.onend = finish;
    u.onerror = finish;

    // Belt and braces: if the engine never fires onend (it happens), don't leave
    // the latch stuck closed forever or narration dies for the rest of the session.
    fallbackTimer = setTimeout(finish, estimate(text) + 6000);

    try {
      s.speak(u);
    } catch {
      finish();
    }
  }

  return {
    /** Fire-and-forget. Safe to call from a render path, an effect, or a handler. */
    speak(moment, vars = {}) {
      if (!MOMENTS[moment]) return;
      if (muted) return;
      if (speaking) {
        pending = { moment, vars }; // latest wins
        return;
      }
      speakNow(moment, vars);
    },

    /** Stop immediately and drop anything parked — used when muting or unmounting. */
    stop() {
      pending = null;
      clearTimeout(fallbackTimer);
      if (supported) {
        try {
          s.cancel();
        } catch {
          /* nothing useful to do */
        }
      }
      speaking = false;
      caption = null;
      emit();
    },

    setMuted(next) {
      muted = Boolean(next);
      write(MUTE_KEY, muted);
      if (muted) this.stop();
      else emit();
    },

    setRate(next) {
      rate = Number(next) || 1;
      write(RATE_KEY, rate);
      emit();
    },

    getState() {
      return { speaking, caption, muted, rate, supported };
    },

    subscribe(fn) {
      listeners.add(fn);
      fn(this.getState());
      return () => listeners.delete(fn);
    },
  };
}
