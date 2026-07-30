// Render Iris's voice, on your machine, into a local folder.
//
//   npm run voice:generate                  # every problem
//   npm run voice:generate -- order-desk    # one problem
//   npm run voice:generate -- --dry-run     # what it WOULD render, spends nothing
//   npm run voice:generate -- --prune       # also delete clips no table refers to
//
// ---------------------------------------------------------------------------
// This script never talks to S3. That is the point.
// ---------------------------------------------------------------------------
// The previous version asked the bucket "do you have this one?" for all 387 clips
// on every run — including dry runs, which render nothing. Two runs was ~800
// requests that produced no audio, and it is most of why Scaler's keys got flagged.
//
// "What is missing?" is a question about a folder on this laptop, so it is answered
// by `fs.existsSync`. Uploading is a separate, deliberate step: `npm run voice:sync`.
//
// Safe and cheap to re-run. A clip's file name contains a fingerprint of the exact
// sentence, so an unchanged line is already on disk under the name we would give it
// and costs nothing; a reworded line has a new name and is the only thing rendered.
import fs from 'node:fs';
import path from 'node:path';
import { problems } from '@judge/problems';
import { NODE_CATALOG } from '@judge/catalog';
import { buildScript, filesFrom } from '../apps/web/src/server/voiceScript.js';

// Which vendor renders. Both are supported because we have now switched once, and
// the clip fingerprint includes the vendor, so the two libraries coexist on disk and
// in the bucket. Going back is a config change, not a migration.
//
//   elevenlabs  v3 understands the phrase book's [warm]/[calm] tags and acts on them.
//               Needs a voice id: with ElevenLabs the voice and the model are separate.
//   deepgram    an Aura model IS the voice (`aura-2-helena-en` names a speaker), so
//               there is no voice id. Tags are stripped, because it reads them aloud.
const VENDOR = process.env.VOICE_VENDOR || 'elevenlabs';
const ELEVEN = VENDOR === 'elevenlabs';
const API_KEY = ELEVEN ? process.env.ELEVENLABS_API_KEY : process.env.DEEPGRAM_API_KEY;
const VOICE_ID = ELEVEN ? process.env.ELEVENLABS_VOICE_ID : null;
const MODEL = ELEVEN
  ? process.env.ELEVENLABS_MODEL_ID || 'eleven_v3'
  : process.env.DEEPGRAM_TTS_MODEL || 'aura-2-helena-en';
const VOICE = { vendor: VENDOR, voiceId: VOICE_ID, model: MODEL };

if (!['elevenlabs', 'deepgram'].includes(VENDOR)) {
  console.error(`VOICE_VENDOR must be "elevenlabs" or "deepgram", got "${VENDOR}".`);
  process.exit(1);
}
if (ELEVEN && !VOICE_ID) {
  console.error(
    'ELEVENLABS_VOICE_ID is required — with ElevenLabs the voice is separate from the\n' +
      'model, and it is part of every clip fingerprint. Find it in Voices, on the card.'
  );
  process.exit(1);
}
const CLIP_DIR = process.env.VOICE_CLIP_DIR || '.voice-clips';
const SCRIPT_DIR = 'packages/voice-scripts';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || process.env.DRY_RUN === '1';
const prune = args.includes('--prune');
const only = args.filter((a) => !a.startsWith('-'));

// The API key is checked LATER, immediately before rendering. Writing the tables and
// reporting what is missing needs no vendor account at all — the model has a default,
// so `--dry-run` works on a clean checkout with no environment set — and a run where
// nothing is missing should not demand a key it will never use.

