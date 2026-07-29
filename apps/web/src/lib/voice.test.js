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

describe('within one context: queue, latest wins', () => {
  it('parks a second line instead of cutting the first', async () => {
    voice = make();
    voice.play('verify_pass', { scope: 'node:1', node: 'ZEBRA' });
    await vi.advanceTimersByTimeAsync(0);
    const first = voice.getState().caption?.text;

    voice.play('verify_fail', { scope: 'node:1', node: 'ZEBRA' });
    await vi.advanceTimersByTimeAsync(0);
    // Still saying the first thing: same subject, so it is allowed to finish.
    expect(voice.getState().caption?.text).toBe(first);
  });

  it('keeps only the newest parked line, so a burst does not queue up', async () => {
    voice = make();
    voice.play('verify_pass', { scope: 'node:1', node: 'ZEBRA' });
    await vi.advanceTimersByTimeAsync(0);

    voice.play('answer_correct', { scope: 'node:1', answer: 'QUOKKA' });
    voice.play('answer_wrong', { scope: 'node:1', answer: 'NARWHAL' });

    // Advance in steps until a new line starts, and stop there: going too far lets
    // the parked line finish too and the caption clears again.
    let parked = '';
    for (let t = 0; t < 12000 && !parked; t += 400) {
      await vi.advanceTimersByTimeAsync(400);
      const text = voice.getState().caption?.text ?? '';
      if (/QUOKKA|NARWHAL/.test(text)) parked = text;
    }
    // The LAST one parked, not the first: a burst collapses to what is true now.
    expect(parked).toMatch(/NARWHAL/);
    expect(parked).not.toMatch(/QUOKKA/);
  });
});

describe('across contexts: cut immediately', () => {
  it('cuts a line when the subject changes', async () => {
    voice = make();
    voice.play('verify_pass', { scope: 'node:1', node: 'A' });
    await vi.advanceTimersByTimeAsync(0);
    const first = voice.getState().caption?.text;

    // A different node: the learner has moved on, so the old line is stale.
    voice.play('verify_pass', { scope: 'node:2', node: 'B' });
    await vi.advanceTimersByTimeAsync(0);
    const second = voice.getState().caption?.text;

    expect(second).not.toBe(first);
    expect(second).toContain('B');
  });

  it('drops anything parked when the subject changes', async () => {
    voice = make();
    voice.play('verify_pass', { scope: 'node:1', node: 'A' });
    await vi.advanceTimersByTimeAsync(0);
    voice.play('verify_fail', { scope: 'node:1', node: 'A' }); // parked

    voice.play('answer_correct', { scope: 'q:1', answer: 'Z' });
    await vi.advanceTimersByTimeAsync(0);
    expect(voice.getState().caption?.text).toContain('Z');

    // The parked node line must not surface later: it was about the old subject.
    await vi.advanceTimersByTimeAsync(20000);
    expect(voice.getState().caption).toBe(null);
  });

  it('treats no scope as its own context', async () => {
    voice = make();
    voice.play('welcome');
    await vi.advanceTimersByTimeAsync(0);
    const first = voice.getState().caption?.text;
    voice.play('verify_pass', { scope: 'node:1', node: 'A' });
    await vi.advanceTimersByTimeAsync(0);
    expect(voice.getState().caption?.text).not.toBe(first);
  });
});

describe('stop', () => {
  it('goes silent and drops what was parked', async () => {
    voice = make();
    voice.play('verify_pass', { scope: 'n', node: 'A' });
    await vi.advanceTimersByTimeAsync(0);
    voice.play('verify_fail', { scope: 'n', node: 'A' });

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
