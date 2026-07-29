import { auth } from '../../../auth';
import { pickLine, captionFor, fillLine, hasMoment } from '../../../src/lib/voiceLines.js';

// Iris's voice: render one moment's line through ElevenLabs and hand back the audio.
//
//   GET /api/voice?moment=verify_pass&variant=2
//     200 audio/mpeg  + X-Voice-Text: <url-encoded caption>
//     204            when narration is switched off or unconfigured
//     404            unknown moment
//
// Why a server route at all, when the browser has speechSynthesis: the platform
// voices are robotic and different on every machine, so the product would sound
// like a different person depending on the laptop. One voice, chosen once, is
// part of the character.
//
// ---------------------------------------------------------------------------
// Cost, and why the cache is not optional
// ---------------------------------------------------------------------------
// Every render is billed per character. A learner hears `verify_pass` once per
// node, and a cohort of two hundred hears it thousands of times, for a sentence
// that never changes. So rendered bytes are cached in memory per
// (voice, model, moment, variant) and served from there afterwards. The phrase
// book is small and fixed, so the cache has a natural ceiling: it holds at most
// one entry per line that exists.
//
// This is deliberately NOT the design the porting guide describes, which
// pre-renders every clip to S3 offline and serves bytes with no vendor call at
// playback. That is the right end state (zero latency, zero runtime cost, and
// the clips survive a restart) and the seam for it is this route: swap the
// `render` call for an S3 read and nothing else changes. In-process caching is
// the version that ships today, and it loses its contents on every deploy.
//
// 204 rather than an error when unconfigured: a missing key is a normal state,
// not a fault. The client shows the caption and the mascot still reacts, exactly
// as it does when a fetch fails.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ELEVEN_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

/** Rendered audio, keyed by everything that changes the bytes. */
const cache = new Map<string, ArrayBuffer>();
/** A line's audio is a few tens of KB; the phrase book is under a hundred lines. */
const MAX_CACHE = 200;

function remember(key: string, bytes: ArrayBuffer) {
  // Oldest out first. Insertion order is Map's iteration order, so the first key
  // is the least recently added.
  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, bytes);
}

async function render(text: string, apiKey: string, voiceId: string, modelId: string) {
  const res = await fetch(`${ELEVEN_URL}/${encodeURIComponent(voiceId)}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'content-type': 'application/json',
      accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      // Stability low enough that the audio tags actually change the delivery;
      // high enough that the same line does not sound different every render.
      voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`elevenlabs ${res.status}: ${detail.slice(0, 300)}`);
  }
  return await res.arrayBuffer();
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });

  const url = new URL(req.url);
  const moment = url.searchParams.get('moment') ?? '';
  const variantParam = url.searchParams.get('variant');
  const vars = { phase: url.searchParams.get('phase') ?? '' };

  if (!hasMoment(moment)) return Response.json({ error: 'unknown_moment' }, { status: 404 });

  const picked = pickLine(moment, variantParam === null ? undefined : Number(variantParam));
  if (!picked) return Response.json({ error: 'unknown_moment' }, { status: 404 });

  const spoken = fillLine(picked.line, vars);
  const caption = captionFor(spoken);

  // The caption travels on a header so it is available even when the body is
  // audio. Header values must be latin-1 safe, hence the encoding: an apostrophe
  // in a line would otherwise throw at the edge.
  const headers = new Headers({
    'X-Voice-Text': encodeURIComponent(caption),
    'X-Voice-Variant': String(picked.index),
    'Access-Control-Expose-Headers': 'X-Voice-Text, X-Voice-Variant',
    // Variants must rotate, so the browser must not reuse the last one.
    'Cache-Control': 'no-store',
  });

  const enabled = process.env.FEATURE_VOICE === 'true';
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_v3';

  if (!enabled || !apiKey || !voiceId) {
    // 204 carries the caption but no audio: the line still gets read, just not
    // heard. The client treats this as its text-only path.
    return new Response(null, { status: 204, headers });
  }

  const key = `${voiceId}:${modelId}:${moment}:${picked.index}:${vars.phase}`;
  const hit = cache.get(key);
  if (hit) {
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('X-Voice-Cache', 'hit');
    return new Response(hit, { headers });
  }

  try {
    const bytes = await render(spoken, apiKey, voiceId, modelId);
    remember(key, bytes);
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('X-Voice-Cache', 'miss');
    return new Response(bytes, { headers });
  } catch (err) {
    // A vendor failure must not cost the learner the line. Log it so a wrong
    // model id or an expired key is greppable rather than mysteriously silent,
    // and fall back to the caption.
    console.error('[voice] render failed:', err instanceof Error ? err.message : err);
    headers.set('X-Voice-Error', '1');
    return new Response(null, { status: 204, headers });
  }
}
