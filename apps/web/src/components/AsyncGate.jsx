import React, { useEffect, useState } from 'react';
import { Button } from '../design-system/Button.jsx';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';

// Loading and failure states for anything the app now fetches instead of
// importing. Problems moved to the database, so app startup went from
// synchronous to async and every entry point needs these two states.

// The loading clips in companion.lottie. Cycled so a long fetch does not sit
// on one gag the whole time — each is a loop, held for a few seconds, then the
// next one takes over.
const LOADING_CLIPS = [
  'loading-orbit',
  'loading-pulse',
  'loading-bar',
  'processing',
];

/** How long each loading clip stays on screen before the next one. */
const CLIP_MS = 2800;

export function Loading({ label = 'Loading…' }) {
  const [clipIndex, setClipIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setClipIndex((i) => (i + 1) % LOADING_CLIPS.length),
      CLIP_MS,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        height: '100%',
        minHeight: 240,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: 'var(--surface-0)',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ width: 96, height: 96 }}>
        <MascotPlayer
          clip={LOADING_CLIPS[clipIndex]}
          once={false}
          onceDone={() => {}}
          pulse={false}
        />
      </div>
      <div
        style={{
          color: 'var(--fg-3)',
          fontSize: 14,
          fontFamily: 'var(--font-body, system-ui, sans-serif)',
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function LoadError({ error, onRetry }) {
  return (
    <div
      style={{
        height: '100%',
        minHeight: 240,
        display: 'grid',
        placeItems: 'center',
        background: 'var(--surface-0)',
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 460, textAlign: 'center', display: 'grid', gap: 14, justifyItems: 'center' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg-1)' }}>Couldn’t load this</div>
        <div style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6 }}>
          {String(error?.message || error || 'Something went wrong.')}
        </div>
        {onRetry ? (
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// Runs `load()` on mount (and on retry) and renders `children(value)` once it
// resolves. `deps` re-runs the load, the same way useEffect deps do.
export function AsyncGate({ load, deps = [], label, children }) {
  const [state, setState] = useState({ status: 'loading', value: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', value: null, error: null });
    Promise.resolve()
      .then(load)
      .then((value) => {
        if (!cancelled) setState({ status: 'ready', value, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', value: null, error });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  if (state.status === 'loading') return <Loading label={label} />;
  if (state.status === 'error') return <LoadError error={state.error} onRetry={() => setAttempt((a) => a + 1)} />;
  return children(state.value);
}
