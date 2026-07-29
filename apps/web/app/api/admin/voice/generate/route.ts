import { auth } from '../../../../../auth';
import { problems } from '@judge/problems';
import { NODE_CATALOG } from '@judge/catalog';
import { enumerateSpeakable } from '../../../../../src/lib/voiceCatalogue.js';
import { clipBackend, hasClip, writeClip } from '../../../../../src/server/voiceStore';
import {
  clipHash,
  clipState,
  problemOfPath,
  readManifest,
  writeManifest,
  type Manifest,
} from '../../../../../src/server/voiceManifest';
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

/**
 * Split into what is already correct and what needs rendering.
 *
 * The manifest answers most of this with no storage traffic at all: a path whose
 * recorded hash still matches the sentence we would render is current, full stop.
 * Storage is only consulted for paths the manifest has never heard of.
 *
 * Three outcomes per clip:
 *   current  recorded hash matches            -> skip, free
 *   stale    recorded hash differs            -> re-render, the words changed
 *   unknown  nothing recorded                 -> ask storage, then adopt or render
 *
 * ADOPTION is the migration path. Every clip is `unknown` the first time this runs,
 * and treating unknown-but-stored as stale would re-render the entire library on a
 * guess, for real money, to fix a problem that may not exist. So a stored clip with
 * no recorded hash is adopted: we record the current hash and leave the audio
 * alone. That assumes the stored audio matches today's text, which is true unless
 * a line was edited before manifests existed. `?force=1` is the override.
 */
async function partition(
  wanted: Map<string, string>,
  manifests: Map<string, Manifest>,
  voiceId: string,
  modelId: string,
  force: boolean
) {
  const entries = [...wanted];
  const decided = new Array<{ entry: [string, string]; render: boolean; adopt: boolean; stale: boolean } | null>(
    entries.length
  );

  await pooled(
    entries.map((entry, i) => ({ entry, i })),
    CHECK_POOL,
    async ({ entry, i }) => {
      const [path, spoken] = entry;
      const hash = clipHash(spoken, voiceId, modelId);
      const manifest = manifests.get(problemOfPath(path)) ?? {};
      const state = force ? 'stale' : clipState(manifest, path, hash);

      if (state === 'current') {
        decided[i] = { entry, render: false, adopt: false, stale: false };
        return;
      }
      if (state === 'stale') {
        decided[i] = { entry, render: true, adopt: false, stale: !force };
        return;
      }
      // Unknown: this is the only case that costs a request, and only until the
      // manifest has been back-filled once.
      const stored = await hasClip(path);
      decided[i] = { entry, render: !stored, adopt: stored, stale: false };
    }
  );

  // Index order, not completion order, so batches stay stable between calls and a
  // resumed run walks the same sequence.
  const settled = decided.filter((d): d is NonNullable<typeof d> => d !== null);
  return {
    todo: settled.filter((d) => d.render).map((d) => d.entry),
    adopted: settled.filter((d) => d.adopt).map((d) => d.entry),
    staleCount: settled.filter((d) => d.stale).length,
    alreadyCurrent: settled.filter((d) => !d.render && !d.adopt).length,
  };
}

/** Load every manifest a set of problems could touch, one GET each. */
async function loadManifests(slugs: string[]): Promise<Map<string, Manifest>> {
  const out = new Map<string, Manifest>();
  await Promise.all(
    slugs.map(async (slug) => {
      out.set(slug, await readManifest(slug));
    })
  );
  return out;
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

  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? '';
  const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_v3';

  const wanted = wantedClips(slugs);
  const manifests = await loadManifests(slugs);
  const { todo, adopted, staleCount, alreadyCurrent } = await partition(wanted, manifests, voiceId, modelId, false);
  const total = wanted.size;
  const stored = alreadyCurrent + adopted.length;
  return Response.json({
    backend,
    total,
    stored,
    // Split out, because they mean different things to whoever is watching: `stale`
    // is copy that changed and needs re-rendering, `remaining` includes clips that
    // never existed.
    stale: staleCount,
    remaining: todo.length,
    percent: total ? Math.round((stored / total) * 100) : 100,
    done: todo.length === 0,
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
  // Re-render everything regardless of what the manifest says. The escape hatch for
  // "the recorded hashes are wrong", which adoption can cause exactly once.
  const force = url.searchParams.get('force') === '1';

  const wanted = wantedClips(slugs);
  const manifests = await loadManifests(slugs);
  const { todo, adopted, staleCount, alreadyCurrent } = await partition(wanted, manifests, voiceId, modelId, force);

  // Record the hash for anything already stored but unrecorded. Free, and it is
  // what makes the next run cost one GET per problem instead of one request per clip.
  for (const [path, spoken] of adopted) {
    const m = manifests.get(problemOfPath(path));
    if (m) m[path] = clipHash(spoken, voiceId, modelId);
  }

  const batch = todo.slice(0, limit);
  let rendered = 0;
  let unstored = 0;
  const failures: string[] = [];

  await pooled(batch, RENDER_POOL, async ([key, spoken]) => {
    try {
      const bytes = await render(spoken, apiKey, voiceId, modelId);
      // `writeClip` reports whether it landed. A run against a bucket it can read
      // but not write to would otherwise look like a success and store nothing.
      if (await writeClip(key, bytes)) {
        rendered += 1;
        // Recorded only AFTER the bytes are stored. Recording first would mark a
        // clip current that does not exist, and the next run would skip it forever.
        const m = manifests.get(problemOfPath(key));
        if (m) m[key] = clipHash(spoken, voiceId, modelId);
      } else {
        unstored += 1;
      }
    } catch (err) {
      failures.push(`${spoken.slice(0, 50)}: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  // One write per problem per batch, after the renders, so a batch that dies
  // mid-flight leaves the manifest describing strictly less than what is stored —
  // which costs a re-check, never a wrong skip.
  const manifestWrites = await Promise.all(
    [...manifests].map(async ([slug, m]) => (Object.keys(m).length ? writeManifest(slug, m) : true))
  );
  const manifestSaved = manifestWrites.every(Boolean);

  const remaining = todo.length - batch.length;
  const stored = alreadyCurrent + adopted.length + rendered;
  return Response.json({
    backend,
    total: wanted.size,
    stored,
    percent: wanted.size ? Math.round((stored / wanted.size) * 100) : 100,
    alreadyStored: alreadyCurrent,
    // Back-filled hashes for clips that already existed. Non-zero only on the first
    // run after manifests landed, or after a new problem's clips were generated by
    // the playback route's self-heal.
    adopted: adopted.length,
    // Clips whose text CHANGED since they were rendered. This is the number that
    // was previously invisible: a reworded line used to keep its old audio silently.
    stale: staleCount,
    rendered,
    unstored,
    remaining,
    failures: failures.slice(0, 5),
    done: remaining === 0 && unstored === 0 && failures.length === 0,
    next: remaining > 0 ? 'Call again to continue; clips whose text has not changed are skipped.' : null,
    ...(unstored
      ? { warning: `${unstored} clip(s) rendered but NOT stored. Those characters were billed. Check bucket write permissions.` }
      : {}),
    ...(manifestSaved
      ? {}
      : {
          warning:
            'Clips stored but the manifest could NOT be written, so the next run will re-check every clip against storage. Check bucket write permissions.',
        }),
  });
}
