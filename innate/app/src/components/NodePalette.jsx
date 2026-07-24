import React, { useState } from 'react';
import { MagnifyingGlass, CheckCircle } from '@phosphor-icons/react';
import { nodeIcons, nodeIconColor, categoryMeta, categoryOrder, CHIP_BG } from '../nodes/nodeIcons.js';

// Shows ONLY the current build step's nodes. As each step completes, the palette
// swaps to the next step's nodes — a guided, one-step-at-a-time tutorial.
export function NodePalette({ problem, currentStepIndex }) {
  const [query, setQuery] = useState('');

  const onDragStart = (event, paletteNode) => {
    event.dataTransfer.setData('application/judge-node', JSON.stringify(paletteNode));
    event.dataTransfer.effectAllowed = 'move';
  };

  const step = problem.buildSteps[currentStepIndex];
  const total = problem.buildSteps.length;
  const done = currentStepIndex >= total;
  const stepNodes = step
    ? problem.nodePalette.filter((n) => step.categories.includes(n.category) && n.label.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  return (
    <div
      data-tour="palette"
      style={{ width: 252, flex: 'none', overflowY: 'auto', background: 'var(--surface-0)', borderRight: '1px solid var(--border-strong)', padding: 14 }}
    >
      {/* step progress dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        {problem.buildSteps.map((s, i) => (
          <div
            key={s.id}
            title={s.label}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i < currentStepIndex ? 'var(--status-success)' : i === currentStepIndex ? 'var(--brand-primary)' : 'var(--n-200)',
            }}
          />
        ))}
      </div>

      {done ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '30px 10px', textAlign: 'center' }}>
          <CheckCircle size={30} weight="fill" color="var(--status-success)" />
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>All nodes placed</div>
          <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>Wire them up, then hit Run to watch it work.</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: 'var(--brand-primary)', color: 'var(--fg-on-brand)' }}>
              {currentStepIndex + 1}
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--fg-1)' }}>
              Step {currentStepIndex + 1} of {total}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', marginBottom: 14, paddingLeft: 28 }}>{step.label}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border-subtle)', background: 'var(--surface-1)', padding: '7px 9px', marginBottom: 14 }}>
            <MagnifyingGlass size={14} color="var(--fg-3)" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search this step..."
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, fontFamily: 'var(--font-body)', color: 'var(--fg-1)', width: '100%' }}
            />
          </div>

          {categoryOrder
            .filter((cat) => step.categories.includes(cat))
            .map((cat) => {
              const items = stepNodes.filter((n) => n.category === cat);
              if (items.length === 0) return null;
              const meta = categoryMeta[cat];
              return (
                <div key={cat} style={{ marginBottom: 16 }} data-tour="active-step">
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: meta.color, fontWeight: 700, marginBottom: 6, paddingLeft: 2 }}>
                    {meta.label}
                  </div>
                  {items.map((paletteNode) => {
                    const Icon = nodeIcons[paletteNode.type];
                    const iconColor = nodeIconColor[paletteNode.type] || meta.color;
                    return (
                      <div
                        key={paletteNode.type}
                        draggable
                        onDragStart={(event) => onDragStart(event, paletteNode)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 9px', marginBottom: 6, border: '1px solid var(--border-subtle)', background: 'var(--surface-0)', cursor: 'grab' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.background = meta.tint; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--surface-0)'; }}
                      >
                        <div style={{ width: 26, height: 26, flex: 'none', borderRadius: 7, background: CHIP_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {Icon ? <Icon size={15} color={iconColor} /> : null}
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--fg-1)' }}>{paletteNode.label}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
        </>
      )}
    </div>
  );
}
