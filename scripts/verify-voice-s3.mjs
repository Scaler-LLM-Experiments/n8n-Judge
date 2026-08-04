// Prove where a voice clip actually came from.
//
//   node scripts/verify-voice-s3.mjs                    # report only, touches nothing
//   node scripts/verify-voice-s3.mjs --isolate          # the real proof (see below)
//   node scripts/verify-voice-s3.mjs --isolate --restore-only
//
// ---------------------------------------------------------------------------
// Why this script exists
// ---------------------------------------------------------------------------
// "The audio plays, so S3 works" is not a valid inference. `voiceCache` reads
// local disk BEFORE it asks storage, and one of the directories it reads is
// VOICE_CLIP_DIR — the folder `voice:generate` just wrote. So on the machine that
// rendered the clips, every clip plays from local disk and the bucket is never
// contacted at all. That is deliberate (it means you can hear your own audition
// with no bucket), and it is exactly what makes a naive test meaningless.
//
// `--isolate` moves VOICE_CLIP_DIR aside and empties VOICE_CACHE_DIR, leaving
// s3Fetch as the ONLY way bytes can reach the route. If a clip still returns 200
// after that, it came over the network from the bucket named in AUDIO_S3_BUCKET.
//
// It also reports whether that bucket is real AWS or an S3-compatible store:
// AUDIO_S3_ENDPOINT empty means the SDK derives the endpoint from the region and
// talks to AWS; a value there means something else (Railway, R2, B2, MinIO).
//
// The ledger `.uploaded.json` lives INSIDE VOICE_CLIP_DIR, so this script MOVES
// that directory rather than deleting it. Losing the ledger would make the next
// `voice:sync` re-upload everything.
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000';
const EMAIL = process.env.SMOKE_EMAIL ?? 'smoke@judge.local';
const PASSWORD = process.env.SMOKE_PASSWORD ?? 'smoke-test-password';
const INVITE = process.env.SMOKE_INVITE ?? 'AIML-DEMO';
const SLUG = process.argv.slice(2).find((a) => !a.startsWith('-')) ?? 'email-triage';

const CLIP_DIR = process.env.VOICE_CLIP_DIR || '.voice-clips';
const CACHE_DIR = process.env.VOICE_CACHE_DIR || '.voice-cache';
const PARKED = `${CLIP_DIR}.parked`;

const isolate = process.argv.includes('--isolate');
const restoreOnly = process.argv.includes('--restore-only');

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

// --- a cookie jar, because the clip route is behind the login ---------------
const jar = new Map();
function remember(res) {
  for (const raw of res.headers.getSetCookie?.() ?? []) {
    const [pair] = raw.split(';');
    const i = pair.indexOf('=');
    if (i > 0) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
}
const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
async function req(url, init = {}) {
  const res = await fetch(`${BASE}${url}`, {
    ...init,
    redirect: 'manual',
    headers: { ...(init.headers ?? {}), ...(jar.size ? { cookie: cookieHeader() } : {}) },
  });
  remember(res);
  return res;
}

async function signIn() {
  // Idempotent: 201 the first time, 409 after. Both fine.
  await req('/api/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, inviteCode: INVITE }),
  }).catch(() => {});

  const { csrfToken } = await (await req('/api/auth/csrf')).json();
  await req('/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrfToken, email: EMAIL, password: PASSWORD }),
  });
  const session = await (await req('/api/auth/session')).json();
  return session?.user?.email ?? null;
}

const diagnostics = async () => (await req(`/api/voice/diagnostics?problem=${SLUG}`)).json();

function restore() {
  if (fs.existsSync(PARKED)) {
    if (fs.existsSync(CLIP_DIR)) {
      console.error(red(`Both ${CLIP_DIR} and ${PARKED} exist — refusing to overwrite. Merge them by hand.`));
      process.exit(1);
    }
    fs.renameSync(PARKED, CLIP_DIR);
    console.log(`restored  ${PARKED} -> ${CLIP_DIR}  ${dim('(ledger intact)')}`);
  }
}

// ---------------------------------------------------------------------------
if (restoreOnly) {
  restore();
  process.exit(0);
}

console.log(bold(`\nVoice clip source check — ${SLUG} @ ${BASE}\n`));

const who = await signIn();
if (who !== EMAIL) {
  console.error(red(`Could not sign in as ${EMAIL}. Is the dev server up and the DB seeded?`));
  process.exit(1);
}
console.log(`signed in as ${who}`);

// --- 1. Which storage is configured? ---------------------------------------
let d = await diagnostics();
if (d.error) {
  console.error(red(`diagnostics: ${d.error}`));
  process.exit(1);
}
const c = d.config;
// An empty string is as good as unset here: voiceCache does
// `process.env.AUDIO_S3_ENDPOINT || undefined`, so "" means the SDK derives the
// endpoint from the region — i.e. real AWS.
const isAws = !c.endpoint;
const BUCKET_NAME = process.env.AUDIO_S3_BUCKET || '(unset)';

