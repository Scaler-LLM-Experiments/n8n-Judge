import React from 'react';
import { useVoice } from '../lib/VoiceContext.jsx';

// The small blue bubble under Iris that says "she is talking right now".
//
// It exists because the mascot's own animation loops whether or not there is
// sound, so nothing on screen distinguished "Iris is speaking" from "Iris is
// idle". A learner with the volume down could not tell they were missing
// anything, and one with it up could not tell where the voice was coming from.
//
// Driven by `amplitude`, the RMS of the actual audio, so it moves WITH the
// speech rather than on a timer. On the caption-only path a synthetic envelope
// drives it instead, so it still breathes when there is no audio at all: the
// signal means "Iris is saying something", which is true either way.
//
// Deliberately small and quiet. It sits under the mascot and pulses; it is not a
// visualiser and should not pull attention off what Iris is actually saying.
export function VoiceBubble({ size = 10, style }) {
  const { speaking, amplitude } = useVoice();
  if (!speaking) return null;

  // A floor of 0.35 so the bubble is always visibly alive while speaking, even
  // through the quiet gaps between words.
  const level = Math.max(0.35, amplitude ?? 0);

  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--brand-primary)',
        // Both the halo and the scale follow the voice. transform is GPU-cheap,
        // which matters because this updates every animation frame.
        boxShadow: `0 0 0 ${(2 + level * 5).toFixed(1)}px rgba(0, 85, 255, ${(0.1 + level * 0.16).toFixed(3)})`,
        transform: `scale(${(0.85 + level * 0.45).toFixed(3)})`,
        transition: 'transform 90ms linear',
        flex: 'none',
        ...style,
      }}
    />
  );
}

/**
 * The bubble plus the line being spoken. Used where there is room for the words;
 * the bare bubble is for tight spots next to the mascot.
 */
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
