import React from 'react';

/**
 * Switch — a sharp-cornered toggle. Brand-blue track when on; the knob is a
 * square that slides. Controlled via `checked` + `onChange`.
 */
export function Switch({ checked = false, onChange, label, disabled = false, style, ...rest }) {
  const W = 40, H = 22, PAD = 3, KNOB = H - PAD * 2;
  return (
    <label
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
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          position: 'relative',
          width: W,
          height: H,
          flex: 'none',
          background: checked ? 'var(--brand-primary)' : 'var(--n-300)',
          border: '1px solid',
          borderColor: checked ? 'var(--brand-primary)' : 'var(--border-strong)',
          transition: 'background 140ms var(--ease-standard,ease), border-color 140ms var(--ease-standard,ease)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: PAD - 1,
            left: checked ? W - KNOB - PAD - 1 : PAD - 1,
            width: KNOB,
            height: KNOB,
            background: 'var(--surface-0)',
            transition: 'left 140ms var(--ease-standard,ease)',
          }}
        />
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
