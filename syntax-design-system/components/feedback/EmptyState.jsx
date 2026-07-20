import React from 'react';

/**
 * EmptyState — a thoughtful pause for no-data, no-results and first-run moments.
 * Square icon frame, restrained copy, optional action. Follows the brand voice:
 * "Nothing here yet." not "Oops!".
 */
export function EmptyState({ icon, title, description, action, align = 'center', style, ...rest }) {
  const centered = align === 'center';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: centered ? 'center' : 'flex-start',
        textAlign: centered ? 'center' : 'left',
        gap: 6,
        padding: '48px 24px',
        fontFamily: 'var(--font-body)',
        ...style,
      }}
      {...rest}
    >
      {icon ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            marginBottom: 10,
            color: 'var(--fg-3)',
            background: 'var(--surface-1)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {icon}
        </span>
      ) : null}
      {title ? <div style={{ fontFamily: 'var(--font-headline)', fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--fg-1)' }}>{title}</div> : null}
      {description ? <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--fg-3)', maxWidth: 360 }}>{description}</div> : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}
