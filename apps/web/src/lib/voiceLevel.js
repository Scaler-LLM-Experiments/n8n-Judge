// How loud Iris is, right now — computed in ONE place.
//
// Two things animate to her voice: the corner glow (VoiceoverIndicator) and Iris
// herself (MascotPlayer). They have to move with the same intensity or the pair
// reads as two unrelated effects, so both drive off this loop rather than each
// reading the analyser with its own constants.
//
// Three rules carried over from the glow, all load-bearing:
//
//   1. Read the AnalyserNode in a plain requestAnimationFrame loop and write
//      straight to the DOM through `gsap.quickTo`. Never through React state — one
//      render per frame re-renders every consumer of the voice context, and an
//      effect that depends on it loops. That is the crash that took out the
//      Understand screen.
//   2. Attack fast, release slow. Symmetric smoothing looks like a VU meter;
//      asymmetric looks like a voice, because speech starts abruptly and trails.
//   3. Hold a FLOOR. Speech has gaps between words, and a level that falls to zero
//      in every gap makes the whole thing flicker.
//
// The analyser is passed as a GETTER, not a node. A new spoken line tears down the
// previous MediaElementSource and builds a fresh AnalyserNode while `speaking`
// stays true — so a loop that captured the old node once would sit on silence for
// every line after the first. Re-resolving each frame keeps the glow and the
// mascot on the live waveform.

/** Level never drops below this while she is speaking. */
export const FLOOR = 0.32;

const ATTACK = 0.28;
const RELEASE = 0.09;
// RMS runs about 0 to 0.5 on speech, so lift it into the usable range.
const RMS_GAIN = 3.2;

/**
 * Caption-only / no-Web-Audio loudness. Same envelope `voice.js` uses when it
 * cannot play a clip, so the mascot and the glow still breathe together when the
 * line is words on screen with no waveform behind them.
 */
export function syntheticAmp(tMs) {
  return Math.max(0, Math.min(1, 0.42 + 0.26 * Math.sin(tMs / 220) + 0.1 * Math.sin(tMs / 95)));
}

/**
 * Call `onLevel(level)` every frame with a 0..1 loudness, where `level` is never
 * below FLOOR.
 *
 * @param {AnalyserNode | null | (() => AnalyserNode | null)} analyserOrGet
 *   Prefer a getter (`() => getAnalyser()`). A bare node is accepted for tests
 *   and one-shot call sites, but it goes stale across spoken lines.
 * @param {(level: number) => void} onLevel
 * @returns {() => void} stop function — always, even when there is no analyser
 *   yet (the loop falls back to a synthetic envelope until one appears).
 */
export function driveVoiceLevel(analyserOrGet, onLevel) {
  const get =
    typeof analyserOrGet === 'function' ? analyserOrGet : () => analyserOrGet ?? null;

  let buf = new Uint8Array(256);
  let smoothed = 0;
  let rafId = null;
  const started = performance.now();

  const tick = () => {
    const analyser = get();
    let amp;
    if (analyser) {
      if (buf.length !== analyser.fftSize) {
        buf = new Uint8Array(analyser.fftSize);
      }
      analyser.getByteTimeDomainData(buf);
      let sumSq = 0;
      for (let i = 0; i < buf.length; i += 1) {
        const v = (buf[i] - 128) / 128;
        sumSq += v * v;
      }
      amp = Math.min(1, Math.sqrt(sumSq / buf.length) * RMS_GAIN);
    } else {
      amp = syntheticAmp(performance.now() - started);
    }
    smoothed =
      amp > smoothed
        ? smoothed + (amp - smoothed) * ATTACK
        : smoothed + (amp - smoothed) * RELEASE;
    onLevel(Math.max(FLOOR, smoothed));
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}

/**
 * The level, remapped so silence sits at 0 and a peak at 1.
 *
 * `driveVoiceLevel` floors its output, which is right for a glow that must stay
 * visible through the gaps between words but wrong for anything that should sit at
 * its natural size when she is quiet — Iris would be permanently 32% inflated.
 */
export function aboveFloor(level) {
  return Math.max(0, (level - FLOOR) / (1 - FLOOR));
}
