// The state of one authoring run, on disk.
//
//   node scripts/authoring/run-state.mjs init --slug <slug> --name "Title" --spec <path> [--fake]
//   node scripts/authoring/run-state.mjs active
//   node scripts/authoring/run-state.mjs show [--run <id>]
//   node scripts/authoring/run-state.mjs stage <stage> <status> [--attempt] [--result <json|@file>]
//                                                               [--log @<file>] [--note "…"]
//   node scripts/authoring/run-state.mjs set [--status …] [--stage …] [--branch …]
//                                            [--pr <url>] [--revision] [--error "…"]
//
// ---------------------------------------------------------------------------
// Why a file, and why written BEFORE each stage runs
// ---------------------------------------------------------------------------
// A run spends real money: ElevenLabs renders narration, OpenAI draws the cover, and
// clips go to a shared S3 bucket. If a run dies half way and we cannot tell what
// already happened, the only safe move is to redo all of it — which pays twice for
// audio that is already uploaded. So every stage records its outcome here the moment
// it is known, and the orchestrator reads this file rather than trusting its own
// memory of the conversation.
//
// The shape deliberately mirrors the two Postgres tables this becomes in production
// (`case_pipeline` and `case_pipeline_stages`): the same fields, the same statuses,
// `sessionId` per stage where a cloud agent would record its CMA session. Porting is
// then a matter of swapping the reader and writer, not of redesigning the state.
//
// Writes are atomic (temp file then rename). A run interrupted mid-write must never
// leave truncated JSON behind, because the next thing to read it decides whether to
// spend money.
import fs from 'node:fs';
import path from 'node:path';

const DIR = process.env.AUTHORING_RUN_DIR || '.authoring-runs';

/**
 * The five stages, in order, with the two properties the orchestrator branches on.
 *
 * `blocking:false` is how "cover art must never dead-end a good case" is expressed as
 * data rather than as a special case in the runbook — the art stage can fail and the
 * chain still reaches a PR, carrying an unchecked checklist item instead.
 *
 * `host` marks a stage that CANNOT run in a cloud sandbox and must run on a machine
 * with the real toolchain: `db:seed` needs Postgres, `smoke` needs Chrome and a warm
 * dev server, and the media stages need the vendor keys that must never be mounted
 * into a sandbox.
 */
export const STAGES = {
  author_case: { blocking: true, host: false, label: 'write the eight files' },
  case_review: { blocking: true, host: false, label: 'independent blind-solve review' },
  case_art: { blocking: false, host: true, label: 'cover art' },
  case_audio: { blocking: true, host: true, label: 'narration: author, render, upload' },
  case_finalize: { blocking: true, host: true, label: 'authoritative gate + draft PR' },
};

const STAGE_STATUS = ['pending', 'running', 'passed', 'failed', 'skipped', 'blocked'];
const RUN_STATUS = ['queued', 'running', 'blocked', 'awaiting_review', 'failed', 'merged'];

// ---------------------------------------------------------------------------
// Reading and writing
// ---------------------------------------------------------------------------

const runFile = (runId) => path.join(DIR, `${runId}.json`);

function write(run) {
  fs.mkdirSync(DIR, { recursive: true });
  run.updatedAt = new Date().toISOString();
  const target = runFile(run.runId);
  const tmp = `${target}.part`;
  fs.writeFileSync(tmp, `${JSON.stringify(run, null, 2)}\n`);
  fs.renameSync(tmp, target);
  return run;
}

