import React from 'react';

const VARIANTS = {
  primary: { bg: 'var(--brand-primary)', fg: 'var(--fg-on-brand)', border: 'var(--brand-primary)', divider: 'rgba(255,255,255,0.28)', hover: '#1F6BFF' },
  black: { bg: 'var(--fg-1)', fg: 'var(--surface-0)', border: 'var(--fg-1)', divider: 'rgba(128,128,128,0.45)', hover: 'var(--fg-2)' },
  outline: { bg: 'var(--surface-0)', fg: 'var(--brand-primary)', border: 'var(--border-strong)', divider: 'var(--border-strong)', hover: 'var(--brand-blue-50)' },
};
const SIZES = { sm: { h: 32, px: 12, fs: 13 }, md: { h: 36, px: 16, fs: 14 }, lg: { h: 48, px: 22, fs: 15 } };

/**
 * SplitButton — a primary action joined to a caret that opens a menu of
 * secondary actions. Sharp corners, shared collapsed border. `items` use the
 * Menu shape: { label, icon?, onClick?, danger?, disabled? } or { divider:true }.
 */
export function SplitButton({ children, onClick, items = [], variant = 'primary', size = 'md', disabled = false, menuWidth = 200, style, ...rest }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const [open, setOpen] = React.useState(false);
  const [mainHover, setMainHover] = React.useState(false);
  const [caretHover, setCaretHover] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const seg = (hover) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    height: s.h, border: `1px solid ${v.border}`, background: hover && !disabled ? v.hover : v.bg,
    color: v.fg, fontFamily: 'var(--font-body)', fontSize: s.fs, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 0, transition: 'background 120ms var(--ease-standard,ease)', whiteSpace: 'nowrap',
  });

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex', opacity: disabled ? 0.55 : 1, ...style }} {...rest}>
      <button type="button" disabled={disabled} onClick={onClick} onMouseEnter={() => setMainHover(true)} onMouseLeave={() => setMainHover(false)} style={{ ...seg(mainHover), padding: `0 ${s.px}px`, borderRight: 0 }}>
        {children}
      </button>
      <button type="button" disabled={disabled} aria-label="More actions" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} onMouseEnter={() => setCaretHover(true)} onMouseLeave={() => setCaretHover(false)} style={{ ...seg(caretHover), width: s.h, borderLeft: `1px solid ${v.divider}` }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ transition: 'transform 160ms var(--ease-standard,ease)', transform: open ? 'rotate(180deg)' : 'none' }}><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open ? (
        <div role="menu" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 'var(--z-dropdown, 1000)', minWidth: menuWidth, padding: 4, background: 'var(--surface-0)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)', animation: 'sbs-fade-up 160ms var(--ease-standard,ease)' }}>
          {items.map((it, i) => {
            if (it.divider) return <div key={'d' + i} style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />;
            return <SplitRow key={i} item={it} onSelect={() => { setOpen(false); it.onClick && it.onClick(); }} />;
          })}
        </div>
      ) : null}
    </span>
  );
}

function SplitRow({ item, onSelect }) {
  const [hover, setHover] = React.useState(false);
  const color = item.disabled ? 'var(--fg-4)' : item.danger ? 'var(--status-danger)' : 'var(--fg-1)';
  return (
    <button type="button" role="menuitem" disabled={item.disabled} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onSelect}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px', border: 0, borderRadius: 0, background: hover && !item.disabled ? (item.danger ? 'var(--status-danger-bg)' : 'var(--brand-blue-50)') : 'transparent', color, cursor: item.disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, textAlign: 'left' }}>
      {item.icon ? <span style={{ display: 'inline-flex', flex: 'none' }}>{item.icon}</span> : null}
      <span style={{ flex: 1 }}>{item.label}</span>
    </button>
  );
}
