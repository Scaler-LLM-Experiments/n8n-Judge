import React from 'react';

const PALETTE = ['#0055FF', '#82B0FF', '#1F9D55', '#E8B017', '#8000FF', '#C97A0E'];

function niceLabel(v) {
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + 'k';
  return String(v);
}

/**
 * LineChart — flat polyline(s) over hairline gridlines. Single series via
 * `data` ({label,value}); multiple via `series` ({name,color,values}) + `labels`.
 * Optional soft area fill and end-point markers.
 */
export function LineChart({ data, series, labels, height = 180, color = PALETTE[0], area = true, markers = true, showGrid = true, valueFormat = niceLabel, style, ...rest }) {
  const lines = series
    ? series.map((s, i) => ({ name: s.name, color: s.color || PALETTE[i % PALETTE.length], values: s.values }))
    : [{ name: '', color, values: (data || []).map((d) => d.value) }];
  const xLabels = labels || (data || []).map((d) => d.label);
  const n = Math.max(...lines.map((l) => l.values.length), 1);

  const W = 640, H = height, padL = 40, padR = 12, padT = 12, padB = 24;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const allVals = lines.flatMap((l) => l.values);
  const max = Math.max(1, ...allVals), min = Math.min(0, ...allVals);
  const span = max - min || 1;
  const x = (i) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v) => padT + plotH - ((v - min) / span) * plotH;
  const ticks = [min, (min + max) / 2, max];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', height: 'auto', fontFamily: 'var(--font-body)', ...style }} {...rest}>
      {showGrid ? ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke={i === 0 ? 'var(--border-strong)' : 'var(--border-subtle)'} strokeWidth="1" />
          <text x={padL - 8} y={y(t) + 3} textAnchor="end" fontSize="10" fill="var(--fg-4)">{valueFormat(Math.round(t))}</text>
        </g>
      )) : null}
      {lines.map((l, li) => {
        const pts = l.values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
        const areaD = `M${x(0)},${y(l.values[0])} ` + l.values.map((v, i) => `L${x(i)},${y(v)}`).join(' ') + ` L${x(l.values.length - 1)},${padT + plotH} L${x(0)},${padT + plotH} Z`;
        return (
          <g key={li}>
            {area && lines.length === 1 ? <path d={areaD} fill={l.color} fillOpacity="0.10" /> : null}
            <polyline points={pts} fill="none" stroke={l.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {markers ? <circle cx={x(l.values.length - 1)} cy={y(l.values[l.values.length - 1])} r="3" fill={l.color} /> : null}
          </g>
        );
      })}
      {xLabels.map((lab, i) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === xLabels.length - 1 ? 'end' : 'middle'} fontSize="10" fill="var(--fg-4)">{lab}</text>
      ))}
    </svg>
  );
}
