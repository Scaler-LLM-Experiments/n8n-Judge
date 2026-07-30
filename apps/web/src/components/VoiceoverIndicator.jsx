import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useVoiceActions, useVoiceGlowHidden, useVoiceSpeaking } from '../lib/VoiceContext.jsx';
import { FLOOR, driveVoiceLevel } from '../lib/voiceLevel.js';

// "Iris is speaking", as a glow blooming out of the bottom-left corner.
//
// Ported from the reference simulator's `VoiceoverIndicator`, which solves this
// the right way round. Three things are worth keeping from it:
//
//   1. It blooms from the bottom-LEFT corner rather than spanning the bottom
//      edge, so the light reads as coming from Iris, who sits there. A bar across
//      the whole bottom reads as a progress indicator.
//   2. It reads the AnalyserNode in its OWN requestAnimationFrame loop and writes
//      through `gsap.quickTo`, straight to the DOM. Not one React render per
//      frame. The earlier version pushed amplitude through context, which
//      re-rendered every consumer sixty times a second and looped an effect into
//      a crash.
//   3. Attack fast, release slow. Symmetric smoothing looks like a VU meter;
//      asymmetric looks like a voice, because speech starts abruptly and trails.
//
// Three stacked layers, because one gradient cannot do it: a large soft bloom
// that scales with volume, a static floor wash that keeps the corner grounded
// through the gaps between words, and a thin bright line along the bottom edge
// that gives the whole thing a defined edge instead of a fog.
//
// The earlier local glow (`VoiceGlowLayer`) sat inside the mascot's own box and
// had to be small enough to fit it, so it read as a border. This is not tied to
// the mascot at all, which is why it can be big.

// A screen can claim the corner (see `useHideVoiceGlow`). The claim UNMOUNTS the
// glow rather than styling it away: the bloom runs its own requestAnimationFrame
// loop writing through `gsap.quickTo`, so hiding a still-mounted one would leave
// that loop animating detached nodes for the rest of the session.
export function VoiceoverIndicator() {
  const hidden = useVoiceGlowHidden();
  if (hidden) return null;
  return <CornerGlow />;
}

function CornerGlow() {
  const { getAnalyser } = useVoiceActions();
  // Only `speaking` and `muted`, so this does not re-render on caption changes.
  const { speaking, muted } = useVoiceSpeaking();
  const active = speaking && !muted;

  const rootRef = useRef(null);
  const glowRef = useRef(null);
  const lineRef = useRef(null);
  // Mount, then animate in on the next frame — a GSAP `fromTo` on a node that has
  // not been painted yet has nothing to tween from.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!active) return undefined;
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [active]);

  useEffect(() => {
    if (!mounted) return undefined;
    const root = rootRef.current;
    const glow = glowRef.current;
    const line = lineRef.current;
    if (!root || !glow || !line) return undefined;

    const enter = gsap.fromTo(root, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    // Grow from the corner the light comes from, not from the middle.
    gsap.set(glow, { transformOrigin: '0% 100%' });
    gsap.set(line, { transformOrigin: '0% 50%' });

    const glowOpacity = gsap.quickTo(glow, 'opacity', { duration: 0.18, ease: 'power2.out' });
    const glowScale = gsap.quickTo(glow, 'scaleY', { duration: 0.24, ease: 'power2.out' });
    const lineOpacity = gsap.quickTo(line, 'opacity', { duration: 0.18, ease: 'power2.out' });
    const lineScale = gsap.quickTo(line, 'scaleX', { duration: 0.24, ease: 'power2.out' });

    const analyser = getAnalyser?.() ?? null;
    let idle = null;

    // Shared with the mascot's own pulse, so the two move as one effect rather than
    // as two things that happen to be blue.
    const stopLevel = driveVoiceLevel(analyser, (level) => {
      glowOpacity(0.35 + level * 0.85);
      glowScale(0.85 + level * 0.75);
      lineOpacity(0.35 + level * 0.95);
      lineScale(0.9 + level * 0.2);
    });

    if (!stopLevel) {
      // No analyser is a normal state, not a failure: Web Audio may be missing, or
      // the line may be caption-only because no clip exists. The signal is "Iris is
      // saying something", which is still true, so it breathes on a timer instead.
      gsap.set(glow, { opacity: 0.55, scaleY: 0.9 });
      gsap.set(line, { opacity: 0.45, scaleX: 0.96 });
      idle = gsap.timeline({ repeat: -1, yoyo: true });
      idle
        .to(glow, { opacity: 1, scaleY: 1.12, duration: 0.45, ease: 'sine.inOut' })
        .to(line, { opacity: 0.9, scaleX: 1.02, duration: 0.7, ease: 'sine.inOut' }, 0);
    }

    return () => {
      enter.kill();
      if (stopLevel) stopLevel();
      if (idle) idle.kill();
    };
  }, [mounted, getAnalyser]);

  // Fade out on the way down rather than vanishing, then unmount. A glow that
  // snaps off makes the end of every line feel like a cut.
  useEffect(() => {
    if (active || !mounted) return undefined;
    const root = rootRef.current;
    if (!root) {
      setMounted(false);
      return undefined;
    }
    const out = gsap.to(root, {
      opacity: 0,
      y: 12,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: () => setMounted(false),
    });
    return () => out.kill();
  }, [active, mounted]);

  if (!mounted) return null;

  // rgb of --brand-primary (#0055FF). Written out because these are gradient stops
  // with their own alphas, and `color-mix` on a custom property is not supported
  // widely enough to rely on for something purely decorative.
  const b = '0, 85, 255';

  return (
    <div
      aria-hidden="true"
      ref={rootRef}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        height: 380,
        width: '54vw',
        // Above the canvas, below the NDV modal and the picker drawer: it must
        // never sit over something a learner is reading.
        zIndex: 40,
        pointerEvents: 'none',
        opacity: 0,
      }}
    >
      <div
        ref={glowRef}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.4,
          background: `radial-gradient(ellipse 92% 96% at 0% 100%, rgba(${b},0.30) 0%, rgba(${b},0.16) 32%, rgba(${b},0.05) 56%, transparent 78%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 120,
          width: '100%',
          background: `radial-gradient(ellipse 60% 100% at 0% 100%, rgba(${b},0.10) 0%, rgba(${b},0.035) 50%, transparent 100%)`,
        }}
      />
      <div
        ref={lineRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 2,
          width: '70%',
          opacity: 0.4,
          background: `linear-gradient(to right, rgba(${b},0.95) 0%, rgba(${b},0.55) 30%, rgba(${b},0.3) 60%, transparent 100%)`,
          filter: 'blur(1.5px)',
        }}
      />
    </div>
  );
}
