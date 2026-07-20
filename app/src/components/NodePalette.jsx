import React, { useState } from 'react';
import { MagnifyingGlass, Lightning, Sparkle, FlowArrow, Plug } from '@phosphor-icons/react';
import { Card } from '../design-system/Card.jsx';
import { nodeIcons, categoryLabels } from '../nodes/nodeIcons.js';

const CATEGORY_ORDER = ['trigger', 'ai', 'core', 'action'];
const CATEGORY_ICONS = { trigger: Lightning, ai: Sparkle, core: FlowArrow, action: Plug };

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
    <div style={{ width: 240, overflowY: 'auto', borderRight: '1px solid var(--border-subtle)', padding: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          border: '1px solid var(--border-subtle)',
          padding: '6px 8px',
          marginBottom: 14,
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
            fontSize: 12,
            fontFamily: 'var(--font-body)',
            color: 'var(--fg-1)',
            width: '100%',
          }}
        />
      </div>

      {CATEGORY_ORDER.map((category) => {
        const items = filtered.filter((n) => n.category === category);
        if (items.length === 0) return null;
        const CategoryIcon = CATEGORY_ICONS[category];
        return (
          <div key={category} style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--fg-2)',
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              <CategoryIcon size={13} />
              {categoryLabels[category]}
            </div>
            {items.map((paletteNode) => {
              const Icon = nodeIcons[paletteNode.type];
              return (
                <Card
                  key={paletteNode.type}
                  padding={8}
                  interactive
                  draggable
                  onDragStart={(event) => onDragStart(event, paletteNode)}
                  style={{ marginBottom: 6, cursor: 'grab' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {Icon ? <Icon size={15} color="var(--fg-2)" /> : null}
                    <span style={{ fontSize: 12.5, fontWeight: 500 }}>{paletteNode.label}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
