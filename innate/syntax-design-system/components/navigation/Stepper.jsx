import React from 'react';

/**
 * Stepper — progress through an ordered flow. Square markers: completed (brand
 * fill + check), active (brand outline), upcoming (grey). Horizontal or
 * vertical. Pass `steps` as { label, description? } and the 0-based `current`.
 */
export function Stepper({ steps = [], current = 0, orientation = 'horizontal', style, ...rest }) {
  const vertical = orientation === 'vertical';

  const marker = (state) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, flex: 'none', borderRadius: 0,
    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
    border: '1.5px solid',
    ...(state === 'done'
      ? { background: 'var(--brand-primary)', borderColor: 'var(--brand-primary)', color: '#fff' }
      : state === 'active'
      ? { background: 'var(--surface-0)', borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }
      : { background: 'var(--surface-0)', borderColor: 'var(--border-strong)', color: 'var(--fg-4)' }),
  });

  return (
    <div
      style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', alignItems: vertical ? 'stretch' : 'flex-start', gap: 0, ...style }}
      {...rest}
    >
      {steps.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'todo';
        const last = i === steps.length - 1;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: vertical ? 'row' : 'column', alignItems: vertical ? 'flex-start' : 'center', gap: vertical ? 14 : 8, flex: vertical ? 'none' : 1, position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', alignItems: 'center', gap: 0, width: vertical ? 'auto' : '100%' }}>
              {!vertical && i > 0 ? <span style={{ flex: 1, height: 2, background: i <= current ? 'var(--brand-primary)' : 'var(--border-subtle)' }} /> : null}
              <span style={marker(state)}>
                {state === 'done' ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="square"><polyline points="20 6 9 17 4 12" /></svg>
                ) : i + 1}
              </span>
              {!vertical && !last ? <span style={{ flex: 1, height: 2, background: i < current ? 'var(--brand-primary)' : 'var(--border-subtle)' }} /> : null}
              {vertical && !last ? <span style={{ width: 2, flex: 1, minHeight: 24, background: i < current ? 'var(--brand-primary)' : 'var(--border-subtle)', marginTop: 4 }} /> : null}
            </div>
            <div style={{ textAlign: vertical ? 'left' : 'center', paddingBottom: vertical && !last ? 20 : 0 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: state === 'todo' ? 500 : 600, color: state === 'todo' ? 'var(--fg-3)' : 'var(--fg-1)' }}>{s.label}</div>
              {s.description ? <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>{s.description}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
