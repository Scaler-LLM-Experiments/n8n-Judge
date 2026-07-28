// Demo learners with realistic session histories, so the admin dashboard has
// something to show before real cohorts exist.
//
//   npm run db:seed:demo            (default 60 learners)
//   DEMO_LEARNERS=200 npm run db:seed:demo
//   npm run db:seed:demo -- --clear (remove them again)
//
// REFUSES to run against a non-local database unless ALLOW_REMOTE=1. Fake
// learners in the production database would corrupt exactly the numbers the
// dashboard exists to report, and that is not a mistake anyone would notice
// quickly.
//
// The scores are NOT invented. Each learner gets a generated trace, and that
// trace is replayed through the same engine the live report uses, so every number
// on the dashboard is internally consistent with the rubric — and generating a
// few hundred sessions doubles as a workout for the scoring code.
import { PrismaClient } from '@prisma/client';
import { problemList } from '@judge/problems';
import { attemptsFromTrace, scoreSession, enumerateItems } from '@judge/engine';

const prisma = new PrismaClient();
const COUNT = Number(process.env.DEMO_LEARNERS ?? 60);
const CLEAR = process.argv.includes('--clear');
const DEMO_DOMAIN = 'demo.judge.local'; // the marker that makes cleanup exact

const url = process.env.DATABASE_URL ?? '';
const host = (() => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
})();
const isLocal = host === 'localhost' || host === '127.0.0.1' || host === 'postgres' || host.endsWith('.local');
if (!isLocal && process.env.ALLOW_REMOTE !== '1') {
  console.error(`Refusing to write demo data to a non-local database (${host || 'unknown host'}).`);
  console.error('Set ALLOW_REMOTE=1 if you really mean it.');
  process.exit(1);
}
console.log(`target: ${host || '(unparseable)'}\n`);

// ---------------------------------------------------------------------------
// Deterministic randomness: same command, same dashboard. Reviewing a design
// against numbers that move every run is miserable.
// ---------------------------------------------------------------------------
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, list) => list[Math.floor(r() * list.length)];

// How far a learner got, and how well. Weighted to look like a real cohort:
// most finish, a meaningful minority give up partway, a few are excellent.
const ARCHETYPES = [
  { key: 'strong', weight: 18, reach: 'report', attemptSpread: [1, 1, 1, 2] },
  { key: 'solid', weight: 30, reach: 'report', attemptSpread: [1, 1, 2, 2] },
  { key: 'developing', weight: 24, reach: 'report', attemptSpread: [1, 2, 2, 3] },
  { key: 'struggling', weight: 10, reach: 'report', attemptSpread: [2, 2, 3, 3] },
  { key: 'quit_build', weight: 12, reach: 'dashboard', attemptSpread: [1, 2, 2, 3] },
  // Someone who builds a working flow and then abandons the edge-case questions
  // is a real and distinct pattern — and without it the funnel's last two steps
  // are identical, which makes the chart useless for spotting where people go.
  { key: 'quit_stress', weight: 8, reach: 'eval', attemptSpread: [1, 2, 2, 3] },
  { key: 'quit_early', weight: 6, reach: 'statement', attemptSpread: [1, 2, 3, 3] },
];
const ARCHETYPE_BAG = ARCHETYPES.flatMap((a) => Array(a.weight).fill(a));

const SCREENS = ['statement', 'dashboard', 'eval', 'report'];

/**
 * Build one session's worth of trace events.
 *
 * Only the items a learner actually reached are answered — someone who quit
 * during Build has no stress-testing rows, which is what makes the funnel and
 * the "unfinished" count mean anything.
 */
