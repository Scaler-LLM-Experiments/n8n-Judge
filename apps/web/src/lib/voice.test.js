import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createVoice } from './voice.js';
import { clipId } from './voicePath.js';

// The barge-in policy, which is the difference between narration that keeps up with
// a learner and narration that talks about the screen they just left.
//
// No audio here: with no `Audio`/`AudioContext` (as in Node) the store takes its
// caption-only path, which exercises the same latch, scope and pending logic.

let voice;
// A minimal document stand-in rather than pulling in jsdom for four assertions:
// `preload` only ever creates a link and appends it to head.
let appended = [];
beforeEach(() => {
  appended = [];
  globalThis.document = {
    createElement: () => ({}),  // props are assigned by preload()
    head: { appendChild: (el) => appended.push(el) },
  };
  vi.useFakeTimers();
  globalThis.requestAnimationFrame = () => 0;
  globalThis.cancelAnimationFrame = () => {};
});
afterEach(() => {
  voice?.stop();
  vi.useRealTimers();
});

// No `Audio` in jsdom by default, so the store takes its caption-only path — which
// exercises the same latch, cut and preload logic.
const make = (overrides = {}) => createVoice({ onMoment: vi.fn(), problemSlug: 'email-triage', ...overrides });

/**
 * A stand-in for the generated clip table, keyed exactly as the generator keys it.
 *
 * Every variant is filled because which one a learner hears is decided in their
 * browser from a session seed, so all of them have to exist — the same reason the
 * real generator renders each variant.
 */
const clipTable = (moments) => {
  const clips = {};
  for (const { moment, vars } of moments) {
    for (let variant = 0; variant < 6; variant += 1) {
      clips[clipId(moment, vars?.key, vars ?? {}, variant)] = {
        text: 'stand-in',
        file: `shared/${moment.replace(/_/g, '-')}--v${variant}fingerprint`.slice(0, 60) + '.mp3',
      };
    }
  }
  return clips;
};

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

describe('preloading what is next', () => {
  // Warming is now `link rel=preload` on the exact URL the audio element will
  // request, so the browser's own cache does the work. The old JS blob cache was
  // reimplementing HTTP caching, and losing it on every navigation.
  const links = () => appended.filter((l) => l.rel === 'preload' && l.as === 'audio');

  const UPCOMING = [
    { moment: 'verify_pass', vars: { node: 'A' } },
    { moment: 'verify_fail', vars: { node: 'A' } },
    { moment: 'answer_correct', vars: { answer: 'B' } },
    { moment: 'answer_wrong', vars: { answer: 'C' } },
  ];
  const withClips = (moments) => make({ problem: { voiceClips: clipTable(moments) } });

  it('preloads the declared upcoming clips, capped at three', () => {
    voice = withClips(UPCOMING);
    voice.setUpcoming(UPCOMING);
    expect(links().length).toBe(3);
  });

  it('points at the file the table names, not one it worked out itself', () => {
    // The bug this replaces: the player DERIVED the path with the same rule the
    // generator used, implemented twice. They drifted, so every keyed clip missed
    // storage — and a miss used to be answered by rendering the line live.
    const moments = [{ moment: 'verify_pass', vars: { key: 'classify', node: 'Classify with AI' } }];
    voice = withClips(moments);
    voice.setUpcoming(moments);
    expect(links()[0].href).toMatch(/^\/api\/voice\/clip\/shared\/verify-pass--v\d[a-z]*\.mp3$/);
  });

  it('does not preload the same URL twice', () => {
    voice = withClips(UPCOMING);
    voice.setUpcoming([{ moment: 'verify_pass', vars: { node: 'A' } }]);
    voice.setUpcoming([{ moment: 'verify_pass', vars: { node: 'A' } }]);
    expect(links().length).toBe(1);
  });

  it('requests NOTHING for a line the table has no audio for', () => {
    // No table at all is the state before any voice is generated, and a line added
    // since the last run is the state after. Both must cost zero requests: asking
    // anyway would be a 404 per beat for a learner who was never going to hear it.
    voice = make();
    voice.setUpcoming(UPCOMING);
    expect(links().length).toBe(0);

    voice.play('verify_pass', { node: 'A' });
    expect(links().length).toBe(0);
    // Still narrates — the caption comes from the local phrase book, not the network.
    expect(voice.getState().caption?.moment).toBe('verify_pass');
  });

  it('preloads nothing while muted', () => {
    voice = withClips(UPCOMING);
    voice.setMuted(true);
    voice.setUpcoming([{ moment: 'verify_pass', vars: { node: 'A' } }]);
    expect(links().length).toBe(0);
  });
});
