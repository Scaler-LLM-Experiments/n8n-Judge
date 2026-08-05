// Prove, from our side, that what an agent SAID happened actually happened.
//
//   node scripts/authoring/verify.mjs all <slug> [--branch <name>] [--fake]
//   node scripts/authoring/verify.mjs files <slug>
//   node scripts/authoring/verify.mjs registered <slug>
//   node scripts/authoring/verify.mjs check <slug>
//   node scripts/authoring/verify.mjs cover <slug>
//   node scripts/authoring/verify.mjs voice-rendered <slug>
//   node scripts/authoring/verify.mjs voice-uploaded <slug>
//   node scripts/authoring/verify.mjs seeded <slug>
//   node scripts/authoring/verify.mjs branch <name>
//
// ---------------------------------------------------------------------------
// Why this file is the most important one in the pipeline
// ---------------------------------------------------------------------------
// An agent works somewhere we cannot see and reports its own success. A failed write,
// a silent auth problem, a slightly wrong slug, or simply an optimistic summary all
// produce a confident "done". Every stage that believes such a report hands a broken
// case to the next stage, which fails somewhere unrelated with a cryptic error.
//
// So: no agent claim is ever load-bearing. Each one has a cheap, authoritative check
// here that runs on our side, and the orchestrator advances on the CHECK, never on the
// claim. This is the single highest-value guard in the design.
//
// Every check prints one line and contributes an exit code. `all` is what the
// orchestrator calls between stages.
//
// Two deliberate cheap-ness decisions:
//   - `voice-uploaded` uses ONE paginated ListObjectsV2 rather than a HEAD per clip.
//     Asking storage per object is the exact pattern that got Scaler's S3 keys
//     flagged, and it is never necessary: list the prefix once, compare locally.
//   - Nothing here renders, uploads, seeds or pushes. Verification must be safe to
//     re-run at any time, including on a half-finished run.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

const CLIP_DIR = process.env.VOICE_CLIP_DIR || '.voice-clips';
const SCRIPT_DIR = 'packages/voice-scripts';
const REQUIRED_FILES = ['meta.js', 'dissection.js', 'build.js', 'nodeSetup.js', 'probes.js', 'cases.js', 'voice.js', 'index.js'];

/** One check's outcome. `blocking:false` reports without failing the run. */
const pass = (name, detail) => ({ name, ok: true, detail });
const fail = (name, detail, { blocking = true } = {}) => ({ name, ok: false, blocking, detail });

function report(results) {
  for (const r of results) {
    const mark = r.ok ? green('✓') : r.blocking === false ? yellow('!') : red('✗');
    console.log(`  ${mark} ${r.name.padEnd(16)} ${r.detail}`);
  }
  const blocked = results.filter((r) => !r.ok && r.blocking !== false);
  const advisory = results.filter((r) => !r.ok && r.blocking === false);
  console.log('');
  if (blocked.length) console.log(red(`${blocked.length} blocking failure(s): ${blocked.map((r) => r.name).join(', ')}`));
  if (advisory.length) console.log(yellow(`${advisory.length} non-blocking: ${advisory.map((r) => r.name).join(', ')}`));
  if (!blocked.length && !advisory.length) console.log(green('every check passed'));
  return blocked.length === 0;
}

// ---------------------------------------------------------------------------
// Loading the problem from the repo
// ---------------------------------------------------------------------------

/**
 * The assembled problem from its folder, whether or not it is registered.
 *
 * Deliberately imports the folder rather than reading the registry, so a case can be
 * verified before it is wired into the catalogue — which is when most of these checks
 * matter.
 */
async function loadFromDisk(slug) {
  const file = path.resolve(`packages/problems/${slug}/index.js`);
  if (!fs.existsSync(file)) return null;
  const mod = await import(`file://${file}`);
  return Object.values(mod).find((v) => v && typeof v === 'object' && 'id' in v && 'dissection' in v) ?? null;
}

/** Every string in the object, with the path that reached it. */
function strings(node, at = '', out = []) {
  if (typeof node === 'string') out.push([at, node]);
  else if (Array.isArray(node)) node.forEach((v, i) => strings(v, `${at}[${i}]`, out));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) strings(v, at ? `${at}.${k}` : k, out);
  return out;
}

// ---------------------------------------------------------------------------
// The checks
// ---------------------------------------------------------------------------

