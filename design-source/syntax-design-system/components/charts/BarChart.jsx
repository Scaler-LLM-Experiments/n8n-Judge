import React from 'react';

export const CHART_PALETTE = ['#0055FF', '#82B0FF', '#1F9D55', '#E8B017', '#8000FF', '#C97A0E'];

function niceLabel(v) {
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + 'k';
  return String(v);
}

/**
 * BarChart — flat, square-cornered vertical bars. Simple ({label,value}) or
 * stacked ({label, values:[…]} + `series`). Brand palette, hairline gridlines.
 */
export function BarChart({ data = [], series, height = 200, color = CHART_PALETTE[0], showGrid = true, showValues = false, valueFormat = niceLabel, style, ...rest }) {
  const W = 640, H = height, padL = 40, padR = 8, padT = 12, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const norm = data.map((d) => {
    if (Array.isArray(d.values)) return { label: d.label, segs: d.values.map((v, i) => ({ value: v, color: (series && series[i] && series[i].color) || CHART_PALETTE[i % CHART_PALETTE.length] })) };
    return { label: d.label, segs: [{ value: d.value, color: d.color || color }] };
  });
  const totals = norm.map((d) => d.segs.reduce((s, x) => s + x.value, 0));
  const max = Math.max(1, ...totals);
  const ticks = [0, max / 2, max];
  const band = plotW / Math.max(1, norm.length);
  const barW = Math.min(48, band * 0.56);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', height: 'auto', fontFamily: 'var(--font-body)', ...style }} {...rest}>
      {showGrid ? ticks.map((t, i) => {
        const y = padT + plotH - (t / max) * plotH;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={i === 0 ? 'var(--border-strong)' : 'var(--border-subtle)'} strokeWidth="1" />
            <text x={padL - 8} y={y + 3} textAnchor="end" fontSize="10" fill="var(--fg-4)">{valueFormat(Math.round(t))}</text>
          </g>
        );
      }) : null}
      {norm.map((d, i) => {
        const cx = padL + band * i + band / 2;
        let yCursor = padT + plotH;
        return (
          <g key={i}>
            {d.segs.map((s, j) => {
              const segH = (s.value / max) * plotH;
              yCursor -= segH;
              return <rect key={j} x={cx - barW / 2} y={yCursor} width={barW} height={Math.max(0, segH)} fill={s.color} />;
            })}
            {showValues ? <text x={cx} y={yCursor - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--fg-2)">{valueFormat(totals[i])}</text> : null}
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--fg-4)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
