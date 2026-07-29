import { captionFor, clipFor, fillLine, hasMoment, pickLine } from './voiceLines.js';

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
//  3. QUEUE WITHIN A CONTEXT, CUT ACROSS ONE. Two beats about the same thing
//     should not talk over each other, so a new moment in the same context parks
//     in a SINGLE slot and the latest wins.
//
//     But a learner moving fast has moved ON, and finishing the old line first
//     means the new one arrives late and the old one describes a screen they can
//     no longer see. So a moment from a DIFFERENT context cuts the current line
//     dead and starts immediately. Being interrupted mid-sentence is correct
//     behaviour here: it is what a person does when you change the subject.
//
//  4. TEAR THE GRAPH DOWN. Web Audio nodes do not get collected while connected,
//     so every finished line disconnects its source and analyser. Without this a
//     long session accumulates dead graphs until audio stops working entirely.

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

export function createVoice({ fetchImpl, onMoment, problemSlug, problem } = {}) {
  const doFetch = fetchImpl ?? (typeof fetch === 'function' ? fetch.bind(globalThis) : null);

  let muted = read(MUTE_KEY, 'false') === 'true';
  let rate = Number(read(RATE_KEY, '1')) || 1;
  let speaking = false;
  let caption = null; // { moment, text }
  /** 0..1, drives the mascot's pulse and the speaking bubble. */
  let amplitude = 0;
  let pending = null; // single slot within a context, latest wins
  let token = 0; // invalidates in-flight work when muted or superseded
  /** What the current line is about, so a change of subject can cut it. */
  let scope = null;

  /**
   * Warmed clips, so `play` can start with no network wait at all.
   *
   * This is the fix for the delay between a click and Iris speaking. Rendering a
   * line takes a round trip plus the vendor's own generation time, which is
   * one to three seconds — long enough that the verdict arrives after the learner
   * has already moved on. Nothing can make an unrendered line instant, so the
   * answer is to render it BEFORE it is needed.
   *
   * The trick is that the branch points are all predictable: when a question is on
   * screen we know the next line is either `answer_correct` or `answer_wrong`, so
   * both get warmed while the learner is still reading. Same for verify and for a
   * run. By the time they click, the audio is already in memory.
   *
   * Bounded and one-shot, per the porting guide: consumed on play so variants
   * still rotate, and capped so a long session cannot accumulate blobs.
   */
  const warmed = new Map(); // warmKey -> { variant, caption, blob }
  // Room for both verdicts across a question's options, since a warmed clip is
  // per WORDING and a line naming the learner's choice has one per choice.
  const MAX_WARM = 12;

  /**
   * A warmed clip is keyed by everything that changes the words, not just the
   * moment.
   *
   * This was the bug behind "it does not say the node name". `verify_pass` was
   * warmed on NDV open with no vars, so the server rendered "Yes, {node} is set up
   * right" with an empty node — and `play` then consumed that clip, so the name
   * never appeared however carefully it was passed in. Keying by moment alone
   * silently discards the variables.
   */
  // NOTE: `scope` is deliberately absent. It decides whether a line is cut, not
  // what the line says, so including it would store the same audio twice.
  const warmKey = (moment, vars = {}) => `${moment}|${vars.key ?? ''}|${vars.node ?? ''}|${vars.answer ?? ''}`;

  let audioEl = null;
  let ctx = null;
  let sourceNode = null;
  let analyser = null;
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
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const teardown = () => {
    stopMeter();
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
    try {
      sourceNode?.disconnect();
      analyser?.disconnect();
    } catch {
      /* already gone */
    }
    sourceNode = null;
    analyser = null;
    if (audioEl) {
      try {
        audioEl.pause();
        audioEl.src = '';
      } catch {
        /* already gone */
      }
      audioEl = null;
    }
  };

  const finish = () => {
    teardown();
    speaking = false;
    caption = null;
    amplitude = 0;
    const next = pending;
    pending = null;
    emit();
    if (next) start(next.moment, next.vars);
  };

  /**
   * Amplitude from the time domain (RMS), not by averaging frequency bins.
   * RMS tracks the envelope of speech, which is what makes the mascot look like
   * it is talking; a frequency average barely moves.
   */
  const runMeter = () => {
    if (!analyser) return;
    const buf = new Uint8Array(analyser.fftSize);
    const tick = () => {
      if (!analyser) return;
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      // Boost then low-pass smooth, so the bubble breathes instead of flickering.
      const target = Math.min(1, rms * 3.2);
      amplitude = amplitude * 0.6 + target * 0.4;
      emit();
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  };

  /** Caption-only: no audio, but the line is still read and the bubble still moves. */
  const speakSilently = (text) => {
    // A slow synthetic envelope, so the mascot does not sit frozen while the
    // caption is up. Two summed sines, smoothed exactly like the real path.
    const started = Date.now();
    const tick = () => {
      const t = Date.now() - started;
      const target = 0.42 + 0.26 * Math.sin(t / 220) + 0.1 * Math.sin(t / 95);
      amplitude = amplitude * 0.6 + Math.max(0, Math.min(1, target)) * 0.4;
      emit();
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    fallbackTimer = setTimeout(finish, estimate(text));
  };

  /**
   * Fetch one line. Returns what is needed to play it, or null when there is no
   * audio to be had (flag off, no key, vendor error, network failure) — in which
   * case the caller shows the caption instead.
   */
  async function fetchLine(moment, variant, vars) {
    if (!doFetch) return null;
    try {
      const qs = new URLSearchParams({ moment, variant: String(variant) });
      // The problem and the node decide WHICH line; `node` fills it in.
      if (problemSlug) qs.set('problem', problemSlug);
      if (vars?.key) qs.set('key', vars.key);
      if (vars?.node) qs.set('node', vars.node);
      const res = await doFetch(`/api/voice?${qs}`, { cache: 'no-store' });

      let caption = null;
      const served = res?.headers?.get?.('X-Voice-Text');
      if (served) {
        try {
          caption = decodeURIComponent(served);
        } catch {
          caption = null;
        }
      }

      // 204 is "no audio by design": the caption still came back.
      if (!res.ok || res.status === 204) return { blob: null, caption };
      return { blob: await res.blob(), caption };
    } catch {
      return null;
    }
  }

  function remember(key, entry) {
    if (warmed.size >= MAX_WARM) {
      const oldest = warmed.keys().next().value;
      if (oldest !== undefined) warmed.delete(oldest);
    }
    warmed.set(key, entry);
  }

  async function start(moment, vars) {
    scope = vars?.scope ?? null;
    // A warmed clip is consumed here, which is what makes the common path
    // instant: no fetch, no vendor call, straight to playback.
    const wk = warmKey(moment, vars);
    const hit = warmed.get(wk);
    if (hit) warmed.delete(wk);

    const picked = hit ? { index: hit.variant, line: null } : pickLine(moment, undefined, { problem, key: vars?.key });
    if (!picked) return;

    const mine = ++token;
    speaking = true;
    caption = { moment, text: hit?.caption ?? captionFor(fillLine(picked.line, vars)) };
    amplitude = 0;
    emit();

    let fetched = hit ? { blob: hit.blob, caption: hit.caption } : await fetchLine(moment, picked.index, vars);

    // Muted or superseded while the request was in flight.
    if (mine !== token) return;

    // Prefer the caption the server sent: that is the text belonging to the audio
    // actually about to play.
    if (fetched?.caption) caption = { moment, text: fetched.caption };

    if (!fetched?.blob) {
      emit();
      speakSilently(caption.text);
      return;
    }

    let blobUrl = null;
    try {
      blobUrl = URL.createObjectURL(fetched.blob);

      audioEl = new Audio(blobUrl);
      audioEl.playbackRate = rate;
      audioEl.onended = finish;
      audioEl.onerror = finish;

      // Route through Web Audio so the analyser can drive the mascot. If any of
      // it fails, play the bare element instead: no pulse, but audible.
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          ctx = ctx ?? new AC();
          if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
          sourceNode = ctx.createMediaElementSource(audioEl);
          analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          sourceNode.connect(analyser);
          analyser.connect(ctx.destination);
          runMeter();
        }
      } catch {
        analyser = null;
        sourceNode = null;
      }

      await audioEl.play();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    } catch {
      // Autoplay refused, or a decode failure. Fall back to the caption rather
      // than leaving the learner with a silent screen and no words.
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      teardown();
      if (mine !== token) return;
      speakSilently(caption.text);
    }
  }

  return {
    /** Fire and forget. Safe from a handler, an effect, or a render path. */
    play(moment, vars = {}) {
      if (!hasMoment(moment)) return;

      // Rule 2: the mascot reacts first, and regardless of mute.
      try {
        onMoment?.(moment, clipFor(moment));
      } catch {
        /* a mascot failure must not stop the line */
      }

      if (muted) return;

      if (speaking) {
        const incoming = vars?.scope ?? null;
        // Same subject: let the current line finish and park this one.
        if (incoming === scope) {
          pending = { moment, vars };
          return;
        }
        // Different subject: the learner has moved on, so stop talking about the
        // old one. Anything parked is dropped with it — it was about the old
        // context too.
        token += 1;
        pending = null;
        teardown();
        speaking = false;
        caption = null;
        amplitude = 0;
      }

      start(moment, vars);
    },

    /**
     * Warm a line so the next `play` of it starts instantly.
     *
     * Call it at a lead point, for every outcome that is possible next. Cheap to
     * over-call: the server caches rendered bytes, so warming a line a second
     * time costs one request and no vendor billing.
     */
    prefetch(moment, vars = {}) {
      const wk = warmKey(moment, vars);
      if (!hasMoment(moment) || muted || warmed.has(wk)) return;
      const picked = pickLine(moment, undefined, { problem, key: vars?.key });
      if (!picked) return;
      // Reserve the slot immediately so two callers cannot both fetch it.
      remember(wk, { variant: picked.index, caption: captionFor(fillLine(picked.line, vars)), blob: null });
      fetchLine(moment, picked.index, vars).then((got) => {
        if (!got) {
          warmed.delete(wk);
          return;
        }
        // Keep the entry even with no blob: the server's caption is still better
        // than the locally-picked one, and it records that there is no audio.
        remember(wk, { variant: picked.index, caption: got.caption ?? captionFor(fillLine(picked.line, vars)), blob: got.blob });
      });
    },

    /** Stop now and drop anything parked. */
    stop() {
      token += 1;
      pending = null;
      scope = null;
      teardown();
      speaking = false;
      caption = null;
      amplitude = 0;
      emit();
    },

    setMuted(next) {
      muted = Boolean(next);
      write(MUTE_KEY, muted);
      if (muted) {
        warmed.clear();
        this.stop();
      }
      else emit();
    },

    setRate(next) {
      rate = Number(next) || 1;
      write(RATE_KEY, rate);
      // Applied live, so a change mid-line takes effect immediately.
      if (audioEl) audioEl.playbackRate = rate;
      emit();
    },

    getState() {
      return { speaking, caption, amplitude, muted, rate };
    },

    subscribe(fn) {
      listeners.add(fn);
      fn(this.getState());
      return () => listeners.delete(fn);
    },
  };
}
