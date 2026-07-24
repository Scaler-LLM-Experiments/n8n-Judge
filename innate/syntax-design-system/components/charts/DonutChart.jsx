import React from 'react';

const PALETTE = ['#0055FF', '#82B0FF', '#1F9D55', '#E8B017', '#8000FF', '#C97A0E'];

/**
 * DonutChart — a flat ring of proportional segments with an optional centre
 * label. Pass `segments` as { label, value, color? }. Legend on the right.
 */
export function DonutChart({ segments = [], size = 132, thickness = 14, centerValue, centerLabel, legend = true, gap = 0, style, ...rest }) {
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const total = Math.max(1, segments.reduce((s, x) => s + x.value, 0));
  let offset = 0;
  const segs = segments.map((s, i) => {
    const frac = s.value / total;
    const len = frac * circ;
    const node = {
      color: s.color || PALETTE[i % PALETTE.length],
      dash: `${Math.max(0, len - gap)} ${circ - Math.max(0, len - gap)}`,
      dashOffset: -offset,
      pct: Math.round(frac * 100),
      label: s.label,
    };
    offset += len;
    return node;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontFamily: 'var(--font-body)', ...style }} {...rest}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flex: 'none' }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth={thickness} />
        {segs.map((s, i) => (
          <circle key={i} cx={c} cy={c} r={r} fill="none" stroke={s.color} strokeWidth={thickness}
            strokeDasharray={s.dash} strokeDashoffset={s.dashOffset} transform={`rotate(-90 ${c} ${c})`} />
        ))}
        {(centerValue != null || centerLabel) ? (
          <g>
            {centerValue != null ? <text x={c} y={c - 2} textAnchor="middle" fontSize="18" fontWeight="600" fill="var(--fg-1)">{centerValue}</text> : null}
            {centerLabel ? <text x={c} y={c + 14} textAnchor="middle" fontSize="9" letterSpacing="0.08em" fill="var(--fg-3)" style={{ textTransform: 'uppercase' }}>{centerLabel}</text> : null}
          </g>
        ) : null}
      </svg>
      {legend ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {segs.map((s, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-2)' }}>
              <span style={{ width: 10, height: 10, background: s.color, flex: 'none' }} />
              {s.label}<span style={{ color: 'var(--fg-4)' }}>· {s.pct}%</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
