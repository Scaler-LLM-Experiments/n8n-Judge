import { auth } from '../../../../../auth';
import { problems } from '@judge/problems';
import { NODE_CATALOG } from '@judge/catalog';
import { enumerateSpeakable } from '../../../../../src/lib/voiceCatalogue.js';
import { clipBackend, readClip, writeClip } from '../../../../../src/server/voiceStore';
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
// anything already stored — clips are content-addressed, so a second run skips
// them.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Kept low enough that a batch finishes inside a request, and honest about it. */
const DEFAULT_LIMIT = 40;
const MAX_LIMIT = 120;

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

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'unauthenticated' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return Response.json({ error: 'forbidden' }, { status: 403 });

  const url = new URL(req.url);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(url.searchParams.get('limit')) || DEFAULT_LIMIT));
  const only = url.searchParams.get('problem');

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

  const slugs = only ? [only] : Object.keys(problems);
  for (const slug of slugs) {
    if (!(slug in problems)) return Response.json({ error: `unknown problem: ${slug}` }, { status: 404 });
  }

  // Paths are per problem now, so a line shared between problems is stored twice.
  // That is the cost of a readable, cacheable URL, and it is a few hundred KB.
  const wanted = new Map<string, string>(); // clip path -> spoken text
  for (const slug of slugs) {
    for (const item of enumerateSpeakable((problems as Record<string, Record<string, unknown>>)[slug], NODE_CATALOG)) {
      // Every variant: which one a learner hears is decided in their browser from a
      // session seed, so all of them have to exist.
      for (const v of item.variants as Array<{ index: number; spoken: string }>) {
        wanted.set(clipPath(slug, item.moment, item.vars, v.index), v.spoken);
      }
    }
  }

  const todo: Array<[string, string]> = [];
  let alreadyStored = 0;
  for (const [key, spoken] of wanted) {
    if (await readClip(key)) alreadyStored += 1;
    else todo.push([key, spoken]);
  }

  const batch = todo.slice(0, limit);
  let rendered = 0;
  let unstored = 0;
  const failures: string[] = [];

  for (const [key, spoken] of batch) {
    try {
      const bytes = await render(spoken, apiKey, voiceId, modelId);
      // `writeClip` reports whether it landed. A run against a bucket it can read
      // but not write to would otherwise look like a success and store nothing.
      if (await writeClip(key, bytes)) rendered += 1;
      else unstored += 1;
    } catch (err) {
      failures.push(`${spoken.slice(0, 50)}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const remaining = todo.length - batch.length;
  return Response.json({
    backend,
    total: wanted.size,
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
