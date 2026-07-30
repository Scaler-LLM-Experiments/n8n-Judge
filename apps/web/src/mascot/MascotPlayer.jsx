import { useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import './dotlottieSetup.js';
import { useVoiceActions, useVoiceSpeaking } from '../lib/VoiceContext.jsx';
import { aboveFloor, driveVoiceLevel } from '../lib/voiceLevel.js';

// Served from /public (copied from src/assets by scripts/sync-static-assets.mjs).
const companionUrl = '/mascot/companion.lottie';

// How much bigger Iris gets at the loudest part of a word. Small on purpose: the
// glow is the loud signal and she is the subject, so she breathes rather than throbs.
const MAX_GROWTH = 0.14;

// One persistent dotLottie instance playing clips out of the companion.lottie bundle.
// State changes swap animations in-memory via loadAnimation(id) — no remounts.
//
// `pulse` (default on): while Iris is speaking she scales with her own voice, off the
// SAME level the corner glow uses (`voiceLevel.js`), so the two read as one effect.
// Pass `pulse={false}` where she is furniture rather than a speaker — the 22px mascot
// inside the "Ask Iris" button, for instance, where a wobble is just noise.
export function MascotPlayer({ clip, once, onceDone, pulse = true }) {
  const dlRef = useRef(null);
  const desired = useRef({ clip, once });
  const onceDoneRef = useRef(onceDone);
  const scaleRef = useRef(null);
  const { getAnalyser } = useVoiceActions();
  const { speaking, muted } = useVoiceSpeaking();
  // Muted still animates her: the mascot reacting is how a muted learner can tell
  // Iris is saying something at all (rule 2 in voice.js). It just cannot follow a
  // waveform that is not playing, so it breathes on a timer instead.
  const active = pulse && speaking;

  useEffect(() => {
    const el = scaleRef.current;
    if (!el) return undefined;

    if (!active) {
      // Back to her real size, gently. Snapping back lands on the last frame of a
      // word and reads as a flinch.
      const settle = gsap.to(el, { scale: 1, duration: 0.32, ease: 'power2.out' });
      return () => settle.kill();
    }

    gsap.set(el, { transformOrigin: '50% 85%' }); // grows from her feet, not her middle
    const scaleTo = gsap.quickTo(el, 'scale', { duration: 0.16, ease: 'power2.out' });
    const stop = driveVoiceLevel(muted ? null : getAnalyser?.() ?? null, (level) => {
      scaleTo(1 + aboveFloor(level) * MAX_GROWTH);
    });

    if (stop) return stop;

    const idle = gsap.to(el, {
      scale: 1 + MAX_GROWTH * 0.55,
      duration: 0.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
    return () => idle.kill();
  }, [active, muted, getAnalyser]);

  useEffect(() => {
    onceDoneRef.current = onceDone;
  }, [onceDone]);

  const apply = useCallback(() => {
    const dl = dlRef.current;
    if (!dl || !dl.isLoaded) return;
    const want = desired.current;
    if (dl.activeAnimationId !== want.clip) {
      dl.loadAnimation(want.clip);
      return;
    }
    dl.setLoop(!want.once);
    dl.play();
  }, []);

  const dotLottieRefCallback = useCallback(
    (dl) => {
      dlRef.current = dl;
      if (!dl) return;
      dl.addEventListener('load', apply);
      dl.addEventListener('complete', () => {
        if (desired.current.once) onceDoneRef.current();
      });
    },
    [apply]
  );

  useEffect(() => {
    desired.current = { clip, once };
    apply();
  }, [clip, once, apply]);

  // The scale lives on a wrapper, never on the caller's own element: BuildStage
  // tweens the traveling mascot's container (left/top/width/height) with GSAP, and
  // two tweens fighting over one node's transform is a bug waiting to happen.
  return (
    <div ref={scaleRef} style={{ width: '100%', height: '100%', willChange: 'transform' }}>
      <DotLottieReact
        src={companionUrl}
        autoplay={false}
        loop
        dotLottieRefCallback={dotLottieRefCallback}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
