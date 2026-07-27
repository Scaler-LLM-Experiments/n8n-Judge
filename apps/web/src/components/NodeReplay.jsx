import React, { useEffect, useRef, useState } from 'react';
import { EnvelopeSimpleOpen, Sparkle, BracketsCurly, ArrowsSplit, PaperPlaneTilt, XCircle } from '@phosphor-icons/react';
import { NodeFlowRow } from './NodeFlowRow.jsx';

const STEP_ICON = {
  email: EnvelopeSimpleOpen,
  trigger: EnvelopeSimpleOpen,
  classify: Sparkle,
  parse: BracketsCurly,
  switch: ArrowsSplit,
  action: PaperPlaneTilt,
  dead: XCircle,
};

// iconType -> the real node type/label shown in the actual-nodes row above
// the narration. 'email' isn't a graph node (it's the incoming message), so
// it's skipped when building that row.
const NODE_META = {
  trigger: { type: 'trigger', label: 'New Email' },
  classify: { type: 'classify', label: 'Classify with AI' },
  parse: { type: 'parse', label: 'Parse Result' },
  switch: { type: 'switch', label: 'Switch' },
  action: { type: 'action', label: 'Send Reply' },
};

// A 'dead' step sometimes IS a real node that exists in the graph — e.g. the
// Switch step when nothing matches, or Classify when no model is attached —
// simulate.js folds "this node ran" and "then it dead-ended" into one step
// (no separate 'ok' entry precedes it). Detect that from the text so the row
// still shows the real node (tagged wrong) instead of skipping straight to a
// bare "nothing here" marker.
function deadNodeMeta(text) {
  if (text.startsWith('Switch:')) return NODE_META.switch;
  if (text.startsWith('Classify with AI has no Chat Model')) return NODE_META.classify;
  return null;
}

function nodeRowItems(steps) {
  const items = [];
  steps.forEach((s, i) => {
    if (s.iconType === 'email') return;
    const active = i === steps.length - 1;
    if (s.iconType === 'dead') {
      const meta = deadNodeMeta(s.text);
      if (meta) items.push({ ...meta, active, tag: 'wrong' });
      else items.push({ dead: true });
      return;
    }
    const meta = NODE_META[s.iconType];
    if (!meta) return;
    items.push({ ...meta, active, tag: s.status === 'done' ? 'correct' : undefined });
  });
  return items;
}

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
      <NodeFlowRow items={nodeRowItems(steps.slice(0, revealed))} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
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
