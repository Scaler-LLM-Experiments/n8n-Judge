import React from 'react';

const ICONS = {
  info:    <path d="M12 16v-4M12 8h.01" />,
  success: <path d="m9 12 2 2 4-4" />,
  warning: <path d="M12 9v4M12 17h.01" />,
  danger:  <path d="M15 9l-6 6M9 9l6 6" />,
  neutral: <path d="M12 16v-4M12 8h.01" />,
};

/**
 * Alert — an inline, persistent message banner. Hairline border + soft status
 * tint (sharp corners). Optional title, dismiss button and a trailing action
 * node. For transient feedback use Toast instead.
 */
export function Alert({ tone = 'info', title, children, icon, onClose, action, style, ...rest }) {
  const tones = {
    info:    { fg: 'var(--status-info)', bg: 'var(--status-info-bg)', bd: 'var(--status-info-border)' },
    success: { fg: 'var(--status-success)', bg: 'var(--status-success-bg)', bd: 'var(--status-success-border)' },
    warning: { fg: 'var(--status-warning)', bg: 'var(--status-warning-bg)', bd: 'var(--status-warning-border)' },
    danger:  { fg: 'var(--status-danger)', bg: 'var(--status-danger-bg)', bd: 'var(--status-danger-border)' },
    neutral: { fg: 'var(--fg-2)', bg: 'var(--surface-1)', bd: 'var(--border-subtle)' },
  };
  const t = tones[tone] || tones.info;
  const glyph = icon !== undefined ? icon : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />{ICONS[tone] || ICONS.info}
    </svg>
  );

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        gap: 12,
        padding: '14px 16px',
        background: t.bg,
        border: `1px solid ${t.bd}`,
        borderRadius: 0,
        fontFamily: 'var(--font-body)',
        ...style,
      }}
      {...rest}
    >
      {glyph ? <span style={{ display: 'inline-flex', flex: 'none', color: t.fg, marginTop: 1 }}>{glyph}</span> : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title ? <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)', marginBottom: children ? 3 : 0 }}>{title}</div> : null}
        {children ? <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)' }}>{children}</div> : null}
        {action ? <div style={{ marginTop: 10 }}>{action}</div> : null}
      </div>
      {onClose ? (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onClose}
          style={{ flex: 'none', background: 'transparent', border: 0, padding: 2, margin: -2, cursor: 'pointer', color: 'var(--fg-3)', borderRadius: 0, lineHeight: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      ) : null}
    </div>
  );
}
