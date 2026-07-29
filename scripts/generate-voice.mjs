// Render every line Iris can say, once, and store it.
//
//   npm run voice:generate              # every published problem
//   npm run voice:generate -- email-triage
//   DRY_RUN=1 npm run voice:generate    # list what WOULD be rendered, spend nothing
//
// Why this exists: rendering on demand costs a vendor round trip on the first play
// of every line, which is the pause between a click and Iris speaking. The phrase
// book is small, fixed and fully enumerable (see voiceCatalogue.js), so the whole
// thing can be rendered ahead of time and served as bytes.
//
// Safe to re-run. Clips are content-addressed by (voice, model, spoken text), so a
// line that already exists is skipped and only genuinely new or reworded lines are
// billed. Editing one word regenerates exactly that one clip.
//
// Needs: ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, and a storage backend
// (VOICE_CLIP_DIR for local, or VOICE_CLIP_BACKEND=s3 with VOICE_S3_BUCKET).
import { problems } from '@judge/problems';
import { NODE_CATALOG } from '@judge/catalog';
import { enumerateSpeakable } from '../apps/web/src/lib/voiceCatalogue.js';
import { clipBackend, clipKey, readClip, writeClip } from '../apps/web/src/server/voiceStore.ts';

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_v3';
const DRY_RUN = process.env.DRY_RUN === '1';
const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));

const backend = clipBackend();
if (backend === 'none') {
  console.error(
    'No clip storage configured. Set VOICE_CLIP_DIR=.voice-clips for local files,\n' +
      'or VOICE_CLIP_BACKEND=s3 with VOICE_S3_BUCKET and VOICE_S3_REGION.'
  );
  process.exit(1);
}
if (!DRY_RUN && (!API_KEY || !VOICE_ID)) {
  console.error('ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID are required (or run with DRY_RUN=1).');
  process.exit(1);
}

const slugs = only.length ? only : Object.keys(problems);
for (const slug of slugs) {
  if (!problems[slug]) {
    console.error(`Unknown problem: ${slug}`);
    process.exit(1);
  }
}

/** One render. Throws on a vendor error so the caller can report and continue. */
async function render(text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(VOICE_ID)}`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      // Must match the route's settings exactly, or a clip generated here sounds
      // different from one rendered live as a fallback.
      voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text().catch(() => '')).slice(0, 200)}`);
  return Buffer.from(await res.arrayBuffer());
}

// Collect across all problems first, deduplicated: many lines are shared (every
// problem says "Correct."), and rendering those once per problem would triple the bill.
const wanted = new Map(); // key -> { spoken, where[] }
for (const slug of slugs) {
  for (const item of enumerateSpeakable(problems[slug], NODE_CATALOG)) {
    const key = clipKey(item.spoken, VOICE_ID ?? 'dry', MODEL_ID);
    const entry = wanted.get(key) ?? { spoken: item.spoken, where: [] };
    entry.where.push(`${slug}/${item.moment}${item.key ? `:${item.key}` : ''}`);
    wanted.set(key, entry);
  }
}

console.log(`${wanted.size} distinct lines across ${slugs.length} problem(s), backend: ${backend}`);

let made = 0;
let skipped = 0;
let failed = 0;
const chars = { total: 0, new: 0 };

for (const [key, { spoken, where }] of wanted) {
  chars.total += spoken.length;

  if (!DRY_RUN && (await readClip(key))) {
    skipped += 1;
    continue;
  }
  chars.new += spoken.length;

  if (DRY_RUN) {
    console.log(`  would render  ${spoken.slice(0, 72)}`);
    made += 1;
    continue;
  }

  try {
    const bytes = await render(spoken);
    await writeClip(key, bytes);
    made += 1;
    console.log(`  ✓ ${String(bytes.length).padStart(7)}b  ${spoken.slice(0, 64)}`);
  } catch (err) {
    failed += 1;
    // Keep going: one bad line should not abandon the run, and the route still
    // falls back to live rendering for anything missing.
    console.error(`  ✗ ${where[0]}: ${err instanceof Error ? err.message : err}`);
  }
}

console.log(
  `\n${made} rendered, ${skipped} already stored, ${failed} failed.\n` +
    `${chars.new} characters billed of ${chars.total} total.`
);
if (failed) process.exitCode = 1;
