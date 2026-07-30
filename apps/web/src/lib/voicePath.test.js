import { describe, expect, it } from 'vitest';
import { SAFE_CLIP_PATH, SHARED_SCOPE, clipFile, clipId, clipUrl } from './voicePath.js';

// A clip's NAME, and why it has two halves.
//
// The readable half (`verify-pass--classify--classify-with-ai--v0`) is derived, and
// both the generator and the browser derive it — so it must be a pure function of
// things both hold. The fingerprint half is NOT derived at runtime: it is written
// into the script table by the generator and only ever looked up. That split is what
// fixes the two bugs the old scheme had:
//
//   the browser derived a path the generator never wrote (every keyed clip missed),
//   and a reworded line kept its URL, so `immutable` served stale audio for a year.

describe('clipId', () => {
  it('is a pure function of moment, key, filled variable and variant', () => {
    expect(clipId('verify_pass', 'classify', { node: 'Classify with AI' }, 0)).toBe(
      'verify-pass--classify--classify-with-ai--v0'
    );
  });

  it('includes the key, which is what the old scheme dropped', () => {
    // The browser plays with `key: type` (BuildStage), the generator enumerated
    // without it, so these two disagreed on every node moment and nothing matched.
    expect(clipId('node_placed', 'switch', { node: 'Switch' }, 0)).toContain('--switch--');
  });

  it('separates two questions that share an option label', () => {
    // 17 clips used to collide precisely here: same moment, same answer text,
    // different question, so different authored explanations landed on one name.
    const a = clipId('answer_wrong', 'trigger', { answer: 'If' }, 0);
    const b = clipId('answer_wrong', 'classify', { answer: 'If' }, 0);
    expect(a).not.toBe(b);
  });

  it('keeps variants apart', () => {
    expect(clipId('welcome', null, {}, 0)).not.toBe(clipId('welcome', null, {}, 1));
  });

  it('survives a moment with no key and no variables', () => {
    expect(clipId('welcome', null, {}, 0)).toBe('welcome--v0');
  });
});

describe('clipFile', () => {
  it('puts an unauthored line in the shared folder', () => {
    expect(clipFile('', 'welcome', 'a1b2c3d4')).toBe(`${SHARED_SCOPE}/welcome--a1b2c3d4.mp3`);
  });

  it('keeps an authored line under its problem', () => {
    expect(clipFile('order-desk', 'welcome', 'a1b2c3d4')).toBe('order-desk/welcome--a1b2c3d4.mp3');
  });

  it('changes name when the fingerprint changes, so a reworded line is a new URL', () => {
    expect(clipFile('', 'welcome', 'aaaaaaaa')).not.toBe(clipFile('', 'welcome', 'bbbbbbbb'));
  });

  it('is one recording when the sentence is the same, whatever moment reached it', () => {
    // The saving: an id is per moment, a file is per sentence. Identical words at
    // two moments of the same kind must not be billed twice.
    expect(clipFile('', 'idle_nudge', 'a1b2c3d4')).toBe(clipFile('', 'idle_nudge', 'a1b2c3d4'));
  });

  it('produces something the route will accept', () => {
    expect(SAFE_CLIP_PATH.test(clipFile('', 'verify_pass', 'a1b2c3d4'))).toBe(true);
    expect(SAFE_CLIP_PATH.test(clipFile('order-desk', 'answer_wrong_again', 'deadbeef'))).toBe(true);
  });
});

describe('SAFE_CLIP_PATH', () => {
  it('rejects anything that could climb out of the prefix', () => {
    for (const bad of ['../secret.mp3', 'a/../../etc/passwd', 'one/two/three.mp3', 'shared/x.wav', '/shared/x.mp3']) {
      expect(SAFE_CLIP_PATH.test(bad), bad).toBe(false);
    }
  });
});

describe('clipUrl', () => {
  it('addresses the app is own route, taking the stored file verbatim', () => {
    expect(clipUrl('shared/welcome--v0--a1b2c3d4.mp3')).toBe('/api/voice/clip/shared/welcome--v0--a1b2c3d4.mp3');
  });
});
