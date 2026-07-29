import { describe, it, expect } from 'vitest';
import { clipHash, clipState, manifestPath, problemOfPath } from './voiceManifest';

const VOICE = 'voice-abc';
const MODEL = 'eleven_v3';

describe('clipHash', () => {
  it('is stable for the same inputs', () => {
    expect(clipHash('Hello.', VOICE, MODEL)).toBe(clipHash('Hello.', VOICE, MODEL));
  });

  it('changes when the text changes', () => {
    // The whole point: a reworded line has to become detectably different, because
    // its PATH does not change.
    expect(clipHash('Hello.', VOICE, MODEL)).not.toBe(clipHash('Hello!', VOICE, MODEL));
  });

  it('changes when the voice or the model changes', () => {
    // Switching either makes every stored clip wrong in the same way a rewrite
    // does, and re-rendering everything is then the correct behaviour.
    expect(clipHash('Hello.', VOICE, MODEL)).not.toBe(clipHash('Hello.', 'other-voice', MODEL));
    expect(clipHash('Hello.', VOICE, MODEL)).not.toBe(clipHash('Hello.', VOICE, 'eleven_turbo_v2'));
  });

  it('is not sensitive to the delimiter being ambiguous', () => {
    // voice+model+text are joined with newlines, so a text that itself contains the
    // delimiter must not be able to impersonate a different voice.
    expect(clipHash(`${MODEL}\nHello.`, VOICE, '')).not.toBe(clipHash('Hello.', VOICE, MODEL));
  });
});

describe('clipState', () => {
  const path = 'email-triage/welcome--v0.mp3';
  const hash = clipHash('Hello.', VOICE, MODEL);

  it('is current when the recorded hash matches', () => {
    expect(clipState({ [path]: hash }, path, hash)).toBe('current');
  });

  it('is stale when a hash is recorded but differs', () => {
    expect(clipState({ [path]: 'something-else' }, path, hash)).toBe('stale');
  });

  it('is unknown when nothing is recorded', () => {
    // Every clip is in this state the first time generation runs after manifests
    // landed, which is why adoption exists rather than treating it as stale.
    expect(clipState({}, path, hash)).toBe('unknown');
  });
});

describe('paths', () => {
  it('keeps one manifest per problem', () => {
    expect(manifestPath('email-triage')).toBe('_manifest/email-triage.json');
    expect(manifestPath('order-desk')).not.toBe(manifestPath('email-triage'));
  });

  it('reads the problem back off a clip path', () => {
    expect(problemOfPath('order-desk/verify-pass--switch--v1.mp3')).toBe('order-desk');
    expect(problemOfPath('welcome--v0.mp3')).toBe('welcome--v0.mp3');
  });

  it('does not collide with a clip path', () => {
    // Manifests live under a prefix a clip can never occupy: SAFE_CLIP_PATH rejects
    // a leading underscore, so `_manifest/...` is unreachable through the playback
    // route and cannot be served as audio.
    expect(manifestPath('x').startsWith('_')).toBe(true);
  });
});
