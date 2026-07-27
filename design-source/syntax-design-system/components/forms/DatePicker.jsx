import React from 'react';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ymd = (d) => (d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null);
const same = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const lt = (a, b) => ymd(a).getTime() < ymd(b).getTime();

// 42-cell (6-week) grid starting on the Monday on/before the 1st.
function buildGrid(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Mon=0
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

/**
 * DatePicker — a sharp-cornered calendar. Single date or a start/end range.
 * Brand-blue selection, soft-blue in-range fill, today marker. Monday-first.
 * Controlled via `value` + `onChange`; `min`/`max` disable out-of-bounds days.
 */
export function DatePicker({ mode = 'single', value, defaultValue, onChange, min, max, style, ...rest }) {
  const isRange = mode === 'range';
  const controlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue != null ? defaultValue : (isRange ? { start: null, end: null } : null));
  const val = controlled ? value : internal;

  const anchor = isRange ? (val && val.start) : val;
  const [view, setView] = React.useState(() => {
    const d = anchor || new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const today = ymd(new Date());
  const minD = min ? ymd(min) : null;
  const maxD = max ? ymd(max) : null;
  const disabled = (d) => (minD && lt(d, minD)) || (maxD && lt(maxD, d));

  const commit = (next) => { if (onChange) onChange(next); if (!controlled) setInternal(next); };

  const pick = (d) => {
    if (disabled(d)) return;
    if (!isRange) { commit(ymd(d)); return; }
    const { start, end } = val || {};
    if (!start || end || lt(d, start)) commit({ start: ymd(d), end: null });
    else commit({ start, end: ymd(d) });
  };

  const grid = buildGrid(view.y, view.m);
  const step = (delta) => setView((v) => { const m = v.m + delta; return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 }; });

  const inRange = (d) => isRange && val && val.start && val.end && lt(val.start, d) && lt(d, val.end);
  const isSel = (d) => isRange ? (same(d, val && val.start) || same(d, val && val.end)) : same(d, val);

  const navBtn = {
    width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--fg-3)', borderRadius: 0,
    transition: 'color 120ms var(--ease-standard,ease)',
  };

  return (
    <div style={{ width: 280, border: '1px solid var(--border-subtle)', background: 'var(--surface-0)', padding: 14, fontFamily: 'var(--font-body)', ...style }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button type="button" aria-label="Previous month" style={navBtn} onClick={() => step(-1)} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-primary)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fg-3)')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>{MONTHS[view.m]} {view.y}</span>
        <button type="button" aria-label="Next month" style={navBtn} onClick={() => step(1)} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-primary)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fg-3)')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {DOW.map((d, i) => <span key={i} style={{ fontSize: 10, letterSpacing: '0.04em', textAlign: 'center', padding: '6px 0', color: 'var(--fg-4)', textTransform: 'uppercase' }}>{d}</span>)}
        {grid.map((d, i) => {
          const muted = d.getMonth() !== view.m;
          const sel = isSel(d);
          const rng = inRange(d);
          const isToday = same(d, today);
          const dis = disabled(d);
          let bg = 'transparent', color = muted ? 'var(--n-300)' : 'var(--fg-2)';
          if (sel) { bg = 'var(--brand-primary)'; color = '#fff'; }
          else if (rng) { bg = 'var(--brand-blue-100)'; color = 'var(--brand-primary)'; }
          else if (isToday) { color = 'var(--brand-primary)'; }
          return (
            <button
              key={i}
              type="button"
              disabled={dis}
              onClick={() => pick(d)}
              style={{
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 0, background: bg, color: dis ? 'var(--n-300)' : color, borderRadius: 0,
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: sel || isToday ? 600 : 400,
                cursor: dis ? 'not-allowed' : 'pointer', opacity: dis ? 0.6 : 1,
                transition: 'background 120ms var(--ease-standard,ease), color 120ms var(--ease-standard,ease)',
              }}
              onMouseEnter={(e) => { if (!dis && !sel && !rng) { e.currentTarget.style.background = 'var(--brand-blue-50)'; e.currentTarget.style.color = 'var(--brand-primary)'; } }}
              onMouseLeave={(e) => { if (!dis && !sel && !rng) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = muted ? 'var(--n-300)' : (isToday ? 'var(--brand-primary)' : 'var(--fg-2)'); } }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
