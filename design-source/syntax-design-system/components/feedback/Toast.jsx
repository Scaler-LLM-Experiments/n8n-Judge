import React from 'react';

const ICONS = {
  info:    <path d="M12 16v-4M12 8h.01" />,
  success: <path d="m9 12 2 2 4-4" />,
  warning: <path d="M12 9v4M12 17h.01" />,
  danger:  <path d="M15 9l-6 6M9 9l6 6" />,
};

/**
 * Toast — a single transient notification. Sharp corners, navy-elevated card
 * with a status-coloured edge. Presentational and controlled — render it
 * yourself or, more usually, via `ToastStack`. Calls `onClose` when dismissed.
 */
export function Toast({ tone = 'info', title, description, onClose, style, ...rest }) {
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

  const edges = { info: 'var(--brand-primary)', success: 'var(--status-success)', warning: 'var(--status-warning)', danger: 'var(--status-danger)' };
  const edge = edges[tone] || edges.info;

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        gap: 12,
        width: 340,
        maxWidth: '88vw',
        padding: '14px 14px 14px 16px',
        background: 'var(--surface-overlay)',
        color: '#fff',
        borderLeft: `3px solid ${edge}`,
        boxShadow: 'var(--shadow-lg)',
        animation: 'sbs-fade-up 240ms var(--ease-entrance,ease)',
        ...style,
      }}
      {...rest}
    >
      <span style={{ display: 'inline-flex', flex: 'none', color: edge, marginTop: 1 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />{ICONS[tone] || ICONS.info}
        </svg>
      </span>
      <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-body)' }}>
        {title ? <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div> : null}
        {description ? <div style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.78)', marginTop: title ? 2 : 0 }}>{description}</div> : null}
      </div>
      {onClose ? (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onClose}
          style={{ flex: 'none', background: 'transparent', border: 0, padding: 2, margin: -2, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', borderRadius: 0, lineHeight: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      ) : null}
    </div>
  );
}
