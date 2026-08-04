'use client';

import dynamic from 'next/dynamic';
import { Loading } from '../src/components/AsyncGate.jsx';

// The entire ported prototype (canvas, GSAP mascot, hash-based dev routes)
// is browser-only — mount it client-side with SSR off. The #root wrapper
// preserves the prototype's `html, body, #root { height: 100% }` styling.
//
// Loading reuses the same Iris cycle as AsyncGate ("Loading challenges…") so
// the first paint and the catalogue fetch feel like one wait, not two different
// spinners.
const App = dynamic(() => import('../src/App.jsx'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100vh' }}>
      <Loading label="Loading Judge…" />
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
