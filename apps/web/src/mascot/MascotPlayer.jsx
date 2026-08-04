import { useCallback, useEffect, useRef } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import './dotlottieSetup.js';
import { useVoiceActions, useVoiceSpeaking } from '../lib/VoiceContext.jsx';
import { aboveFloor, driveVoiceLevel } from '../lib/voiceLevel.js';

// Served from /public (copied from src/assets by scripts/sync-static-assets.mjs).
const companionUrl = '/mascot/companion.lottie';

// Scale while speaking. Written as a plain CSS `transform: scale(...)` — NOT via
// GSAP's `scale` property. GSAP 3.15 was writing the new individual transform
// properties as `scale: none` + `transform: translate(0,0)`, so the matrix stayed
// identity forever and the mascot never grew. The corner glow uses scaleX/scaleY
// (which still work); the mascot needs uniform scale, so we set it ourselves.
//
// Range ~1.03–1.11: half the first-pass growth so she breathes rather than bounces.
// Same level driver as VoiceoverIndicator so the two stay in lockstep.
const BASE_SCALE = 1.03;
const PEAK_EXTRA = 0.08;

function applyScale(el, scale) {
  // Clear any leftover individual transform props GSAP may have written earlier.
  el.style.translate = '';
  el.style.rotate = '';
  el.style.scale = '';
  el.style.transformOrigin = '50% 50%';
  el.style.transform = scale === 1 ? '' : `scale(${scale})`;
}

// One persistent dotLottie instance playing clips out of the companion.lottie bundle.
// State changes swap animations in-memory via loadAnimation(id) — no remounts.
//
// `pulse` (default on): while Iris is speaking she scales with her own voice, off the
// SAME level the corner glow uses (`voiceLevel.js`), so the two read as one effect.
// Pass `pulse={false}` where she is furniture rather than a speaker — the 22px mascot
// inside the "Ask Iris" button, for instance, where a wobble is just noise.
//
// Playback:
//   once={true}           play the clip once, then onceDone
//   times={N}             play the clip N times total, then onceDone (Home hero)
//   once={false}, no times  loop forever (speaking loops, idle)
export function MascotPlayer({ clip, once, onceDone, pulse = true, times }) {
  const dlRef = useRef(null);
  const desired = useRef({ clip, once, times });
  const onceDoneRef = useRef(onceDone);
  const scaleRef = useRef(null);
  const { getAnalyser } = useVoiceActions();
  const { speaking, muted } = useVoiceSpeaking();
  // Muted still animates her: the mascot reacting is how a muted learner can tell
  // Iris is saying something at all (rule 2 in voice.js). It just cannot follow a
  // waveform that is not playing, so voiceLevel falls back to a synthetic envelope.
  const active = pulse && speaking;

  useEffect(() => {
    const el = scaleRef.current;
    if (!el) return undefined;

    if (!active) {
      // Ease back without GSAP — a CSS transition on the way down is enough, and
      // avoids the scale:none bug above.
      el.style.transition = 'transform 0.28s ease-out';
      applyScale(el, 1);
      const t = window.setTimeout(() => {
        el.style.transition = '';
      }, 300);
      return () => window.clearTimeout(t);
    }

    el.style.transition = 'none';
    // Light smoothing on top of driveVoiceLevel's attack/release, so she eases
    // rather than jitters — without the 160ms GSAP lag that killed the peaks.
    let current = BASE_SCALE;
    const stop = driveVoiceLevel(
      () => (muted ? null : getAnalyser?.() ?? null),
      (level) => {
        const target = BASE_SCALE + aboveFloor(level) * PEAK_EXTRA;
        current += (target - current) * 0.35;
        applyScale(el, current);
      },
    );
    return () => {
      stop();
      el.style.transition = '';
    };
  }, [active, muted, getAnalyser]);

  useEffect(() => {
    onceDoneRef.current = onceDone;
  }, [onceDone]);

  const apply = useCallback(() => {
    const dl = dlRef.current;
    if (!dl || !dl.isLoaded) return;
    const want = desired.current;
    if (dl.activeAnimationId !== want.clip) {
      // Same-bundle swaps are usually sync; fall through and play when the id
      // already matches so a loading-clip cycle does not stall on a load event
      // that only fires for the initial file.
      dl.loadAnimation(want.clip);
    }
    if (dl.activeAnimationId !== want.clip) return;
    // Finite count: loop with loopCount = additional replays (API: 0 = infinite,
    // 1 = play twice, so times 3 → loopCount 2). Infinite only when neither once
    // nor times is asking for a stop.
    const finite = typeof want.times === 'number' && want.times > 0;
    if (want.once) {
      dl.setLoop(false);
      if (typeof dl.setLoopCount === 'function') dl.setLoopCount(0);
    } else if (finite) {
      dl.setLoop(want.times > 1);
      if (typeof dl.setLoopCount === 'function') dl.setLoopCount(Math.max(0, want.times - 1));
    } else {
      dl.setLoop(true);
      if (typeof dl.setLoopCount === 'function') dl.setLoopCount(0);
    }
    dl.play();
  }, []);

  const dotLottieRefCallback = useCallback(
    (dl) => {
      dlRef.current = dl;
      if (!dl) return;
      dl.addEventListener('load', apply);
      dl.addEventListener('complete', () => {
        // once, or a finite times run that has used up its plays.
        const want = desired.current;
        const finite = typeof want.times === 'number' && want.times > 0;
        if (want.once || finite) onceDoneRef.current?.();
      });
    },
    [apply]
  );

  useEffect(() => {
    desired.current = { clip, once, times };
    apply();
  }, [clip, once, times, apply]);

  // The scale lives on a wrapper, never on the caller's own element: BuildStage
  // tweens the traveling mascot's container (left/top/width/height) with GSAP, and
  // two tweens fighting over one node's transform is a bug waiting to happen.
  return (
    <div
      ref={scaleRef}
      data-iris-voice-scale=""
      style={{ width: '100%', height: '100%', willChange: 'transform', transformOrigin: '50% 50%' }}
    >
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
