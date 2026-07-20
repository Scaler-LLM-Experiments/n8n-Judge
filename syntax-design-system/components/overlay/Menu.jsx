import React from 'react';

/**
 * Menu — a dropdown action list anchored to a trigger. Pass `items` as
 * { label, icon?, onClick?, danger?, disabled? } or { divider: true }.
 * Self-managed: toggles on click, closes on select, outside-click and Escape.
 */
export function Menu({ trigger, items = [], placement = 'bottom-start', width = 200, style, ...rest }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const [v, h] = placement.split('-');
  const pos = {
    top: { bottom: '100%', marginBottom: 6 },
    bottom: { top: '100%', marginTop: 6 },
    start: { left: 0 },
    end: { right: 0 },
  };

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex' }} {...rest}>
      <span onClick={() => setOpen((o) => !o)} style={{ display: 'inline-flex', cursor: 'pointer' }}>{trigger}</span>
      {open ? (
        <div
          role="menu"
          style={{
            position: 'absolute',
            zIndex: 'var(--z-dropdown, 1000)',
            ...(pos[v] || pos.bottom),
            ...(pos[h] || pos.start),
            minWidth: width,
            padding: 4,
            background: 'var(--surface-0)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-md)',
            animation: 'sbs-fade-up 160ms var(--ease-standard,ease)',
            ...style,
          }}
        >
          {items.map((it, i) => {
            if (it.divider) return <div key={'d' + i} style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />;
            return (
              <MenuRow key={i} item={it} onSelect={() => { setOpen(false); it.onClick && it.onClick(); }} />
            );
          })}
        </div>
      ) : null}
    </span>
  );
}

function MenuRow({ item, onSelect }) {
  const [hover, setHover] = React.useState(false);
  const danger = item.danger;
  const color = item.disabled ? 'var(--fg-4)' : danger ? 'var(--status-danger)' : 'var(--fg-1)';
  return (
    <button
      type="button"
      role="menuitem"
      disabled={item.disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '8px 10px',
        border: 0,
        borderRadius: 0,
        background: hover && !item.disabled ? (danger ? 'var(--status-danger-bg)' : 'var(--brand-blue-50)') : 'transparent',
        color,
        cursor: item.disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: 500,
        textAlign: 'left',
        transition: 'background 100ms var(--ease-standard,ease)',
      }}
    >
      {item.icon ? <span style={{ display: 'inline-flex', flex: 'none' }}>{item.icon}</span> : null}
      <span style={{ flex: 1 }}>{item.label}</span>
    </button>
  );
}
