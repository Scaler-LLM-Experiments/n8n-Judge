import { captionFor, clipFor, fillLine, hasMoment, pickLine, resolveLines, speakingVars } from './voiceLines.js';
import { clipId, clipUrl } from './voicePath.js';

// Iris speaking, client side.
//
// The architecture is the porting guide's (docs/mascot-system-porting-guide.md
// §5): a "moment" abstraction, a busy latch, a single-slot pending queue, and
// silent degradation everywhere. Callers do `voice.play('verify_pass')` and never
// think about it again.
//
// Four rules, all load-bearing:
//
//  1. NEVER throw at the caller. Narration is the least important thing on the
//     page. No key, a dead network, a browser that blocks autoplay: every one of
//     them ends as "caption only", never as a broken screen.
//
//  2. ALWAYS notify the mascot first, before any audio work and even when muted.
//     A learner who turned the sound off should still see Iris react. The visual
//     beat is the part that carries the moment; the audio is a bonus.
//
//  3. ONE LINE AT A TIME, AND THE NEWEST WINS. A new moment always cuts whatever
//     is playing.
//
//     This started as a queue — park the new line, let the old one finish — and
//     that was wrong in practice. Whatever is being said is about a moment that has
//     already passed; the new one is about now. Letting the old line finish makes
//     the new one late AND makes the learner listen to a description of a screen
//     they can no longer see. Two seconds of stale narration is worse than an
//     interrupted sentence.
//
//     So there is no pending slot at all. Being cut off mid-sentence is correct
//     behaviour: it is what a person does when you change the subject.
//
//  4. TEAR THE GRAPH DOWN. Web Audio nodes do not get collected while connected,
//     so every finished line disconnects its source and analyser. Without this a
//     long session accumulates dead graphs until audio stops working entirely.
//
// ---------------------------------------------------------------------------
// The transport, and why it changed
// ---------------------------------------------------------------------------
// This used to `fetch()` a query URL, `await res.blob()`, and make an object URL.
// That was the latency. Three problems, each enough on its own:
//
//   the URL was `no-store`, so the browser could never reuse a clip;
//   awaiting the blob meant waiting for the WHOLE file before any sound;
//   a hand-rolled warm cache was reimplementing the HTTP cache, worse.
//
// Now: `new Audio(stableUrl)`. The browser starts on the first few KB, streams the
// rest, honours Range, and keeps the file for a year. The caption comes from the
// local phrase book, so playback needs no request of its own at all.
//
// Preloading is `link rel=preload` on the same URL — it warms the HTTP cache, which
// means the element finds the bytes already there. No parallel cache to maintain.

const MUTE_KEY = 'judge.voice.muted';
const RATE_KEY = 'judge.voice.rate';

/** Spoken-duration estimate for the caption-only path, in ms. */
const estimate = (text) => Math.max(2400, text.split(/\s+/).length * 380);

const read = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* private mode must not break narration */
  }
};

