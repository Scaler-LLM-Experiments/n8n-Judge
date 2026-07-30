import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';

// One copy of each clip, on this container's own disk.
//
// ---------------------------------------------------------------------------
// What this is for
// ---------------------------------------------------------------------------
// The bucket is private, so clips cannot be served from a CDN and every byte
// transits this server. Without a cache that means one S3 GET per learner per clip:
// 307 clips across a 60-person cohort is ~18,000 requests, which is the pattern that
// got Scaler's credentials flagged, just larger.
//
// So the first request for a clip fetches it once and writes it to disk. Every later
// request — from anyone — reads the disk. Total S3 reads are bounded by the number of
// DISTINCT CLIPS ACTUALLY PLAYED, at most 307 for the life of the container, and then
// zero no matter how much traffic arrives.
//
// The cache is deliberately ephemeral. A deploy starts with an empty disk and refills
// on demand, which is fine at these numbers and means there is no eviction policy to
// get wrong. Nothing can go stale, either: a clip's file name contains a fingerprint
// of its own audio, so a given name always means the same bytes.
//
// ---------------------------------------------------------------------------
// Single-flight, which is the part that is easy to miss
// ---------------------------------------------------------------------------
// A cold cache plus a class of learners starting together is the exact shape of a
// thundering herd: twenty simultaneous requests for the same missing clip would be
// twenty identical GETs, all writing the same file. Requests for one file share one
// in-flight fetch, so that is one GET.

export interface ClipCache {
  read(file: string): Promise<Buffer | null>;
}

/**
 * Where a relative clip directory might actually be.
 *
 * `next dev` runs with its working directory at `apps/web`, but the scripts that
 * write clips (`voice:generate`) run from the repo root — so a plain `.voice-clips`
 * means two DIFFERENT folders in the two processes. Everything was rendered, nothing
 * was found, and every clip 404'd with the diagnostics cheerfully reporting zero
 * clips on disk.
 *
 * So a relative path is tried against the working directory and against the repo root
 * two levels up. Both are one failed stat when wrong, and only on the path that is
 * about to reach for storage anyway. An absolute path is taken as given.
 */
function candidateBases(dir: string): string[] {
  if (isAbsolute(dir)) return [dir];
  const cwd = resolve(dir);
  const fromRepoRoot = resolve(process.cwd(), '..', '..', dir);
  return cwd === fromRepoRoot ? [cwd] : [cwd, fromRepoRoot];
}

/** Fetch one object's bytes, or null if it is not there. Never throws. */
export type FetchObject = (file: string) => Promise<Buffer | null>;

/**
 * @param dir        where fetched clips are written. The cache proper.
 * @param alsoRead   extra read-only directories searched before storage is asked.
 *                   This is how a freshly rendered clip plays with no bucket at all:
 *                   `npm run voice:generate` writes into VOICE_CLIP_DIR, and in
 *                   development that folder is right there. Without it you would have
 *                   to stand up a bucket and sync just to hear your own audition, and
 *                   every clip would 404 in the meantime — which is exactly what
 *                   happened. In a deployed container the folder does not exist, the
 *                   lookup costs one failed stat, and behaviour is unchanged.
 * @param fetchObject how to get a clip that is not on disk anywhere.
 */
export function createClipCache({
  dir,
  alsoRead = [],
  fetchObject,
}: {
  dir: string;
  alsoRead?: string[];
  fetchObject: FetchObject;
}): ClipCache {
  const inFlight = new Map<string, Promise<Buffer | null>>();

  async function fromDisk(local: string): Promise<Buffer | null> {
    try {
      const bytes = await readFile(local);
      // A zero-length file is a failed write, not a clip. Treat it as absent so the
      // next request repairs it rather than serving silence forever.
      return bytes.length ? bytes : null;
    } catch {
      return null;
    }
  }

  /** Every local place a clip might already be, cache first. */
  async function anyLocal(file: string): Promise<Buffer | null> {
    for (const base of [dir, ...alsoRead].flatMap(candidateBases)) {
      const bytes = await fromDisk(join(base, file));
      if (bytes) return bytes;
    }
    return null;
  }

  return {
    async read(file: string): Promise<Buffer | null> {
      const local = join(dir, file);

      const cached = await anyLocal(file);
      if (cached) return cached;

      const existing = inFlight.get(file);
      if (existing) return existing;

      const pending = (async () => {
        try {
          const bytes = await fetchObject(file);
          if (!bytes?.length) return null;
          await mkdir(dirname(local), { recursive: true });
          // Write to a temp name and rename into place. A rename is atomic, so a
          // request arriving mid-download can only ever see the whole file or no
          // file — never a truncated one that would then be cached as if it were
          // complete.
          const tmp = `${local}.${process.pid}.part`;
          await writeFile(tmp, bytes);
          await rename(tmp, local);
          return bytes;
        } catch (err) {
          // A clip that cannot be cached is still a clip that can be served, so the
          // bytes are returned by the branch above where possible. Reaching here
          // means the fetch itself failed: the caller 404s and the learner reads the
          // caption. Never a retry loop — a retry storm against storage is the
          // failure mode this whole design exists to remove.
          warnOnce(`could not fetch clip ${file}: ${err instanceof Error ? err.message : String(err)}`);
          return null;
        } finally {
          inFlight.delete(file);
        }
      })();

      inFlight.set(file, pending);
      return pending;
    },
  };
}

// ---------------------------------------------------------------------------
// The default cache: S3-backed, configured from the environment.
// ---------------------------------------------------------------------------

const bucket = () => process.env.AUDIO_S3_BUCKET || null;

/** Objects live under a prefix so clips can share a bucket without colliding. */
function objectKey(file: string): string {
  const prefix = (process.env.AUDIO_S3_PREFIX ?? 'voice-clips').replace(/^\/+|\/+$/g, '');
  return prefix ? `${prefix}/${file}` : file;
}

let s3: import('@aws-sdk/client-s3').S3Client | null = null;
async function client() {
  if (s3) return s3;
  const { S3Client } = await import('@aws-sdk/client-s3');
  const accessKeyId = process.env.AUDIO_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AUDIO_S3_SECRET_ACCESS_KEY;
  const endpoint = process.env.AUDIO_S3_ENDPOINT || undefined;
  s3 = new S3Client({
    region: process.env.AUDIO_S3_REGION || 'ap-south-1',
    // Set only for S3-compatible stores (R2, B2, MinIO); real S3 needs neither.
    endpoint,
    forcePathStyle: Boolean(endpoint),
    // Explicit keys when given, otherwise the default AWS chain so a task role works.
    credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
  });
  return s3;
}

export const s3Fetch: FetchObject = async (file) => {
  const b = bucket();
  if (!b) {
    warnOnce('AUDIO_S3_BUCKET is not set, so no clip can be served');
    return null;
  }
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const res = await (await client()).send(new GetObjectCommand({ Bucket: b, Key: objectKey(file) }));
  const bytes = await res.Body?.transformToByteArray();
  return bytes ? Buffer.from(bytes) : null;
};

export const clipCache: ClipCache = createClipCache({
  dir: process.env.VOICE_CACHE_DIR || '.voice-cache',
  // Locally rendered clips play immediately, with no bucket and no sync.
  alsoRead: [process.env.VOICE_CLIP_DIR || '.voice-clips'],
  fetchObject: s3Fetch,
});

const warned = new Set<string>();
function warnOnce(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[voice] ${message}`);
}
