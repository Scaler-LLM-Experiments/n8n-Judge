import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { X, CheckCircle } from '@phosphor-icons/react';
import { Card } from '../design-system/Card.jsx';

// Problem statement. Default: centered modal. `side`: a large right-hand drawer
// (used in the Build stage via the nav File icon).
export function ProblemStatementPanel({ problem, onClose, side }) {
  const panelRef = useRef(null);
  useEffect(() => {
    if (!panelRef.current) return;
    if (side) gsap.fromTo(panelRef.current, { xPercent: 100 }, { xPercent: 0, duration: 0.32, ease: 'power3.out' });
    else gsap.fromTo(panelRef.current, { scale: 0.96, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'power3.out' });
  }, [side]);

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
