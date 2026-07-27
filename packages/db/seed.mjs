// Seed: programs, a demo batch with an invite code, and the shipped problems
// published as v1. Idempotent — safe to re-run against any environment.
//
//   npm run db:seed                    (uses DATABASE_URL from .env)
//   DATABASE_URL=<url> npm run db:seed (any other environment)
import { PrismaClient } from '@prisma/client';
import { problemList } from '@judge/problems';

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

// Publish each in-repo problem as version 1. If a published version already
// exists we refresh its `data` in place rather than minting a new version —
// seeding is not authoring, and a running Session pins its version.
async function seedProblems() {
  for (const p of problemList) {
    const problem = await prisma.problem.upsert({
      where: { slug: p.id },
      update: { title: p.title },
      create: { slug: p.id, title: p.title },
    });

    const existing = await prisma.problemVersion.findFirst({
      where: { problemId: problem.id, version: 1 },
    });

    const version = existing
      ? await prisma.problemVersion.update({
          where: { id: existing.id },
          data: { data: p, status: 'PUBLISHED' },
        })
      : await prisma.problemVersion.create({
          data: {
            problemId: problem.id,
            version: 1,
            status: 'PUBLISHED',
            data: p,
            authoredBy: 'seed',
          },
        });

    await prisma.problem.update({
      where: { id: problem.id },
      data: { currentPublishedVersionId: version.id },
    });

    console.log(`problem:  ${p.id} @ v${version.version} (${version.status})`);
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

const programs = await seedPrograms();
await seedBatches(programs);
await seedProblems();
await seedAssignments(programs);
await prisma.$disconnect();
console.log('\nseed complete.');