/** All eight files present, and none of them still carrying the template's TODOs. */
async function checkFiles(slug) {
  const dir = `packages/problems/${slug}`;
  if (!fs.existsSync(dir)) return [fail('files', `${dir}/ does not exist — the author stage wrote nothing`)];
  const missing = REQUIRED_FILES.filter((f) => !fs.existsSync(path.join(dir, f)));
  if (missing.length) return [fail('files', `${dir}/ is missing ${missing.join(', ')}`)];

  // The template's own test must be gone: it tests the template, not this case, and
  // `problem:new` deletes it. A copied one left behind fails the suite for the wrong
  // reason and sends whoever reads the failure to the wrong file.
  const results = [pass('files', `all ${REQUIRED_FILES.length} files present`)];
  if (fs.existsSync(path.join(dir, 'template.test.js'))) {
    results.push(fail('files', `${dir}/template.test.js was copied from the template and must be deleted`));
  }

  const problem = await loadFromDisk(slug);
  if (!problem) return [...results, fail('files', `${dir}/index.js exports no problem object`)];
  const todos = strings(problem).filter(([, v]) => v.includes('TODO'));
  results.push(
    todos.length
      ? fail('no-todos', `${todos.length} unfilled TODO(s), first at ${todos[0][0]}`)
      : pass('no-todos', 'no placeholders left')
  );
  return results;
}

/** Registered in the registry, which is what makes it the catalogue. */
async function checkRegistered(slug) {
  const { problems } = await import('@judge/problems');
  return problems[slug]
    ? [pass('registered', `in the registry at position ${Object.keys(problems).indexOf(slug) + 1} of ${Object.keys(problems).length}`)]
    : [fail('registered', `not in packages/problems/index.js — nothing will serve it`)];
}

/**
 * `problem:check` itself, run by us rather than reported to us.
 *
 * Offline by design (no database, no dev server, no API key), so this is safe at any
 * point in a run and is the right gate at author time.
 */
