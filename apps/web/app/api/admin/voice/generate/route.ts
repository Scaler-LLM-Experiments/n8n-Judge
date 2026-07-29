import { auth } from '../../../../../auth';
import { problems } from '@judge/problems';
import { NODE_CATALOG } from '@judge/catalog';
import { enumerateSpeakable } from '../../../../../src/lib/voiceCatalogue.js';
import { clipBackend, hasClip, writeClip } from '../../../../../src/server/voiceStore';
import { clipPath } from '../../../../../src/lib/voicePath.js';

// Render the missing voice clips and store them, from the deployed app.
//
//   POST /api/admin/voice/generate            one batch, every problem
//   POST /api/admin/voice/generate?limit=60   a bigger batch
//   POST /api/admin/voice/generate?problem=email-triage
//
// Why this exists rather than only the CLI: the credentials live HERE. Running
// `scripts/generate-voice.mjs` means copying an ElevenLabs key and an S3 key pair
// onto a laptop, which is both a faff and a worse place for them to be. The
// deployed app already has everything, so generation can just happen where the
// secrets already are.
//
// BATCHED on purpose. A full run is a few hundred vendor calls and would sit well
// past any sensible request timeout, so each call does a bounded amount of work and
// reports what is left. Call it until `remaining` is 0. Re-calling is free for
// anything already stored — a second run skips it after one HEAD request.
//
//   GET  /api/admin/voice/generate            progress only, renders nothing
//
// ---------------------------------------------------------------------------
// Why this was slow, twice over
// ---------------------------------------------------------------------------
// Both causes were here, not at the vendor, and both scaled the wrong way:
//
//   1. The "is it stored?" check used `readClip`, which DOWNLOADS the clip. Every
//      batch pulled every already-stored MP3 in full from the bucket before
//      rendering anything, so the run got slower the more it had saved. Now it is
//      `hasClip` (one HEAD, no body) and they run concurrently.
//   2. Renders ran one at a time, so a batch cost limit × vendor latency. A pool
//      of four cuts that by about four, which is also what stopped a 60-clip batch
//      from outliving the gateway and 502ing.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Kept low enough that a batch finishes inside a request, and honest about it. */
const DEFAULT_LIMIT = 40;
const MAX_LIMIT = 120;
/**
 * Concurrent renders. Four sits inside every ElevenLabs tier's concurrency
 * allowance; a clip that does get rate-limited simply stays missing and the next
 * batch picks it up, so the failure mode is a retry rather than a gap.
 */
const RENDER_POOL = 4;
/** Concurrent HEAD requests. Cheap, so this can be much wider than the renders. */
const CHECK_POOL = 24;

/** Run `task` over `items` with a bounded number in flight. */
async function pooled<T>(items: T[], size: number, task: (item: T) => Promise<void>) {
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) await task(items[cursor++]);
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
}

