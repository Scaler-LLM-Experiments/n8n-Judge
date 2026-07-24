import React from 'react';

/**
 * Sidebar — a persistent vertical navigation rail. `items` are nav rows
 * { label, icon, href, onClick, active, badge } or section headings
 * { section: true, label }. Optional `header` (logo) and `footer` slots.
 * Pass `collapsed` for a 68px icon-only rail.
 */
export function Sidebar({ items = [], header, footer, collapsed = false, width = 248, style, ...rest }) {
  const w = collapsed ? 68 : width;
  return (
    <nav
      style={{
        display: 'flex', flexDirection: 'column', width: w, flex: 'none',
        height: '100%', background: 'var(--surface-0)', borderRight: '1px solid var(--border-subtle)',
        fontFamily: 'var(--font-body)', transition: 'width 180ms var(--ease-standard,ease)', overflow: 'hidden', ...style,
      }}
      {...rest}
    >
      {header != null ? (
        <div style={{ display: 'flex', alignItems: 'center', height: 60, padding: collapsed ? '0' : '0 18px', justifyContent: collapsed ? 'center' : 'flex-start', borderBottom: '1px solid var(--border-subtle)', flex: 'none' }}>{header}</div>
      ) : null}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
        {items.map((it, i) => {
          if (it.section) {
            if (collapsed) return <div key={i} style={{ height: 1, background: 'var(--border-subtle)', margin: '10px 6px' }} />;
            return <div key={i} style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-4)', padding: '14px 10px 6px' }}>{it.label}</div>;
          }
          return <SidebarRow key={i} item={it} collapsed={collapsed} />;
        })}
      </div>
      {footer != null ? (
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: collapsed ? '10px 0' : '12px 14px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start', flex: 'none' }}>{footer}</div>
      ) : null}
    </nav>
  );
}

function SidebarRow({ item, collapsed }) {
  const [hover, setHover] = React.useState(false);
  const active = item.active;
  const Tag = item.href ? 'a' : 'button';
  return (
    <Tag
      href={item.href}
      type={item.href ? undefined : 'button'}
      onClick={item.onClick}
      title={collapsed ? (typeof item.label === 'string' ? item.label : undefined) : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        padding: collapsed ? '0' : '0 12px', height: 40, justifyContent: collapsed ? 'center' : 'flex-start',
        border: 0, borderLeft: `2px solid ${active ? 'var(--brand-primary)' : 'transparent'}`,
        background: active ? 'var(--brand-blue-50)' : hover ? 'var(--surface-1)' : 'transparent',
        color: active ? 'var(--brand-primary)' : 'var(--fg-2)', textDecoration: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: active ? 600 : 500,
        transition: 'background 100ms var(--ease-standard,ease), color 100ms var(--ease-standard,ease)',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {item.icon != null ? <span style={{ display: 'inline-flex', flex: 'none' }}>{item.icon}</span> : null}
      {!collapsed ? <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span> : null}
      {!collapsed && item.badge != null ? <span style={{ flex: 'none', fontSize: 11, fontWeight: 600, padding: '1px 7px', background: active ? 'var(--brand-primary)' : 'var(--n-100)', color: active ? '#fff' : 'var(--fg-3)' }}>{item.badge}</span> : null}
    </Tag>
  );
}
