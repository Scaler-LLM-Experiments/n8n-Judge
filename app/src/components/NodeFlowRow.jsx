import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { N8nNodeView } from '../n8n/N8nNodeView.jsx';

// A compact horizontal row of real node visuals (the exact same N8nNodeView
// used on the Build Node canvas and in DissectionScreen's Understand quiz —
// same body, icon, ports). The container matches Understand's canvas exactly
// (background, dot pattern, padding — see DissectionScreen.jsx's QuizBody),
// and the most-recently-revealed node pops in with the same spring used
// there (`scale 0.82 -> 1, back.out(2)`) rather than appearing instantly.
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
        alignItems: 'center',
        gap: 0,
        overflowX: 'auto',
        padding: '20px 14px',
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
              <N8nNodeView type={item.type} label={item.label} tag={item.tag} selected={item.active} size={44} hideAiChip />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function DeadEnd({ innerRef }) {
  return (
    <div ref={innerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 'none', width: 44 }}>
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
