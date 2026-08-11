// Lint a filled-in case spec before an authoring run spends 33 minutes on it.
//
//   npm run case:spec-check -- docs/case-specs/<slug>.md
//
// Offline. Every rule here has already forced a case to be redesigned after it
// was written; all of them are decidable from the spec text.
import fs from 'node:fs';
import { lintSpec } from '@judge/authoring';

const file = process.argv[2];
if (!file) {
  console.log('Usage: npm run case:spec-check -- docs/case-specs/<slug>.md');
  process.exit(1);
}
if (!fs.existsSync(file)) {
  console.error(`✗ ${file} does not exist`);
  process.exit(1);
}

const issues = lintSpec(fs.readFileSync(file, 'utf8'));
const errors = issues.filter((i) => i.level === 'error');
for (const i of issues) {
  const mark = i.level === 'error' ? '\x1b[31m✗\x1b[0m' : '\x1b[33m!\x1b[0m';
  console.log(`  ${mark} ${i.rule.padEnd(24)} ${i.message}`);
}
console.log('');
console.log(errors.length ? `\x1b[31m${errors.length} blocking\x1b[0m` : '\x1b[32mspec is buildable\x1b[0m');
process.exit(errors.length ? 1 : 0);
