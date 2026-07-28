// Seed: programs, a demo batch with an invite code, and the shipped problems
// published as v1. Idempotent — safe to re-run against any environment.
//
//   npm run db:seed                    (uses DATABASE_URL from .env)
//   DATABASE_URL=<url> npm run db:seed (any other environment)
import { PrismaClient } from '@prisma/client';
import { problemList } from '@judge/problems';
import { DEFAULT_RUBRIC_SYSTEM_PROMPT } from '@judge/llm/gradingPrompt.ts';
import { publishProblem } from './publishProblem.mjs';

const prisma = new PrismaClient();

const PROGRAMS = [
  { key: 'SE', name: 'Software Engineering' },
  { key: 'AIML', name: 'AI / Machine Learning' },
  { key: 'DSML', name: 'Data Science & Machine Learning' },
];

// One batch per program so signup has a working invite code out of the box.
const BATCHES = [
  { programKey: 'AIML', name: 'AI/ML — Demo Batch', inviteCode: 'AIML-DEMO' },
  { programKey: 'DSML', name: 'DSML — Demo Batch', inviteCode: 'DSML-DEMO' },
  { programKey: 'SE', name: 'SE — Demo Batch', inviteCode: 'SE-DEMO' },
];

async function seedPrograms() {
  const out = {};
  for (const p of PROGRAMS) {
    out[p.key] = await prisma.program.upsert({
      where: { key: p.key },
      update: { name: p.name },
      create: { key: p.key, name: p.name },
    });
  }
  console.log(`programs: ${Object.keys(out).length}`);
  return out;
}

async function seedBatches(programs) {
  for (const b of BATCHES) {
    await prisma.batch.upsert({
      where: { inviteCode: b.inviteCode },
      update: { name: b.name, programId: programs[b.programKey].id },
      create: { name: b.name, inviteCode: b.inviteCode, programId: programs[b.programKey].id },
    });
  }
  console.log(`batches:  ${BATCHES.length} (invite codes: ${BATCHES.map((b) => b.inviteCode).join(', ')})`);
}

/**
 * Publish each in-repo problem, APPENDING a version when the content changed.
 * The rule and the reasoning live in publishProblem.mjs — the short version is
 * that a ProblemVersion is immutable, because Sessions pin one and the server
 * caches them without invalidation.
 */
async function seedProblems() {
  for (const p of problemList) {
    const r = await publishProblem(prisma, p);
    console.log(
      r.changed
        ? `problem:  ${p.id} @ v${r.version} (PUBLISHED${r.archived ? `, v${r.archived} archived` : ''})`
        : `problem:  ${p.id} @ v${r.version} (unchanged)`
    );
  }
}

// Every seeded problem is offered to every program until an admin narrows it.
async function seedAssignments(programs) {
  const problems = await prisma.problem.findMany();
  let n = 0;
  for (const problem of problems) {
    for (const program of Object.values(programs)) {
      const already = await prisma.problemAssignment.findFirst({
        where: { problemId: problem.id, programId: program.id },
      });
      if (already) continue;
      await prisma.problemAssignment.create({
        data: { problemId: problem.id, programId: program.id },
      });
      n++;
    }
  }
  console.log(`assignments: +${n}`);
}

// The grading rubric the worker reads. Global (problemId null) until an admin
// writes a problem-specific one.
//
// Versioned rather than updated in place: a GradingReport points at the exact
// RubricVersion that produced it, so an edit must never rewrite the basis of
// reports already issued. Re-running this seed after editing the prompt text
// therefore appends v2 rather than mutating v1.
async function seedRubric() {
  const label = 'Default rubric';
  let rubric = await prisma.rubric.findFirst({ where: { label, problemId: null } });
  if (!rubric) rubric = await prisma.rubric.create({ data: { label } });

  const latest = await prisma.rubricVersion.findFirst({
    where: { rubricId: rubric.id },
    orderBy: { version: 'desc' },
  });

  if (latest?.systemPrompt === DEFAULT_RUBRIC_SYSTEM_PROMPT) {
    console.log(`rubric:   "${label}" @ v${latest.version} (unchanged)`);
    return;
  }

  const version = await prisma.rubricVersion.create({
    data: {
      rubricId: rubric.id,
      version: (latest?.version ?? 0) + 1,
      systemPrompt: DEFAULT_RUBRIC_SYSTEM_PROMPT,
    },
  });
  console.log(`rubric:   "${label}" @ v${version.version} (${latest ? 'updated' : 'created'})`);
}

const programs = await seedPrograms();
await seedBatches(programs);
await seedProblems();
await seedAssignments(programs);
await seedRubric();
await prisma.$disconnect();
console.log('\nseed complete.');
