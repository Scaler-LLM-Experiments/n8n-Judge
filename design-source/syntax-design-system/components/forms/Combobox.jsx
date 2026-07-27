import React from 'react';

/**
 * Combobox — a text field that filters a list of options as you type.
 * Mirrors Input's label / hint / error contract. Keyboard: ↑/↓ to move,
 * Enter to choose, Esc to close. Controlled via `value` + `onChange`.
 * Options are `{ value, label }` or plain strings.
 */
export function Combobox({ options = [], value, onChange, label, hint, error, placeholder = 'Search…', disabled = false, emptyText = 'No matches', style, id, ...rest }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const selected = opts.find((o) => o.value === value) || null;
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [hi, setHi] = React.useState(0);
  const ref = React.useRef(null);
  const reactId = React.useId ? React.useId() : undefined;
  const fieldId = id || reactId;

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const text = open ? query : (selected ? selected.label : '');
  const filtered = open && query ? opts.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : opts;

  const choose = (o) => { if (onChange) onChange(o.value); setQuery(''); setOpen(false); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi((h) => Math.min(filtered.length - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (open && filtered[hi]) choose(filtered[hi]); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  const borderColor = error ? 'var(--status-danger)' : open ? 'var(--brand-primary)' : 'var(--border-subtle)';

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', ...style }} {...rest}>
      {label ? <label htmlFor={fieldId} style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--fg-2)' }}>{label}</label> : null}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 48, background: disabled ? 'var(--surface-2)' : 'var(--surface-0)', border: `1px solid ${borderColor}`, boxShadow: open && !error ? '0 0 0 2px rgba(0,85,255,0.18)' : 'none', transition: 'border-color 120ms var(--ease-standard,ease), box-shadow 120ms var(--ease-standard,ease)' }}>
        <input
          id={fieldId}
          disabled={disabled}
          value={text}
          placeholder={placeholder}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setHi(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          role="combobox"
          aria-expanded={open}
          autoComplete="off"
          style={{ flex: 1, height: '100%', border: 0, outline: 'none', background: 'transparent', padding: '0 12px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--fg-1)', borderRadius: 0, minWidth: 0 }}
        />
        <span style={{ display: 'inline-flex', paddingRight: 10, color: 'var(--fg-3)', pointerEvents: 'none', transition: 'transform 160ms var(--ease-standard,ease)', transform: open ? 'rotate(180deg)' : 'none' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
        </span>
      </div>
      {open ? (
        <div role="listbox" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 'var(--z-dropdown, 1000)', maxHeight: 240, overflowY: 'auto', background: 'var(--surface-0)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)', padding: 4 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '10px 10px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-4)' }}>{emptyText}</div>
          ) : filtered.map((o, i) => {
            const active = i === hi, isSel = o.value === value;
            return (
              <button key={o.value} type="button" role="option" aria-selected={isSel}
                onMouseEnter={() => setHi(i)} onClick={() => choose(o)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%', padding: '8px 10px', border: 0, borderRadius: 0, background: active ? 'var(--brand-blue-50)' : 'transparent', color: 'var(--fg-1)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: isSel ? 600 : 500, textAlign: 'left' }}>
                <span>{o.label}</span>
                {isSel ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg> : null}
              </button>
            );
          })}
        </div>
      ) : null}
      {error ? <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--status-danger)' }}>{error}</span>
        : hint ? <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--fg-3)' }}>{hint}</span> : null}
    </div>
  );
}
