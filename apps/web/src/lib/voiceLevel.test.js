import { afterEach, describe, expect, it, vi } from 'vitest';
import { FLOOR, aboveFloor, driveVoiceLevel, syntheticAmp } from './voiceLevel.js';

describe('aboveFloor', () => {
  it('is 0 at the speech floor so the mascot is not permanently inflated', () => {
    expect(aboveFloor(FLOOR)).toBe(0);
    expect(aboveFloor(0)).toBe(0);
  });

  it('is 1 at full loudness', () => {
    expect(aboveFloor(1)).toBeCloseTo(1, 5);
  });

  it('is linear between floor and peak', () => {
    const mid = FLOOR + (1 - FLOOR) / 2;
    expect(aboveFloor(mid)).toBeCloseTo(0.5, 5);
  });
});

describe('syntheticAmp', () => {
  it('stays in 0..1', () => {
    for (let t = 0; t < 5000; t += 37) {
      const a = syntheticAmp(t);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(1);
    }
  });

  it('moves over time so a caption-only line still breathes', () => {
    expect(syntheticAmp(0)).not.toBeCloseTo(syntheticAmp(400), 2);
  });
});

describe('driveVoiceLevel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('always returns a stop function, even with no analyser', () => {
    vi.stubGlobal('requestAnimationFrame', () => 1);
    vi.stubGlobal('cancelAnimationFrame', () => {});
    const stop = driveVoiceLevel(null, () => {});
    expect(typeof stop).toBe('function');
    stop();
  });

  it('re-reads a getter each frame so a late-arriving analyser is used', () => {
    let analyser = null;
    const samples = [];
    const frames = [];

    // Drive one tick at a time so we can swap the analyser mid-stream.
    vi.stubGlobal('requestAnimationFrame', (fn) => {
      frames.push(fn);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});

    const stop = driveVoiceLevel(
      () => analyser,
      (level) => samples.push(level),
    );

    // First scheduled tick: no analyser yet → synthetic, but still ≥ FLOOR.
    expect(frames).toHaveLength(1);
    frames[0]();
    expect(samples).toHaveLength(1);
    expect(samples[0]).toBeGreaterThanOrEqual(FLOOR);

    // A real analyser appears (next spoken line, or audio finally wired).
    const silence = new Uint8Array(256).fill(128);
    analyser = {
      fftSize: 256,
      getByteTimeDomainData(buf) {
        buf.set(silence);
      },
    };
    frames[frames.length - 1]();
    expect(samples.length).toBeGreaterThanOrEqual(2);
    // Pure silence after gain is 0, smoothed toward 0, floored at FLOOR.
    expect(samples[samples.length - 1]).toBeGreaterThanOrEqual(FLOOR);

    stop();
  });
});