function checkProblemCheck(slug) {
  try {
    const out = execFileSync('node', ['scripts/problem-check.mjs', slug], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const warnings = (out.match(/warning\(s\)/g) ?? []).length;
    return [pass('problem:check', `clean${warnings ? ` (with warnings — read them)` : ''}`)];
  } catch (err) {
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}`.trim();
    return [fail('problem:check', `non-zero exit:\n${out.split('\n').slice(-14).join('\n')}`)];
  }
}

/** Cover art: authored prompt, `src` set, and a real file behind it. Never blocking. */
async function checkCover(slug) {
  const problem = await loadFromDisk(slug);
  if (!problem) return [fail('cover', 'problem does not load')];
  const { prompt, src } = problem.coverImage ?? {};
  if (!prompt) return [fail('cover', 'no coverImage.prompt authored', { blocking: false })];
  if (!src) return [fail('cover', 'coverImage.prompt authored but src is null — covers:generate has not run', { blocking: false })];
  const file = path.join('apps/web/public', src);
  if (!fs.existsSync(file)) return [fail('cover', `src is ${src} but ${file} is not on disk`, { blocking: false })];
  const kb = Math.round(fs.statSync(file).size / 1024);
  // A few hundred bytes means a truncated or errored download, which renders as a
  // broken image rather than as a failure anyone notices.
  if (kb < 10) return [fail('cover', `${file} is only ${kb}KB — almost certainly a failed render`, { blocking: false })];
  return [pass('cover', `${src} on disk, ${kb}KB`)];
}

/** The clip table exists and every file it names is on this machine. */
function checkVoiceRendered(slug) {
  const table = path.join(SCRIPT_DIR, `${slug}.json`);
  if (!fs.existsSync(table)) return [fail('voice-table', `${table} does not exist — voice:generate has not run for this case`)];
  const parsed = JSON.parse(fs.readFileSync(table, 'utf8'));
  const files = [...new Set(Object.values(parsed.clips ?? {}).map((c) => c.file))];
  if (!files.length) return [fail('voice-table', `${table} names no clips`)];
  const absent = files.filter((f) => !fs.existsSync(path.join(CLIP_DIR, f)));
  return absent.length
    ? [fail('voice-rendered', `${absent.length} of ${files.length} clips not in ${CLIP_DIR}/ (e.g. ${absent[0]}) — re-run voice:generate`)]
    : [pass('voice-rendered', `${files.length} clips referenced, all present in ${CLIP_DIR}/`)];
}

/**
 * Every clip this case needs is really in the bucket.
 *
 * ONE paginated ListObjectsV2 over the prefix, then a local set difference. The local
 * `.uploaded.json` ledger is our own record of having uploaded, which is exactly the
 * kind of self-report this file exists not to trust — so it is used only to explain a
 * mismatch, never as the evidence.
 */
async function checkVoiceUploaded(slug) {
  const table = path.join(SCRIPT_DIR, `${slug}.json`);
  if (!fs.existsSync(table)) return [fail('voice-uploaded', `${table} does not exist`)];
  const parsed = JSON.parse(fs.readFileSync(table, 'utf8'));
  const want = [...new Set(Object.values(parsed.clips ?? {}).map((c) => c.file))];

  const bucket = process.env.AUDIO_S3_BUCKET;
  const region = process.env.AUDIO_S3_REGION;
  const endpoint = process.env.AUDIO_S3_ENDPOINT || undefined;
  const prefix = (process.env.AUDIO_S3_PREFIX ?? 'voice-clips').replace(/^\/+|\/+$/g, '');
  if (!bucket || (!region && !endpoint)) {
    return [fail('voice-uploaded', 'AUDIO_S3_BUCKET / AUDIO_S3_REGION not set — cannot verify the bucket', { blocking: false })];
  }

  const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3');
  const s3 = new S3Client({
    region: region || 'us-east-1',
    endpoint,
    forcePathStyle: Boolean(endpoint),
    credentials:
      process.env.AUDIO_S3_ACCESS_KEY_ID && process.env.AUDIO_S3_SECRET_ACCESS_KEY
        ? { accessKeyId: process.env.AUDIO_S3_ACCESS_KEY_ID, secretAccessKey: process.env.AUDIO_S3_SECRET_ACCESS_KEY }
        : undefined,
  });

  const inBucket = new Set();
  let token;
  let requests = 0;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: `${prefix}/`, ContinuationToken: token }));
    requests += 1;
    for (const o of page.Contents ?? []) inBucket.add(o.Key.slice(prefix.length + 1));
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);

  const absent = want.filter((f) => !inBucket.has(f));
  const ledgerFile = path.join(CLIP_DIR, '.uploaded.json');
  const ledger = fs.existsSync(ledgerFile) ? new Set(JSON.parse(fs.readFileSync(ledgerFile, 'utf8'))) : new Set();
  if (absent.length) {
    const lying = absent.filter((f) => ledger.has(f)).length;
    return [
      fail(
        'voice-uploaded',
        `${absent.length} of ${want.length} clips are NOT in s3://${bucket}/${prefix}/ (e.g. ${absent[0]})` +
          (lying ? ` — and ${lying} of them are marked uploaded in the local ledger, so the ledger is wrong` : '') +
          ` — re-run voice:sync`
      ),
    ];
  }
  return [pass('voice-uploaded', `all ${want.length} clips in s3://${bucket}/${prefix}/ ${dim(`(${requests} list request(s), ${inBucket.size} objects)`)}`)];
}

/**
 * Postgres serves this case, and serves THIS content.
 *
 * "A row exists" is not enough: `db:seed` appends a version only when the content
 * differs, so a forgotten re-seed leaves a perfectly healthy PUBLISHED row serving the
 * previous wording. That failure is invisible in the app and looks exactly like a
 * broken voice render, so it is compared byte-for-byte with the same key-sorted
 * serialisation `publishProblem` uses.
 */
