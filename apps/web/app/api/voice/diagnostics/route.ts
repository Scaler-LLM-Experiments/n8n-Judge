import { stat } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
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
const CLIP_DIR = process.env.VOICE_CLIP_DIR || '.voice-clips';

/**
 * Same base resolution the cache uses — see `candidateBases` in voiceCache.ts. `next
 * dev` runs from apps/web while the render scripts run from the repo root, so a
 * relative folder means two different places and this report has to agree with what
 * the route will actually find.
 */
function bases(dir: string): string[] {
  if (isAbsolute(dir)) return [dir];
  const here = resolve(dir);
  const root = resolve(process.cwd(), '..', '..', dir);
  return here === root ? [here] : [here, root];
}

/** Playable without touching storage: cached, or rendered here and not yet synced. */
async function localSource(file: string): Promise<'cache' | 'rendered' | null> {
  for (const [where, dir] of [['cache', CACHE_DIR], ['rendered', CLIP_DIR]] as const) {
    for (const base of bases(dir)) {
      try {
        if ((await stat(join(base, file))).size > 0) return where;
      } catch {
        /* not here, try the next */
      }
    }
  }
  return null;
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
  const found = await Promise.all(files.map(localSource));
  const cached = found.filter((f) => f === 'cache').length;
  const rendered = found.filter((f) => f === 'rendered').length;
  const local = cached + rendered;

  const verdict = !table
    ? `No clip table for "${slug}". Run \`npm run voice:generate\`; until then this problem is captions only.`
    : local === files.length
      ? `Every clip for this problem plays from local disk (${cached} cached, ${rendered} rendered here). Storage is not being touched at all.`
      : !config.bucket
        ? `AUDIO_S3_BUCKET is not set and ${files.length - local} of ${files.length} clips are not on disk, so those play as captions. Run \`npm run voice:generate\` to render them here, or configure the bucket.`
        : !config.credentials
          ? 'No key pair set, so the default AWS credential chain is used — fine with a task role, otherwise every fetch will fail.'
          : local === 0
            ? 'Configured, and nothing served yet. The first play of each clip fetches it once; after that this number climbs and storage is never asked again.'
            : `${local} of ${files.length} clips are on local disk. The rest are fetched once each, on first play.`;

  return Response.json({
    verdict,
    problem: slug,
    config,
    clips: table
      ? {
          lines: Object.keys(table.clips).length,
          files: files.length,
          // Split, because they mean different things: `cached` was fetched from
          // storage and will survive nothing but this container, `renderedLocally`
          // is output of `voice:generate` that has probably not been synced yet.
          playableFromDisk: local,
          cached,
          renderedLocally: rendered,
          renderedWith: table.renderedWith,
        }
      : null,
    publishedFilesAcrossAllProblems: VALID_CLIP_FILES.size,
    note: 'No storage calls are made to produce this report.',
  });
}
