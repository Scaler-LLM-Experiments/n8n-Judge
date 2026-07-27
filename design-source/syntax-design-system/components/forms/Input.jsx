import React from 'react';

/**
 * Input — single-line text field. Sharp corners, 1px border, brand focus ring.
 * Supports label, hint, error, and a leading icon.
 */
export function Input({
  label,
  hint,
  error,
  icon = null,
  size = 'lg',
  type = 'text',
  disabled = false,
  style,
  id,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const heights = { md: 36, lg: 48 };
  const h = heights[size] || heights.lg;
  const reactId = React.useId ? React.useId() : undefined;
  const fieldId = id || reactId;
  const borderColor = error ? 'var(--status-danger)' : focus ? 'var(--brand-primary)' : 'var(--border-subtle)';

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
          border: `1px solid ${borderColor}`,
          boxShadow: focus && !error ? '0 0 0 2px rgba(0,85,255,0.18)' : 'none',
          transition: 'border-color 120ms var(--ease-standard,ease), box-shadow 120ms var(--ease-standard,ease)',
        }}
      >
        {icon ? (
          <span style={{ display: 'inline-flex', paddingLeft: 12, color: 'var(--fg-3)', flex: 'none' }}>{icon}</span>
        ) : null}
        <input
          id={fieldId}
          type={type}
          disabled={disabled}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1,
            height: '100%',
            border: 0,
            outline: 'none',
            background: 'transparent',
            padding: icon ? '0 12px 0 8px' : '0 12px',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--fg-1)',
            borderRadius: 0,
            minWidth: 0,
          }}
          {...rest}
        />
      </div>
      {error ? (
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--status-danger)' }}>{error}</span>
      ) : hint ? (
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--fg-3)' }}>{hint}</span>
      ) : null}
    </div>
  );
}