async function checkSeeded(slug) {
  const problem = await loadFromDisk(slug);
  if (!problem) return [fail('seeded', 'problem does not load from disk')];

  // A relative file URL, not a package subpath: @judge/db's `exports` map defines only
  // ".", so `@judge/db/publishProblem.mjs` throws ERR_PACKAGE_PATH_NOT_EXPORTED — which
  // this function used to catch and report as "could not reach Postgres". A friendly
  // message that can be wrong is worse than a cryptic one, so the two are separated
  // below and this import happens outside the try.
  const { canonical } = await import(new URL('../../packages/db/publishProblem.mjs', import.meta.url).href);

  let prisma;
  try {
    ({ prisma } = await import('@judge/db'));
    const row = await prisma.problem.findUnique({
      where: { slug },
      include: { versions: { where: { status: 'PUBLISHED' }, orderBy: { version: 'desc' }, take: 1 } },
    });
    if (!row) return [fail('seeded', `no Problem row for "${slug}" — npm run db:seed has not run`)];
    const published = row.versions[0];
    if (!published) return [fail('seeded', `Problem row exists but has no PUBLISHED version`)];
    if (canonical(published.data) !== canonical(problem)) {
      return [fail('seeded', `v${published.version} is PUBLISHED but its content differs from the repo — re-run npm run db:seed`)];
    }
    return [pass('seeded', `v${published.version} PUBLISHED and byte-identical to the repo`)];
  } catch (err) {
    // Only claim "unreachable" when it really is a connection problem. Anything else is
    // a bug in this script and must say so, or an afternoon goes into debugging a
    // database that was fine all along.
    const line = `${err.message}`.split('\n')[0];
    const isConnection = /P1001|P1010|ECONNREFUSED|ENOTFOUND|timeout|Can't reach database/i.test(err.message);
    return [fail('seeded', isConnection ? `could not reach Postgres: ${line}` : `check itself failed (not a database problem): ${line}`)];
  } finally {
    await prisma?.$disconnect().catch(() => {});
  }
}

/**
 * Would the app, right now, serve every problem the database says it has?
 *
 * ---------------------------------------------------------------------------
 * The database is branch-independent. The files it points at are not.
 * ---------------------------------------------------------------------------
 * Postgres does not roll back when you `git switch`. So a case seeded on its branch stays
 * PUBLISHED after you move to a branch that never had it — and the app keeps serving it,
 * pointing at a cover PNG and a clip table that are no longer on disk. The symptoms are
 * exactly the two most confusing ones available: a **missing cover image** (404 on a path
 * the served problem still names) and **no audio at all** (the clip table is absent, so
 * none of its files are in `VALID_CLIP_FILES`, and the route refuses every request by
 * design — degrading silently to captions, which looks identical to a broken render).
 *
 * Every other check in this file passed while this was broken, because they all ran on the
 * branch that HAD the files. Found the hard way after moving a case onto its own branch to
 * keep two PRs separate.
 *
 * This is the one check that asks about the working tree and the database together.
 */
async function checkServable() {
  const results = [];
  let prisma;
  try {
    ({ prisma } = await import('@judge/db'));
    const rows = await prisma.problem.findMany({
      include: { versions: { where: { status: 'PUBLISHED' }, orderBy: { version: 'desc' }, take: 1 } },
    });
    const { problems } = await import('@judge/problems');

    for (const row of rows) {
      const data = row.versions[0]?.data;
      if (!data) continue;
      const missing = [];

      // Registered here? An unregistered-but-published case is servable (the API reads the
      // DB) yet invisible to voice:generate and covers:generate, so it silently stops
      // getting new clips and art.
      if (!problems[row.slug]) missing.push('not in the repo registry');

      const src = data.coverImage?.src;
      if (src && !fs.existsSync(path.join('apps/web/public', src))) missing.push(`cover ${src} not on disk`);

      const table = path.join(SCRIPT_DIR, `${row.slug}.json`);
      if (!fs.existsSync(table)) missing.push(`clip table ${row.slug}.json absent — ALL narration will be refused`);

      results.push(
        missing.length
          ? fail('servable', `${row.slug} is PUBLISHED but ${missing.join('; ')}`)
          : pass('servable', `${row.slug} v${row.versions[0].version} — cover and clip table both present`)
      );
    }
    if (!results.length) results.push(fail('servable', 'no PUBLISHED problems in the database'));
    return results;
  } catch (err) {
    const line = `${err.message}`.split('\n')[0];
    const isConnection = /P1001|P1010|ECONNREFUSED|ENOTFOUND|timeout|Can't reach database/i.test(err.message);
    return [fail('servable', isConnection ? `could not reach Postgres: ${line}` : `check itself failed: ${line}`)];
  } finally {
    await prisma?.$disconnect().catch(() => {});
  }
}

/**
 * We are really standing on the branch we think we are.
 *
 * Added after a real incident: a run's two commits landed on `main` instead of the case
 * branch, because `git switch -c` had run many steps earlier and something moved HEAD in
 * between. Nothing was pushed and nothing was lost, but a `git commit` that silently
 * targets the wrong branch is the cheapest possible thing to check and among the more
 * annoying to unpick — and "I created the branch earlier" is exactly the kind of
 * self-report the rest of this file exists not to trust.
 */
