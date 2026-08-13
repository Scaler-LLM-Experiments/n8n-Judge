// The mechanical half of a case review, decided in under a second.
//
//   npm run case:audit -- <slug>
//
// A blocker is something a learner would be graded wrongly by. A note is for the
// PR. Offline: no database, no dev server, no API key.
import fs from 'node:fs';
import path from 'node:path';
import { auditProblem } from '@judge/authoring';

const slug = process.argv[2];
if (!slug) {
  console.log('Usage: npm run case:audit -- <slug>');
  process.exit(1);
}
const file = path.resolve(`packages/problems/${slug}/index.js`);
if (!fs.existsSync(file)) {
  console.error(`✗ packages/problems/${slug}/index.js does not exist`);
  process.exit(1);
}
const mod = await import(`file://${file}`);
const problem = Object.values(mod).find((v) => v && typeof v === 'object' && 'dissection' in v);
if (!problem) {
  console.error(`✗ ${file} exports no problem object — auditProblem(undefined) would throw a bare TypeError`);
  process.exit(1);
}

const findings = auditProblem(problem);
for (const f of findings) {
  const mark = f.level === 'blocker' ? '\x1b[31m✗\x1b[0m' : '\x1b[33m!\x1b[0m';
  console.log(`  ${mark} ${f.rule.padEnd(24)} ${f.where}\n      ${f.message}`);
}
const blockers = findings.filter((f) => f.level === 'blocker');
console.log('');
console.log(blockers.length ? `\x1b[31m${blockers.length} blocker(s)\x1b[0m` : '\x1b[32mno mechanical defects\x1b[0m');
process.exit(blockers.length ? 1 : 0);
