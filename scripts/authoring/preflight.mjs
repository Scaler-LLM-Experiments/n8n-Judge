// Can an authoring run actually finish on this machine?
//
//   node scripts/authoring/preflight.mjs [--fake]
//
// ---------------------------------------------------------------------------
// Why this runs before anything else
// ---------------------------------------------------------------------------
// An autonomous run spends money in the middle: cover art, then narration, then an
// upload to a shared bucket. The worst possible ordering is to discover a missing
// `gh` login or an unreachable Postgres AFTER paying for audio — the work is done, the
// bucket is written, and the run still cannot finish.
//
// So everything a run will need is checked up front, cheaply, and a missing piece is
// reported with the exact command that fixes it. Nothing here writes anything.
//
// In `--fake` mode the vendor keys and the bucket become advisory, because a rehearsal
// never calls them. Postgres, git and `gh` stay required: fake mode still exercises the
// state machine, the seed step and the branch.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

const fake = process.argv.includes('--fake');
const results = [];
const ok = (name, detail) => results.push({ name, ok: true, detail });
const bad = (name, detail, fix, { blocking = true } = {}) => results.push({ name, ok: false, blocking, detail, fix });

const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

// --- Node -------------------------------------------------------------------
// 22.6+ specifically: `db:seed` imports a .ts file directly and relies on native type
// stripping. On Node 20 it dies with ERR_UNKNOWN_FILE_EXTENSION on gradingPrompt.ts,
// which reads as a broken script rather than as a wrong runtime.
{
  const [maj, min] = process.versions.node.split('.').map(Number);
  const good = maj > 22 || (maj === 22 && min >= 6);
  good
    ? ok('node', `v${process.versions.node}`)
    : bad('node', `v${process.versions.node} cannot run db:seed (needs ≥22.6 for native type stripping)`, 'export PATH="/opt/homebrew/opt/node@22/bin:$PATH"');
}

// --- git --------------------------------------------------------------------
// A run creates a branch and commits to it, so it must start from a known point. A
// dirty tree is the blocking one: the commit step scopes itself to the authoring paths,
// but an unrelated half-finished edit under those paths would be swept into the PR.
try {
  const dirty = sh('git', ['status', '--porcelain']);
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  if (dirty) {
    const authoring = dirty
      .split('\n')
      .filter((l) => /packages\/problems|packages\/voice-scripts|apps\/web\/public\/covers/.test(l));
    authoring.length
      ? bad('git', `${authoring.length} uncommitted change(s) under the authoring paths:\n${authoring.map((l) => `        ${l}`).join('\n')}`, 'commit or stash them — the case commit would otherwise sweep them into the PR')
      : bad('git', `${dirty.split('\n').length} uncommitted change(s), none under the authoring paths`, 'safe to proceed, but commit them so the branch point is clean', { blocking: false });
  } else {
    ok('git', `clean tree on ${branch}`);
  }

  // The PR targets main, so the branch point should be main and it should be current.
  // Branching from a stale main produces a PR full of other people's commits.
  try {
    sh('git', ['fetch', 'origin', 'main', '--quiet']);
    const behind = sh('git', ['rev-list', '--count', 'HEAD..origin/main']);
    Number(behind) === 0
      ? ok('git base', 'HEAD is level with origin/main')
      : bad('git base', `HEAD is ${behind} commit(s) behind origin/main`, 'git pull --ff-only origin main', { blocking: false });
  } catch (err) {
    bad('git base', `could not reach origin: ${`${err.message}`.split('\n')[0]}`, 'check network / credentials', { blocking: false });
  }
} catch (err) {
  bad('git', `not a git repository or git is unavailable: ${err.message.split('\n')[0]}`, 'run from the repo root');
}

// --- gh ---------------------------------------------------------------------
// The PR is opened by us, never by an agent, so the credential lives here.
try {
  sh('gh', ['auth', 'status']);
  const who = sh('gh', ['api', 'user', '--jq', '.login']);
  ok('gh', `authenticated as ${who}`);
} catch {
  bad('gh', 'not authenticated — the run cannot open its draft PR', 'gh auth login');
}

