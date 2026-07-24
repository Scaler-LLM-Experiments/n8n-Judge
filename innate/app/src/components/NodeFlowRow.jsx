import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { N8nNodeView } from '../n8n/N8nNodeView.jsx';

const NODE_SIZE = 64;

// A horizontal row of real node visuals — the exact same N8nNodeView used on
// the Build Node canvas, at the same size DissectionScreen's "toolkit reveal"
// uses it (see Done() in DissectionScreen.jsx). Ports and the AI cluster's
// "Chat Model" sub-chip are shown (not hidden), matching that richer look.
// The container matches Understand's canvas exactly (background, dot
// pattern — see DissectionScreen.jsx's QuizBody), and the most-recently-
// revealed node pops in with the same spring used there
// (`scale 0.82 -> 1, back.out(2)`) rather than appearing instantly.
//
// `items`: [{ type, label, tag?, active?, dead? }]
// - `dead` renders a broken red connector + an X instead of a node box —
//   nothing exists at that point in the graph (e.g. an unwired branch).
// - `active` is the node currently being narrated — it gets the spring pop
//   and a selected highlight.
// - `tag` is passed straight through to N8nNodeView ('correct' | 'wrong').
export function NodeFlowRow({ items }) {
  const nodeRefs = useRef([]);

  useEffect(() => {
    const activeIndex = items.findIndex((it) => it.active);
    const el = nodeRefs.current[activeIndex >= 0 ? activeIndex : items.length - 1];
    if (el) gsap.fromTo(el, { scale: 0.82, y: 8, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)' });
  }, [items]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 0,
        overflowX: 'auto',
        overflowY: 'visible',
        padding: '24px 18px 64px',
        background: '#E9ECF2',
        backgroundImage: 'radial-gradient(#C4CAD4 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }}
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <Connector dead={item.dead} /> : null}
          {item.dead ? (
            <DeadEnd innerRef={(el) => (nodeRefs.current[i] = el)} />
          ) : (
            <div ref={(el) => (nodeRefs.current[i] = el)} style={{ flex: 'none' }}>
              <N8nNodeView type={item.type} label={item.label} tag={item.tag} selected={item.active} size={NODE_SIZE} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function DeadEnd({ innerRef }) {
  return (
    <div ref={innerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, flex: 'none', width: NODE_SIZE }}>
      <div style={{ width: NODE_SIZE, height: NODE_SIZE, borderRadius: 18, border: '1.5px dashed #C9CED6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-danger)', fontSize: 26, fontWeight: 700 }}>
        ✕
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--status-danger)', textAlign: 'center', lineHeight: 1.2 }}>Nothing here</span>
    </div>
  );
}

// Matches N8nEditor's `defaultEdgeOptions`: smoothstep type (a straight run
// here, since the row has no vertical offset to route around), stroke
// #94A3B8 at 1.75px, closed-triangle arrowhead — same color/weight/marker.
function Connector({ dead }) {
  const color = dead ? 'var(--status-danger)' : '#94A3B8';
  return (
    <svg width="40" height="16" viewBox="0 0 40 16" style={{ flex: 'none', overflow: 'visible', marginTop: NODE_SIZE / 2 - 8 }}>
      <line x1="0" y1="8" x2="28" y2="8" stroke={color} strokeWidth="1.75" strokeDasharray={dead ? '3,3' : undefined} />
      <path d="M26 2 L36 8 L26 14 Z" fill={color} />
    </svg>
  );
}
