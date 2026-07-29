import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createVoice } from './voice.js';

// The barge-in policy, which is the difference between narration that keeps up with
// a learner and narration that talks about the screen they just left.
//
// No audio here: with no `Audio`/`AudioContext` (as in Node) the store takes its
// caption-only path, which exercises the same latch, scope and pending logic.

const noAudio = () => ({ ok: false, status: 204, headers: { get: () => null } });

let voice;
beforeEach(() => {
  vi.useFakeTimers();
  globalThis.requestAnimationFrame = () => 0;
  globalThis.cancelAnimationFrame = () => {};
});
afterEach(() => {
  voice?.stop();
  vi.useRealTimers();
});

const make = (overrides = {}) =>
  createVoice({ fetchImpl: vi.fn(noAudio), onMoment: vi.fn(), ...overrides });

describe('one line at a time', () => {
  it('starts speaking when asked', async () => {
    voice = make();
    voice.play('welcome');
    await vi.advanceTimersByTimeAsync(0);
    expect(voice.getState().speaking).toBe(true);
  });

  it('says nothing for a moment it has no words for', () => {
    voice = make();
    voice.play('no_such_moment');
    expect(voice.getState().speaking).toBe(false);
  });

  it('tells the mascot even when muted, because the reaction is not the audio', () => {
    const onMoment = vi.fn();
    voice = make({ onMoment });
    voice.setMuted(true);
    voice.play('welcome');
    expect(onMoment).toHaveBeenCalledWith('welcome', expect.any(String));
    expect(voice.getState().speaking).toBe(false);
  });
});

describe('the newest line always wins', () => {
  // No queue: whatever is playing is about a moment that has passed, and the new
  // line is about now. Letting the old one finish makes the new one late and makes
  // the learner sit through a description of a screen they have left.
  it('cuts the current line even for the same subject', async () => {
    voice = make();
    voice.play('verify_pass', { scope: 'node:1', node: 'ZEBRA' });
    await vi.advanceTimersByTimeAsync(0);
    expect(voice.getState().caption?.text).toContain('ZEBRA');

    voice.play('verify_fail', { scope: 'node:1', node: 'QUOKKA' });
    await vi.advanceTimersByTimeAsync(0);
    expect(voice.getState().caption?.text).toContain('QUOKKA');
  });

  it('cuts across subjects too', async () => {
    voice = make();
    voice.play('verify_pass', { scope: 'node:1', node: 'ZEBRA' });
    await vi.advanceTimersByTimeAsync(0);
    voice.play('answer_correct', { scope: 'q:1', answer: 'NARWHAL' });
    await vi.advanceTimersByTimeAsync(0);
    expect(voice.getState().caption?.text).toContain('NARWHAL');
  });

  it('never lets a cut line resurface later', async () => {
    voice = make();
    voice.play('verify_pass', { node: 'ZEBRA' });
    await vi.advanceTimersByTimeAsync(0);
    voice.play('answer_correct', { answer: 'NARWHAL' });
    await vi.advanceTimersByTimeAsync(0);

    // Well past both lines' durations: nothing should be speaking, and certainly
    // not the one that was cut.
    await vi.advanceTimersByTimeAsync(30000);
    expect(voice.getState().speaking).toBe(false);
    expect(voice.getState().caption).toBe(null);
  });

  it('collapses a burst to the last one', async () => {
    voice = make();
    voice.play('verify_pass', { node: 'ZEBRA' });
    voice.play('verify_fail', { node: 'QUOKKA' });
    voice.play('answer_correct', { answer: 'NARWHAL' });
    await vi.advanceTimersByTimeAsync(0);
    expect(voice.getState().caption?.text).toContain('NARWHAL');
  });
});

describe('stop', () => {
  it('goes silent immediately', async () => {
    voice = make();
    voice.play('verify_pass', { scope: 'n', node: 'ZEBRA' });
    await vi.advanceTimersByTimeAsync(0);

    voice.stop();
    expect(voice.getState().speaking).toBe(false);
    expect(voice.getState().caption).toBe(null);

    await vi.advanceTimersByTimeAsync(20000);
    expect(voice.getState().speaking).toBe(false);
  });

  // A learner who mutes mid-sentence wants silence now, not at the end of the line.
  it('muting stops the current line', async () => {
    voice = make();
    voice.play('welcome');
    await vi.advanceTimersByTimeAsync(0);
    expect(voice.getState().speaking).toBe(true);
    voice.setMuted(true);
    expect(voice.getState().speaking).toBe(false);
  });
});

describe('prefetch', () => {
  it('warms a clip per wording, not per moment', async () => {
    const fetchImpl = vi.fn(noAudio);
    voice = make({ fetchImpl });
    voice.prefetch('verify_pass', { node: 'A' });
    voice.prefetch('verify_pass', { node: 'B' });
    await vi.advanceTimersByTimeAsync(0);
    // Two different lines, so two requests: keying by moment alone was the bug
    // that made the verdict play without the node's name.
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not warm the same wording twice', async () => {
    const fetchImpl = vi.fn(noAudio);
    voice = make({ fetchImpl });
    voice.prefetch('verify_pass', { node: 'A' });
    voice.prefetch('verify_pass', { node: 'A' });
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('warms nothing while muted', async () => {
    const fetchImpl = vi.fn(noAudio);
    voice = make({ fetchImpl });
    voice.setMuted(true);
    voice.prefetch('verify_pass', { node: 'A' });
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
