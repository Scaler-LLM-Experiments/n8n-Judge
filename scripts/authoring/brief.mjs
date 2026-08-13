// The briefing pack one authoring run's agents read instead of the whole library.
//
//   npm run case:brief -- <slug> docs/case-specs/<slug>.md
//
// Writes .authoring-runs/brief-<slug>.md, which is gitignored operational state
// like the run file beside it. Offline.
import fs from 'node:fs';
import path from 'node:path';
import { briefingPack } from '@judge/authoring';

const [slug, specPath] = process.argv.slice(2);
if (!slug || !specPath) {
  console.log('Usage: npm run case:brief -- <slug> docs/case-specs/<slug>.md');
  process.exit(1);
}
const dir = process.env.AUTHORING_RUN_DIR || '.authoring-runs';
fs.mkdirSync(dir, { recursive: true });
const out = path.join(dir, `brief-${slug}.md`);
const pack = briefingPack({ slug, specMd: fs.readFileSync(specPath, 'utf8') });
fs.writeFileSync(out, pack);
console.log(`✓ ${out}  ${Math.round(pack.length / 1024)}KB`);
