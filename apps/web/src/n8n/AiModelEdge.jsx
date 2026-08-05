import React, { memo } from 'react';
import { BaseEdge, getSmoothStepPath } from 'reactflow';

// Chat Model → AI root wire.
//
// React Flow's built-in `animated: true` uses `dashdraw` at 0.5s with
// stroke-dasharray: 5 and dashoffset: 10 — the period doesn't match the offset,
// so on a short vertical stem the dashes stutter and look stuck. This edge keeps
// a flowing dash, but with a seamless period (dasharray total === offset step)
// and a slower linear loop.

const STROKE = '#0E9488';
// Dash 6 + gap 6 = 12. Animation advances by exactly 12 so the loop is seamless.
const DASH = '6 6';
const PERIOD = 12;

function AiModelEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}) {
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <BaseEdge
      id={id}
      path={path}
      // No arrow — sub-node links in n8n are plain stems, not main-flow wires.
      style={{
        stroke: STROKE,
        strokeWidth: 2,
        strokeDasharray: DASH,
        fill: 'none',
        animation: `judge-ai-edge-flow 0.85s linear infinite`,
      }}
    />
  );
}

export const AiModelEdge = memo(AiModelEdgeComponent);

/** Mount once near the canvas so the keyframes exist. */
export function AiModelEdgeStyles() {
  return (
    <style>{`
      @keyframes judge-ai-edge-flow {
        from { stroke-dashoffset: 0; }
        to { stroke-dashoffset: -${PERIOD}; }
      }
    `}</style>
  );
}
