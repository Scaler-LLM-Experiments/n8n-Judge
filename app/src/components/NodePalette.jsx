import React, { useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { nodeIcons, nodeIconColor, categoryMeta, categoryOrder } from '../nodes/nodeIcons.js';

export function NodePalette({ problem }) {
  const [query, setQuery] = useState('');

  const onDragStart = (event, paletteNode) => {
    event.dataTransfer.setData('application/judge-node', JSON.stringify(paletteNode));
    event.dataTransfer.effectAllowed = 'move';
  };

  const filtered = problem.nodePalette.filter((n) =>
    n.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div
      style={{
        width: 244,
        flex: 'none',
        overflowY: 'auto',
        background: 'var(--surface-0)',
        borderRight: '1px solid var(--border-strong)',
        padding: 14,
      }}
    >
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', fontWeight: 700, marginBottom: 10 }}>
        Nodes
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          border: '1px solid var(--border-subtle)',
          background: 'var(--surface-1)',
          padding: '7px 9px',
          marginBottom: 16,
        }}
      >
        <MagnifyingGlass size={14} color="var(--fg-3)" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search nodes..."
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 12.5,
            fontFamily: 'var(--font-body)',
            color: 'var(--fg-1)',
            width: '100%',
          }}
        />
      </div>

      {categoryOrder.map((category) => {
        const items = filtered.filter((n) => n.category === category);
        if (items.length === 0) return null;
        const meta = categoryMeta[category];
        const CategoryIcon = meta.icon;
        return (
          <div key={category} style={{ marginBottom: 18 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 10.5,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: meta.color,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              <CategoryIcon size={13} weight="fill" /> {meta.label}
            </div>
            {items.map((paletteNode) => {
              const Icon = nodeIcons[paletteNode.type];
              const iconColor = nodeIconColor[paletteNode.type] || meta.color;
              return (
                <div
                  key={paletteNode.type}
                  draggable
                  onDragStart={(event) => onDragStart(event, paletteNode)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 9px',
                    marginBottom: 6,
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-0)',
                    cursor: 'grab',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = meta.color;
                    e.currentTarget.style.background = meta.tint;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.background = 'var(--surface-0)';
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      flex: 'none',
                      borderRadius: 7,
                      background: meta.tint,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {Icon ? <Icon size={15} color={iconColor} /> : null}
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--fg-1)' }}>{paletteNode.label}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
