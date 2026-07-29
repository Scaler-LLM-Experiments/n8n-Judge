import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { clipBackend, clipKey, readClip, writeClip } from './voiceStore.ts';
import { enumerateSpeakable } from '../lib/voiceCatalogue.js';
import { problems } from '@judge/problems';
import { NODE_CATALOG } from '@judge/catalog';

const ENV = ['VOICE_CLIP_BACKEND', 'VOICE_CLIP_DIR', 'AUDIO_S3_BUCKET'];
let saved: Record<string, string | undefined> = {};
let dir = '';

beforeEach(async () => {
  saved = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));
  for (const k of ENV) delete process.env[k];
  dir = await mkdtemp(join(tmpdir(), 'judge-voice-'));
});

afterEach(async () => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  await rm(dir, { recursive: true, force: true });
});

describe('clip keys', () => {
  // The key IS the contract between the generator and the route. If they derive it
  // differently, every clip misses and playback silently falls back to live
  // rendering — the exact latency the pre-rendering exists to remove.
  it('is stable for the same text, voice and model', () => {
    const a = clipKey('[warm] Correct.', 'voice-1', 'eleven_v3');
    const b = clipKey('[warm] Correct.', 'voice-1', 'eleven_v3');
    expect(a).toBe(b);
  });

  it('changes when the wording changes, so an edit regenerates just that line', () => {
    const before = clipKey('[warm] Correct.', 'v', 'm');
    const after = clipKey('[warm] Correct!', 'v', 'm');
    expect(after).not.toBe(before);
  });

  it('changes with the voice and with the model', () => {
    const base = clipKey('x', 'voice-1', 'eleven_v3');
    expect(clipKey('x', 'voice-2', 'eleven_v3')).not.toBe(base);
    expect(clipKey('x', 'voice-1', 'eleven_v2')).not.toBe(base);
  });

  // The audio tags are direction, and they change the delivery, so they are part of
  // the identity of the clip.
  it('treats the delivery tag as part of the line', () => {
    expect(clipKey('[warm] Yes.', 'v', 'm')).not.toBe(clipKey('[calm] Yes.', 'v', 'm'));
  });

  it('shards one level so a listing stays usable', () => {
    expect(clipKey('x', 'v', 'm')).toMatch(/^[0-9a-f]{2}\/[0-9a-f]{64}\.mp3$/);
  });
});

describe('backend selection', () => {
  it('is none until something is configured, so nothing is written by accident', () => {
    expect(clipBackend()).toBe('none');
  });

  // Setting the credentials is enough. Needing a separate VOICE_CLIP_BACKEND=s3 on
  // top of them meant everything looked configured while nothing was consulted,
  // and the only symptom was narration still being slow.
  it('infers s3 from the bucket alone', () => {
    process.env.AUDIO_S3_BUCKET = 'some-bucket';
    expect(clipBackend()).toBe('s3');
  });

  it('prefers s3 over a local directory when both are set', () => {
    process.env.AUDIO_S3_BUCKET = 'some-bucket';
    process.env.VOICE_CLIP_DIR = dir;
    expect(clipBackend()).toBe('s3');
  });

  it('uses local storage as soon as a directory is set', () => {
    process.env.VOICE_CLIP_DIR = dir;
    expect(clipBackend()).toBe('local');
  });

  it('honours an explicit choice over the inferred one', () => {
    process.env.VOICE_CLIP_DIR = dir;
    process.env.VOICE_CLIP_BACKEND = 'none';
    expect(clipBackend()).toBe('none');
  });
});

describe('local storage', () => {
  beforeEach(() => {
    process.env.VOICE_CLIP_DIR = dir;
  });

  it('round-trips a clip', async () => {
    const key = clipKey('[warm] Correct.', 'v', 'm');
    await writeClip(key, Buffer.from('fake-mp3-bytes'));
    const got = await readClip(key);
    expect(got?.toString()).toBe('fake-mp3-bytes');
  });

  it('returns null for a clip that has not been generated', async () => {
    // The normal state for a newly added line, and it must not throw: the route
    // treats null as "render it live" rather than as a failure.
    expect(await readClip(clipKey('never rendered', 'v', 'm'))).toBe(null);
  });

  it('creates the shard directory rather than failing on a missing path', async () => {
    const key = clipKey('deep', 'v', 'm');
    await expect(writeClip(key, Buffer.from('x'))).resolves.toBeUndefined();
    expect(await readClip(key)).not.toBe(null);
  });

  it('reads nothing when storage is switched off, even with clips on disk', async () => {
    const key = clipKey('stored', 'v', 'm');
    await writeClip(key, Buffer.from('x'));
    process.env.VOICE_CLIP_BACKEND = 'none';
    expect(await readClip(key)).toBe(null);
  });
});

describe('what pre-generation has to cover', () => {
  // If the enumeration misses a line, that line is never pre-rendered and every
  // learner pays the vendor round trip for it. So: the catalogue must account for
  // every variable in every line it emits.
  it('leaves no unfilled placeholder in any enumerated line', () => {
    for (const [slug, problem] of Object.entries(problems)) {
      for (const item of enumerateSpeakable(problem, NODE_CATALOG)) {
        expect(item.spoken, `${slug} ${item.moment}`).not.toMatch(/\{\w+\}/);
      }
    }
  });

  it('enumerates a line per option for the verdicts that name the choice', () => {
    const et = problems['email-triage'] as Record<string, any>;
    const list = enumerateSpeakable(et, NODE_CATALOG);
    // Every question, not just the first: an authored line that forgot `{answer}`
    // would silently stop naming the learner's choice, which is how the generic
    // "that is right" crept back in once already.
    for (const q of et.dissection) {
      for (const moment of ['answer_correct', 'answer_wrong']) {
        const forQuestion = list.filter((i) => i.moment === moment && i.key === q.id);
        expect(forQuestion.length, `${moment}:${q.id} should cover every option`).toBe(q.options.length);
        for (const opt of q.options) {
          expect(forQuestion.some((i) => i.spoken.includes(opt.label)), `${moment}:${q.id} → ${opt.label}`).toBe(true);
        }
      }
    }
  });

  it('enumerates a line per node for the verdicts that name the node', () => {
    const list = enumerateSpeakable(problems['email-triage'], NODE_CATALOG);
    const named = list.filter((i) => i.moment === 'verify_pass');
    expect(named.length).toBeGreaterThan(1);
    expect(named.every((i) => i.spoken.length > 0)).toBe(true);
  });

  it('deduplicates wording shared across moments, so it is billed once', () => {
    const list = enumerateSpeakable(problems['email-triage'], NODE_CATALOG);
    const spoken = list.map((i) => i.spoken);
    expect(new Set(spoken).size).toBe(spoken.length);
  });

  it('covers every moment the phrase book defines', async () => {
    const { LINES } = await import('../lib/voiceLines.js');
    const list = enumerateSpeakable(problems['email-triage'], NODE_CATALOG);
    const covered = new Set(list.map((i) => i.moment));
    for (const moment of Object.keys(LINES)) {
      expect(covered.has(moment), `${moment} would never be pre-rendered`).toBe(true);
    }
  });
});