function checkOnBranch(expected) {
  try {
    const actual = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    return actual === expected
      ? [pass('on-branch', `HEAD is on ${expected}`)]
      : [fail('on-branch', `HEAD is on "${actual}", not "${expected}" — a commit now would land on the wrong branch`)];
  } catch (err) {
    return [fail('on-branch', `could not read HEAD: ${`${err.stderr ?? err.message}`.split('\n')[0]}`)];
  }
}

/**
 * The branch is really on origin.
 *
 * `git ls-remote` exits 0 with EMPTY output when the ref is absent, so the exit code
 * proves nothing and the output is the answer. This is the check that catches "the
 * agent said it pushed" — the doc's single highest-value guard.
 */
function checkBranch(branch) {
  try {
    const out = execFileSync('git', ['ls-remote', '--heads', 'origin', branch], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return out.trim().length
      ? [pass('branch', `${branch} is on origin (${out.trim().split(/\s+/)[0].slice(0, 8)})`)]
      : [fail('branch', `${branch} is NOT on origin — ls-remote returned nothing (it exits 0 either way)`)];
  } catch (err) {
    return [fail('branch', `git ls-remote failed: ${`${err.stderr ?? err.message}`.split('\n')[0]}`)];
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at === -1 ? fallback : argv[at + 1];
};
const has = (name) => argv.includes(`--${name}`);
const positional = argv.filter((a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--'));
const [cmd, target] = positional;

const USAGE = [
  'Usage: node scripts/authoring/verify.mjs <check> <slug>',
  '',
  '  all <slug> [--branch <name>] [--fake]   every applicable check',
  '  files <slug>            eight files, no TODOs, no copied template test',
  '  registered <slug>       in packages/problems/index.js',
  '  check <slug>            problem:check, run by us',
  '  cover <slug>            prompt + src + a real PNG (non-blocking)',
  '  voice-rendered <slug>   every clip the table names is on disk',
  '  voice-uploaded <slug>   every clip is in the bucket (one list request)',
  '  seeded <slug>           Postgres serves THIS content, not an older version',
  '  servable <anything>     EVERY published problem still has its cover + clip table on disk',
  '                          (the database does not roll back when you `git switch`)',
  '  on-branch <name>        HEAD is really on this branch — run BEFORE every commit',
  '  branch <name>           the branch is really on origin',
].join('\n');

if (!cmd || !target) {
  console.log(USAGE);
  process.exit(cmd ? 1 : 0);
}

let results = [];
switch (cmd) {
  case 'files':
    results = await checkFiles(target);
    break;
  case 'registered':
    results = await checkRegistered(target);
    break;
  case 'check':
    results = checkProblemCheck(target);
    break;
  case 'cover':
    results = await checkCover(target);
    break;
  case 'voice-rendered':
    results = checkVoiceRendered(target);
    break;
  case 'voice-uploaded':
    results = await checkVoiceUploaded(target);
    break;
  case 'seeded':
    results = await checkSeeded(target);
    break;
  case 'branch':
    results = checkBranch(target);
    break;
  case 'on-branch':
    results = checkOnBranch(target);
    break;
  case 'servable':
    results = await checkServable();
    break;
  case 'all': {
    const slug = target;
    console.log(bold(`\nverifying ${slug}\n`));
    results = [
      ...(await checkFiles(slug)),
      ...(await checkRegistered(slug)),
      ...checkProblemCheck(slug),
      ...(await checkCover(slug)),
      ...checkVoiceRendered(slug),
    ];
    // Fake mode never uploaded, seeded or pushed, so asserting it did would fail every
    // rehearsal run for the one reason that is not a defect.
    if (has('fake')) {
      console.log(dim('  (fake mode: skipping voice-uploaded, seeded and branch)'));
    } else {
      results.push(...(await checkVoiceUploaded(slug)), ...(await checkSeeded(slug)));
      // Asks about EVERY published problem, not just this one: switching branches breaks
      // whichever cases the new branch never had, which is usually not the one being worked on.
      results.push(...(await checkServable()));
      const branch = flag('branch');
      if (branch) results.push(...checkBranch(branch));
    }
    break;
  }
  default:
    console.log(USAGE);
    process.exit(1);
}

process.exit(report(results) ? 0 : 1);