async function render(text: string, apiKey: string, voiceId: string, modelId: string) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({
      text,
      model_id: modelId,
      // Identical to the playback route's settings. A mismatch here would make a
      // pre-rendered clip sound different from a live fallback of the same line.
      voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
    }),
  });
  if (!res.ok) throw new Error(`elevenlabs ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Every clip the given problems need: path -> the sentence it holds.
 *
 * Paths are per problem, so a line shared between problems is stored twice. That
 * is the cost of a readable, cacheable URL, and it is a few hundred KB.
 */
function wantedClips(slugs: string[]): Map<string, string> {
  const wanted = new Map<string, string>();
  for (const slug of slugs) {
    for (const item of enumerateSpeakable((problems as Record<string, Record<string, unknown>>)[slug], NODE_CATALOG)) {
      // Every variant: which one a learner hears is decided in their browser from a
      // session seed, so all of them have to exist.
      for (const v of item.variants as Array<{ index: number; spoken: string }>) {
        wanted.set(clipPath(slug, item.moment, item.vars, v.index), v.spoken);
      }
    }
  }
  return wanted;
}

/** Split into what is stored and what still needs rendering, checked concurrently. */
async function partition(wanted: Map<string, string>) {
  const entries = [...wanted];
  const missing = new Array<[string, string] | null>(entries.length);
  await pooled(
    entries.map((entry, i) => ({ entry, i })),
    CHECK_POOL,
    async ({ entry, i }) => {
      missing[i] = (await hasClip(entry[0])) ? null : entry;
    }
  );
  // Index order, not completion order, so batches stay stable between calls and a
  // resumed run walks the same sequence.
  const todo = missing.filter((e): e is [string, string] => e !== null);
  return { todo, alreadyStored: entries.length - todo.length };
}

/** Which problems to work on, or an error Response if one was named and is unknown. */
function slugsFrom(url: URL): string[] | Response {
  const only = url.searchParams.get('problem');
  const slugs = only ? [only] : Object.keys(problems);
  for (const slug of slugs) {
    if (!(slug in problems)) return Response.json({ error: `unknown problem: ${slug}` }, { status: 404 });
  }
  return slugs;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'unauthenticated' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return Response.json({ error: 'forbidden' }, { status: 403 });
  return null;
}

/**
 * Progress, rendering nothing.
 *
 * Exists because a long generation run had no way to answer "how far along is it?"
 * except by starting another batch, which is the one thing you do not want to do
 * while wondering. Cheap now that checking is a HEAD.
 */
export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const backend = clipBackend();
  if (backend === 'none') return Response.json({ backend, error: 'No clip storage configured.' }, { status: 400 });

  const slugs = slugsFrom(new URL(req.url));
  if (slugs instanceof Response) return slugs;

  const wanted = wantedClips(slugs);
  const { alreadyStored } = await partition(wanted);
  const total = wanted.size;
  return Response.json({
    backend,
    total,
    stored: alreadyStored,
    remaining: total - alreadyStored,
    percent: total ? Math.round((alreadyStored / total) * 100) : 100,
    done: alreadyStored === total,
  });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const url = new URL(req.url);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(url.searchParams.get('limit')) || DEFAULT_LIMIT));

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_v3';
  const backend = clipBackend();

  if (!apiKey || !voiceId) {
    return Response.json({ error: 'ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID is not set' }, { status: 400 });
  }
  if (backend === 'none') {
    return Response.json(
      { error: 'No clip storage configured. Set AUDIO_S3_BUCKET (or VOICE_CLIP_DIR).' },
      { status: 400 }
    );
  }

  const slugs = slugsFrom(url);
  if (slugs instanceof Response) return slugs;

  const wanted = wantedClips(slugs);
  const { todo, alreadyStored } = await partition(wanted);

  const batch = todo.slice(0, limit);
  let rendered = 0;
  let unstored = 0;
  const failures: string[] = [];

  await pooled(batch, RENDER_POOL, async ([key, spoken]) => {
    try {
      const bytes = await render(spoken, apiKey, voiceId, modelId);
      // `writeClip` reports whether it landed. A run against a bucket it can read
      // but not write to would otherwise look like a success and store nothing.
      if (await writeClip(key, bytes)) rendered += 1;
      else unstored += 1;
    } catch (err) {
      failures.push(`${spoken.slice(0, 50)}: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  const remaining = todo.length - batch.length;
  const stored = alreadyStored + rendered;
  return Response.json({
    backend,
    total: wanted.size,
    stored,
    percent: wanted.size ? Math.round((stored / wanted.size) * 100) : 100,
    alreadyStored,
    rendered,
    unstored,
    remaining,
    failures: failures.slice(0, 5),
    done: remaining === 0 && unstored === 0 && failures.length === 0,
    next: remaining > 0 ? 'Call again to continue; already-stored clips are skipped.' : null,
    ...(unstored
      ? { warning: `${unstored} clip(s) rendered but NOT stored. Those characters were billed. Check bucket write permissions.` }
      : {}),
  });
}
