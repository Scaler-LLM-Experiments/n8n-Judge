import React from 'react';
import { useVoice } from '../lib/VoiceContext.jsx';

// "Iris is speaking", shown as a big soft blue glow behind the mascot.
//
// Two earlier versions were wrong. A small dot beside her read as one more status
// pip in a row of buttons rather than as Iris doing something. Wrapping the mascot
// fixed the meaning but broke the layout, because MascotPlayer fills its parent
// and the wrapper became that parent, resizing the mascot everywhere it appeared.
//
// So: an independent layer that paints behind and touches nothing.
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
 * A big soft glow that pulses with Iris's voice, painted BEHIND whatever it sits
 * next to.
 *
 * Deliberately not a wrapper. The first version wrapped the mascot, which changed
 * the mascot's own box: MascotPlayer fills its parent, and the wrapper became that
 * parent, so the mascot got resized on every screen it appeared on. This is a
 * standalone absolutely-positioned sibling instead. It reads no layout and affects
 * none, so it cannot break anything by being added or removed.
 *
 * Drop it inside any positioned container, before the thing it should sit behind:
 *
 *   <div style={{ position: 'relative', width: 68, height: 68 }}>
 *     <VoiceGlowLayer />
 *     <MascotPlayer … />
 *   </div>
 *
 * `scale` grows it past its container, because a glow confined to the mascot's own
 * 68px box reads as a border rather than as light. It goes well outside.
 *
 * Driven by `amplitude`, the RMS of the real audio, so it moves with the speech.
 * On the caption-only path a synthetic envelope drives it, so it still breathes:
 * the signal is "Iris is saying something", true either way.
 */
export function VoiceGlowLayer({ scale = 2.6, style }) {
  const { speaking, amplitude } = useVoice();

  // A floor so the glow holds steady through the natural gaps between words
  // instead of strobing.
  const level = speaking ? Math.max(0.32, amplitude ?? 0) : 0;
  const size = `${(scale * (0.82 + level * 0.3) * 100).toFixed(0)}%`;

  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        // Centred on the container, then grown outwards from the middle, so the
        // glow stays concentric with the mascot at any size.
        top: '50%',
        left: '50%',
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(0,85,255,${(level * 0.34).toFixed(3)}) 0%, rgba(0,85,255,${(level * 0.14).toFixed(3)}) 42%, rgba(0,85,255,0) 70%)`,
        opacity: speaking ? 1 : 0,
        // In fast, out slow, so the end of a line fades rather than snapping off.
        transition: speaking ? 'opacity 140ms linear, width 90ms linear, height 90ms linear' : 'opacity 480ms ease-out',
        pointerEvents: 'none',
        zIndex: 0,
        ...style,
      }}
    />
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