function buildTrace(problem, archetype, r, startedAt) {
  const items = enumerateItems(problem);
  const events = [];
  let seq = 0;
  let clientSeq = 0;
  let t = startedAt.getTime();
  const step = (ms) => {
    t += ms;
    return new Date(t);
  };

  const reachedIndex = SCREENS.indexOf(archetype.reach);
  const attemptFor = () => pick(r, archetype.attemptSpread);

  const decision = (kind, id, attempt, correct) => {
    events.push({
      seq: seq++,
      clientSeq: null, // server-recorded, like the real check endpoint
      type: 'decision',
      clientTs: step(4000 + Math.floor(r() * 20000)),
      payload: { key: `${kind}:${id}`, kind, id, correct, attempt, firstTry: attempt === 1 },
    });
  };

  const clientEvent = (type, payload, gap = 3000) => {
    events.push({
      seq: seq++,
      clientSeq: clientSeq++,
      type,
      clientTs: step(gap + Math.floor(r() * 8000)),
      payload,
    });
  };

  // --- Understand
  for (const item of items.understand) {
    const attempt = attemptFor();
    // Every wrong try before the right one is its own row, like the real thing.
    for (let a = 1; a < attempt; a++) decision('dissection', item.id.replace('dissection:', ''), a, false);
    decision('dissection', item.id.replace('dissection:', ''), attempt, true);
  }
  if (reachedIndex < 1) return events;
  clientEvent('screen_transition', { from: 'statement', to: 'dashboard' });

  // --- Build: place the nodes, then configure them
  const placed = reachedIndex >= 1 ? items.placement : [];
  const stopAt = archetype.reach === 'dashboard' ? Math.ceil(placed.length * (0.3 + r() * 0.5)) : placed.length;
  for (const item of placed.slice(0, stopAt)) {
    const type = item.id.replace('nodePick:', '');
    const attempt = attemptFor();
    for (let a = 1; a < attempt; a++) {
      decision('placement', type, a, false);
      clientEvent('probe_shown', { nodeType: type }, 1500);
    }
    decision('placement', type, attempt, true);
    clientEvent('graph_mutation', { op: 'add_node', nodeType: type, graph: { nodes: [], edges: [] } }, 1200);
    clientEvent('ndv_open', { nodeType: type }, 900);
  }

  if (archetype.reach !== 'dashboard') {
    for (const item of items.config) {
      const attempt = attemptFor();
      const [nodeType, rest] = item.id.split(':');
      const kind = rest.startsWith('settings.') ? 'setting' : 'field';
      const id = rest.startsWith('settings.') ? `${nodeType}:${rest.replace('settings.', '')}` : item.id;
      for (let a = 1; a < attempt; a++) decision(kind, id, a, false);
      decision(kind, id, attempt, true);
    }
    clientEvent('run_result', { graph: { nodes: [], edges: [] }, validation: { allPassed: true } }, 15000);
  }

  if (reachedIndex < 2) return events;
  clientEvent('screen_transition', { from: 'dashboard', to: 'eval' });

  // --- Stress testing
  for (const item of items.stress) {
    const attempt = attemptFor();
    const id = item.id.replace('stress:', '');
    for (let a = 1; a < attempt; a++) decision('stress', id, a, false);
    decision('stress', id, attempt, true);
  }

  if (reachedIndex < 3) return events;
  clientEvent('screen_transition', { from: 'eval', to: 'report' });
  clientEvent('session_complete', {}, 1000);
  return events;
}

