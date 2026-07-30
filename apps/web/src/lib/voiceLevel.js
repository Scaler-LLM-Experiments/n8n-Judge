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

/** Level never drops below this while she is speaking. */
export const FLOOR = 0.32;

const ATTACK = 0.28;
const RELEASE = 0.09;
// RMS runs about 0 to 0.5 on speech, so lift it into the usable range.
const RMS_GAIN = 3.2;

/**
 * Call `onLevel(level)` every frame with a 0..1 loudness, where `level` is never
 * below FLOOR.
 *
 * @param {AnalyserNode | null} analyser
 * @param {(level: number) => void} onLevel
 * @returns {(() => void) | null} stop function, or null when there is no analyser
 *   to read (a normal state: Web Audio may be missing, or the line may be
 *   caption-only because no clip exists — callers fall back to a timed breathe).
 */
export function driveVoiceLevel(analyser, onLevel) {
  if (!analyser) return null;

  const buf = new Uint8Array(analyser.fftSize);
  let smoothed = 0;
  let rafId = null;

  const tick = () => {
    analyser.getByteTimeDomainData(buf);
    let sumSq = 0;
    for (let i = 0; i < buf.length; i += 1) {
      const v = (buf[i] - 128) / 128;
      sumSq += v * v;
    }
    const amp = Math.min(1, Math.sqrt(sumSq / buf.length) * RMS_GAIN);
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
