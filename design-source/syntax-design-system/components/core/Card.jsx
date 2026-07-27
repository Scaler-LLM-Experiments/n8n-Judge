import React from 'react';

/**
 * Card — the brand's surface primitive. Pure rectangle, 1px hairline border,
 * no drop shadow. `tone` switches the background; `interactive` adds a hover
 * border darken + soft navy lift (used for clickable cards).
 */
export function Card({ tone = 'default', interactive = false, padding = 24, children, style, ...rest }) {
  const [hover, setHover] = React.useState(false);

  const tones = {
    default: { background: 'var(--surface-0)', borderColor: 'var(--border-subtle)' },
    soft:    { background: 'var(--surface-2)', borderColor: 'var(--border-subtle)' },
    blue:    { background: 'var(--surface-soft-blue)', borderColor: 'var(--brand-blue-100)' },
    deep:    { background: 'var(--surface-deep)', borderColor: 'rgba(255,255,255,0.10)', color: 'var(--fg-inverse)' },
  };
  const t = tones[tone] || tones.default;

  return (
    <div
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      style={{
        boxSizing: 'border-box',
        padding,
        border: '1px solid',
        borderRadius: 0,
        transition: 'border-color 140ms var(--ease-standard,ease), box-shadow 140ms var(--ease-standard,ease)',
        ...t,
        ...(interactive && hover ? { borderColor: 'var(--border-strong)', boxShadow: 'var(--shadow-md)' } : null),
        cursor: interactive ? 'pointer' : 'default',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
