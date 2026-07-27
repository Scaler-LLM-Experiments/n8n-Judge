import React from 'react';

/**
 * Select — styled native select with a custom chevron. Sharp corners,
 * brand focus ring. Pass `options` as [{value,label}] or use children.
 */
export function Select({ label, hint, options, size = 'lg', disabled = false, style, id, children, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const heights = { md: 36, lg: 48 };
  const h = heights[size] || heights.lg;
  const reactId = React.useId ? React.useId() : undefined;
  const fieldId = id || reactId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label ? (
        <label htmlFor={fieldId} style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--fg-2)' }}>
          {label}
        </label>
      ) : null}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          height: h,
          background: disabled ? 'var(--surface-2)' : 'var(--surface-0)',
          border: `1px solid ${focus ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
          boxShadow: focus ? '0 0 0 2px rgba(0,85,255,0.18)' : 'none',
          transition: 'border-color 120ms var(--ease-standard,ease), box-shadow 120ms var(--ease-standard,ease)',
        }}
      >
        <select
          id={fieldId}
          disabled={disabled}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            flex: 1,
            height: '100%',
            border: 0,
            outline: 'none',
            background: 'transparent',
            padding: '0 36px 0 12px',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--fg-1)',
            borderRadius: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
            minWidth: 0,
          }}
          {...rest}
        >
          {options ? options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>) : children}
        </select>
        <span style={{ position: 'absolute', right: 12, pointerEvents: 'none', color: 'var(--fg-3)', fontSize: 12, lineHeight: 1 }}>▾</span>
      </div>
      {hint ? <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--fg-3)' }}>{hint}</span> : null}
    </div>
  );
}