console.log(bold('\n1. Storage configuration'));
console.log(`   bucket          ${c.bucket ? green(BUCKET_NAME) : red('unset')}`);
console.log(`   region          ${c.region || red('unset')}`);
console.log(`   prefix          ${c.prefix}`);
console.log(`   key pair set    ${c.credentials ? green('yes') : yellow('no (default AWS chain)')}`);
console.log(`   endpoint        ${c.endpoint ? red(c.endpoint) : green('(empty)')}`);
console.log(
  `   ${bold('→ target')}        ${
    isAws
      ? green('real AWS S3 (endpoint derived from region)')
      : red(`S3-COMPATIBLE STORE at ${c.endpoint} — this is NOT AWS`)
  }`
);
if (!c.bucket) {
  console.error(red('\nAUDIO_S3_BUCKET is unset, so no clip can ever be served from storage.'));
  process.exit(1);
}

// --- 2. Pick a clip from the committed table -------------------------------
const tablePath = path.join('packages/voice-scripts', `${SLUG}.json`);
if (!fs.existsSync(tablePath)) {
  console.error(red(`\nNo ${tablePath} — run \`npm run voice:generate\` first.`));
  process.exit(1);
}
const table = JSON.parse(fs.readFileSync(tablePath, 'utf8'));
const file = [...new Set(Object.values(table.clips).map((x) => x.file))].sort()[0];

console.log(bold('\n2. Before'));
console.log(`   rendered here   ${d.clips.renderedLocally}`);
console.log(`   fetched (cache) ${d.clips.cached}`);
console.log(`   test clip       ${file}`);

// --- 3. Isolate, so local disk cannot answer -------------------------------
if (isolate) {
  console.log(bold('\n3. Isolating local disk'));
  restore(); // clean up a previous interrupted run
  if (fs.existsSync(CLIP_DIR)) {
    fs.renameSync(CLIP_DIR, PARKED);
    console.log(`   moved    ${CLIP_DIR} -> ${PARKED}  ${dim('(ledger travels with it)')}`);
  } else {
    console.log(`   ${dim(`${CLIP_DIR} does not exist — nothing to move`)}`);
  }
  if (fs.existsSync(CACHE_DIR)) {
    fs.rmSync(CACHE_DIR, { recursive: true, force: true });
    console.log(`   cleared  ${CACHE_DIR}`);
  }
  console.log(`   ${yellow('s3Fetch is now the only path bytes can take.')}`);
} else {
  console.log(bold('\n3. ') + dim('Not isolating — pass --isolate for a conclusive result.'));
}

// --- 4. Fetch the clip -----------------------------------------------------
console.log(bold('\n4. Fetching the clip through the app'));
const t0 = Date.now();
const res = await req(`/api/voice/clip/${file}`);
const ms = Date.now() - t0;
const bytes = res.ok ? (await res.arrayBuffer()).byteLength : 0;
console.log(`   HTTP ${res.status}  ${bytes} bytes  in ${ms}ms`);

// --- 5. Verdict ------------------------------------------------------------
const after = await diagnostics();
const grew = after.clips.cached - d.clips.cached;
console.log(bold('\n5. After'));
console.log(`   fetched (cache) ${d.clips.cached} -> ${after.clips.cached}  ${grew > 0 ? green(`+${grew}`) : dim('unchanged')}`);

console.log(bold('\nVerdict'));
if (!res.ok) {
  console.log(red(`   The clip 404'd.`));
  console.log(
    isolate
      ? '   With local disk isolated this means the object is not in the bucket:\n' +
        '   run `npm run voice:sync` (after restoring), or check the bucket/prefix/region.'
      : '   It is not on local disk and not in the bucket. Render and sync it.'
  );
} else if (grew > 0) {
  console.log(green('   CONFIRMED: the bytes came from storage, not local disk.'));
  console.log(`   The cache counter only increases via s3Fetch, and it grew by ${grew}.`);
  console.log(
    `   Source: ${isAws ? green('AWS S3') : red(`non-AWS store at ${c.endpoint}`)}` +
      `  s3://${BUCKET_NAME}/${c.prefix}/${file}`
  );
} else if (isolate) {
  console.log(yellow('   Served, but the cache counter did not move.'));
  console.log('   Most likely a stale dev-server process is holding the old env — restart `npm run dev`.');
} else {
  console.log(yellow('   INCONCLUSIVE: served from local disk without touching storage.'));
  console.log('   This is the trap. Re-run with --isolate to force the bucket to answer.');
}

if (isolate) {
  console.log(dim(`\nRestore your rendered clips with:\n  node scripts/verify-voice-s3.mjs --restore-only\n`));
}
