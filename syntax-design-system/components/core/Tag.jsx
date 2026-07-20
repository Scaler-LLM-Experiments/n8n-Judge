import React from 'react';

/**
 * Tag — a filter chip. Selectable and optionally removable.
 * Sharp rectangle; selected = brand-tinted; remove uses an inline × .
 */
export function Tag({ selected = false, onRemove, onClick, children, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const composed = selected
    ? { background: 'var(--brand-blue-50)', color: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' }
    : hover
      ? { background: 'var(--n-100)', color: 'var(--fg-1)', borderColor: 'var(--border-strong)' }
      : { background: 'var(--surface-0)', color: 'var(--fg-2)', borderColor: 'var(--border-subtle)' };

  return (
    <span
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: 28,
        padding: '0 10px',
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 500,
        lineHeight: 1,
        border: '1px solid',
        borderRadius: 0,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 120ms var(--ease-standard,ease), border-color 120ms var(--ease-standard,ease), color 120ms var(--ease-standard,ease)',
        ...composed,
        ...style,
      }}
      {...rest}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(e); }}
          aria-label="Remove"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 16,
            height: 16,
            padding: 0,
            border: 0,
            background: 'transparent',
            color: 'currentColor',
            cursor: 'pointer',
            opacity: 0.7,
            lineHeight: 1,
            fontSize: 14,
          }}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
