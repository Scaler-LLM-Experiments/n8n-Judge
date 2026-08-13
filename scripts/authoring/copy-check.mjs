#!/usr/bin/env node
// Reports plain-language violations per case: every word a learner reads while deciding.
//
// The rules and the walk over a problem's surfaces live in
// packages/problem-schema/plainLanguage.ts, so this script, `validateProblem()` and the
// debt guard in registry.test.js all read exactly the same strings. Three copies of that
// walk existed briefly and the weakest silently disagreed with the other two, reporting a
// case with 42 long sentences and no dashes as clean.
//
// Reporting only. `validateProblem()` is what enforces, and it skips the cases on
// PLAIN_LANGUAGE_DEBT while they are being rewritten. This script never skips anything,
// which is what makes it the tool for working that backlog down.
//
//   npm run case:copy                       every case
//   npm run case:copy -- <slug>             one case
//   npm run case:copy -- <slug> --verbose   every violation, with its path
import { problems } from '../../packages/problems/index.js';
import { plainLanguageIssues } from '../../packages/problem-schema/plainLanguage.ts';

const args = process.argv.slice(2);
const only = args.find((a) => !a.startsWith('-'));
const verbose = args.includes('--verbose');

if (only && !problems[only]) {
  console.error(`unknown case "${only}". Known: ${Object.keys(problems).join(', ')}`);
  process.exit(2);
}
const targets = only ? { [only]: problems[only] } : problems;

let total = 0;
for (const [id, problem] of Object.entries(targets)) {
  const issues = plainLanguageIssues(problem);
  total += issues.length;
  console.log(`  ${issues.length ? '[31m✗[0m' : '[32m✓[0m'} ${id.padEnd(24)} ${issues.length} violation(s)`);
  if (verbose) for (const i of issues) console.log(`      ${i.path}\n        ${i.message}`);
}

console.log(
  total
    ? `\n[31m${total} violation(s)[0m. Run with --verbose to see each one.`
    : '\n[32mplain language: clean[0m'
);
process.exit(total ? 1 : 0);
