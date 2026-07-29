import { auth } from '../../../../../auth';
import { problems } from '@judge/problems';
import { pickLine, fillLine, captionFor } from '../../../../../src/lib/voiceLines.js';
import { SAFE_CLIP_PATH, clipPath } from '../../../../../src/lib/voicePath.js';
import { createHash } from 'node:crypto';
import { clipBackend, clipMeta, readClip, writeClip } from '../../../../../src/server/voiceStore';

// One voice clip, at a stable URL the browser can cache.
//
//   GET /api/voice/clip/email-triage/verify_pass--classify--classify-with-ai--v0.mp3
//
// This is the whole playback path now. The client points an <audio> element here and
// the browser does the rest: it starts on the first few KB, streams the remainder,
// honours Range, and keeps the file for a year. No `fetch`, no blob, no object URL,
// no JS-side cache.
//
// That is the fix for the latency. The previous route was `/api/voice?moment=…` with
// `Cache-Control: no-store`, so nothing was ever reused, and the client downloaded
// each clip in full before playback could begin.
//
// `immutable` is safe because the path identifies the content: a given path always
// holds the same sentence. Reword a line and it needs regenerating (`--force`), which
// is the trade for a URL that caches and can be read by a human.
//
// The bucket stays PRIVATE and bytes transit this route. That costs egress, and buys
// not having to make a bucket public or sign URLs. Front it with a CDN if that
// becomes the bottleneck; the immutable header means a CDN holds each clip forever.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** A year, immutable. The path pins the content, so nothing can go stale under it. */
const CACHE = 'private, max-age=31536000, immutable';

/**
 * Does an `If-None-Match` header cover this ETag?
 *
 * Handles the comma-separated list and `*`, and compares weakly by stripping any
 * `W/` prefix — the distinction between a strong and weak validator only matters
 * for range requests on mutable content, and a clip's bytes never change under its
 * path.
 */
function etagMatches(ifNoneMatch: string, etag: string): boolean {
  const norm = (v: string) => v.trim().replace(/^W\//, '');
  if (ifNoneMatch.trim() === '*') return true;
  return ifNoneMatch.split(',').some((candidate) => norm(candidate) === norm(etag));
}

/**
 * Render a missing clip once, so a line added since the last generation run still
 * speaks instead of 404ing. Self-healing: it is stored on the way out, and every
 * later play comes from storage and then from the browser.
 */
async function renderAndStore(rel: string): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_v3';
  if (process.env.FEATURE_VOICE !== 'true' || !apiKey || !voiceId) return null;

  const spoken = spokenTextFor(rel);
  if (!spoken) return null;

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'content-type': 'application/json', accept: 'audio/mpeg' },
      body: JSON.stringify({
        text: spoken,
        model_id: modelId,
        voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
      }),
    });
    if (!res.ok) throw new Error(`elevenlabs ${res.status}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    void writeClip(rel, bytes);
    return bytes;
  } catch (err) {
    console.error('[voice] live render failed for', rel, err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Recover the sentence a path stands for, by generating every candidate path and
 * looking for a match.
 *
 * Deliberately a reverse lookup rather than encoding the text in the URL: the path
 * has to stay short and readable, and this only runs on a cache miss. It is the one
 * place the slug scheme costs something, and it costs it rarely.
 */
function spokenTextFor(rel: string): string | null {
  const [dir] = rel.split('/');
  const problem = (problems as Record<string, Record<string, unknown>>)[dir] ?? null;

  const candidates: Array<{ moment: string; vars: Record<string, string>; variant: number }> = [];
  const push = (moment: string, vars: Record<string, string>) => {
    for (let v = 0; v < 6; v += 1) candidates.push({ moment, vars, variant: v });
  };

  // Every shape a line can take, mirroring voiceCatalogue's enumeration.
  const { LINES } = require('../../../../../src/lib/voiceLines.js') as { LINES: Record<string, string[]> };
  for (const moment of Object.keys(LINES)) push(moment, {});

  if (problem) {
    for (const q of (problem.dissection as Array<Record<string, unknown>>) ?? []) {
      for (const opt of (q.options as Array<Record<string, string>>) ?? []) {
        for (const moment of ['answer_correct', 'answer_wrong', 'answer_wrong_again']) {
          push(moment, { key: String(q.id), answer: opt.label });
        }
      }
    }
    for (const [type, setup] of Object.entries((problem.nodeSetup as Record<string, Record<string, unknown>>) ?? {})) {
      const node = String(setup.label ?? type);
      for (const moment of ['node_placed', 'verify_pass', 'verify_fail']) {
        push(moment, { key: type, node });
      }
    }
    for (const phase of (problem.buildPhases as Array<Record<string, string>>) ?? []) {
      push('phase_complete', { key: phase.id });
    }
  }

  for (const c of candidates) {
    if (clipPath(dir, c.moment, c.vars, c.variant) !== rel) continue;
    const picked = pickLine(c.moment, c.variant, { problem, key: c.vars.key });
    if (!picked) return null;
    return fillLine(picked.line, c.vars);
  }
  return null;
}

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });

  const { path } = await ctx.params;
  const rel = (path ?? []).join('/');
  // Two segments, an mp3, nothing that climbs out of the prefix.
  if (!SAFE_CLIP_PATH.test(rel)) return new Response('not found', { status: 404 });

  const configured = clipBackend() !== 'none';

  // Answer a conditional request before fetching anything. A browser that has the
  // clip but no longer trusts its freshness sends If-None-Match; without this it
  // had to re-download the whole file, and we had to re-download it from S3 to
  // serve it. Now that costs one HEAD and returns an empty body.
  const inm = req.headers.get('if-none-match');
  if (configured && inm) {
    const meta = await clipMeta(rel);
    if (meta && etagMatches(inm, meta.etag)) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: meta.etag,
          'Cache-Control': CACHE,
          ...(meta.lastModified ? { 'Last-Modified': meta.lastModified } : {}),
        },
      });
    }
  }

  let bytes = configured ? await readClip(rel) : null;
  let source = 'stored';
  if (!bytes) {
    bytes = await renderAndStore(rel);
    source = 'rendered';
  }
  // No audio to be had: the client shows the caption it already has.
  if (!bytes) return new Response('not found', { status: 404 });

  const headers = new Headers({
    'Content-Type': 'audio/mpeg',
    'Cache-Control': CACHE,
    'Accept-Ranges': 'bytes',
    'X-Voice-Source': source,
    // Computed from the bytes we are about to send rather than read back from
    // storage: it is free here, it is correct for a clip that was just rendered
    // (which has no stored metadata yet), and it is the value the next
    // If-None-Match will carry.
    ETag: `"${createHash('md5').update(bytes).digest('hex')}"`,
  });

  // Range support, so the browser can seek and start before the whole file lands.
  const range = req.headers.get('range');
  const m = range ? /bytes=(\d*)-(\d*)/.exec(range) : null;
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
