import React from 'react';

/**
 * RadioGroup — single choice from a set. Square (zero radius) dots with a
 * brand-blue inner fill when selected. Controlled via `value` + `onChange`.
 * Pass `options` as { value, label, hint?, disabled? }. `direction` lays the
 * options out in a row or column.
 */
export function RadioGroup({
  options = [],
  value,
  onChange,
  name,
  direction = 'column',
  disabled = false,
  style,
  ...rest
}) {
  const reactId = React.useId ? React.useId() : 'rg';
  const groupName = name || reactId;
  return (
    <div
      role="radiogroup"
      style={{
        display: 'flex',
        flexDirection: direction === 'row' ? 'row' : 'column',
        gap: direction === 'row' ? 24 : 14,
        flexWrap: 'wrap',
        ...style,
      }}
      {...rest}
    >
      {options.map((opt) => {
        const checked = value === opt.value;
        const isDisabled = disabled || opt.disabled;
        return (
          <label
            key={opt.value}
            style={{
              display: 'flex',
              alignItems: opt.hint ? 'flex-start' : 'center',
              gap: 10,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.5 : 1,
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--fg-1)',
            }}
          >
            <span
              style={{
                position: 'relative',
                width: 18,
                height: 18,
                flex: 'none',
                marginTop: opt.hint ? 2 : 0,
                background: 'var(--surface-0)',
                border: `1.5px solid ${checked ? 'var(--brand-primary)' : 'var(--border-strong)'}`,
                transition: 'border-color 120ms var(--ease-standard,ease)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {checked ? (
                <span style={{ width: 8, height: 8, background: 'var(--brand-primary)' }} />
              ) : null}
              <input
                type="radio"
                name={groupName}
                value={opt.value}
                checked={checked}
                disabled={isDisabled}
                onChange={(e) => onChange && onChange(opt.value, e)}
                style={{ position: 'absolute', opacity: 0, inset: 0, margin: 0, cursor: 'inherit' }}
              />
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span>{opt.label}</span>
              {opt.hint ? <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{opt.hint}</span> : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
