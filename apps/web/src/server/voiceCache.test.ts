import { mkdtemp, readdir, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createClipCache } from './voiceCache';

// The whole point of this module is a number: how many times storage is asked for
// the same clip. Every test here is really asserting that number.

let dir = '';
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'voice-cache-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

/** A fetcher that counts, and can be held open to force a race. */
function counting(bytes: Buffer | null, { hold }: { hold?: Promise<void> } = {}) {
  let calls = 0;
  return {
    get calls() {
      return calls;
    },
    fetchObject: async () => {
      calls += 1;
      if (hold) await hold;
      return bytes;
    },
  };
}

describe('createClipCache', () => {
  it('asks storage once, then never again for that clip', async () => {
    const src = counting(Buffer.from('audio-bytes'));
    const cache = createClipCache({ dir, fetchObject: src.fetchObject });

    expect((await cache.read('shared/a--1234.mp3'))?.toString()).toBe('audio-bytes');
    expect(src.calls).toBe(1);

    // Every later read — this learner, the next learner, tomorrow — is local disk.
    for (let i = 0; i < 25; i += 1) await cache.read('shared/a--1234.mp3');
    expect(src.calls).toBe(1);
  });

  it('collapses a cold-start stampede into ONE fetch', async () => {
    // A class starting together on an empty cache. Without single-flight this is
    // twenty identical GETs against a bucket that just flagged us.
    let release = () => {};
    const hold = new Promise<void>((r) => {
      release = r;
    });
    const src = counting(Buffer.from('x'), { hold });
    const cache = createClipCache({ dir, fetchObject: src.fetchObject });

    const all = Promise.all(Array.from({ length: 20 }, () => cache.read('shared/a--1234.mp3')));
    release();
    const results = await all;

    expect(src.calls).toBe(1);
    expect(results.every((r) => r?.toString() === 'x')).toBe(true);
  });

  it('serves a clip already on disk without touching storage at all', async () => {
    await mkdir(join(dir, 'shared'), { recursive: true });
    await writeFile(join(dir, 'shared/a--1234.mp3'), 'from-disk');
    const src = counting(Buffer.from('from-storage'));
    const cache = createClipCache({ dir, fetchObject: src.fetchObject });

    expect((await cache.read('shared/a--1234.mp3'))?.toString()).toBe('from-disk');
    expect(src.calls).toBe(0);
  });

  it('returns null for a clip storage does not have, and caches nothing', async () => {
    const src = counting(null);
    const cache = createClipCache({ dir, fetchObject: src.fetchObject });

    expect(await cache.read('shared/missing--1234.mp3')).toBeNull();
    expect(await readdir(dir)).toEqual([]);
  });

  it('survives a failing fetch without throwing or leaving a partial file', async () => {
    const cache = createClipCache({
      dir,
      fetchObject: async () => {
        throw new Error('network down');
      },
    });

    expect(await cache.read('shared/a--1234.mp3')).toBeNull();
    // No `.part` left behind: a truncated file would be served forever as if whole.
    await expect(readdir(dir)).resolves.toEqual([]);
  });

  it('retries on the NEXT request after a failure, rather than caching the failure', async () => {
    let attempt = 0;
    const cache = createClipCache({
      dir,
      fetchObject: async () => {
        attempt += 1;
        if (attempt === 1) throw new Error('blip');
        return Buffer.from('recovered');
      },
    });

    expect(await cache.read('shared/a--1234.mp3')).toBeNull();
    expect((await cache.read('shared/a--1234.mp3'))?.toString()).toBe('recovered');
  });

  it('treats a zero-length file on disk as absent and repairs it', async () => {
    await mkdir(join(dir, 'shared'), { recursive: true });
    await writeFile(join(dir, 'shared/a--1234.mp3'), '');
    const src = counting(Buffer.from('real'));
    const cache = createClipCache({ dir, fetchObject: src.fetchObject });

    expect((await cache.read('shared/a--1234.mp3'))?.toString()).toBe('real');
    expect(src.calls).toBe(1);
  });
});
