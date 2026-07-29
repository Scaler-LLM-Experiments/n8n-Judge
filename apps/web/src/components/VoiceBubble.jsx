import React from 'react';
import { useVoice } from '../lib/VoiceContext.jsx';

// Small "Iris is speaking" bits that sit inline with text.
//
// The big screen-level glow is NOT here any more — it lives in
// VoiceoverIndicator.jsx, mounted once for the whole journey. `VoiceGlowLayer`
// used to live in this file and paint a glow inside the mascot's own 68px box,
// which is too small a space for light: it read as a border rather than as Iris
// doing something. Two earlier attempts and the reasons they failed are recorded
// in that file's header.
//
// What is left is the inline pair: a dot, and a dot next to the words being said.

/**
 * The bare indicator, for places with no mascot to wrap. Same signal, same
 * amplitude, just nothing to attach it to.
 */
export function VoiceBubble({ size = 10, style }) {
  const { speaking, amplitude } = useVoice();
  if (!speaking) return null;
  const level = Math.max(0.35, amplitude ?? 0);

  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--brand-primary)',
        boxShadow: `0 0 0 ${(2 + level * 5).toFixed(1)}px rgba(0, 85, 255, ${(0.1 + level * 0.16).toFixed(3)})`,
        transform: `scale(${(0.85 + level * 0.45).toFixed(3)})`,
        transition: 'transform 90ms linear',
        flex: 'none',
        ...style,
      }}
    />
  );
}

/** The glow plus the line being spoken, for screens with room for the words. */
export function VoiceCaption({ maxWidth = 320 }) {
  const { speaking, caption } = useVoice();
  if (!speaking || !caption?.text) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        maxWidth,
        padding: '7px 10px',
        background: 'var(--brand-blue-50, rgba(0,85,255,0.06))',
        border: '1px solid var(--brand-primary)',
        fontSize: 12,
        lineHeight: 1.45,
        color: 'var(--fg-1)',
      }}
    >
      <span style={{ marginTop: 4 }}>
        <VoiceBubble size={8} />
      </span>
      <span>{caption.text}</span>
    </div>
  );
}
