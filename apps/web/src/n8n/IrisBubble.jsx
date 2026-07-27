import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';

// Iris explaining one decision. Extracted from Ndv so the Parameters and
// Settings tabs share a single voice — one node, one mascot — rather than each
// tab growing its own explanation surface.
export function IrisBubble({ tone, children }) {
  const ref = useRef(null);
  const correct = tone === 'correct';
  const c = correct ? 'var(--status-success)' : 'var(--status-danger)';
  useEffect(() => {
    if (ref.current) gsap.fromTo(ref.current, { x: -26, opacity: 0 }, { x: 0, opacity: 1, duration: 0.38, ease: 'back.out(1.4)' });
  }, []);
  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 11 }}>
      <div style={{ width: 46, height: 46, flex: 'none' }}>
        <MascotPlayer clip={correct ? 'correct' : 'shake-no'} once={false} onceDone={() => {}} />
      </div>
      <div style={{ position: 'relative', flex: 1, maxWidth: 300, background: 'var(--surface-0)', border: '1px solid var(--border-strong)', borderLeft: `3px solid ${c}`, boxShadow: '0 10px 26px rgba(1,24,69,0.14)', padding: '10px 12px' }}>
        <span style={{ position: 'absolute', left: -7, top: 15, width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: '7px solid var(--border-strong)' }} />
        <span style={{ position: 'absolute', left: -6, top: 15, width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: '7px solid var(--surface-0)' }} />
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: c, marginBottom: 3 }}>{correct ? 'Nailed it' : 'Not quite'}</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-1)' }}>{children}</div>
      </div>
    </div>
  );
}
