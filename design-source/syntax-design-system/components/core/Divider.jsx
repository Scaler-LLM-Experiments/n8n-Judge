import React from 'react';

/**
 * Divider — a 1px hairline separator. Horizontal by default; `vertical` for
 * inline use. An optional `label` centers tracked text on the rule.
 */
export function Divider({ vertical = false, label, spacing = 16, style, ...rest }) {
  if (vertical) {
    return (
      <span
        role="separator"
        aria-orientation="vertical"
        style={{ display: 'inline-block', width: 1, alignSelf: 'stretch', minHeight: 16, background: 'var(--border-subtle)', margin: `0 ${spacing}px`, ...style }}
        {...rest}
      />
    );
  }
  if (label) {
    return (
      <div role="separator" style={{ display: 'flex', alignItems: 'center', gap: 14, margin: `${spacing}px 0`, ...style }} {...rest}>
        <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>{label}</span>
        <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
      </div>
    );
  }
  return <div role="separator" style={{ height: 1, background: 'var(--border-subtle)', margin: `${spacing}px 0`, ...style }} {...rest} />;
}
