import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { X, CheckCircle, DotsSixVertical } from '@phosphor-icons/react';
import { Card } from '../design-system/Card.jsx';
import { ConceptFlow } from './ConceptFlow.jsx';

// Problem statement. Default: centered modal. `side`: a large right-hand drawer.
// `sticky`: a right-hand drawer styled as the "problem" sticky note, fully
// expanded with the flow diagram (used in the Build stage via the nav icon).
export function ProblemStatementPanel({ problem, onClose, side, sticky }) {
  const panelRef = useRef(null);
  useEffect(() => {
    if (!panelRef.current) return;
    if (side || sticky) gsap.fromTo(panelRef.current, { xPercent: 100 }, { xPercent: 0, duration: 0.32, ease: 'power3.out' });
    else gsap.fromTo(panelRef.current, { scale: 0.96, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'power3.out' });
  }, [side, sticky]);

  if (sticky) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(1,24,69,0.35)', zIndex: 60, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
        <div
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
          style={{ width: 440, maxWidth: '92%', height: '100%', background: '#FEFAE7', borderLeft: '1px solid #E8DFA8', boxShadow: '-16px 0 46px rgba(1,24,69,0.18)', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 16px', borderBottom: '1px solid #EAE1AE', flex: 'none' }}>
            <DotsSixVertical size={16} color="#B8A94E" />
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#8A7B2E' }}>The problem</span>
            <button type="button" onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#8A7B2E', display: 'flex' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ padding: '18px 20px 28px', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: 'var(--fg-1)' }}>{problem.title}</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--fg-2)' }}>{problem.statement}</div>
            <div style={{ marginTop: 22, marginBottom: 6, fontSize: 12, fontWeight: 700, color: '#8A7B2E', display: 'flex', alignItems: 'center', gap: 6 }}>Flow diagram</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <ConceptFlow direction="column" size="md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const body = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <h4 style={{ margin: 0, fontSize: side ? 17 : 15 }}>{problem.title}</h4>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-2)' }}>
          <X size={18} />
        </button>
      </div>
      <div style={{ padding: 20, overflowY: 'auto' }}>
        <div style={{ fontSize: side ? 14.5 : 13.5, lineHeight: 1.65, color: 'var(--fg-1)', background: 'var(--surface-soft-blue)', border: '1px solid var(--brand-blue-100)', padding: 16, marginBottom: 20 }}>
          {problem.statement}
        </div>
        <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--fg-2)', fontWeight: 700, marginBottom: 8, letterSpacing: '0.04em' }}>
          What Run will check
        </div>
        {problem.testCaseSummary.map((line) => (
          <div key={line} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--surface-1)', fontSize: side ? 13.5 : 13, lineHeight: 1.5, color: 'var(--fg-1)' }}>
            <CheckCircle size={17} color="var(--brand-primary)" style={{ marginTop: 1, flex: 'none' }} />
            {line}
          </div>
        ))}
      </div>
    </>
  );

  if (side) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(1,24,69,0.35)', zIndex: 60, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
        <div ref={panelRef} onClick={(e) => e.stopPropagation()} style={{ width: 600, maxWidth: '92%', height: '100%', background: 'var(--surface-0)', borderLeft: '1px solid var(--border-strong)', boxShadow: '-16px 0 46px rgba(1,24,69,0.18)', display: 'flex', flexDirection: 'column' }}>
          {body}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(1, 24, 69, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }} onClick={onClose}>
      <Card padding={0} style={{ width: 480, maxHeight: '80%', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div ref={panelRef}>{body}</div>
      </Card>
    </div>
  );
}
