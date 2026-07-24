import React from 'react';

/**
 * IconButton — a square, icon-only action. Same visual language as Button
 * (zero radius, brand fill / outline / ghost, hover ring) sized to a square.
 * `aria-label` is required for accessibility — pass it via rest props.
 */
export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  type = 'button',
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const sizes = { sm: 28, md: 36, lg: 44 };
  const dim = sizes[size] || sizes.md;

  const variants = {
    primary: {
      rest: { background: 'var(--brand-primary)', color: 'var(--fg-on-brand)', borderColor: 'transparent', boxShadow: 'var(--shadow-xs)' },
      hover: { background: '#1F6BFF', boxShadow: '0 0 0 2px var(--surface-0), 0 0 0 4px var(--brand-primary)' },
    },
    black: {
      rest: { background: 'var(--fg-1)', color: 'var(--surface-0)', borderColor: 'transparent', boxShadow: 'var(--shadow-xs)' },
      hover: { background: 'var(--fg-2)', boxShadow: '0 0 0 2px var(--surface-0), 0 0 0 4px var(--fg-1)' },
    },
    outline: {
      rest: { background: 'var(--surface-0)', color: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' },
      hover: { background: 'var(--brand-blue-50)' },
    },
    ghost: {
      rest: { background: 'transparent', color: 'var(--fg-2)', borderColor: 'transparent' },
      hover: { background: 'var(--brand-blue-50)', color: 'var(--brand-primary)' },
    },
  };
  const v = variants[variant] || variants.ghost;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: dim,
        height: dim,
        flex: 'none',
        padding: 0,
        border: '1px solid',
        borderRadius: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transformOrigin: 'center',
        transform: disabled ? 'none' : active ? 'scale(0.92)' : hover ? 'scale(1.04)' : 'none',
        transition: 'background-color 140ms var(--ease-standard,ease), box-shadow 180ms var(--ease-standard,ease), transform 120ms var(--ease-standard,ease)',
        ...v.rest,
        ...(hover && !disabled ? v.hover : null),
        ...style,
      }}
      {...rest}
    >
      {icon}
    </button>
  );
}
