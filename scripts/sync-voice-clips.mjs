// Upload the rendered clips to the bucket. One deliberate step, run by a human.
//
//   npm run voice:sync                # upload whatever has not been uploaded
//   npm run voice:sync -- --dry-run   # list what would go up, touch nothing
//   npm run voice:sync -- --force     # ignore the ledger and re-upload everything
//
// ---------------------------------------------------------------------------
// Deciding what to upload costs ZERO reads from the bucket
// ---------------------------------------------------------------------------
// The old pipeline asked S3 about every clip, one HEAD each, to work out what it
// already had — 387 requests to render nothing, on every run. That pattern is what
// got Scaler's keys flagged, so it is not repeated here at any scale.
//
// Instead there is a ledger on this laptop: `.voice-clips/.uploaded.json`, a list of
// the file names already sent. It can be trusted because a clip's name contains a
// fingerprint of its own audio — a name that has been uploaded can never later mean
// different bytes. If the ledger is lost, `--force` rebuilds it, and re-uploading a
// few hundred small objects is cheap and safe.
import fs from 'node:fs';
import path from 'node:path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { filesFrom } from '../apps/web/src/server/voiceScript.js';

const CLIP_DIR = process.env.VOICE_CLIP_DIR || '.voice-clips';
const SCRIPT_DIR = 'packages/voice-scripts';
const LEDGER = path.join(CLIP_DIR, '.uploaded.json');

const BUCKET = process.env.AUDIO_S3_BUCKET;
const REGION = process.env.AUDIO_S3_REGION;
const ENDPOINT = process.env.AUDIO_S3_ENDPOINT || undefined;
const PREFIX = (process.env.AUDIO_S3_PREFIX ?? 'voice-clips').replace(/^\/+|\/+$/g, '');
const ACCESS_KEY_ID = process.env.AUDIO_S3_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.AUDIO_S3_SECRET_ACCESS_KEY;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

if (!dryRun && (!BUCKET || (!REGION && !ENDPOINT))) {
  console.error(
    'Missing bucket config. Set AUDIO_S3_BUCKET and AUDIO_S3_REGION in .env\n' +
      '(plus AUDIO_S3_ENDPOINT for a non-AWS S3-compatible store).'
  );
  process.exit(1);
}

// What SHOULD be in the bucket: every file the committed tables refer to. Reading
// the tables rather than walking the folder means a stale clip left on disk from an
// older wording is never uploaded.
if (!fs.existsSync(SCRIPT_DIR)) {
  console.error(`No ${SCRIPT_DIR}/ — run \`npm run voice:generate\` first.`);
  process.exit(1);
}
const tables = fs
  .readdirSync(SCRIPT_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(SCRIPT_DIR, f), 'utf8')));
const wanted = [...filesFrom(tables).keys()].sort();

const ledger = new Set(!force && fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, 'utf8')) : []);

const present = wanted.filter((f) => fs.existsSync(path.join(CLIP_DIR, f)));
const absent = wanted.filter((f) => !fs.existsSync(path.join(CLIP_DIR, f)));
const todo = present.filter((f) => !ledger.has(f));

console.log(`${wanted.length} clips referenced by ${tables.length} table(s).`);
if (absent.length) {
  console.log(`⚠ ${absent.length} not rendered yet — run \`npm run voice:generate\` before syncing.`);
}
console.log(`${todo.length} to upload, ${present.length - todo.length} already uploaded.`);

if (dryRun) {
  for (const f of todo.slice(0, 20)) console.log(`  would upload  ${f}`);
  if (todo.length > 20) console.log(`  … and ${todo.length - 20} more`);
  console.log('\nDry run: nothing uploaded.');
  process.exit(0);
}
if (!todo.length) {
  console.log('Nothing to upload.');
  process.exit(absent.length ? 1 : 0);
}

const s3 = new S3Client({
  region: REGION || 'us-east-1',
  endpoint: ENDPOINT,
  // Path-style addressing is what non-AWS S3-compatible stores (R2, B2, MinIO)
  // expect; real S3 is happy either way.
  forcePathStyle: Boolean(ENDPOINT),
  credentials:
    ACCESS_KEY_ID && SECRET_ACCESS_KEY
      ? { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY }
      : undefined,
});

/** Record progress as we go, so an interrupted run does not re-upload what landed. */
const save = () => fs.writeFileSync(LEDGER, `${JSON.stringify([...ledger].sort(), null, 0)}\n`);

let done = 0;
let failed = 0;
let cursor = 0;
const POOL = 8;

async function worker() {
  while (cursor < todo.length) {
    const file = todo[cursor++];
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: `${PREFIX}/${file}`,
          Body: fs.readFileSync(path.join(CLIP_DIR, file)),
          ContentType: 'audio/mpeg',
          // The name contains a fingerprint of the audio, so these bytes can never
          // change under this key. Safe to cache for a year. `private` because
          // narration explains correct answers and must stay behind the login.
          CacheControl: 'private, max-age=31536000, immutable',
        })
      );
      ledger.add(file);
      done += 1;
      if (done % 25 === 0) save();
      console.log(`  ✓ ${file}`);
    } catch (err) {
      failed += 1;
      console.error(`  ✗ ${file}: ${err instanceof Error ? err.message : err}`);
    }
  }
}

await Promise.all(Array.from({ length: Math.min(POOL, todo.length) }, worker));
save();

console.log(`\n${done} uploaded, ${failed} failed. Ledger: ${LEDGER}`);
if (failed || absent.length) process.exitCode = 1;
