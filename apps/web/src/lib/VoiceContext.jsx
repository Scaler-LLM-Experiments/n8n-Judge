import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createVoice } from './voice.js';

// Two contexts, deliberately.
//
// `amplitude` updates on every animation frame while Iris speaks, because that is
// what makes the glow follow her voice. If the actions and the state share one
// context value, that value is a NEW object sixty times a second, and everything
// downstream pays for it:
//
//   * every consumer re-renders every frame, including screens that only ever
//     call `play` and never read a single piece of state;
//   * every effect with `voice` in its dependency array re-runs every frame. An
//     effect that calls `prefetch` then loops, because prefetching emits state,
//     which changes the context, which re-runs the effect. That is the crash that
//     took out the Understand screen.
//
// So: actions are memoised ONCE and never change. State lives separately, and only
// the two things that actually animate subscribe to it.
//
//   useVoiceActions()  play / prefetch / stop / setMuted / setRate — stable,
//                      safe in a dependency array
//   useVoice()         the above plus speaking / amplitude / caption / muted /
//                      rate / clip, for the glow and the narration control
//
// Both default to no-ops rather than throwing: dev routes, tests and anything
// outside the journey must keep working, and a missing provider should cost a
// spoken line, never a crash.

const noop = () => {};
const DEFAULT_ACTIONS = {
  play: noop,
  setUpcoming: noop,
  stop: noop,
  setMuted: noop,
  setRate: noop,
  // Getters, not state, so an animation can read the waveform every frame without
  // any of it going through React. See `getAnalyser` in voice.js.
  getAnalyser: () => null,
  getAmplitude: () => 0,
};
const DEFAULT_STATE = { speaking: false, caption: null, amplitude: 0, muted: false, rate: 1, clip: null };

const VoiceActionsContext = createContext(DEFAULT_ACTIONS);
const VoiceStateContext = createContext(DEFAULT_STATE);

export function VoiceProvider({ children, problem }) {
  const [state, setState] = useState(DEFAULT_STATE);
  const voiceRef = useRef(null);

  if (!voiceRef.current && typeof window !== 'undefined') {
    voiceRef.current = createVoice({
      // The problem carries its own lines (`problem.voice`), so the caption shown
      // before the server answers and the line the server renders resolve from the
      // same source.
      problem,
      problemSlug: problem?.id ?? problem?.slug ?? null,
      // Rule 2 in voice.js: the mascot reacts even when muted, so this fires from
      // inside `play` before any audio work happens.
      onMoment: (_moment, wanted) =>
        setState((s) => (s.clip === wanted ? s : { ...s, clip: wanted })),
    });
  }

  // A pending `stop()` from a teardown, cancelled if the effect comes straight back.
  const stopTimer = useRef(null);

  useEffect(() => {
    const v = voiceRef.current;
    if (!v) return undefined;

    // React's development StrictMode runs every effect, tears it down, and runs it
    // again. A plain `v.stop()` in the cleanup therefore fired a fraction of a second
    // after mount — and because child effects run BEFORE their parent's, the greeting
    // had already started. It was paused before a word came out, with
    // `play() was interrupted by a call to pause()` as the only trace, and the
    // screen's say-once guard meant it was never retried. The first line a learner
    // ever hears was silent, every session, in development.
    //
    // Deferring the stop by a tick tells the two apart: a StrictMode remount comes
    // straight back and cancels it, a real unmount never does.
    clearTimeout(stopTimer.current);

    // Keep the clip the mascot is on: it is set by `onMoment`, which fires before
    // any audio state exists, so a plain overwrite would drop it.
    const off = v.subscribe((next) => setState((s) => ({ ...next, clip: s.clip })));
    return () => {
      off();
      stopTimer.current = setTimeout(() => v.stop(), 0);
    };
  }, []);

  // Memoised with no dependencies: these read the ref, so they never need
  // rebuilding, and anything that depends on them never re-runs.
  const actions = useMemo(() => {
    const call = (name) => (...args) => voiceRef.current?.[name]?.(...args);
    return {
      play: call('play'),
      setUpcoming: call('setUpcoming'),
      stop: call('stop'),
      setMuted: call('setMuted'),
      setRate: call('setRate'),
      getAnalyser: () => voiceRef.current?.getAnalyser?.() ?? null,
      getAmplitude: () => voiceRef.current?.getAmplitude?.() ?? 0,
    };
  }, []);

  return (
    <VoiceActionsContext.Provider value={actions}>
      <VoiceStateContext.Provider value={state}>{children}</VoiceStateContext.Provider>
    </VoiceActionsContext.Provider>
  );
}

/**
 * Stable action handles. Use this in effects and handlers: it is safe in a
 * dependency array and does not change when Iris starts talking.
 */
export function useVoiceActions() {
  return useContext(VoiceActionsContext);
}

/**
 * Just "is Iris talking, and is she muted".
 *
 * For the indicator, which needs to know when to appear and nothing else. It reads
 * the waveform itself through `getAnalyser`, so pulling the whole state object in
 * would subscribe it to caption changes it does not use.
 */
export function useVoiceSpeaking() {
  const { speaking, muted } = useContext(VoiceStateContext);
  return { speaking, muted };
}

/**
 * Actions plus live state. Only for what must animate with the voice — the glow
 * and the narration control. Anything else wants `useVoiceActions`, or it
 * re-renders on every frame of every spoken line.
 */
export function useVoice() {
  const actions = useContext(VoiceActionsContext);
  const state = useContext(VoiceStateContext);
  return { ...actions, ...state };
}
