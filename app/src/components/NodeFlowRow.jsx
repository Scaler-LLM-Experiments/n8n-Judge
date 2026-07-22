import React from 'react';
import { ArrowRight, XCircle } from '@phosphor-icons/react';
import { N8nNodeView } from '../n8n/N8nNodeView.jsx';

// A compact horizontal row of real node visuals (the same N8nNodeView used on
// the Build Node canvas) connected by simple line connectors. Used wherever a
// question needs to show actual nodes + connections rather than an abstract
// icon sketch.
//
// `items`: [{ type, label, tag?, active?, dead? }]
// - `dead` renders a broken red connector + an X instead of a node box —
//   nothing exists at that point in the graph (e.g. an unwired branch).
// - `active` highlights the node as the one currently being narrated.
// - `tag` is passed straight through to N8nNodeView ('correct' | 'wrong').
export function NodeFlowRow({ items }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto', padding: '8px 4px' }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <Connector dead={item.dead} /> : null}
          {item.dead ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 'none', width: 48 }}>
              <XCircle size={28} weight="fill" color="var(--status-danger)" />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--status-danger)', textAlign: 'center', lineHeight: 1.2 }}>Nothing here</span>
            </div>
          ) : (
            <div style={{ flex: 'none' }}>
              <N8nNodeView type={item.type} label={item.label} tag={item.tag} selected={item.active} size={48} hidePorts hideAiChip />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Connector({ dead }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', flex: 'none', width: 26 }}>
      <div style={{ flex: 1, height: 2, background: dead ? 'var(--status-danger-border)' : 'var(--border-strong)' }} />
      <ArrowRight size={12} color={dead ? 'var(--status-danger)' : 'var(--fg-3)'} weight="bold" />
    </div>
  );
}
