import React from 'react';
import { useVoice } from '../lib/VoiceContext.jsx';

// "Iris is speaking", shown as a blue glow around the mascot itself.
//
// The first version was a separate little dot beside her, which was legible but
// wrong: it read as one more status pip in a row of buttons rather than as Iris
// doing something. The glow reads as the character, because it is attached to the
// character.
//
// Driven by `amplitude`, the RMS of the actual audio, so it moves WITH the speech
// rather than on a timer. On the caption-only path (no key, blocked autoplay, a
// vendor failure) a synthetic envelope drives it instead, so it still breathes:
// the signal means "Iris is saying something", which is true either way.
//
// It exists because the mascot's own animation loops whether or not there is
// sound, so nothing on screen distinguished speaking from idle. A learner with
// the volume down could not tell they were missing anything.

/**
 * Wrap a mascot to make it glow while Iris talks.
 *
 * The glow is a sibling layer behind the children rather than a box-shadow on
 * them, so it can extend past the mascot's own bounds without the parent needing
 * spare padding, and so it never affects layout.
 */
export function VoiceGlow({ children, spread = 1, style }) {
  const { speaking, amplitude } = useVoice();

  // A floor, so the glow is steady rather than flickering out in the natural
  // gaps between words.
  const level = speaking ? Math.max(0.34, amplitude ?? 0) : 0;
  const radius = (10 + level * 26) * spread;

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-14%',
          borderRadius: '50%',
          // Two stops so the glow falls off softly instead of ending on a hard
          // edge, which is what makes it read as light rather than as a border.
          background: `radial-gradient(circle, rgba(0,85,255,${(level * 0.42).toFixed(3)}) 0%, rgba(0,85,255,${(level * 0.16).toFixed(3)}) 55%, rgba(0,85,255,0) 78%)`,
          boxShadow: speaking ? `0 0 ${radius.toFixed(1)}px rgba(0,85,255,${(0.18 + level * 0.3).toFixed(3)})` : 'none',
          opacity: speaking ? 1 : 0,
          // Fade in fast, out gently, so the end of a line does not snap off.
          transition: speaking ? 'opacity 120ms linear' : 'opacity 420ms ease-out',
          pointerEvents: 'none',
        }}
      />
      <span style={{ position: 'relative', display: 'inline-flex' }}>{children}</span>
    </span>
  );
}

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
