import React from 'react';
import { X } from '@phosphor-icons/react';
import { Badge } from '../design-system/Badge.jsx';
import { nodeIcons, categoryLabels } from '../nodes/nodeIcons.js';

const BRANCH_LABELS = ['Bug Report', 'Feature Request', 'Urgent Complaint'];

export function NodePropertyPanel({ node, problem, onClose }) {
  if (!node) return null;

  const paletteEntry = problem.nodePalette.find((p) => p.type === node.type);
  const Icon = nodeIcons[node.type];
  const categoryLabel = paletteEntry ? categoryLabels[paletteEntry.category] : node.type;

  return (
    <div style={{ width: 260, borderLeft: '1px solid var(--border-subtle)', padding: 16, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--fg-2)', fontWeight: 700 }}>
          Node Properties
        </div>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)' }}>
          <X size={14} />
        </button>
      </div>

      <Badge tone="warning" style={{ marginBottom: 14 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {Icon ? <Icon size={12} /> : null}
          {categoryLabel}
        </span>
      </Badge>

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--fg-2)', marginBottom: 5 }}>Display Name</label>
        <div style={{ border: '1px solid var(--border-subtle)', padding: '8px 10px', fontSize: 13, color: 'var(--fg-1)', background: 'var(--surface-1)' }}>
          {node.data.label}
        </div>
      </div>

      {node.type === 'switch' ? (
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--fg-2)', marginBottom: 5 }}>Branches</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {BRANCH_LABELS.map((label) => (
              <div key={label} style={{ border: '1px solid var(--border-subtle)', padding: '6px 10px', fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                {label} <span>&rarr;</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--fg-2)', marginBottom: 5 }}>Notes</label>
        <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>
          Read-only for now — values here don't affect Run yet.
        </div>
      </div>
    </div>
  );
}