// --- Postgres ---------------------------------------------------------------
// Both that it is reachable and that the rubric is seeded. A missing RubricVersion is
// the classic silent one: the Result screen still shows a score, but the report cannot
// be persisted, so admin analytics has nothing to average and nothing complains.
{
  let prisma;
  try {
    ({ prisma } = await import('@judge/db'));
    const problems = await prisma.problem.count();
    const rubric = await prisma.rubricVersion.count();
    ok('postgres', `reachable, ${problems} problem(s) registered`);
    rubric
      ? ok('rubric', `${rubric} RubricVersion row(s)`)
      : bad('rubric', 'no RubricVersion — a score cannot be persisted, so admin analytics stays empty', 'DATABASE_URL="…" npm run db:seed:rubric');
  } catch (err) {
    const detail = `${err.message}`.split('\n')[0];
    bad(
      'postgres',
      `unreachable: ${detail}`,
      /denied access/i.test(detail)
        ? 'P1010 usually means the port belongs to ANOTHER database — this repo expects 5442, not 5432. Check POSTGRES_PORT and DATABASE_URL agree, then: npm run db:up'
        : 'npm run db:up && npm run db:migrate'
    );
  } finally {
    await prisma?.$disconnect().catch(() => {});
  }
}

// --- vendor keys and the bucket ---------------------------------------------
// Advisory in fake mode; a real run needs all of them, and the doc's rule is that an
// unconfigured media stage SKIPS rather than fails — so a missing key is reported here
// as "this stage will be skipped", not as a mystery later.
{
  const need = [
    { key: 'OPENAI_API_KEY', what: 'cover art (covers:generate)', blocking: false },
    { key: 'ELEVENLABS_API_KEY', what: 'narration render (voice:generate)', blocking: true },
    { key: 'ELEVENLABS_VOICE_ID', what: 'narration render — the voice is part of every clip fingerprint', blocking: true },
    { key: 'AUDIO_S3_BUCKET', what: 'narration upload (voice:sync)', blocking: true },
    { key: 'AUDIO_S3_ACCESS_KEY_ID', what: 'narration upload', blocking: true },
    { key: 'AUDIO_S3_SECRET_ACCESS_KEY', what: 'narration upload', blocking: true },
  ];
  for (const { key, what, blocking } of need) {
    const value = process.env[key];
    if (value && value.trim()) ok(key.toLowerCase().replace(/_/g, '-'), `set ${dim(`(${what})`)}`);
    else if (fake) bad(key.toLowerCase().replace(/_/g, '-'), `not set — ${what}`, 'not needed in fake mode', { blocking: false });
    else bad(key.toLowerCase().replace(/_/g, '-'), `not set — ${what} cannot run`, `add ${key} to .env`, { blocking });
  }
  // A trailing newline in a value is invisible in most dashboards and presents as
  // "the key is set but the process cannot see it". Cheap to catch here.
  for (const { key } of need) {
    const raw = process.env[key];
    if (raw && raw !== raw.trim()) bad(`${key.toLowerCase()}-clean`, `${key} has leading/trailing whitespace — most SDKs will reject it`, 'retype the value with no trailing newline');
  }
}

// --- smoke ------------------------------------------------------------------
// Smoke is the real gate (there are no component tests), and it needs two things a
// test run does not: system Chrome, and a dev server that is already warm.
{
  const chrome = process.env.SMOKE_CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  fs.existsSync(chrome)
    ? ok('chrome', dim(chrome))
    : bad('chrome', `not found at ${chrome}`, 'install Chrome or set SMOKE_CHROME to its binary');

  try {
    const res = await fetch('http://localhost:3000/api/health', { signal: AbortSignal.timeout(4000) });
    const body = await res.json().catch(() => ({}));
    res.ok
      ? ok('dev server', `up on :3000 ${dim(JSON.stringify(body))}`)
      : bad('dev server', `:3000 answered ${res.status}`, 'check the dev server logs', { blocking: false });
  } catch {
    bad(
      'dev server',
      'not running on :3000 — smoke cannot run, and its resume check flakes against a COLD server',
      'npm run dev, then load http://localhost:3000 once to warm it',
      { blocking: false }
    );
  }
}

// --- report -----------------------------------------------------------------
console.log(bold(`\nauthoring preflight${fake ? ' (fake mode)' : ''}\n`));
for (const r of results) {
  const mark = r.ok ? green('✓') : r.blocking === false ? yellow('!') : red('✗');
  console.log(`  ${mark} ${r.name.padEnd(22)} ${r.detail}`);
  if (!r.ok && r.fix) console.log(`      ${dim(`→ ${r.fix}`)}`);
}

const blocked = results.filter((r) => !r.ok && r.blocking !== false);
const advisory = results.filter((r) => !r.ok && r.blocking === false);
console.log('');
if (blocked.length) {
  console.log(red(`${blocked.length} blocking: ${blocked.map((r) => r.name).join(', ')}`));
  console.log(dim('A run started now would fail — possibly after spending money. Fix these first.'));
} else if (advisory.length) {
  console.log(yellow(`ready, with ${advisory.length} warning(s): ${advisory.map((r) => r.name).join(', ')}`));
} else {
  console.log(green('ready'));
}
process.exit(blocked.length ? 1 : 0);
