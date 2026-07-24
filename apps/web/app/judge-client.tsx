'use client';

import dynamic from 'next/dynamic';

// The entire ported prototype (canvas, GSAP mascot, hash-based dev routes)
// is browser-only — mount it client-side with SSR off. The #root wrapper
// preserves the prototype's `html, body, #root { height: 100% }` styling.
const App = dynamic(() => import('../src/App.jsx'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '100vh',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'system-ui, sans-serif',
        color: 'var(--fg-muted, #6b7280)',
      }}
    >
      Loading Judge…
    </div>
  ),
});

export function JudgeClient() {
  return (
    <div id="root">
      <App />
    </div>
  );
}
