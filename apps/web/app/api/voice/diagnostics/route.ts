import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { VALID_CLIP_FILES, voiceScriptFor } from '@judge/voice-scripts';
import { auth } from '../../../../auth';

// "Why is narration not playing?", answerable without opening devtools.
//
//   GET /api/voice/diagnostics
//   GET /api/voice/diagnostics?problem=order-desk
//
// Every failure mode here is silent by design — a learner just sees captions — so
// without this the only way to tell a missing bucket from an ungenerated problem is
// reading response headers on someone else's phone.
//
// It makes NO call to storage. Answering "how many clips are in the bucket?" would
// mean one request per clip, which is precisely the loop that got the credentials
// flagged; a diagnostic must never be the thing you end up diagnosing. What it can
// answer for free is what the container has actually served so far, which is the
// more useful number anyway.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE_DIR = process.env.VOICE_CACHE_DIR || '.voice-cache';

async function isWarm(file: string): Promise<boolean> {
  try {
    return (await stat(join(CACHE_DIR, file))).size > 0;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'unauthenticated' }, { status: 401 });

  const slug = new URL(req.url).searchParams.get('problem') ?? 'email-triage';
  const table = voiceScriptFor(slug);

  const config = {
    bucket: Boolean(process.env.AUDIO_S3_BUCKET),
    region: process.env.AUDIO_S3_REGION ?? null,
    endpoint: process.env.AUDIO_S3_ENDPOINT ?? null,
    prefix: process.env.AUDIO_S3_PREFIX ?? 'voice-clips',
    credentials: Boolean(process.env.AUDIO_S3_ACCESS_KEY_ID && process.env.AUDIO_S3_SECRET_ACCESS_KEY),
    cacheDir: CACHE_DIR,
  };

  const files = table ? [...new Set(Object.values(table.clips).map((c) => (c as { file: string }).file))] : [];
  const warm = (await Promise.all(files.map(isWarm))).filter(Boolean).length;

  const verdict = !table
    ? `No clip table for "${slug}". Run \`npm run voice:generate\`; until then this problem is captions only.`
    : !config.bucket
      ? 'AUDIO_S3_BUCKET is not set, so no clip can be fetched. Narration is captions only.'
      : !config.credentials
        ? 'No key pair set, so the default AWS credential chain is used — fine with a task role, otherwise every fetch will fail.'
        : warm === 0
          ? 'Configured, and nothing served yet. The first play of each clip fetches it once; after that this number climbs and storage is never asked again.'
          : warm < files.length
            ? `Warm: ${warm} of ${files.length} clips are cached on this container. The rest are fetched once each, on first play.`
            : 'Every clip for this problem is cached locally. Storage is not being touched at all.';

  return Response.json({
    verdict,
    problem: slug,
    config,
    clips: table
      ? {
          lines: Object.keys(table.clips).length,
          files: files.length,
          warmOnThisContainer: warm,
          renderedWith: table.renderedWith,
        }
      : null,
    publishedFilesAcrossAllProblems: VALID_CLIP_FILES.size,
    note: 'No storage calls are made to produce this report.',
  });
}
