import React from 'react';

/**
 * Badge — a small status / category label. Sharp rectangle, no radius.
 * Tones map to the system status colors; `solid` fills with brand blue.
 */
export function Badge({ tone = 'neutral', solid = false, icon = null, children, style, ...rest }) {
  const tones = {
    neutral: { bg: 'var(--n-100)', fg: 'var(--fg-2)', bd: 'var(--border-subtle)' },
    info:    { bg: 'var(--status-info-bg)', fg: 'var(--status-info)', bd: 'var(--status-info-border)' },
    success: { bg: 'var(--status-success-bg)', fg: 'var(--status-success)', bd: 'var(--status-success-border)' },
    warning: { bg: 'var(--status-warning-bg)', fg: 'var(--status-warning)', bd: 'var(--status-warning-border)' },
    danger:  { bg: 'var(--status-danger-bg)', fg: 'var(--status-danger)', bd: 'var(--status-danger-border)' },
  };
  const t = tones[tone] || tones.neutral;
  const composed = solid
    ? { background: 'var(--brand-primary)', color: 'var(--fg-on-brand)', borderColor: 'var(--brand-primary)' }
    : { background: t.bg, color: t.fg, borderColor: t.bd };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 22,
        padding: '0 8px',
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: '0.01em',
        border: '1px solid',
        borderRadius: 0,
        ...composed,
        ...style,
      }}
      {...rest}
    >
      {icon ? <span style={{ display: 'inline-flex', flex: 'none' }}>{icon}</span> : null}
      {children}
    </span>
  );
}
