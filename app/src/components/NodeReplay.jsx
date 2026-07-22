import React, { useEffect, useRef, useState } from 'react';
import { EnvelopeSimpleOpen, Sparkle, BracketsCurly, ArrowsSplit, PaperPlaneTilt, XCircle } from '@phosphor-icons/react';

const STEP_ICON = {
  email: EnvelopeSimpleOpen,
  trigger: EnvelopeSimpleOpen,
  classify: Sparkle,
  parse: BracketsCurly,
  switch: ArrowsSplit,
  action: PaperPlaneTilt,
  dead: XCircle,
};

// Reveals `steps` (from engine/simulate.js's simulateCase) one at a time on a
// timer, inside the same dotted-grid canvas style used elsewhere in the app.
// Self-contained: does not depend on any styling BuildStage.jsx injects.
export function NodeReplay({ steps, label }) {
  const [revealed, setRevealed] = useState(0);
  const timers = useRef([]);

  useEffect(() => {
    setRevealed(0);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    steps.forEach((_, i) => {
      timers.current.push(setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), 300 + i * 420));
    });
    return () => timers.current.forEach(clearTimeout);
  }, [steps]);

  return (
    <div
      style={{
        width: '100%',
        border: '1px solid var(--border-strong)',
        background: '#E9ECF2',
        backgroundImage: 'radial-gradient(#C4CAD4 1px, transparent 1px)',
        backgroundSize: '16px 16px',
        padding: 18,
        textAlign: 'left',
        minHeight: 120,
      }}
    >
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand-primary)' }} />
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {steps.slice(0, revealed).map((s, i) => {
          const Icon = STEP_ICON[s.iconType] || Sparkle;
          const color = s.status === 'dead' ? 'var(--status-danger)' : s.status === 'done' ? 'var(--brand-primary)' : 'var(--fg-2)';
          return (
            <div key={i} className="node-replay-step" style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, color: 'var(--fg-1)' }}>
              <Icon size={16} weight="fill" color={color} style={{ flex: 'none', marginTop: 1 }} />
              <span>{s.text}</span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes node-replay-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .node-replay-step { animation: node-replay-fadein 0.32s ease-out; }
      `}</style>
    </div>
  );
}
