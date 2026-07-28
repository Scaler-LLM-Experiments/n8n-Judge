// Seed ONLY the grading rubric.
//
// Separate from seed.mjs on purpose, so it is safe to run against production.
// The full seed also re-publishes problems, and it does that by UPDATING
// ProblemVersion v1 in place — which silently changes the answer basis under any
// session pinned to v1, and leaves the server's version cache (which never
// invalidates, because versions are supposed to be immutable) serving a stale
// copy. Fine on a local database you can drop; not something to point at
// production to install a rubric.
//
//   npm run db:seed:rubric
//   DATABASE_URL="postgresql://…" node packages/db/seed-rubric.mjs
//
// Deliberately does NOT read .env: pass DATABASE_URL explicitly, so there is no
// way to think you are seeding production while actually hitting localhost.
import { PrismaClient } from '@prisma/client';
import { DEFAULT_RUBRIC_SYSTEM_PROMPT } from '@judge/llm/gradingPrompt.ts';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Pass it explicitly:\n  DATABASE_URL="postgresql://…" node packages/db/seed-rubric.mjs');
  process.exit(1);
}

const prisma = new PrismaClient();
const LABEL = 'Default rubric';

// Show which host is being written to, without leaking the credentials.
const host = (() => {
  try {
    return new URL(process.env.DATABASE_URL).host;
  } catch {
    return '(unparseable)';
  }
})();
console.log(`target: ${host}`);

let rubric = await prisma.rubric.findFirst({ where: { label: LABEL, problemId: null } });
if (!rubric) rubric = await prisma.rubric.create({ data: { label: LABEL } });

const latest = await prisma.rubricVersion.findFirst({
  where: { rubricId: rubric.id },
  orderBy: { version: 'desc' },
});

// Append a version rather than editing one: a GradingReport points at the exact
// RubricVersion that produced it, so rewriting v1 would retroactively change the
// stated basis of reports already issued.
if (latest?.systemPrompt === DEFAULT_RUBRIC_SYSTEM_PROMPT) {
  console.log(`rubric: "${LABEL}" @ v${latest.version} (unchanged)`);
} else {
  const version = await prisma.rubricVersion.create({
    data: {
      rubricId: rubric.id,
      version: (latest?.version ?? 0) + 1,
      systemPrompt: DEFAULT_RUBRIC_SYSTEM_PROMPT,
    },
  });
  console.log(`rubric: "${LABEL}" @ v${version.version} (${latest ? 'appended' : 'created'})`);
}

await prisma.$disconnect();
