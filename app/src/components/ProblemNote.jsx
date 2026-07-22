import React, { useRef, useState } from 'react';
import { X, DotsSixVertical, Note } from '@phosphor-icons/react';
import { ConceptFlow } from './ConceptFlow.jsx';

// A draggable "sticky" reference card. Starts top-left, can be dragged anywhere,
// and hidden. Shows the plain-language conceptual flow + the problem statement.
export function ProblemNote({ problem, onHide }) {
  const [pos, setPos] = useState({ x: 20, y: 92 });
  const drag = useRef(null);

  const onPointerDown = (e) => {
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    setPos({ x: Math.max(4, d.ox + e.clientX - d.sx), y: Math.max(64, d.oy + e.clientY - d.sy) });
  };
  const onPointerUp = () => {
    drag.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: 300,
        zIndex: 70,
        background: 'var(--surface-0)',
        border: '1px solid var(--border-strong)',
        boxShadow: '0 12px 32px rgba(1,24,69,0.18)',
      }}
    >
      <div
        onPointerDown={onPointerDown}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 10px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)', cursor: 'grab', userSelect: 'none' }}
      >
        <DotsSixVertical size={15} color="var(--fg-3)" />
        <Note size={14} weight="fill" color="var(--brand-primary)" />
        <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--fg-2)' }}>The problem</span>
        <button type="button" onClick={onHide} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)' }}>
          <X size={14} />
        </button>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{problem.title}</div>
        <ConceptFlow compact />
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--fg-2)', marginTop: 12 }}>{problem.statement}</div>
      </div>
    </div>
  );
}
