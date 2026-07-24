import React from 'react';

/**
 * Button — the brand's primary action control.
 * Sharp corners (radius 0), Plus Jakarta Sans, brand blue #0055FF.
 * Hover = brighter fill + outline ring + gentle center grow; press = center
 * shrink (scales down from the middle, never nudges from the bottom).
 * `link` variant renders as an inline text link (underline on hover).
 */
export function Button({
  variant = 'primary',
  size = 'md',
  icon = null,
  iconRight = null,
  disabled = false,
  type = 'button',
  onClick,
  children,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);

  const sizes = {
    xs: { height: 28, padding: '0 10px', font: 13 },
    sm: { height: 32, padding: '0 12px', font: 13 },
    md: { height: 36, padding: '0 16px', font: 14 },
    lg: { height: 56, padding: '0 28px', font: 16 },
    xl: { height: 80, padding: '0 49px', font: 20 },
  };
  const s = sizes[size] || sizes.md;

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: s.height,
    padding: s.padding,
    fontFamily: 'var(--font-body)',
    fontSize: s.font,
    fontWeight: 500,
    lineHeight: 1,
    border: '1px solid transparent',
    borderRadius: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition:
      'background-color 140ms var(--ease-standard,ease), color 140ms var(--ease-standard,ease), box-shadow 180ms var(--ease-standard,ease), transform 120ms var(--ease-standard,ease)',
    transformOrigin: 'center center',
    transform:
      disabled || variant === 'link'
        ? 'none'
        : active
        ? 'scale(0.94)'
        : hover
        ? 'scale(1.02)'
        : 'none',
    whiteSpace: 'nowrap',
  };

  const variants = {
    primary: {
      rest: { background: 'var(--brand-primary)', color: 'var(--fg-on-brand)', boxShadow: 'var(--shadow-xs)' },
      hover: { background: '#1F6BFF', boxShadow: '0 0 0 2px var(--surface-0), 0 0 0 4px var(--brand-primary)' },
    },
    black: {
      rest: { background: 'var(--fg-1)', color: 'var(--surface-0)', boxShadow: 'var(--shadow-xs)' },
      hover: { background: 'var(--fg-2)', boxShadow: '0 0 0 2px var(--surface-0), 0 0 0 4px var(--fg-1)' },
    },
    outline: {
      rest: { background: 'var(--surface-0)', color: 'var(--brand-primary)', borderColor: 'var(--brand-primary)', boxShadow: 'var(--shadow-xs)' },
      hover: { background: 'var(--brand-blue-50)', color: 'var(--brand-primary)', boxShadow: '0 0 0 2px var(--brand-primary)' },
    },
    ghost: {
      rest: { background: 'transparent', color: 'var(--fg-1)' },
      hover: { background: 'var(--brand-blue-50)', color: 'var(--brand-primary)', boxShadow: 'inset 0 0 0 1px var(--brand-primary)' },
    },
    link: {
      rest: { background: 'transparent', color: 'var(--brand-primary)', height: 'auto', padding: 0, boxShadow: 'none' },
      hover: { color: 'var(--brand-primary)', textDecoration: 'underline', textUnderlineOffset: '3px' },
    },
  };
  const v = variants[variant] || variants.primary;
  const composed = { ...base, ...v.rest, ...(hover && !disabled ? v.hover : null), ...style };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={composed}
      {...rest}
    >
      {icon ? <span style={{ display: 'inline-flex', flex: 'none' }}>{icon}</span> : null}
      {children}
      {iconRight ? <span style={{ display: 'inline-flex', flex: 'none' }}>{iconRight}</span> : null}
    </button>
  );
}