for (const slug of only) {
  if (!problems[slug]) {
    console.error(`Unknown problem: ${slug}. Known: ${Object.keys(problems).join(', ')}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// 1. Tables. Always ALL problems, even when rendering one.
// ---------------------------------------------------------------------------
// A table is the contract the server and the browser read. Writing only the tables
// for the problem being rendered would leave the others describing files that no
// longer exist once a shared line changes.
fs.mkdirSync(SCRIPT_DIR, { recursive: true });
const tables = new Map();
for (const [slug, problem] of Object.entries(problems)) {
  const table = buildScript(problem, NODE_CATALOG, VOICE);
  tables.set(slug, table);
  const file = path.join(SCRIPT_DIR, `${slug}.json`);
  const next = `${JSON.stringify(table, null, 2)}\n`;
  const changed = !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== next;
  if (!dryRun) fs.writeFileSync(file, next);
  console.log(`${changed ? 'updated' : 'unchanged'}  ${file}  (${Object.keys(table.clips).length} lines)`);
}

// The package index is generated too, rather than hand-maintained, so it cannot list a
// problem the registry no longer has or miss one it gained.
if (!dryRun) {
  const slugsAll = [...tables.keys()];
  const ident = (s) => s.replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase());
  fs.writeFileSync(
    path.join(SCRIPT_DIR, 'index.js'),
    [
      '// GENERATED by scripts/generate-voice.mjs — do not edit.',
      '// See README.md for what these tables are and when to regenerate them.',
      ...slugsAll.map((s) => `import ${ident(s)} from './${s}.json' with { type: 'json' };`),
      '',
      '/** Every problem\'s clip table, by slug. */',
      'export const voiceScripts = {',
      ...slugsAll.map((s) => `  '${s}': ${ident(s)},`),
      '};',
      '',
      '/** One problem\'s table, or null. Shape: { version, problem, renderedWith, clips }. */',
      'export function voiceScriptFor(slug) {',
      '  return voiceScripts[slug] ?? null;',
      '}',
      '',
      '/**',
      ' * Every file any table refers to.',
      ' *',
      ' * The serving route refuses to ask storage for anything outside this set, so a',
      ' * stray or hostile URL costs nothing. It is also why the route can never trigger',
      ' * a render: there is nothing to render, only files that already exist.',
      ' */',
      'export const VALID_CLIP_FILES = new Set(',
      '  Object.values(voiceScripts).flatMap((t) => Object.values(t.clips).map((c) => c.file))',
      ');',
      '',
    ].join('\n')
  );
  console.log(`updated  ${SCRIPT_DIR}/index.js`);
}

// ---------------------------------------------------------------------------
// 2. What needs rendering — answered from local disk, no network.
// ---------------------------------------------------------------------------
const slugs = only.length ? only : Object.keys(problems);
const wanted = filesFrom(slugs.map((s) => tables.get(s)));
const missing = [...wanted].filter(([file]) => !fs.existsSync(path.join(CLIP_DIR, file)));
const chars = (pairs) => pairs.reduce((n, [, text]) => n + text.length, 0);

console.log(
  `\n${wanted.size} distinct clips across ${slugs.length} problem(s); ` +
    `${missing.length} missing, ${wanted.size - missing.length} already rendered.`
);
console.log(`${chars(missing)} characters to bill, of ${chars([...wanted])} total.`);

if (prune) {
  const everything = filesFrom([...tables.values()]);
  const orphans = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (name.endsWith('.mp3') && !everything.has(path.relative(CLIP_DIR, full))) orphans.push(full);
    }
  };
  walk(CLIP_DIR);
  for (const file of orphans) {
    console.log(`  prune  ${file}`);
    if (!dryRun) fs.rmSync(file);
  }
  console.log(`${orphans.length} orphaned clip(s)${dryRun ? ' would be' : ''} removed.`);
}

if (dryRun) {
  for (const [, text] of missing.slice(0, 20)) console.log(`  missing  ${text.slice(0, 72)}`);
  if (missing.length > 20) console.log(`  … and ${missing.length - 20} more`);
  console.log('\nDry run: nothing rendered, nothing written, nothing uploaded.');
  process.exit(0);
}
if (!missing.length) {
  console.log('\nNothing to render. Run `npm run voice:sync` to upload.');
  process.exit(0);
}
if (!API_KEY) {
  console.error(
    `\nTables written, but ${missing.length} clip(s) need rendering and ` +
      `${ELEVEN ? 'ELEVENLABS_API_KEY' : 'DEEPGRAM_API_KEY'} is not set.`
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 3. Render.
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * One render.
 *
 * Retries what is worth retrying — a 429, a 5xx or a dropped socket is a blip in a
 * long run, and abandoning 200 clips over one is worse than waiting. A 4xx is a bad
 * key, voice or model and will not fix itself.
 */
async function render(text, label, retries = 4) {
  let last;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (attempt) {
      const wait = Math.min(8000, 500 * 2 ** (attempt - 1));
      console.log(`  retry ${label} (${attempt + 1}/${retries + 1}) in ${wait}ms: ${last}`);
      await sleep(wait);
    }
    try {
      const res = ELEVEN
        ? await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(VOICE_ID)}`, {
            method: 'POST',
            headers: { 'xi-api-key': API_KEY, 'content-type': 'application/json', accept: 'audio/mpeg' },
            body: JSON.stringify({
              // `text` still carries the [tags] here: on v3 they ARE the delivery
              // control, which is the reason for choosing this model.
              text,
              model_id: MODEL,
              voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
            }),
          })
        : await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(MODEL)}`, {
            method: 'POST',
            headers: { Authorization: `Token ${API_KEY}`, 'content-type': 'application/json', accept: 'audio/mpeg' },
            // Tags are already stripped for this vendor in buildScript: Deepgram has
            // no tag concept and would read them aloud. Pacing comes from punctuation.
            body: JSON.stringify({ text }),
          });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
      const detail = `${res.status} ${(await res.text().catch(() => '')).slice(0, 160)}`;
      if (res.status !== 429 && res.status < 500) throw new Error(detail);
      last = detail;
    } catch (err) {
      if (err instanceof Error && /^4\d\d /.test(err.message)) throw err;
      last = err instanceof Error ? err.message : String(err);
    }
  }
  throw new Error(last);
}

/** Four at a time: comfortably inside either vendor's concurrency allowance. */
const POOL = 4;
let done = 0;
let failed = 0;
let cursor = 0;

async function worker() {
  while (cursor < missing.length) {
    const [file, text] = missing[cursor++];
    try {
      const bytes = await render(text, file);
      const out = path.join(CLIP_DIR, file);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      // Temp then rename: a run interrupted mid-write must never leave a truncated
      // mp3 behind, because the next run would see the name and skip it forever.
      const tmp = `${out}.part`;
      fs.writeFileSync(tmp, bytes);
      fs.renameSync(tmp, out);
      done += 1;
      console.log(`  ✓ ${String(bytes.length).padStart(7)}b  ${text.slice(0, 58)}`);
    } catch (err) {
      failed += 1;
      console.error(`  ✗ ${file}: ${err instanceof Error ? err.message : err}`);
    }
  }
}

await Promise.all(Array.from({ length: Math.min(POOL, missing.length) }, worker));

console.log(`\n${done} rendered via ${VENDOR}, ${failed} failed, into ${CLIP_DIR}/`);
console.log(failed ? 'Re-run to retry the failures; everything else is skipped.' : 'Next: npm run voice:sync');
if (failed) process.exitCode = 1;
