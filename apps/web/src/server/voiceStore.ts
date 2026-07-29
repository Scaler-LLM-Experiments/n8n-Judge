import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// Where rendered voice clips live.
//
// ---------------------------------------------------------------------------
// Why pre-render at all
// ---------------------------------------------------------------------------
// Rendering on demand costs a vendor round trip on the first play of every line,
// which is the latency you hear as a pause between a click and Iris speaking.
// Prefetching hides it when the next line is predictable, but it cannot hide the
// very first play, and it cannot hide anything at all on a cold deploy.
//
// The phrase book is small, fixed, and known ahead of time. So render it once,
// store the bytes, and serve those. `scripts/generate-voice.mjs` does the
// rendering; this module is the storage.
//
// ---------------------------------------------------------------------------
// Content addressing, and why there is no manifest
// ---------------------------------------------------------------------------
// A clip's name IS the hash of what produced it: the voice, the model, and the
// exact spoken text including its audio tags. That has three consequences worth
// the trouble:
//
//   * No manifest to keep in sync. The porting guide's design keeps a
//     `manifest.json` mapping moments to clip keys, which is a second source of
//     truth that can disagree with the phrase book. Here the route derives the
//     same key the generator did, from the same text, so they cannot drift.
//   * Editing one line invalidates exactly that line. Change the wording and the
//     hash changes, so the old clip is simply never asked for again and the new
//     one is generated on the next run. No versioning, no cache busting.
//   * The same sentence is stored once. "Correct." shared across three problems is
//     one object, not three.
//
// ---------------------------------------------------------------------------
// Backends
// ---------------------------------------------------------------------------
// `local` writes under a directory and is the default. For this volume (tens of
// short MP3s, a few MB) that is genuinely the better option: the files are baked
// into the container image, so there is no network hop at playback at all, and no
// credentials to manage. The cost is that regenerating needs a deploy.
//
// `s3` is the option to take when clips should be regenerated without shipping
// code, or when the set outgrows an image. Set VOICE_CLIP_BACKEND=s3 plus
// VOICE_S3_BUCKET and VOICE_S3_REGION; credentials come from the standard AWS
// chain. The keys are identical either way, so switching backends does not
// invalidate anything already generated.

export type ClipBackend = 'local' | 's3' | 'none';

export function clipBackend(): ClipBackend {
  const explicit = process.env.VOICE_CLIP_BACKEND;
  if (explicit === 's3' || explicit === 'local' || explicit === 'none') return explicit;
  // Default to local storage whenever a directory is configured, which is the
  // case in both dev and the container.
  return process.env.VOICE_CLIP_DIR ? 'local' : 'none';
}

/**
 * The stable name for one rendered line.
 *
 * Everything that changes the audio goes in, and nothing that does not: two
 * different moments that happen to share wording share a clip, which is correct.
 */
export function clipKey(spokenText: string, voiceId: string, modelId: string): string {
  const h = createHash('sha256').update(`${voiceId}\n${modelId}\n${spokenText}`).digest('hex');
  // Sharded one level, so a directory listing stays usable and S3 prefixes spread.
  return `${h.slice(0, 2)}/${h}.mp3`;
}

function localPath(key: string): string {
  const dir = process.env.VOICE_CLIP_DIR || '.voice-clips';
  return join(dir, key);
}

/** Read a stored clip, or null when it has not been generated. */
export async function readClip(key: string): Promise<Buffer | null> {
  const backend = clipBackend();
  if (backend === 'none') return null;

  if (backend === 'local') {
    try {
      return await readFile(localPath(key));
    } catch {
      return null; // not generated yet, which is a normal state
    }
  }

  return await s3Read(key);
}

/** Store a clip. Failures are logged, never thrown: this is a cache, not the truth. */
export async function writeClip(key: string, bytes: Buffer | Uint8Array): Promise<void> {
  const backend = clipBackend();
  if (backend === 'none') return;

  try {
    if (backend === 'local') {
      const path = localPath(key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, bytes);
      return;
    }
    await s3Write(key, bytes);
  } catch (err) {
    console.error('[voice] could not store clip:', err instanceof Error ? err.message : err);
  }
}

// ---------------------------------------------------------------------------
// S3
// ---------------------------------------------------------------------------
// One client, created lazily and reused: constructing it per request would redo
// credential resolution on every line played.
//
// Credentials come from the standard AWS chain (env, shared config, or the
// instance/task role), so nothing secret is read here directly. Only the bucket
// and region are Judge's own settings.

let s3: import('@aws-sdk/client-s3').S3Client | null = null;

async function client() {
  if (s3) return s3;
  const { S3Client } = await import('@aws-sdk/client-s3');
  s3 = new S3Client({ region: process.env.VOICE_S3_REGION || process.env.AWS_REGION || 'ap-south-1' });
  return s3;
}

function bucket(): string | null {
  return process.env.VOICE_S3_BUCKET || null;
}

/** Optional prefix, so voice clips can share a bucket without colliding. */
function s3Key(key: string): string {
  const prefix = (process.env.VOICE_S3_PREFIX || 'voice-clips').replace(/^\/+|\/+$/g, '');
  return prefix ? `${prefix}/${key}` : key;
}

async function s3Read(key: string): Promise<Buffer | null> {
  const b = bucket();
  if (!b) {
    warnOnce('VOICE_CLIP_BACKEND=s3 but VOICE_S3_BUCKET is not set');
    return null;
  }
  try {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const c = await client();
    const res = await c.send(new GetObjectCommand({ Bucket: b, Key: s3Key(key) }));
    const bytes = await res.Body?.transformToByteArray();
    return bytes ? Buffer.from(bytes) : null;
  } catch (err) {
    // A miss is the NORMAL state for a line nobody has generated yet, so it must
    // not be logged as a failure or the log fills up with non-events. Anything
    // else (permissions, a wrong bucket, a wrong region) is worth shouting about,
    // because otherwise it presents only as "narration got slow again".
    const name = (err as { name?: string })?.name;
    if (name === 'NoSuchKey' || name === 'NotFound') return null;
    warnOnce(`S3 read failed: ${name ?? (err as Error)?.message}`);
    return null;
  }
}

async function s3Write(key: string, bytes: Buffer | Uint8Array): Promise<void> {
  const b = bucket();
  if (!b) return;
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  const c = await client();
  await c.send(
    new PutObjectCommand({
      Bucket: b,
      Key: s3Key(key),
      Body: bytes,
      ContentType: 'audio/mpeg',
      // Content-addressed, so a given key's bytes never change. Safe to cache hard.
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
}

const warnedAbout = new Set<string>();
function warnOnce(message: string) {
  if (warnedAbout.has(message)) return;
  warnedAbout.add(message);
  console.warn(`[voice] ${message} — falling back to live rendering.`);
}
