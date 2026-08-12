// Exactly what a learner's browser receives: the case with every marker of
// correctness stripped.
//
//   npm run problem:blind -- <slug>                       # to stdout
//   npm run problem:blind -- <slug> --out /tmp/blind.json
//
// This is the input to a blind solve, and it is a committed script because every
// reviewer used to hand-write it into /tmp — setup time on every round, and a
// harness an agent can get subtly wrong while reporting success.
import fs from 'node:fs';
import path from 'node:path';
import { toPublicProblem } from '@judge/problem-schema';

const [slug] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const outIdx = process.argv.indexOf('--out');
const out = outIdx === -1 ? null : process.argv[outIdx + 1];
if (!slug) {
  console.log('Usage: npm run problem:blind -- <slug> [--out <file>]');
  process.exit(1);
}
const file = path.resolve(`packages/problems/${slug}/index.js`);
if (!fs.existsSync(file)) {
  console.error(`✗ ${file} does not exist`);
  process.exit(1);
}
const mod = await import(`file://${file}`);
const problem = Object.values(mod).find((v) => v && typeof v === 'object' && 'dissection' in v);
const json = `${JSON.stringify(toPublicProblem(problem), null, 2)}\n`;
if (out) {
  fs.writeFileSync(out, json);
  // stderr, so `--out` keeps stdout clean for a pipe
  console.error(`✓ ${out}  ${Math.round(json.length / 1024)}KB (answer key stripped)`);
} else {
  process.stdout.write(json);
}
