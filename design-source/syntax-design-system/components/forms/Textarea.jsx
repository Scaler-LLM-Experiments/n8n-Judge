import React from 'react';

/**
 * Textarea — multi-line text field. Mirrors Input: sharp corners, 1px border,
 * brand focus ring, label / hint / error. `autoResize` grows with content.
 */
export function Textarea({
  label,
  hint,
  error,
  rows = 4,
  autoResize = false,
  disabled = false,
  style,
  id,
  onChange,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const ref = React.useRef(null);
  const reactId = React.useId ? React.useId() : undefined;
  const fieldId = id || reactId;
  const borderColor = error ? 'var(--status-danger)' : focus ? 'var(--brand-primary)' : 'var(--border-subtle)';

  const grow = () => {
    const el = ref.current;
    if (autoResize && el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  };
  React.useEffect(() => { grow(); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label ? (
        <label htmlFor={fieldId} style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--fg-2)' }}>
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        disabled={disabled}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onChange={(e) => { grow(); onChange && onChange(e); }}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          resize: autoResize ? 'none' : 'vertical',
          overflow: autoResize ? 'hidden' : 'auto',
          padding: '10px 12px',
          background: disabled ? 'var(--surface-2)' : 'var(--surface-0)',
          border: `1px solid ${borderColor}`,
          borderRadius: 0,
          outline: 'none',
          boxShadow: focus && !error ? '0 0 0 2px rgba(0,85,255,0.18)' : 'none',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          lineHeight: 1.5,
          color: 'var(--fg-1)',
          transition: 'border-color 120ms var(--ease-standard,ease), box-shadow 120ms var(--ease-standard,ease)',
        }}
        {...rest}
      />
      {error ? (
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--status-danger)' }}>{error}</span>
      ) : hint ? (
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--fg-3)' }}>{hint}</span>
      ) : null}
    </div>
  );
}
