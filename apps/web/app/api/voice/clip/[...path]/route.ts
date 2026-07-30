import { VALID_CLIP_FILES } from '@judge/voice-scripts';
import { auth } from '../../../../../auth';
import { SAFE_CLIP_PATH } from '../../../../../src/lib/voicePath.js';
import { clipCache } from '../../../../../src/server/voiceCache';

// One voice clip, at a stable URL the browser can cache.
//
//   GET /api/voice/clip/shared/verify-pass--a1b2c3d4.mp3
//
// The client points an <audio> element here and the browser does the rest: it starts
// on the first few KB, streams the remainder, honours Range, and keeps the file for a
// year.
//
// ---------------------------------------------------------------------------
// Three things this route CANNOT do, by construction
// ---------------------------------------------------------------------------
// 1. It cannot render. There is no Deepgram client here and no API key is read.
//    The previous version answered a cache miss by synthesising the line live, which
//    is where the latency came from (the learner was waiting for a recording to be
//    made) and where the vendor spend came from. Worse, the browser and the generator
//    disagreed about clip names, so nearly every play was a miss and took that path.
//    A missing clip is now a 404, and the client shows the caption it already holds.
//
// 2. It cannot ask storage for something that does not exist. Every legitimate file
//    name is listed in a committed table (@judge/voice-scripts), so a name outside
//    that set is rejected before any network call. A stray or hostile URL costs
//    nothing, and no amount of traffic against unknown paths can generate S3 calls.
//
// 3. It cannot ask storage twice for the same clip. `clipCache` keeps one copy per
//    container on local disk and collapses concurrent misses into a single fetch, so
//    S3 reads are bounded by distinct clips played — at most a few hundred, ever —
//    rather than by learners multiplied by clips.
//
// The bucket stays PRIVATE and bytes transit this route, which is the cost of
// narration that explains correct answers: it has to stay behind the login, so it
// cannot sit in a shared cache. Repeat plays are free anyway — each learner's browser
// keeps every clip for a year.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** A year, immutable, and per-learner. The name pins the content. */
const CACHE = 'private, max-age=31536000, immutable';

/**
 * The clip's fingerprint, which is already a hash of its own bytes, so it is the
 * correct ETag and costs nothing to produce. Revalidation therefore never touches
 * storage.
 */
function etagFor(file: string): string {
  const stem = file.slice(file.lastIndexOf('/') + 1, -'.mp3'.length);
  return `"${stem.slice(stem.lastIndexOf('--') + 2)}"`;
}

function matches(ifNoneMatch: string, etag: string): boolean {
  const norm = (v: string) => v.trim().replace(/^W\//, '');
  if (ifNoneMatch.trim() === '*') return true;
  return ifNoneMatch.split(',').some((candidate) => norm(candidate) === norm(etag));
}

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });

  const { path } = await ctx.params;
  const file = (path ?? []).join('/');

  // Shape first (nothing that could climb out of the prefix), then identity: is this
  // a clip we actually published? Both checks happen before anything is fetched.
  if (!SAFE_CLIP_PATH.test(file) || !VALID_CLIP_FILES.has(file)) {
    return new Response('not found', { status: 404 });
  }

  const etag = etagFor(file);

  // A browser holding the clip but no longer trusting its freshness gets an empty
  // 304. Free, because the validator is in the file name.
  const inm = req.headers.get('if-none-match');
  if (inm && matches(inm, etag)) {
    return new Response(null, { status: 304, headers: { ETag: etag, 'Cache-Control': CACHE } });
  }

  const bytes = await clipCache.read(file);
  if (!bytes) return new Response('not found', { status: 404 });

  const headers = new Headers({
    'Content-Type': 'audio/mpeg',
    'Cache-Control': CACHE,
    'Accept-Ranges': 'bytes',
    ETag: etag,
  });

  // Range support, so the browser can seek and start before the whole file lands.
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') ?? '');
  if (m) {
    const start = m[1] ? Number(m[1]) : 0;
    const end = m[2] ? Number(m[2]) : bytes.length - 1;
    if (start >= bytes.length || end >= bytes.length || start > end) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${bytes.length}` } });
    }
    const slice = bytes.subarray(start, end + 1);
    headers.set('Content-Range', `bytes ${start}-${end}/${bytes.length}`);
    headers.set('Content-Length', String(slice.length));
    return new Response(new Uint8Array(slice), { status: 206, headers });
  }

  headers.set('Content-Length', String(bytes.length));
  return new Response(new Uint8Array(bytes), { headers });
}
