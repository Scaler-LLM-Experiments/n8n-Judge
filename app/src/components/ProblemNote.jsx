import React, { useRef, useState } from 'react';
import { X, DotsSixVertical, CaretDown, CaretRight } from '@phosphor-icons/react';
import { ConceptFlow } from './ConceptFlow.jsx';

// Faint-yellow "sticky note" reference card. Draggable (header) and resizable
// (corner). The flow diagram is tucked into a collapsible dropdown so the note
// stays small on tight screens.
const COMPACT = { w: 300, h: 260 };
const EXPANDED = { w: 384, h: 560 };

export function ProblemNote({ problem, onHide }) {
  const [pos, setPos] = useState({ x: 24, y: 96 });
  const [size, setSize] = useState(COMPACT);
  const [showDiagram, setShowDiagram] = useState(false);
  const mode = useRef(null);
  const start = useRef(null);

  // Toggling the flow diagram grows/shrinks the whole note so the full sketch
  // has room to breathe.
  const toggleDiagram = () =>
    setShowDiagram((s) => {
      const next = !s;
      setSize(next ? EXPANDED : COMPACT);
      return next;
    });

  const begin = (kind) => (e) => {
    mode.current = kind;
    start.current = { mx: e.clientX, my: e.clientY, ...pos, ...size };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', end);
  };
  const onMove = (e) => {
    const s = start.current;
    if (!s) return;
    if (mode.current === 'drag') {
      setPos({ x: Math.max(4, s.x + e.clientX - s.mx), y: Math.max(60, s.y + e.clientY - s.my) });
    } else {
      setSize({ w: Math.max(240, s.w + e.clientX - s.mx), h: Math.max(150, s.h + e.clientY - s.my) });
    }
  };
  const end = () => {
    mode.current = null;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', end);
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        zIndex: 70,
        background: '#FEFAE7',
        border: '1px solid #E8DFA8',
        boxShadow: '0 14px 34px rgba(1,24,69,0.16)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        onPointerDown={begin('drag')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 10px', borderBottom: '1px solid #EAE1AE', cursor: 'grab', userSelect: 'none', flex: 'none' }}
      >
        <DotsSixVertical size={15} color="#B8A94E" />
        <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#8A7B2E' }}>The problem</span>
        <button type="button" onClick={onHide} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#8A7B2E', display: 'flex' }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: 14, overflowY: 'auto', flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--fg-1)' }}>{problem.title}</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--fg-2)' }}>{problem.statement}</div>

        <button
          type="button"
          onClick={toggleDiagram}
          style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: '#8A7B2E', padding: 0 }}
        >
          {showDiagram ? <CaretDown size={13} /> : <CaretRight size={13} />} Flow diagram
        </button>
        {showDiagram ? (
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
            <ConceptFlow direction="column" size="md" />
          </div>
        ) : null}
      </div>

      {/* resize handle */}
      <div
        onPointerDown={begin('resize')}
        style={{ position: 'absolute', right: 0, bottom: 0, width: 16, height: 16, cursor: 'nwse-resize', background: 'linear-gradient(135deg, transparent 50%, #D9CE84 50%)' }}
      />
    </div>
  );
}