async function clearDemo() {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: `@${DEMO_DOMAIN}` } },
    select: { id: true },
  });
  if (!users.length) {
    console.log('no demo learners to remove.');
    return;
  }
  const ids = users.map((u) => u.id);
  const sessions = await prisma.session.findMany({ where: { userId: { in: ids } }, select: { id: true } });
  const sIds = sessions.map((s) => s.id);

  await prisma.gradingReport.deleteMany({ where: { sessionId: { in: sIds } } });
  await prisma.traceEvent.deleteMany({ where: { sessionId: { in: sIds } } });
  await prisma.session.deleteMany({ where: { id: { in: sIds } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`removed ${users.length} demo learners and ${sIds.length} attempts.`);
}

async function main() {
  if (CLEAR) return clearDemo();

  const batches = await prisma.batch.findMany({ include: { program: true } });
  if (!batches.length) {
    console.error('No batches found. Run `npm run db:seed` first.');
    process.exit(1);
  }

  const published = await prisma.problem.findMany({
    include: { versions: { where: { status: 'PUBLISHED' }, orderBy: { version: 'desc' }, take: 1 } },
  });
  const problems = published
    .filter((p) => p.versions[0])
    .map((p) => ({ row: p, version: p.versions[0], data: p.versions[0].data }));
  if (!problems.length) {
    console.error('No published problems. Run `npm run db:seed` first.');
    process.exit(1);
  }

  const rubric = await prisma.rubricVersion.findFirst({ orderBy: { version: 'desc' }, select: { id: true } });
  if (!rubric) {
    console.error('No rubric. Run `npm run db:seed:rubric` first.');
    process.exit(1);
  }

  // Same hash for every demo account, and not a usable password — these exist to
  // be counted, not signed into.
  const passwordHash = '$2a$10$demodemodemodemodemodemodemodemodemodemodemodemodemodemo';

  const now = Date.now();
  let learners = 0;
  let attempts = 0;
  let events = 0;
  const bands = { strong: 0, solid: 0, developing: 0, 'needs-another-pass': 0 };

  for (let i = 0; i < COUNT; i++) {
    const r = rng(0x5eed + i * 7919);
    const batch = batches[i % batches.length];
    const email = `learner${String(i + 1).padStart(3, '0')}@${DEMO_DOMAIN}`;

    const user = await prisma.user.upsert({
      where: { email },
      update: { batchId: batch.id },
      create: { email, passwordHash, role: 'LEARNER', batchId: batch.id },
    });
    learners++;

    // 1–3 attempts each, spread across the last 30 days; a third of activity in
    // the last week so "active recently" is not zero.
    const attemptCount = 1 + Math.floor(r() * 3);
    for (let a = 0; a < attemptCount; a++) {
      const problem = pick(r, problems);
      const archetype = pick(r, ARCHETYPE_BAG);
      const daysAgo = r() < 0.34 ? Math.floor(r() * 7) : 7 + Math.floor(r() * 23);
      const startedAt = new Date(now - daysAgo * 86400000 - Math.floor(r() * 8 * 3600000));

      const trace = buildTrace(problem.data, archetype, r, startedAt);
      const finished = archetype.reach === 'report';
      const lastTs = trace.length ? trace[trace.length - 1].clientTs : startedAt;

      const session = await prisma.session.create({
        data: {
          userId: user.id,
          problemId: problem.row.id,
          problemVersionId: problem.version.id,
          status: finished ? 'COMPLETED' : 'IN_PROGRESS',
          currentScreen: archetype.reach.toUpperCase(),
          startedAt,
          completedAt: finished ? lastTs : null,
        },
      });
      attempts++;

      await prisma.traceEvent.createMany({
        data: trace.map((e) => ({
          sessionId: session.id,
          seq: e.seq + 1,
          clientSeq: e.clientSeq,
          type: e.type,
          payload: e.payload,
          clientTs: e.clientTs,
          receivedAt: e.clientTs,
        })),
      });
      events += trace.length;

      // The score comes from replaying the trace through the real engine, so the
      // dashboard cannot disagree with the rubric.
      if (finished) {
        const scored = scoreSession(
          problem.data,
          attemptsFromTrace(trace.map((e) => ({ type: e.type, payload: e.payload })))
        );
        const band =
          scored.total >= 85 ? 'strong' : scored.total >= 70 ? 'solid' : scored.total >= 50 ? 'developing' : 'needs-another-pass';
        bands[band]++;
        await prisma.gradingReport.create({
          data: {
            sessionId: session.id,
            rubricVersionId: rubric.id,
            status: 'QUEUED',
            understandingScore: scored.total,
            createdAt: lastTs,
          },
        });
      }
    }
  }

  console.log(`learners: ${learners}`);
  console.log(`attempts: ${attempts}`);
  console.log(`events:   ${events}`);
  console.log(`bands:    ${Object.entries(bands).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
  console.log(`\nremove with: npm run db:seed:demo -- --clear`);
}

await main();
await prisma.$disconnect();
