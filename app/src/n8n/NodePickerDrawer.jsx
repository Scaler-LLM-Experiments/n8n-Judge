import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { X, MagnifyingGlass } from '@phosphor-icons/react';
import { NODE_CATALOG, TRIGGER_OPTIONS, NODE_OPTIONS } from './catalog.js';
import { nodeIcons, nodeIconColor, categoryMeta, categoryOrder, typeCategory, CHIP_BG } from '../nodes/nodeIcons.js';

// Right-side "add node" drawer. Lists the options for the current slot (trigger
// vs regular vs model), searchable and grouped by category.
export function NodePickerDrawer({ context, onPick, onClose }) {
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(rootRef.current, { xPercent: 100 }, { xPercent: 0, duration: 0.3, ease: 'power3.out' });
  }, []);
  const requestClose = () => gsap.to(rootRef.current, { xPercent: 100, duration: 0.24, ease: 'power2.in', onComplete: onClose });

  let types;
  let title;
  if (context.modelSlot) {
    types = ['chat-gemini'];
    title = 'Choose a language model';
  } else if (context.triggerSlot) {
    types = TRIGGER_OPTIONS;
    title = 'What should trigger this workflow?';
  } else {
    types = NODE_OPTIONS;
    title = 'Add the next step';
  }

  const items = types
    .map((t) => NODE_CATALOG[t])
    .filter(Boolean)
    .filter((n) => n.label.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div ref={rootRef} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 400, background: 'var(--surface-0)', borderLeft: '1px solid var(--border-strong)', boxShadow: '-14px 0 40px rgba(1,24,69,0.14)', zIndex: 40, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
        <button type="button" onClick={requestClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', display: 'flex' }}>
          <X size={17} />
        </button>
      </div>
      <div style={{ padding: 12, borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border-subtle)', background: 'var(--surface-1)', padding: '7px 9px' }}>
          <MagnifyingGlass size={14} color="var(--fg-3)" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search nodes..." autoFocus style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, fontFamily: 'var(--font-body)', color: 'var(--fg-1)', width: '100%' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {categoryOrder.map((cat) => {
          const catItems = items.filter((n) => typeCategory[n.type] === cat);
          if (!catItems.length) return null;
          const meta = categoryMeta[cat];
          return (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: meta.color, fontWeight: 700, marginBottom: 6 }}>{meta.label}</div>
              {catItems.map((n) => {
                const Icon = nodeIcons[n.type];
                const color = nodeIconColor[n.type] || meta.color;
                return (
                  <button
                    key={n.type}
                    type="button"
                    onClick={() => onPick(n.type)}
                    style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '9px 10px', marginBottom: 6, border: '1px solid var(--border-subtle)', background: 'var(--surface-0)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.background = meta.tint; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--surface-0)'; }}
                  >
                    <span style={{ width: 30, height: 30, flex: 'none', borderRadius: 7, background: CHIP_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {Icon ? <Icon size={17} color={color} /> : null}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--fg-1)' }}>{n.label}</span>
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--fg-3)', lineHeight: 1.4 }}>{n.description || n.subtitle}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
