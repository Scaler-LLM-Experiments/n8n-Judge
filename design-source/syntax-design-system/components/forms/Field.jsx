import React from 'react';

/**
 * Field — the standard label / hint / error wrapper for any control that does
 * not render its own (Select, custom inputs, RadioGroup, Slider...). Keeps
 * label typography, required marker, and error/hint placement consistent
 * across the system. Wrap a single control as the child.
 */
export function Field({ label, hint, error, required = false, htmlFor, children, style, ...rest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }} {...rest}>
      {label ? (
        <label
          htmlFor={htmlFor}
          style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--fg-2)', display: 'inline-flex', gap: 4 }}
        >
          {label}
          {required ? <span style={{ color: 'var(--status-danger)' }} aria-hidden="true">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--status-danger)' }}>{error}</span>
      ) : hint ? (
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--fg-3)' }}>{hint}</span>
      ) : null}
    </div>
  );
}