export function createVoice({ onMoment, problemSlug, problem } = {}) {
  let muted = read(MUTE_KEY, 'false') === 'true';
  let rate = Number(read(RATE_KEY, '1')) || 1;
  let speaking = false;
  let caption = null; // { moment, text }
  /** 0..1, drives the glow. */
  let amplitude = 0;
  let token = 0;

  /**
   * Which wording a moment uses, decided ONCE per session per line.
   *
   * `pickLine` with no index picks at random, and that quietly broke preloading:
   * the URL warmed was a different variant from the one played, so every preload
   * missed and every play was a cold fetch. Variety still matters — hearing one
   * identical sentence twenty times is what makes narration feel canned — so the
   * choice is seeded per browser session instead of per call. Different learners,
   * and the same learner tomorrow, hear different wordings; within one session the
   * preload and the play always agree.
   */
  const sessionSeed = (() => {
    if (typeof window === 'undefined') return 'ssr';
    try {
      const k = 'judge.voice.seed';
      let v = window.sessionStorage.getItem(k);
      if (!v) {
        v = Math.random().toString(36).slice(2);
        window.sessionStorage.setItem(k, v);
      }
      return v;
    } catch {
      return 'no-storage';
    }
  })();

  const variantFor = (moment, vars = {}) => {
    const id = `${sessionSeed}:${moment}:${vars.key ?? ''}:${vars.node ?? ''}:${vars.answer ?? ''}`;
    let h = 0x811c9dc5;
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0);
  };

  /** The wording for a moment: same answer every time within a session. */
  const lineFor = (moment, vars) => pickLine(moment, variantFor(moment, vars), { problem, key: vars?.key });

  /**
   * The URL for a line, or null if there is no audio for it.
   *
   * LOOKED UP, never derived. The clip table (`problem.voiceClips`) is written by the
   * generator and shipped with the problem, so the only names this asks for are names
   * that were actually rendered.
   *
   * The old version rebuilt the path here from the moment, node and variant — the
   * same rule the generator applied, implemented twice. They drifted, and because a
   * miss was answered by rendering the line live, the cost of the drift was an
   * Deepgram call and a visible pause on nearly every line a learner heard.
   *
   * Null is a normal answer: no voice generated yet, or a line added since the last
   * run. It means caption only, and — importantly — NO REQUEST AT ALL, rather than a
   * 404 per beat.
   */
  const urlFor = (moment, vars, index) => {
    // Only the variables this wording interpolates take part in the id — see
    // `speakingVars`. Screens pass everything they have (`{ key, node, answer,
    // scope }`) and cannot know whether the line they are about to hear is the
    // generic "Yes, {node} is set up right" or a hand-authored sentence that names
    // the node itself. The phrase book knows, so it decides, here and in the
    // generator, from the same function.
    const lines = resolveLines(moment, { problem, key: vars?.key });
    const id = clipId(moment, vars?.key, speakingVars(lines, vars ?? {}), index);
    const entry = problem?.voiceClips?.[id];
    return entry?.file ? clipUrl(entry.file) : null;
  };

  /** What is likely next. The first few are preloaded into the HTTP cache. */
  let upcoming = [];
  const WARM_AHEAD = 3;
  const preloaded = new Set();

  /**
   * Set once audio has proved unavailable, and never retried this session.
   *
   * Narration off, no key, or nothing generated yet all look the same from here: a
   * 404 on the clip. Without this the app asks again for every single line, which
   * is a request and a console error per beat for a learner who was always going to
   * get captions. One failure is enough to know.
   */
  let audioUnavailable = false;

  let audioEl = null;
  let ctx = null;
  let analyser = null;
  // How often the meter publishes to React. Roughly 12/sec: enough for anything
  // reading `amplitude` out of context, far below the frame rate that made every
  // consumer re-render on every tick.
  const EMIT_INTERVAL_MS = 80;
  let rafId = null;
  let fallbackTimer = null;

  const listeners = new Set();
  const emit = () => {
    for (const fn of listeners) {
      try {
        fn({ speaking, caption, amplitude, muted, rate });
      } catch {
        /* a broken subscriber must not stop narration */
      }
    }
  };

  const stopMeter = () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
  };

  /**
   * Stop and dismantle. `pause()` then reset `currentTime`, which is what actually
   * silences an element mid-stream — clearing `src` alone can leave a buffered
   * fragment playing out.
   */
  const teardown = () => {
    stopMeter();
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
    if (audioEl) {
      try {
        audioEl.pause();
        audioEl.currentTime = 0;
        audioEl.onended = null;
        audioEl.onerror = null;
      } catch {
        /* already gone */
      }
      audioEl = null;
    }
    // The analyser is reused across lines; only the per-element source is dropped,
    // which happens when the element is garbage collected.
    analyser = null;
  };

  const finish = () => {
    teardown();
    speaking = false;
    caption = null;
    amplitude = 0;
    emit();
  };

  /**
   * Amplitude from the time domain (RMS), not a frequency average: RMS tracks the
   * envelope of speech, which is what makes the glow look like talking.
   */
  const runMeter = () => {
    if (!analyser) return;
    const buf = new Uint8Array(analyser.fftSize);
    let lastEmit = 0;
    const tick = () => {
      if (!analyser) return;
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      amplitude = amplitude * 0.6 + Math.min(1, Math.sqrt(sum / buf.length) * 3.2) * 0.4;
      // Throttled, NOT per frame. `amplitude` is kept current every frame for
      // `getAmplitude`, but publishing it to React sixty times a second re-renders
      // every context consumer that often. The indicator reads the analyser itself
      // and writes to the DOM directly, so nothing needs frame-rate state.
      const now = performance.now();
      if (now - lastEmit > EMIT_INTERVAL_MS) {
        lastEmit = now;
        emit();
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  };

  /** Route an element through the analyser. Failure costs the glow, not the audio. */
  const wireAnalyser = (el) => {
    try {
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return;
      ctx = ctx ?? new AC();
      if (ctx.state === 'suspended') void ctx.resume();
      const node = ctx.createAnalyser();
      node.fftSize = 256;
      node.smoothingTimeConstant = 0.85;
      node.connect(ctx.destination);
      ctx.createMediaElementSource(el).connect(node);
      analyser = node;
      runMeter();
    } catch {
      // createMediaElementSource throws if the element already has a source. A
      // fresh element per line means that should not happen, and if it does the
      // line still plays.
      analyser = null;
    }
  };

  /** Caption only: no audio, but the line is read and the glow still breathes. */
  const speakSilently = (text) => {
    const started = Date.now();
    let lastEmit = 0;
    const tick = () => {
      const t = Date.now() - started;
      const target = 0.42 + 0.26 * Math.sin(t / 220) + 0.1 * Math.sin(t / 95);
      amplitude = amplitude * 0.6 + Math.max(0, Math.min(1, target)) * 0.4;
      const now = performance.now();
      if (now - lastEmit > EMIT_INTERVAL_MS) {
        lastEmit = now;
        emit();
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    fallbackTimer = setTimeout(finish, estimate(text));
  };

  /**
   * Warm the HTTP cache with `link rel=preload`.
   *
   * Not a parallel cache: this asks the browser to fetch the exact URL the audio
   * element will ask for, so the element finds it already there. The browser owns
   * eviction, revalidation and concurrency, all of which the old JS blob cache had
   * to fake.
   */
  const preload = (url) => {
    if (!url || audioUnavailable || typeof document === 'undefined' || preloaded.has(url)) return;
    preloaded.add(url);
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'audio';
    link.href = url;
    document.head.appendChild(link);
  };

  function warmUpcoming() {
    if (muted) return;
    let n = 0;
    for (const item of upcoming) {
      if (n >= WARM_AHEAD) break;
      const picked = lineFor(item.moment, item.vars ?? {});
      if (!picked) continue;
      n += 1;
      // The exact URL `start` will ask for, or the warm is wasted.
      preload(urlFor(item.moment, item.vars, picked.index));
    }
  }

  function start(moment, vars) {
    const picked = lineFor(moment, vars ?? {});
    if (!picked) return;

    const mine = ++token;
    speaking = true;
    // Straight from the local phrase book: no request needed to know the words.
    caption = { moment, text: captionFor(fillLine(picked.line, vars)) };
    amplitude = 0;
    emit();

    // The network is idle for the length of this line, and what comes next is known.
    warmUpcoming();

    const url = urlFor(moment, vars, picked.index);
    // No audio for this line, so do not ask for any. A line the generator has not
    // rendered is a caption, and asking anyway would be a 404 per beat for a learner
    // who was never going to hear it.
    if (!url || typeof Audio === 'undefined' || audioUnavailable) {
      speakSilently(caption.text);
      return;
    }

    const el = new Audio(url);
    el.preload = 'auto';
    el.playbackRate = rate;
    audioEl = el;
    wireAnalyser(el);

    el.onended = () => {
      if (mine === token) finish();
    };
    const fallBack = ({ permanent }) => {
      if (mine !== token) return;
      // A missing clip means nothing is generated or narration is off, which will
      // not change mid-session. An autoplay refusal might, so that one is not sticky.
      if (permanent) audioUnavailable = true;
      teardown();
      speaking = true;
      speakSilently(caption?.text ?? '');
    };

    el.onerror = () => fallBack({ permanent: true });
    el.play().catch((err) => fallBack({ permanent: err?.name !== 'NotAllowedError' }));
  }

  const api = {
    /**
     * Declare what may be said next, in likelihood order. The first few are
     * preloaded now and again while each line plays.
     */
    setUpcoming(list) {
      upcoming = Array.isArray(list) ? list.filter((i) => i && hasMoment(i.moment)) : [];
      warmUpcoming();
    },

    /** Fire and forget. Cuts whatever is playing: the newest line always wins. */
    play(moment, vars = {}) {
      if (!hasMoment(moment)) return;

      // The mascot reacts first, and regardless of mute.
      try {
        onMoment?.(moment, clipFor(moment));
      } catch {
        /* a mascot failure must not stop the line */
      }

      if (muted) return;

      // Whatever is playing is about a moment that has passed. Cut it.
      if (speaking) {
        token += 1;
        teardown();
        speaking = false;
        caption = null;
        amplitude = 0;
      }
      start(moment, vars);
    },

    stop() {
      token += 1;
      teardown();
      speaking = false;
      caption = null;
      amplitude = 0;
      emit();
    },

    setMuted(next) {
      muted = Boolean(next);
      write(MUTE_KEY, muted);
      if (muted) api.stop();
      else emit();
    },

    setRate(next) {
      rate = Number(next) || 1;
      write(RATE_KEY, rate);
      if (audioEl) audioEl.playbackRate = rate;
      emit();
    },

    getState() {
      return { speaking, caption, amplitude, muted, rate };
    },

    /**
     * The live AnalyserNode, for anything that wants to animate off the waveform
     * itself.
     *
     * Deliberately a getter rather than state. An indicator that reads this in its
     * own requestAnimationFrame loop and writes straight to the DOM costs zero
     * React renders; the same value delivered through context re-renders every
     * subscriber sixty times a second, which is the bug that took out the
     * Understand screen. Null when the audio could not be routed (no Web Audio, a
     * blocked element) — callers fall back to a synthetic pulse.
     */
    getAnalyser() {
      return analyser;
    },

    /** The smoothed RMS, for the same reason and without the loop. */
    getAmplitude() {
      return amplitude;
    },

    subscribe(fn) {
      listeners.add(fn);
      fn(api.getState());
      return () => listeners.delete(fn);
    },
  };

  return api;
}
