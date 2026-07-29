import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createVoice } from './voice.js';

// One way for any screen to make Iris speak.
//
// The default is a NO-OP, not an error, for the same reason TraceContext's is:
// dev routes, tests and anything rendered outside the journey must keep working.
// A missing provider should cost a spoken line, never a crash.

const noop = () => {};
const DEFAULT = {
  play: noop,
  prefetch: noop,
  stop: noop,
  setMuted: noop,
  setRate: noop,
  speaking: false,
  caption: null,
  amplitude: 0,
  muted: false,
  rate: 1,
  /** The clip a moment asked for, so a screen can drive its own mascot. */
  clip: null,
};

const VoiceContext = createContext(DEFAULT);

export function VoiceProvider({ children }) {
  const [state, setState] = useState({ speaking: false, caption: null, amplitude: 0, muted: false, rate: 1 });
  const [clip, setClip] = useState(null);
  const voiceRef = useRef(null);

  if (!voiceRef.current && typeof window !== 'undefined') {
    voiceRef.current = createVoice({
      // Rule 2 from voice.js: the mascot reacts even when muted, so this fires
      // from inside `play` before any audio work happens.
      onMoment: (_moment, wanted) => setClip(wanted),
    });
  }

  useEffect(() => {
    const v = voiceRef.current;
    if (!v) return undefined;
    const off = v.subscribe(setState);
    return () => {
      off();
      v.stop();
    };
  }, []);

  const value = useMemo(() => {
    const v = voiceRef.current;
    return {
      play: v ? (moment, vars) => v.play(moment, vars) : noop,
      prefetch: v ? (moment, vars) => v.prefetch(moment, vars) : noop,
      stop: v ? () => v.stop() : noop,
      setMuted: v ? (m) => v.setMuted(m) : noop,
      setRate: v ? (r) => v.setRate(r) : noop,
      ...state,
      clip,
    };
  }, [state, clip]);

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice() {
  return useContext(VoiceContext);
}
