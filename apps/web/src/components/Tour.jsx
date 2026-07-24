import React, { useLayoutEffect, useState } from 'react';
import { Button } from '../design-system/Button.jsx';

// Lightweight vignette / spotlight coach-mark tour. Each step targets an element
// by [data-tour="..."]; everything else is dimmed via a big box-shadow "hole".
export function Tour({ steps, onClose }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);

  const step = steps[i];

  useLayoutEffect(() => {
    if (!step) return;
    const measure = () => {
      const el = step.selector ? document.querySelector(step.selector) : null;
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 });
      } else {
        setRect(null); // centred step (no target)
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [step]);

  if (!step) return null;

  const isLast = i === steps.length - 1;
  const next = () => (isLast ? onClose() : setI((n) => n + 1));

  // tooltip placement: below the hole if room, else centred
  const tip = rect
    ? {
        top: Math.min(rect.top + rect.height + 14, window.innerHeight - 210),
        left: Math.min(Math.max(rect.left, 16), window.innerWidth - 340),
      }
    : { top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 165 };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      {rect ? (
        <div
          style={{
            position: 'fixed',
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: 12,
            boxShadow: '0 0 0 9999px rgba(1,24,69,0.62)',
            border: '2px solid var(--brand-primary)',
            pointerEvents: 'none',
            transition: 'all 220ms ease',
          }}
        />
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,24,69,0.62)' }} />
      )}

      <div
        style={{
          position: 'fixed',
          top: tip.top,
          left: tip.left,
          width: 330,
          background: 'var(--surface-0)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 16px 40px rgba(1,24,69,0.28)',
          padding: 18,
        }}
      >
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand-primary)', fontWeight: 700, marginBottom: 6 }}>
          {step.eyebrow || `Step ${i + 1} of ${steps.length}`}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-1)', marginBottom: 6 }}>{step.title}</div>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)', marginBottom: 16 }}>{step.body}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--fg-3)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            Skip tour
          </button>
          <Button variant="primary" size="sm" onClick={next}>
            {isLast ? 'Got it' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
