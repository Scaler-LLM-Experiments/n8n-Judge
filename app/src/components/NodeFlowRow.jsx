import React from 'react';
import { N8nNodeView } from '../n8n/N8nNodeView.jsx';

// A compact horizontal row of real node visuals (the exact same N8nNodeView
// used on the Build Node canvas — same body, icon, ports) connected by edges
// styled to match the canvas exactly: same dotted background, same
// stroke color/weight, same closed-arrow marker (see N8nEditor.jsx's
// `defaultEdgeOptions` and its `Background` props — this mirrors both).
//
// `items`: [{ type, label, tag?, active?, dead? }]
// - `dead` renders a broken red connector + an X instead of a node box —
//   nothing exists at that point in the graph (e.g. an unwired branch).
// - `active` highlights the node as the one currently being narrated.
// - `tag` is passed straight through to N8nNodeView ('correct' | 'wrong').
export function NodeFlowRow({ items }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        overflowX: 'auto',
        padding: '20px 14px',
        background: '#E9ECF2',
        backgroundImage: 'radial-gradient(#C4CAD4 1.5px, transparent 1.5px)',
        backgroundSize: '18px 18px',
      }}
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <Connector dead={item.dead} /> : null}
          {item.dead ? (
            <DeadEnd />
          ) : (
            <div style={{ flex: 'none' }}>
              <N8nNodeView type={item.type} label={item.label} tag={item.tag} selected={item.active} size={44} hideAiChip />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function DeadEnd() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 'none', width: 44 }}>
      <div style={{ width: 44, height: 44, border: '1.5px dashed #C9CED6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-danger)', fontSize: 20, fontWeight: 700 }}>
        ✕
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--status-danger)', textAlign: 'center', lineHeight: 1.2 }}>Nothing here</span>
    </div>
  );
}

// Matches N8nEditor's `defaultEdgeOptions`: smoothstep type (a straight run
// here, since the row has no vertical offset to route around), stroke
// #94A3B8 at 1.75px, closed-triangle arrowhead — same color/weight/marker.
function Connector({ dead }) {
  const color = dead ? 'var(--status-danger)' : '#94A3B8';
  return (
    <svg width="34" height="12" viewBox="0 0 34 12" style={{ flex: 'none', overflow: 'visible' }}>
      <line x1="0" y1="6" x2="24" y2="6" stroke={color} strokeWidth="1.75" strokeDasharray={dead ? '3,3' : undefined} />
      <path d="M22 1 L30 6 L22 11 Z" fill={color} />
    </svg>
  );
}
