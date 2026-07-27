import React from 'react';

/**
 * Slider — a single-value range control. Square brand-blue knob, flat track,
 * brand-blue filled portion. Controlled via `value` + `onChange`. Optional
 * `showValue` prints the current value (via `format`) at the right.
 */
export function Slider({
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled = false,
  showValue = false,
  format = (v) => v,
  style,
  ...rest
}) {
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, ...style }}>
      <span style={{ position: 'relative', flex: 1, height: 22, display: 'inline-flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: 0, right: 0, height: 4, background: 'var(--n-200)' }} />
        <span style={{ position: 'absolute', left: 0, width: pct + '%', height: 4, background: disabled ? 'var(--n-400)' : 'var(--brand-primary)' }} />
        <span
          style={{
            position: 'absolute',
            left: `calc(${pct}% - 9px)`,
            width: 18,
            height: 18,
            background: 'var(--surface-0)',
            border: `2px solid ${disabled ? 'var(--n-400)' : 'var(--brand-primary)'}`,
            pointerEvents: 'none',
          }}
        />
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(e) => onChange && onChange(Number(e.target.value), e)}
          style={{ position: 'absolute', inset: 0, width: '100%', margin: 0, opacity: 0, cursor: disabled ? 'not-allowed' : 'pointer' }}
          {...rest}
        />
      </span>
      {showValue ? (
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--fg-1)', minWidth: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          {format(value)}
        </span>
      ) : null}
    </div>
  );
}
