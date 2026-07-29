import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
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
// Keys, and why there is no manifest
// ---------------------------------------------------------------------------
// A clip's key is its slug path — see `clipPath` in src/lib/voicePath.js, which
// also records why that replaced a content hash. Both schemes share the property
// that matters here: the key is DERIVED, by the generator and the playback route
// alike, from data both already hold. So there is no `manifest.json` mapping
// moments to keys, and therefore no second source of truth to drift from the
// phrase book.
//
// `clipKey` below is the old content-addressed scheme, kept only for reading
// clips generated before the change.
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
// code, or when the set outgrows an image. Set VOICE_CLIP_BACKEND=s3 and the
// AUDIO_S3_* variables. The keys are identical either way, so switching backends
// does not invalidate anything already generated.
//
// The AUDIO_S3_* names are the ones the platform team hands out, and they carry
// their own key pair rather than relying on the instance role. That is deliberate
// on their side: voice clips live in their own bucket on their own credentials, so
// a misconfiguration here can never reach anything else.

export type ClipBackend = 'local' | 's3' | 'none';

export function clipBackend(): ClipBackend {
  const explicit = process.env.VOICE_CLIP_BACKEND;
  if (explicit === 's3' || explicit === 'local' || explicit === 'none') return explicit;
  // INFERRED, so setting the credentials is enough. Requiring a separate
  // VOICE_CLIP_BACKEND=s3 on top of five AUDIO_S3_* variables was a footgun:
  // everything looked configured, nothing was consulted, and the only symptom was
  // "narration is still slow".
  if (process.env.AUDIO_S3_BUCKET) return 's3';
  if (process.env.VOICE_CLIP_DIR) return 'local';
  return 'none';
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

/**
 * Whether a clip is stored, WITHOUT downloading it.
 *
 * The generator asks this about every clip on every batch, and it used to ask via
 * `readClip` — which fetches the bytes. So a run downloaded every already-stored
 * MP3 in full just to learn it existed, and got slower with every clip it saved.
 * That, not the vendor, was why generation crawled.
 *
 * `HeadObject` is one round trip and no body. Never throws: a miss and a broken
 * bucket both mean "not stored", and the caller's next move is the same either way.
 */
export async function hasClip(key: string): Promise<boolean> {
  const backend = clipBackend();
  if (backend === 'none') return false;

  if (backend === 'local') {
    try {
      return (await stat(localPath(key))).size > 0;
    } catch {
      return false;
    }
  }

  const b = bucket();
  if (!b) return false;
  try {
    const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
    const c = await client();
    await c.send(new HeadObjectCommand({ Bucket: b, Key: s3Key(key) }));
    return true;
  } catch {
    return false;
  }
}

/** Validators for a stored clip, so a conditional request can be answered cheaply. */
export interface ClipMeta {
  etag: string;
  lastModified?: string;
  size: number;
}

/**
 * A clip's validators WITHOUT its bytes.
 *
 * The playback route dropped S3's ETag and Last-Modified, which meant a browser
 * holding a cached copy but no fresh `max-age` had no way to revalidate: it could
 * only re-download the whole clip. Passing them through makes that a 304 with an
 * empty body — and because this is a HEAD, a revalidation costs one metadata
 * round trip instead of a full GET plus egress on both hops.
 *
 * Null when the clip is not stored, which is the same signal `hasClip` gives.
 */
export async function clipMeta(key: string): Promise<ClipMeta | null> {
  const backend = clipBackend();
  if (backend === 'none') return null;

  if (backend === 'local') {
    try {
      const st = await stat(localPath(key));
      if (!st.size) return null;
      // MD5 of the content, NOT size-and-mtime. It has to be the same value the
      // serving path puts in its ETag header, or a conditional request could never
      // match and revalidation would silently never happen. S3 gives us the
      // content MD5 for a single-part upload, so matching it here keeps one
      // definition of a clip's identity across both backends. Reading the file is
      // acceptable: this backend is local disk with no egress.
      const bytes = await readFile(localPath(key));
      return {
        etag: `"${createHash('md5').update(bytes).digest('hex')}"`,
        lastModified: st.mtime.toUTCString(),
        size: st.size,
      };
    } catch {
      return null;
    }
  }

  const b = bucket();
  if (!b) return null;
  try {
    const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
    const c = await client();
    const res = await c.send(new HeadObjectCommand({ Bucket: b, Key: s3Key(key) }));
    if (!res.ETag) return null;
    return {
      etag: res.ETag,
      lastModified: res.LastModified?.toUTCString(),
      size: Number(res.ContentLength ?? 0),
    };
  } catch {
    return null;
  }
}

/**
 * Store a clip. Never throws — this is a cache, and a learner should still hear a
 * line that could not be saved.
 *
 * RETURNS whether it landed, which the generator needs. It used to return nothing,
 * so a run against a bucket it could not write to printed a tick for every line
 * and stored none of them: the whole point of the run failed while reporting
 * success. Write-through from the route ignores the result on purpose.
 */
export async function writeClip(key: string, bytes: Buffer | Uint8Array): Promise<boolean> {
  const backend = clipBackend();
  if (backend === 'none') return false;

  try {
    if (backend === 'local') {
      const path = localPath(key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, bytes);
      return true;
    }
    await s3Write(key, bytes);
    return true;
  } catch (err) {
    console.error('[voice] could not store clip:', err instanceof Error ? err.message : err);
    return false;
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
  const accessKeyId = process.env.AUDIO_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AUDIO_S3_SECRET_ACCESS_KEY;
  s3 = new S3Client({
    region: process.env.AUDIO_S3_REGION || 'ap-south-1',
    // Explicit key pair when given; otherwise fall through to the default AWS
    // chain, so a task role still works in an environment that has one.
    credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
  });
  return s3;
}

function bucket(): string | null {
  return process.env.AUDIO_S3_BUCKET || null;
}

/** Optional prefix, so voice clips can share a bucket without colliding. */
function s3Key(key: string): string {
  const prefix = (process.env.AUDIO_S3_PREFIX || 'voice-clips').replace(/^\/+|\/+$/g, '');
  return prefix ? `${prefix}/${key}` : key;
}

async function s3Read(key: string): Promise<Buffer | null> {
  const b = bucket();
  if (!b) {
    warnOnce('VOICE_CLIP_BACKEND=s3 but AUDIO_S3_BUCKET is not set');
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
