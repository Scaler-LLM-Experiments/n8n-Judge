import React from 'react';

/**
 * Progress — a flat, square progress bar. Determinate by default (`value`
 * 0–100); set `indeterminate` for unknown-length work. Optional `label` +
 * `showValue` print above the track.
 */
export function Progress({ value = 0, indeterminate = false, label, showValue = false, height = 6, tone = 'brand', style, ...rest }) {
  React.useEffect(() => {
    if (document.getElementById('sbs-motion-kf')) return;
    const el = document.createElement('style');
    el.id = 'sbs-motion-kf';
    el.textContent = `
      @keyframes sbs-spin { to { transform: rotate(360deg); } }
      @keyframes sbs-shimmer { 0% { background-position: -160% 0; } 100% { background-position: 160% 0; } }
      @keyframes sbs-indeterminate { 0% { left: -40%; width: 40%; } 50% { width: 55%; } 100% { left: 100%; width: 40%; } }
      @keyframes sbs-fade-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes sbs-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      @keyframes sbs-scale-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }
    `;
    document.head.appendChild(el);
  }, []);

  const clamped = Math.max(0, Math.min(100, value));
  const fills = { brand: 'var(--brand-primary)', success: 'var(--status-success)', warning: 'var(--status-warning)', danger: 'var(--status-danger)' };
  const fill = fills[tone] || fills.brand;

  return (
    <div style={{ ...style }} {...rest}>
      {(label || showValue) ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: 'var(--font-body)', fontSize: 13 }}>
          {label ? <span style={{ color: 'var(--fg-2)', fontWeight: 500 }}>{label}</span> : <span />}
          {showValue && !indeterminate ? <span style={{ color: 'var(--fg-3)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(clamped)}%</span> : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ position: 'relative', overflow: 'hidden', height, background: 'var(--n-200)' }}
      >
        {indeterminate ? (
          <span style={{ position: 'absolute', top: 0, bottom: 0, background: fill, animation: 'sbs-indeterminate 1.3s var(--ease-soft,ease) infinite' }} />
        ) : (
          <span style={{ display: 'block', height: '100%', width: clamped + '%', background: fill, transition: 'width 400ms var(--ease-soft,ease)' }} />
        )}
      </div>
    </div>
  );
}
