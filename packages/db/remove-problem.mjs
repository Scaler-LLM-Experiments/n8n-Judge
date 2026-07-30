// Permanently delete problems and everything hanging off them.
//
//   DATABASE_URL="postgresql://…" node packages/db/remove-problem.mjs lead-triage …
//   … --dry-run     count what would go, delete nothing
//   … --yes         skip the confirmation prompt (for scripts)
//
// This is the destructive counterpart to seeding, and it exists because the schema
// declares no `onDelete` behaviour: every relation to Problem defaults to Restrict,
// so a plain `problem.delete()` fails while any session still points at it. Deleting
// in the wrong order therefore does not corrupt anything — it just errors — but
// getting the order right is the whole job, so it lives here rather than being
// retyped as ad-hoc SQL each time.
//
// Deletion order is the reverse of the dependency order:
//
//   GradingReport ─┐
//   TraceEvent   ──┼─→ Session ─→ ProblemVersion ─→ Problem
//   Rating       ──┘                    ▲
//                     ProblemAssignment ┘
//
// Reads DATABASE_URL from the environment ONLY, deliberately — the same reasoning as
// seed-rubric.mjs. A script that can delete a cohort's history must never be able to
// pick up a connection string by accident.
import { PrismaClient } from '@prisma/client';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const assumeYes = args.includes('--yes');
const slugs = args.filter((a) => !a.startsWith('--'));

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Pass it explicitly:\n  DATABASE_URL="postgresql://…" node packages/db/remove-problem.mjs <slug…>');
  process.exit(1);
}
if (!slugs.length) {
  console.error('Name at least one problem slug to remove.');
  process.exit(1);
}

const prisma = new PrismaClient();

const problems = await prisma.problem.findMany({
  where: { slug: { in: slugs } },
  select: { id: true, slug: true, title: true },
});

const missing = slugs.filter((s) => !problems.some((p) => p.slug === s));
if (missing.length) console.warn(`! not in this database, skipping: ${missing.join(', ')}`);
if (!problems.length) {
  console.log('Nothing to do.');
  await prisma.$disconnect();
  process.exit(0);
}

const problemIds = problems.map((p) => p.id);
const sessions = await prisma.session.findMany({
  where: { problemId: { in: problemIds } },
  select: { id: true },
});
const sessionIds = sessions.map((s) => s.id);

// Counted before anything is deleted, so the summary describes what WILL go rather
// than what already went.
const counts = {
  problems: problems.length,
  versions: await prisma.problemVersion.count({ where: { problemId: { in: problemIds } } }),
  assignments: await prisma.problemAssignment.count({ where: { problemId: { in: problemIds } } }),
  sessions: sessionIds.length,
  events: sessionIds.length ? await prisma.traceEvent.count({ where: { sessionId: { in: sessionIds } } }) : 0,
  reports: sessionIds.length ? await prisma.gradingReport.count({ where: { sessionId: { in: sessionIds } } }) : 0,
};

console.log(`\nAbout to permanently delete from ${new URL(process.env.DATABASE_URL.replace(/^postgres/, 'http')).host}:`);
for (const p of problems) console.log(`  ${p.slug.padEnd(16)} ${p.title}`);
console.log('');
for (const [what, n] of Object.entries(counts)) console.log(`  ${String(n).padStart(6)}  ${what}`);
console.log('\nThis includes learner history: trace events are what grading replays, so');
console.log('deleting them removes those attempts from admin analytics for good.\n');

if (dryRun) {
  console.log('Dry run: nothing deleted.');
  await prisma.$disconnect();
  process.exit(0);
}

if (!assumeYes) {
  const { createInterface } = await import('node:readline/promises');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('Type the number of sessions to confirm: ');
  rl.close();
  if (answer.trim() !== String(counts.sessions)) {
    console.error('Did not match. Nothing deleted.');
    await prisma.$disconnect();
    process.exit(1);
  }
}

// One transaction: a half-removed problem is a problem whose versions are gone while
// the catalogue still lists it, which is worse than either outcome on its own.
await prisma.$transaction(async (tx) => {
  if (sessionIds.length) {
    await tx.gradingReport.deleteMany({ where: { sessionId: { in: sessionIds } } });
    await tx.traceEvent.deleteMany({ where: { sessionId: { in: sessionIds } } });
    await tx.rating.deleteMany({ where: { sessionId: { in: sessionIds } } });
    await tx.session.deleteMany({ where: { id: { in: sessionIds } } });
  }
  await tx.problemAssignment.deleteMany({ where: { problemId: { in: problemIds } } });
  // Break the pointer before deleting the rows it points at.
  await tx.problem.updateMany({ where: { id: { in: problemIds } }, data: { currentPublishedVersionId: null } });
  await tx.problemVersion.deleteMany({ where: { problemId: { in: problemIds } } });
  await tx.problem.deleteMany({ where: { id: { in: problemIds } } });
});

console.log('Removed. Remaining problems:');
for (const p of await prisma.problem.findMany({ select: { slug: true }, orderBy: { createdAt: 'asc' } })) {
  console.log(`  ${p.slug}`);
}
await prisma.$disconnect();
