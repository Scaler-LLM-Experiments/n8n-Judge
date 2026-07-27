import React from 'react';

/**
 * Table — a sharp-cornered data table. Hairline rules, an uppercase tracked
 * header, brand-blue sort + selection. Driven by `columns` + `data`.
 *
 * columns: { key, header, align?, width?, sortable?, render?(row, rowIndex) }
 * Sorting is uncontrolled by default; pass `sort` + `onSortChange` to control.
 * Selection is opt-in via `selectable`; control with `selected` + `onSelectChange`.
 */
export function Table({
  columns = [],
  data = [],
  rowKey,
  size = 'md',
  selectable = false,
  selected,
  onSelectChange,
  sort: sortProp,
  onSortChange,
  onRowClick,
  stickyHeader = false,
  empty = 'Nothing to show yet.',
  style,
  ...rest
}) {
  const getKey = (row, i) => (typeof rowKey === 'function' ? rowKey(row, i) : rowKey ? row[rowKey] : (row.id != null ? row.id : i));

  // ---- Sorting (uncontrolled fallback) ----
  const [sortInternal, setSortInternal] = React.useState(null);
  const sort = sortProp !== undefined ? sortProp : sortInternal;
  const applySort = (key) => {
    const dir = sort && sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc';
    const next = { key, dir };
    if (onSortChange) onSortChange(next);
    if (sortProp === undefined) setSortInternal(next);
  };
  const rows = React.useMemo(() => {
    if (!sort || !sort.key) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (col && col.render && !col.sortAccessor && !(data[0] && sort.key in data[0])) return data;
    const get = col && col.sortAccessor ? col.sortAccessor : (r) => r[sort.key];
    const sorted = [...data].sort((a, b) => {
      const av = get(a), bv = get(b);
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv), undefined, { numeric: true });
    });
    return sort.dir === 'desc' ? sorted.reverse() : sorted;
  }, [data, sort, columns]);

  // ---- Selection (uncontrolled fallback) ----
  const [selInternal, setSelInternal] = React.useState([]);
  const sel = selected !== undefined ? selected : selInternal;
  const selSet = React.useMemo(() => new Set(sel), [sel]);
  const allKeys = rows.map((r, i) => getKey(r, i));
  const allOn = allKeys.length > 0 && allKeys.every((k) => selSet.has(k));
  const someOn = !allOn && allKeys.some((k) => selSet.has(k));
  const commitSel = (next) => { if (onSelectChange) onSelectChange(next); if (selected === undefined) setSelInternal(next); };
  const toggleRow = (k) => { const n = new Set(selSet); n.has(k) ? n.delete(k) : n.add(k); commitSel([...n]); };
  const toggleAll = () => commitSel(allOn ? [] : allKeys);

  const cellPad = size === 'sm' ? '8px 14px' : '13px 16px';
  const fontSize = size === 'sm' ? 13 : 14;

  const SortGlyph = ({ active, dir }) => (
    <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 6, lineHeight: 0, color: active ? 'var(--brand-primary)' : 'var(--fg-4)', opacity: active ? 1 : 0.55 }}>
      <svg width="9" height="6" viewBox="0 0 10 6" fill="none" style={{ marginBottom: 1 }}><path d="M5 0 9.33 6H.67z" fill={active && dir === 'asc' ? 'currentColor' : 'var(--n-300)'} /></svg>
      <svg width="9" height="6" viewBox="0 0 10 6" fill="none"><path d="M5 6 .67 0h8.66z" fill={active && dir === 'desc' ? 'currentColor' : 'var(--n-300)'} /></svg>
    </span>
  );

  const Check = ({ on, mixed, onChange, label }) => (
    <span
      role="checkbox"
      aria-checked={mixed ? 'mixed' : on}
      aria-label={label}
      tabIndex={0}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(); } }}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 18, height: 18, flex: 'none', cursor: 'pointer', borderRadius: 0,
        border: `1.5px solid ${on || mixed ? 'var(--brand-primary)' : 'var(--border-strong)'}`,
        background: on || mixed ? 'var(--brand-primary)' : 'var(--surface-0)',
        transition: 'border-color 120ms var(--ease-standard,ease), background 120ms var(--ease-standard,ease)',
        color: '#fff',
      }}
    >
      {mixed ? (
        <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1.5" y="4.25" width="7" height="1.5" fill="currentColor" /></svg>
      ) : on ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
      ) : null}
    </span>
  );

  const th = {
    textAlign: 'left', padding: cellPad, fontFamily: 'var(--font-body)',
    fontSize: size === 'sm' ? 10 : 11, fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--fg-3)', whiteSpace: 'nowrap',
    background: 'var(--surface-1)', borderBottom: '1px solid var(--border-strong)',
    position: stickyHeader ? 'sticky' : undefined, top: stickyHeader ? 0 : undefined, zIndex: stickyHeader ? 1 : undefined,
  };

  return (
    <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface-0)', overflowX: 'auto', ...style }} {...rest}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
        <thead>
          <tr>
            {selectable ? (
              <th style={{ ...th, width: 44, paddingRight: 0 }}>
                <Check on={allOn} mixed={someOn} onChange={toggleAll} label="Select all rows" />
              </th>
            ) : null}
            {columns.map((col) => {
              const active = sort && sort.key === col.key;
              return (
                <th key={col.key} style={{ ...th, textAlign: col.align || 'left', width: col.width, cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }} onClick={col.sortable ? () => applySort(col.key) : undefined} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start', color: active ? 'var(--brand-primary)' : undefined }}>
                    {col.header}
                    {col.sortable ? <SortGlyph active={active} dir={active ? sort.dir : null} /> : null}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--fg-4)', fontSize: 14 }}>{empty}</td>
            </tr>
          ) : rows.map((row, i) => {
            const k = getKey(row, i);
            const on = selSet.has(k);
            return (
              <tr
                key={k}
                onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                style={{
                  background: on ? 'var(--brand-blue-50)' : 'transparent',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background 100ms var(--ease-standard,ease)',
                }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--surface-1)'; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}
              >
                {selectable ? (
                  <td style={{ padding: cellPad, paddingRight: 0, borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' }}>
                    <Check on={on} onChange={() => toggleRow(k)} label="Select row" />
                  </td>
                ) : null}
                {columns.map((col) => (
                  <td key={col.key} style={{
                    padding: cellPad, fontSize, lineHeight: 1.45, color: 'var(--fg-2)',
                    textAlign: col.align || 'left', borderBottom: '1px solid var(--border-subtle)',
                    verticalAlign: 'middle', whiteSpace: col.nowrap ? 'nowrap' : undefined,
                  }}>
                    {col.render ? col.render(row, i) : row[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
