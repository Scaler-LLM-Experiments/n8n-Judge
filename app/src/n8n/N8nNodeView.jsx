import React from 'react';
import { Lightning, CheckCircle, XCircle } from '@phosphor-icons/react';
import { NodeIcon, categoryMeta, typeCategory } from '../nodes/nodeIcons.js';

// ---------------------------------------------------------------------------
// Reusable n8n-style node visual, built from scratch (not n8n's assets).
// Reproduces n8n's conventions: a rounded body with the icon centred, the node
// name BELOW the body, small connection ports on the sides, a lightning badge on
// triggers (rounded-left "flag" silhouette), and a bottom sub-node port on AI
// nodes. Pure presentational — used both for static displays and inside the
// react-flow canvas.
// ---------------------------------------------------------------------------

export function variantOf(type) {
  const cat = typeCategory[type] || 'core';
  if (cat === 'trigger') return 'trigger';
  if (cat === 'ai') return 'ai';
  if (cat === 'model') return 'model';
  return 'action';
}

const BODY = 88;

export function N8nNodeView({ type, label, placeholder, tag, selected, pulse, running, errorPulse, size = BODY, hidePorts, hideAiChip }) {
  const cat = typeCategory[type] || 'core';
  const meta = categoryMeta[cat];
  const variant = variantOf(type);

  const isTrigger = variant === 'trigger';
  const wide = variant === 'ai'; // AI root nodes are wide, with the label inside
  const radius = isTrigger ? `${size / 2}px 18px 18px ${size / 2}px` : '18px';

  const borderColor = placeholder ? 'var(--border-strong)' : errorPulse ? 'var(--status-danger)' : selected ? meta.color : '#C9CED6';
  const bodyW = wide ? 216 : size;
  const bodyH = wide ? 84 : size;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
      <div style={{ position: 'relative' }}>
        {/* lightning badge for triggers */}
        {isTrigger ? (
          <div style={{ position: 'absolute', left: -9, top: -9, zIndex: 2, width: 22, height: 22, borderRadius: '50%', background: 'var(--surface-0)', border: '1px solid #C9CED6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lightning size={13} weight="fill" color="#FF5C39" />
          </div>
        ) : null}

        {/* input port (left) — everything except triggers */}
        {!hidePorts && !isTrigger ? <Port side="left" /> : null}
        {/* output port (right) */}
        {!hidePorts ? <Port side="right" /> : null}

        {/* body */}
        <div
          style={{
            width: bodyW,
            height: bodyH,
            borderRadius: radius,
            background: placeholder ? 'repeating-linear-gradient(45deg, #EEF1F6, #EEF1F6 6px, #E6EAF0 6px, #E6EAF0 12px)' : 'var(--surface-0)',
            border: `${placeholder ? '1.5px dashed' : '1px solid'} ${borderColor}`,
            boxShadow: placeholder ? 'none' : selected ? `0 0 0 3px ${meta.tint}, 0 8px 22px rgba(1,24,69,0.12)` : '0 2px 6px rgba(1,24,69,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: wide ? 'flex-start' : 'center',
            gap: wide ? 13 : 0,
            padding: wide ? '0 18px' : 0,
            boxSizing: 'border-box',
            transition: 'border-color 140ms ease, box-shadow 140ms ease',
          }}
        >
          {placeholder ? (
            <span style={{ fontSize: 34, fontWeight: 700, color: 'var(--fg-3)' }}>?</span>
          ) : (
            <NodeIcon type={type} size={wide ? 32 : 38} />
          )}
          {wide && !placeholder ? (
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-1)', lineHeight: 1.2 }}>{label}</span>
          ) : null}
        </div>

        {/* pulsing "needs setup" ring — overlaid exactly on the body (same box &
            radius) so its corners line up with the node's, plus the animated glow */}
        {pulse && !placeholder && !running ? (
          <div className="pulse-ring" style={{ position: 'absolute', top: 0, left: 0, width: bodyW, height: bodyH, borderRadius: radius, border: '1.5px solid rgba(0,85,255,0.8)', boxSizing: 'border-box', pointerEvents: 'none', zIndex: 1 }} />
        ) : null}
        {/* run highlight — the node currently executing lights up */}
        {running && !placeholder ? (
          <div className="run-glow" style={{ position: 'absolute', top: 0, left: 0, width: bodyW, height: bodyH, borderRadius: radius, pointerEvents: 'none', zIndex: 1 }} />
        ) : null}
        {/* red pulse on a wrong pick (while Iris probes it) */}
        {errorPulse && !placeholder ? (
          <div className="pulse-error" style={{ position: 'absolute', top: 0, left: 0, width: bodyW, height: bodyH, borderRadius: radius, pointerEvents: 'none', zIndex: 1 }} />
        ) : null}

        {/* AI nodes: a Chat Model sub-node port hanging below (suppressed in the
            editor, where the flow node renders the real ports) */}
        {variant === 'ai' && !placeholder && !hideAiChip ? (
          <div style={{ position: 'absolute', left: '50%', top: '100%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 1.5, height: 12, background: categoryMeta.model.color, marginTop: -1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', border: `1px dashed ${categoryMeta.model.color}`, borderRadius: 999, background: categoryMeta.model.tint, color: categoryMeta.model.color, fontSize: 9.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
              Chat Model
            </div>
          </div>
        ) : null}

        {/* result tag */}
        {tag ? (
          <div style={{ position: 'absolute', top: -10, right: -10, zIndex: 3 }}>
            {tag === 'correct' ? <CheckCircle size={22} weight="fill" color="var(--brand-primary)" /> : <XCircle size={22} weight="fill" color="var(--status-danger)" />}
          </div>
        ) : null}
      </div>

      {/* label below (square nodes only — wide AI nodes carry the label inside) */}
      {!wide ? (
        <div style={{ fontSize: 12.5, fontWeight: 600, color: placeholder ? 'var(--fg-3)' : 'var(--fg-1)', textAlign: 'center', maxWidth: 150, lineHeight: 1.25 }}>
          {label}
        </div>
      ) : null}
    </div>
  );
}

function Port({ side }) {
  return (
    <span
      style={{
        position: 'absolute',
        top: '50%',
        [side]: -5,
        transform: 'translateY(-50%)',
        width: 11,
        height: 11,
        borderRadius: '50%',
        background: 'var(--surface-0)',
        border: '2px solid #9AA2AE',
        zIndex: 2,
      }}
    />
  );
}
