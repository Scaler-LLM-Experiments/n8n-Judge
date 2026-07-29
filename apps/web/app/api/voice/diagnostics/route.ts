import { auth } from '../../../../auth';
import { problems } from '@judge/problems';
import { NODE_CATALOG } from '@judge/catalog';
import { enumerateSpeakable } from '../../../../src/lib/voiceCatalogue.js';
import { clipBackend, clipKey, readClip } from '../../../../src/server/voiceStore';

// "Why is narration slow?", answerable without opening devtools.
//
//   GET /api/voice/diagnostics
//   GET /api/voice/diagnostics?problem=email-triage   (checks that problem's clips)
//
// The porting guide has the same idea (§6, `/voice/diagnostics`) and for the same
// reason: every failure mode here is silent by design. A missing key, an empty
// bucket, a wrong region and a typo'd voice id all present identically as "it
// still takes a second before Iris speaks", and the only way to tell them apart
// otherwise is reading response headers on a phone.
//
// Reports configuration and a real sample lookup. Never returns a secret: only
// whether each one is present.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** How many of a problem's clips are actually stored, from a sample. */
async function sample(slug: string, voiceId: string, modelId: string, size = 12) {
  const problem = (problems as Record<string, unknown>)[slug];
  if (!problem) return null;

  const all = enumerateSpeakable(problem, NODE_CATALOG);
  // Evenly spaced rather than the first N, so a partial generation run shows up as
  // partial instead of looking complete.
  const step = Math.max(1, Math.floor(all.length / size));
  const picked = all.filter((_, i) => i % step === 0).slice(0, size);

  let stored = 0;
  const missing: string[] = [];
  for (const item of picked) {
    if (await readClip(clipKey(item.spoken, voiceId, modelId))) stored += 1;
    else missing.push(item.caption.slice(0, 60));
  }

  return { total: all.length, checked: picked.length, stored, missing: missing.slice(0, 5) };
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'unauthenticated' }, { status: 401 });

  const slug = new URL(req.url).searchParams.get('problem') ?? 'email-triage';
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? '';
  const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_v3';
  const backend = clipBackend();

  const config = {
    featureVoice: process.env.FEATURE_VOICE === 'true',
    elevenLabsKey: Boolean(process.env.ELEVENLABS_API_KEY),
    voiceId: Boolean(voiceId),
    modelId,
    backend,
    bucket: Boolean(process.env.AUDIO_S3_BUCKET),
    region: process.env.AUDIO_S3_REGION ?? null,
    credentials: Boolean(process.env.AUDIO_S3_ACCESS_KEY_ID && process.env.AUDIO_S3_SECRET_ACCESS_KEY),
    prefix: process.env.AUDIO_S3_PREFIX ?? 'voice-clips',
  };

  const clips = backend === 'none' ? null : await sample(slug, voiceId, modelId);

  // One sentence naming the actual problem, in the order it bites. Anything that
  // needs a decision tree to interpret will not get read.
  const verdict = !config.featureVoice
    ? 'FEATURE_VOICE is not "true", so narration is captions only. Nothing else here matters until it is.'
    : !config.elevenLabsKey || !config.voiceId
      ? 'ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID is missing, so there is nothing to render with.'
      : backend === 'none'
        ? 'No clip storage, so every line is rendered live. Set AUDIO_S3_BUCKET (or VOICE_CLIP_DIR) and run `npm run voice:generate`.'
        : backend === 's3' && !config.credentials
          ? 'S3 has no key pair, so reads fall back to the default AWS chain and will fail if there is no role.'
          : clips && clips.stored === 0
            ? `Storage is configured but EMPTY (0 of ${clips.checked} sampled). Run \`npm run voice:generate\` — setting the variables does not put clips in the bucket.`
            : clips && clips.stored < clips.checked
              ? `Partly generated: ${clips.stored} of ${clips.checked} sampled are stored. Re-run \`npm run voice:generate\`; it skips what already exists.`
              : 'Configured and stored. Playback should not be reaching the vendor at all.';

  return Response.json({ verdict, config, clips, problem: slug });
}
