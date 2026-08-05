import React from 'react';

/**
 * Switch — a sharp-cornered toggle. Brand-blue track when on; the knob is a
 * square that slides. Controlled via `checked` + `onChange`.
 *
 * The knob moves with `transform`, not `left` or flex justify — those either
 * don't interpolate or reflow, so the flip looked instant and "broken".
 */
export function Switch({
  checked = false,
  onChange,
  label,
  disabled = false,
  style,
  /** Optional track border (e.g. graded field pulse / success / wrong). */
  borderColor,
  'aria-label': ariaLabel,
  ...rest
}) {
  const W = 40;
  const H = 22;
  const PAD = 3;
  const KNOB = H - PAD * 2; // 16
  // Distance the knob travels left → right inside the track.
  const travel = W - KNOB - PAD * 2; // 18

  const trackBorder = borderColor
    ?? (checked ? 'var(--brand-primary)' : 'var(--border-strong)');

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
        aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
        tabIndex={disabled ? -1 : 0}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled && onChange) onChange(!checked);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange?.(!checked);
          }
        }}
        style={{
          position: 'relative',
          width: W,
          height: H,
          flex: 'none',
          boxSizing: 'border-box',
          background: checked ? 'var(--brand-primary)' : 'var(--surface-2, var(--n-300, #D1D5DB))',
          border: '1.5px solid',
          borderColor: trackBorder,
          // Track color + border ease with the knob so the whole control moves as one.
          transition:
            'background 180ms cubic-bezier(0.2, 0.8, 0.2, 1), border-color 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        {...rest}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: PAD - 1.5,
            left: PAD - 1.5,
            width: KNOB,
            height: KNOB,
            background: checked ? '#fff' : 'var(--fg-3)',
            // transform animates smoothly; left/justifyContent do not (or reflow).
            transform: `translateX(${checked ? travel : 0}px)`,
            transition:
              'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), background 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            willChange: 'transform',
          }}
        />
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