export function read(runId) {
  const file = runFile(runId);
  if (!fs.existsSync(file)) throw new Error(`no run "${runId}" — ${file} does not exist`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Every run on disk, newest first. */
export function list() {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/**
 * The one run currently holding the slot, or null.
 *
 * Only `queued` and `running` hold it. A run parked at `awaiting_review` (its PR is
 * open, waiting on a human) or `blocked` must not stop a new case being authored —
 * that would make one unmerged PR block the whole pipeline.
 */
export function active() {
  return list().find((r) => r.status === 'queued' || r.status === 'running') ?? null;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function init({ slug, name, spec, fake = false, branch }) {
  if (!/^[a-z][a-z0-9-]*$/.test(slug ?? '')) {
    throw new Error(`slug "${slug}" must match /^[a-z][a-z0-9-]*$/ — it becomes a folder, a path and a URL`);
  }
  const existing = active();
  if (existing) {
    throw new Error(
      `run ${existing.runId} is still ${existing.status} (stage: ${existing.currentStage}). ` +
        `One authoring run at a time — finish or abandon it first ` +
        `(node scripts/authoring/run-state.mjs set --run ${existing.runId} --status failed).`
    );
  }
  // Timestamped rather than random so runs sort chronologically by name, and so a
  // second run for the same slug (after a first was abandoned) cannot collide.
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
  const run = {
    runId: `${slug}-${stamp}`,
    slug,
    caseName: name ?? slug,
    specPath: spec ?? null,
    status: 'queued',
    currentStage: 'author_case',
    branch: branch ?? `auto/case-${slug}`,
    prUrl: null,
    revisionCycles: 0,
    fake: Boolean(fake),
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    stages: Object.fromEntries(
      Object.keys(STAGES).map((s) => [
        s,
        { status: 'pending', attempts: 0, startedAt: null, endedAt: null, sessionId: null, result: null, logTail: null, notes: [] },
      ])
    ),
  };
  return write(run);
}

export function setStage(runId, stage, status, { attempt = false, result, logTail, note, sessionId } = {}) {
  if (!STAGES[stage]) throw new Error(`unknown stage "${stage}" — one of ${Object.keys(STAGES).join(', ')}`);
  if (!STAGE_STATUS.includes(status)) throw new Error(`unknown stage status "${status}" — one of ${STAGE_STATUS.join(', ')}`);
  const run = read(runId);
  const s = run.stages[stage];

  if (status === 'running') {
    s.startedAt = new Date().toISOString();
    s.endedAt = null;
    run.currentStage = stage;
    if (run.status === 'queued') run.status = 'running';
  }
  if (['passed', 'failed', 'skipped', 'blocked'].includes(status)) s.endedAt = new Date().toISOString();

  s.status = status;
  if (attempt) s.attempts += 1;
  if (result !== undefined) s.result = result;
  // Bounded: this is a debugging aid, not a log store, and an unbounded tail turns
  // the state file into something too big to read at a glance.
  if (logTail !== undefined) s.logTail = typeof logTail === 'string' ? logTail.slice(-8000) : logTail;
  if (sessionId !== undefined) s.sessionId = sessionId;
  if (note) s.notes.push({ at: new Date().toISOString(), note });

  return write(run);
}

export function setRun(runId, patch) {
  const run = read(runId);
  if (patch.status !== undefined) {
    if (!RUN_STATUS.includes(patch.status)) throw new Error(`unknown run status "${patch.status}" — one of ${RUN_STATUS.join(', ')}`);
    run.status = patch.status;
  }
  if (patch.currentStage !== undefined) run.currentStage = patch.currentStage;
  if (patch.branch !== undefined) run.branch = patch.branch;
  if (patch.prUrl !== undefined) run.prUrl = patch.prUrl;
  if (patch.error !== undefined) run.error = patch.error;
  // A counter, incremented rather than set, because the caller that discovers a
  // content failure should not have to know how many cycles came before it.
  if (patch.revision) run.revisionCycles += 1;
  return write(run);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function render(run) {
  const pad = (s, n) => String(s).padEnd(n);
  const lines = [
    `run        ${run.runId}`,
    `case       ${run.caseName} (${run.slug})`,
    `status     ${run.status}${run.fake ? '  [FAKE MODE — no spend, no upload, no PR]' : ''}`,
    `stage      ${run.currentStage}`,
    `branch     ${run.branch}`,
    `pr         ${run.prUrl ?? '—'}`,
    `revisions  ${run.revisionCycles}`,
    run.specPath ? `spec       ${run.specPath}` : null,
    run.error ? `error      ${run.error}` : null,
    '',
  ].filter(Boolean);
  for (const [name, s] of Object.entries(run.stages)) {
    const mark = { passed: '✓', failed: '✗', blocked: '⨯', running: '…', skipped: '–', pending: ' ' }[s.status];
    const meta = [
      s.attempts ? `${s.attempts} attempt(s)` : null,
      STAGES[name].blocking ? null : 'non-blocking',
      STAGES[name].host ? 'host-only' : null,
    ].filter(Boolean);
    lines.push(`  ${mark} ${pad(name, 14)} ${pad(s.status, 9)} ${meta.join(', ')}`);
    for (const n of s.notes ?? []) lines.push(`      · ${n.note}`);
  }
  return lines.join('\n');
}

/** `--result @path` reads a file; anything else is parsed as inline JSON. */
function jsonArg(value) {
  if (value === undefined) return undefined;
  const text = value.startsWith('@') ? fs.readFileSync(value.slice(1), 'utf8') : value;
  try {
    return JSON.parse(text);
  } catch {
    return text; // a plain string is a legitimate result; do not lose it to a parse error
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const flag = (name, fallback) => {
    const at = argv.indexOf(`--${name}`);
    return at === -1 ? fallback : argv[at + 1];
  };
  const has = (name) => argv.includes(`--${name}`);
  const positional = argv.filter((a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--'));
  const [cmd, ...rest] = positional;

  // Most commands act on "the run in progress", because that is what the orchestrator
  // means every time and threading the id through every call is how ids get typo'd.
  const resolveRun = () => {
    const explicit = flag('run');
    if (explicit) return explicit;
    const a = active();
    if (a) return a.runId;
    const newest = list()[0];
    if (newest) return newest.runId;
    throw new Error('no runs on disk — start one with `run-state.mjs init --slug … --name … --spec …`');
  };

  try {
    if (cmd === 'init') {
      const run = init({ slug: flag('slug'), name: flag('name'), spec: flag('spec'), fake: has('fake'), branch: flag('branch') });
      console.log(render(run));
      console.log(`\nstate  ${runFile(run.runId)}`);
    } else if (cmd === 'active') {
      const a = active();
      if (!a) {
        console.log('no active run');
        process.exit(1);
      }
      console.log(a.runId);
    } else if (cmd === 'show') {
      console.log(render(read(resolveRun())));
    } else if (cmd === 'list') {
      for (const r of list()) console.log(`${r.runId}  ${r.status.padEnd(16)} ${r.currentStage}`);
    } else if (cmd === 'stage') {
      const [stage, status] = rest;
      const run = setStage(resolveRun(), stage, status, {
        attempt: has('attempt'),
        result: jsonArg(flag('result')),
        logTail: flag('log') ? jsonArg(flag('log')) : undefined,
        note: flag('note'),
        sessionId: flag('session'),
      });
      console.log(render(run));
    } else if (cmd === 'set') {
      const run = setRun(resolveRun(), {
        status: flag('status'),
        currentStage: flag('stage'),
        branch: flag('branch'),
        prUrl: flag('pr'),
        error: flag('error'),
        revision: has('revision'),
      });
      console.log(render(run));
    } else {
      console.log(
        [
          'Usage:',
          '  run-state.mjs init --slug <slug> --name "Title" --spec <path> [--fake]',
          '  run-state.mjs active | list | show [--run <id>]',
          '  run-state.mjs stage <stage> <status> [--attempt] [--result <json|@file>] [--log @<file>] [--note "…"] [--session <id>]',
          '  run-state.mjs set [--status …] [--stage …] [--branch …] [--pr <url>] [--revision] [--error "…"]',
          '',
          `Stages:   ${Object.keys(STAGES).join(', ')}`,
          `Stage:    ${STAGE_STATUS.join(', ')}`,
          `Run:      ${RUN_STATUS.join(', ')}`,
        ].join('\n')
      );
      process.exit(cmd ? 1 : 0);
    }
  } catch (err) {
    console.error(`✗ ${err.message}`);
    process.exit(1);
  }
}
