// Write each case's reference solution as an importable n8n workflow file.
//
//   npm run workflows:generate              # every registered case
//   npm run workflows:generate -- <slug>    # one case
//   npm run workflows:generate -- --check   # fail if any file is stale or invalid
//
// ---------------------------------------------------------------------------
// Why the file is committed as well as generated on demand
// ---------------------------------------------------------------------------
// The download a learner gets is produced server-side from the ProblemVersion
// they were graded against, so it always matches the content they attempted.
// This committed copy exists for three other reasons:
//
//   1. **It is reviewable.** A workflow is the case's answer key expressed as
//      something that runs, and a diff on it is the clearest possible signal that
//      an authoring change altered what the flow actually does.
//   2. **It is the CI gate.** `--check` fails when a case's export drifts or stops
//      validating, so a change to a node spec cannot silently break three cases.
//   3. **It is what you import to test.** `npm run workflows:generate` then drag
//      the file into n8n — no dev server, no session, no 80% score needed.
//
// Offline: no database, no API key, no dev server.
import fs from 'node:fs';
import path from 'node:path';
import { problems } from '@judge/problems';
import { exportN8nWorkflow, validateN8nWorkflow, serializeWorkflow } from '@judge/engine';

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

const argv = process.argv.slice(2);
const check = argv.includes('--check');
const only = argv.filter((a) => !a.startsWith('-'));

/** The committed file lives beside the case it belongs to. */
export const workflowPath = (slug) => path.join('packages/problems', slug, 'workflow.n8n.json');

/**
 * Load one case straight from its folder, registered or not.
 *
 * The same fallback `scripts/generate-covers.mjs` has, for the same reason and in the same
 * pipeline stage. `/author-case` runs `workflows:generate -- <slug>` inside `author_case`, which
 * that skill explicitly forbids from registering the case (registration makes `voice.js`'s
 * leftover TODOs blocking, and narration is written later) — so resolving the slug against the
 * registry exited 1 with `unknown problem` at exactly the step the skill prescribes. The
 * committed `workflow.n8n.json` belongs in the same commit as the seven files it is derived
 * from, so the fix is to read the disk, not to move the step after registration.
 *
 * `case:verify -- workflow` already loads from disk (`verify.mjs`'s `loadFromDisk`), so this is
 * also what makes the two agree: before this, the generator refused a slug the verifier accepted.
 */
async function fromDisk(slug) {
  const file = path.resolve('packages/problems', slug, 'index.js');
  if (!fs.existsSync(file)) return null;
  const mod = await import(`file://${file}`);
  return Object.values(mod).find((v) => v && typeof v === 'object' && 'dissection' in v) ?? null;
}

const slugs = only.length ? only : Object.keys(problems);
/** slug → problem, registered ones from the registry and an unregistered one from its folder. */
const resolved = {};
for (const slug of slugs) {
  const problem = problems[slug] ?? (await fromDisk(slug));
  if (!problem) {
    console.error(
      red(`✗ unknown problem "${slug}" — not registered and no packages/problems/${slug}/index.js`)
    );
    console.error(dim(`      registered: ${Object.keys(problems).join(', ')}`));
    process.exit(1);
  }
  resolved[slug] = problem;
}

console.log(bold(`\nn8n workflow export${check ? ' (check only)' : ''}\n`));

let failed = 0;
let stale = 0;

for (const slug of slugs) {
  const problem = resolved[slug];
  const { workflow, warnings, unsupported } = exportN8nWorkflow(problem);

  if (unsupported.length) {
    // Deliberately fatal. A case whose node types have no export spec must not
    // produce a partial file that looks importable.
    console.log(red(`  ✗ ${slug}: no export spec for ${unsupported.join(', ')}`));
    console.log(dim('      add one in packages/engine/n8nNodeSpecs.js'));
    failed += 1;
    continue;
  }
  if (!workflow) {
    console.log(red(`  ✗ ${slug}: ${warnings.join('; ')}`));
    failed += 1;
    continue;
  }

  const issues = validateN8nWorkflow(workflow);
  if (issues.length) {
    console.log(red(`  ✗ ${slug}: ${issues.length} validation issue(s)`));
    for (const i of issues) console.log(`      ${i}`);
    failed += 1;
    continue;
  }

  const file = workflowPath(slug);
  const next = serializeWorkflow(workflow);
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  const changed = current !== next;

  if (changed) stale += 1;
  if (changed && !check) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, next);
  }

  const nodeCount = workflow.nodes.length;
  const state = check ? (changed ? yellow('STALE') : green('up to date')) : changed ? green('written') : dim('unchanged');
  console.log(`  ${state.padEnd(22)} ${file} ${dim(`(${nodeCount} nodes)`)}`);

  // Warnings are about the AUTHORED case, not the export — an unwired router
  // output or a field nothing upstream produces. Worth reading, never fatal.
  for (const w of warnings) console.log(yellow(`      ! ${w}`));
}

console.log('');
if (failed) {
  console.log(red(`${failed} case(s) could not be exported.`));
  process.exit(1);
}
if (check && stale) {
  console.log(red(`${stale} file(s) are stale. Run: npm run workflows:generate`));
  process.exit(1);
}
console.log(green(check ? 'Every workflow file is current and valid.' : 'Done.'));
console.log(dim('Import one into n8n: Workflows → ⋯ → Import from File.'));
