import React from 'react';

/**
 * Checkbox — square (zero radius) checkbox with brand-blue checked fill.
 * Controlled via `checked` + `onChange`, with an optional inline label.
 */
export function Checkbox({ checked = false, onChange, label, disabled = false, style, id, ...rest }) {
  const reactId = React.useId ? React.useId() : undefined;
  const fieldId = id || reactId;
  return (
    <label
      htmlFor={fieldId}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        color: 'var(--fg-1)',
        ...style,
      }}
    >
      <span
        style={{
          position: 'relative',
          width: 18,
          height: 18,
          flex: 'none',
          background: checked ? 'var(--brand-primary)' : 'var(--surface-0)',
          border: `1.5px solid ${checked ? 'var(--brand-primary)' : 'var(--border-strong)'}`,
          transition: 'background 120ms var(--ease-standard,ease), border-color 120ms var(--ease-standard,ease)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : null}
        <input
          id={fieldId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange && onChange(e.target.checked, e)}
          style={{ position: 'absolute', opacity: 0, inset: 0, margin: 0, cursor: 'inherit' }}
          {...rest}
        />
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
