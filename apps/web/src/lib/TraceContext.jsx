import React, { createContext, useContext, useMemo } from 'react';

// One way for anything in the journey to report what happened.
//
// Threading a `trace` prop down was becoming the problem: the Ask-AI drawer sits
// inside TopBar, which every screen renders, so reaching it meant adding a prop
// to five components that have no interest in tracing. The NDV is three levels
// deep for the same reason.
//
// The default is a no-op rather than an error. Storybook-style dev routes, tests
// and any component rendered outside a session must keep working — a missing
// trace should cost a line in the admin timeline, never a crash.

const noop = () => {};

const TraceContext = createContext({ trace: noop, sessionId: null });

export function TraceProvider({ trace, sessionId, children }) {
  const value = useMemo(() => ({ trace: trace ?? noop, sessionId: sessionId ?? null }), [trace, sessionId]);
  return <TraceContext.Provider value={value}>{children}</TraceContext.Provider>;
}

/** @returns {{trace: (type: string, payload?: object) => void, sessionId: string|null}} */
export function useTraceContext() {
  return useContext(TraceContext);
}
