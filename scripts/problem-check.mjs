// One report on whether a problem is fit to ship.
//
//   npm run problem:check              every registered problem
//   npm run problem:check -- <slug>    one problem, registered or not
//
// This exists because "is this problem finished?" was six commands and a lot of
// remembering: validateProblem for structure, an eye on where the correct options
// sit, a rubric count to justify the difficulty label, and then finding out from a
// learner that nothing was narrated. It answers all of it in one pass, offline, and
// exits non-zero only on things that are actually wrong — a warning is a judgement
// call for the author, not a blocked build.
//
// Deliberately does NOT need the database or the dev server. It reads the repo, so
// it works on a problem that has never been seeded, which is exactly when you want
// it.
import { readFileSync, existsSync } from 'node:fs';
import { validateProblem } from '@judge/problem-schema';
import { enumerateItems } from '@judge/engine/rubric.ts';
import { problems } from '@judge/problems';
import { enumerateSpeakable } from '../apps/web/src/lib/voiceCatalogue.js';
import { NODE_CATALOG } from '@judge/catalog';

const arg = process.argv[2];
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

/**
 * Load a problem by slug, from the registry if it is registered and from its folder
 * if it is not. The unregistered case is the point: a draft should be checkable
 * before it is wired into the catalogue, because registering a half-finished problem
 * is what puts `TODO Field Label` in front of a learner.
 */
async function load(slug) {
  if (problems[slug]) return { problem: problems[slug], registered: true };
  const dir = new URL(`../packages/problems/${slug}/index.js`, import.meta.url);
  if (!existsSync(dir)) return null;
  const mod = await import(dir.href);
  // The folder exports one problem under its own name; take the only object that
  // looks like one rather than requiring the author to have named it a certain way.
  const found = Object.values(mod).find((v) => v && typeof v === 'object' && 'id' in v && 'dissection' in v);
  return found ? { problem: found, registered: false } : null;
}

/** Every string in the object, with the path that reached it. */
function strings(node, path = '', out = []) {
  if (typeof node === 'string') out.push([path, node]);
  else if (Array.isArray(node)) node.forEach((v, i) => strings(v, `${path}[${i}]`, out));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) strings(v, path ? `${path}.${k}` : k, out);
  }
  return out;
}

/**
 * Where the correct answer sits in every graded list.
 *
 * `balanceProblemOptions` spreads these server-side before the answer key is
 * stripped, so a clustered authored order is not a live bug — but it is a signal
 * that a list was written on autopilot, and the author is the only one who can tell
 * whether the distractors were thought about at all.
 */
function balance(problem) {
  const at = [];
  for (const q of problem.dissection ?? []) {
    at.push((q.options ?? []).findIndex((o) => o.type === q.correctType));
  }
  for (const setup of Object.values(problem.nodeSetup ?? {})) {
    for (const f of setup.fields ?? []) {
      if (!f.options) continue;
      at.push(f.options.findIndex((o) => o.correct));
    }
  }
  for (const probe of Object.values(problem.nodeProbes ?? {})) {
    at.push((probe.options ?? []).findIndex((o) => o.correct));
  }
  const spread = {};
  for (const i of at) spread[i] = (spread[i] ?? 0) + 1;
  const top = at.filter((i) => i === 0).length;
  return { spread, total: at.length, atTop: top };
}

/**
 * Which narrated moments this problem authors, and which it leaves to the shared
 * phrase book. Not a failure — every problem speaks either way — but a problem with
 * no `voice` block sounds generic, which is the note the retired problems got.
 */
function voice(problem) {
  const { nodes = {}, ...moments } = problem.voice ?? {};
  const authored = Object.keys(moments).length;
  const perNode = Object.keys(nodes).length;

  // Every line this problem can EVER speak, which is what the generator renders and
  // therefore what has to exist in storage. `scope` says whether a line came from
  // this problem's own words or from the shared phrase book.
  let speakable = null;
  let ownScope = null;
  try {
    const lines = enumerateSpeakable(problem, NODE_CATALOG);
    speakable = lines.reduce((n, l) => n + l.variants.length, 0);
    ownScope = lines.filter((l) => l.scope !== 'shared').length;
  } catch {
    // A malformed problem can break enumeration; the validation section above is
    // where that gets reported, so this stays quiet rather than throwing here.
  }

  const table = new URL(`../packages/voice-scripts/${problem.id}.json`, import.meta.url);
  let clips = null;
  if (existsSync(table)) {
    const parsed = JSON.parse(readFileSync(table, 'utf8'));
    clips = Object.keys(parsed.clips ?? parsed).length;
  }
  return { authored, perNode, speakable, ownScope, clips };
}

function cover(problem) {
  const src = problem.coverImage?.src ?? null;
  if (!src) return { authoredPrompt: Boolean(problem.coverImage?.prompt), src: null, onDisk: false };
  const file = new URL(`../apps/web/public${src}`, import.meta.url);
  return { authoredPrompt: Boolean(problem.coverImage?.prompt), src, onDisk: existsSync(file) };
}

/** email-triage's numbers, the one fully-authored reference to size a label against. */
const ANCHORS = [
  { max: 20, difficulty: 'easy', minutes: 15 },
  { max: 45, difficulty: 'moderate', minutes: 25 },
  { max: Infinity, difficulty: 'difficult', minutes: 45 },
];

async function check(slug) {
  const loaded = await load(slug);
  if (!loaded) {
    console.log(red(`✗ no problem "${slug}" — not registered, and packages/problems/${slug}/index.js does not exist`));
    return false;
  }
  const { problem, registered } = loaded;
  console.log(`\n${bold(problem.id)} ${dim(registered ? '(registered)' : '(not registered yet)')}`);

  let blocking = 0;

  // --- structure
  //
  // Split into "this is wrong" and "this is still a placeholder". An unfilled scaffold
  // fails half a dozen checks purely because `TODO-trigger-type` is not a real node
  // type, and reporting those the same way as a genuine mistake buries the genuine
  // mistake — which is the only reason to run this before the problem is finished.
  const { issues } = validateProblem(problem);
  const isPlaceholder = (i) => i.message.includes('TODO') || i.path.includes('TODO');
  const errors = issues.filter((i) => i.level === 'error' && !isPlaceholder(i));
  const placeholders = issues.filter((i) => i.level === 'error' && isPlaceholder(i));
  const warnings = issues.filter((i) => i.level === 'warning' && !isPlaceholder(i));
  blocking += errors.length;
  // A registered problem gets no such indulgence: its placeholders are live.
  if (registered) blocking += placeholders.length;

  if (errors.length) {
    console.log(red(`  ✗ ${errors.length} validation error(s)`));
    for (const e of errors) console.log(`      ${e.path}: ${e.message}`);
  } else {
    console.log(green(`  ✓ structure valid${placeholders.length ? ' apart from placeholders' : ''}`));
  }
  if (placeholders.length) {
    const note = `${placeholders.length} error(s) are just unreplaced placeholders (e.g. ${placeholders[0].message.slice(0, 60)}…)`;
    console.log(registered ? red(`  ✗ ${note} — and this problem is registered`) : dim(`      ${note}`));
  }
  if (warnings.length) {
    console.log(yellow(`  ! ${warnings.length} warning(s)`));
    for (const w of warnings) console.log(`      ${w.path}: ${w.message}`);
  }

  // --- placeholders. Blocking only once registered: an unfinished draft is
  // allowed to be unfinished, but a registered problem with TODO copy is live.
  const todos = strings(problem).filter(([, v]) => v.includes('TODO'));
  if (todos.length) {
    const line = `${todos.length} unfilled TODO(s), first at ${todos[0][0]}`;
    if (registered) { console.log(red(`  ✗ ${line} — and this problem is registered`)); blocking += 1; }
    else console.log(yellow(`  ! ${line}`));
  } else {
    console.log(green('  ✓ no placeholders left'));
  }

  // --- size, against what the rubric actually scores
  const items = enumerateItems(problem);
  const counts = Object.fromEntries(Object.entries(items).map(([k, v]) => [k, v.length]));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const anchor = ANCHORS.find((a) => total <= a.max);
  const label = problem.difficulty ?? '(none)';
  const fits = label === anchor.difficulty;
  console.log(
    `  ${fits ? green('✓') : yellow('!')} ${total} scored decisions ${dim(JSON.stringify(counts))} → reads as ${anchor.difficulty}/${anchor.minutes}min, authored ${label}/${problem.estimatedMinutes ?? '?'}min`
  );

  // --- where the answers sit
  const b = balance(problem);
  const clustered = b.total > 0 && b.atTop / b.total > 0.6;
  console.log(
    `  ${clustered ? yellow('!') : green('✓')} correct option position ${dim(JSON.stringify(b.spread))} — ${b.atTop}/${b.total} at the top`
  );

  // --- narration
  const v = voice(problem);
  const clipNote =
    v.clips === null
      ? red('no clip table rendered — run voice:generate')
      : v.speakable && v.clips < v.speakable
        ? yellow(`${v.clips} clips rendered of ${v.speakable} speakable — re-run voice:generate`)
        : `${v.clips} clips rendered`;
  console.log(
    `  ${v.authored ? green('✓') : yellow('!')} voice: ${v.authored} authored moment(s) + ${v.perNode} per-node, ${v.speakable ?? '?'} lines speakable, ${clipNote}`
  );

  // --- the n8n workflow file
  //
  // Every case owes a file that imports into real n8n. It is generated, not
  // authored, so the only thing to report is whether it CAN be generated — which
  // fails when the case uses a node type with no export spec. Blocking, because a
  // case that cannot be exported cannot offer its reward.
  try {
    const { exportN8nWorkflow, validateN8nWorkflow } = await import('@judge/engine');
    const { workflow, unsupported, warnings } = exportN8nWorkflow(problem);
    if (unsupported.length) {
      console.log(red(`  ✗ n8n export: no spec for ${unsupported.join(', ')} — add one in packages/engine/n8nNodeSpecs.js`));
      blocking += 1;
    } else if (!workflow) {
      console.log(red(`  ✗ n8n export: ${warnings.join('; ')}`));
      blocking += 1;
    } else {
      const issues = validateN8nWorkflow(workflow);
      const file = new URL(`../packages/problems/${problem.id}/workflow.n8n.json`, import.meta.url);
      const onDisk = existsSync(file);
      if (issues.length) {
        console.log(red(`  ✗ n8n export: ${issues.length} validation issue(s) — ${issues[0]}`));
        blocking += 1;
      } else {
        console.log(
          `  ${onDisk ? green('✓') : yellow('!')} n8n export: ${workflow.nodes.length} nodes, valid` +
            `${onDisk ? '' : yellow(' — workflow.n8n.json not committed yet, run npm run workflows:generate')}`
        );
      }
      // Authored-graph smells the export surfaces, not export problems.
      for (const w of warnings.filter((x) => !x.includes('exported as'))) console.log(yellow(`      ! ${w}`));
    }
  } catch (err) {
    console.log(yellow(`  ! n8n export: could not be checked (${err.message.split('\n')[0]})`));
  }

  // --- the mechanical half of review, so it never costs a revision cycle
  const { auditProblem } = await import('@judge/authoring');
  const findings = auditProblem(problem);
  blocking += findings.filter((f) => f.level === 'blocker').length;
  if (findings.length) {
    for (const f of findings) {
      const line = `${f.rule}: ${f.where} — ${f.message}`;
      console.log(f.level === 'blocker' ? red(`  ✗ ${line}`) : yellow(`  ! ${line}`));
    }
  } else {
    console.log(green('  ✓ audit: no mechanical defects'));
  }

  // --- cover art
  const c = cover(problem);
  const coverOk = c.authoredPrompt && c.src && c.onDisk;
  console.log(
    `  ${coverOk ? green('✓') : yellow('!')} cover: prompt ${c.authoredPrompt ? 'authored' : 'MISSING'}, src ${c.src ?? 'null'}${c.src && !c.onDisk ? red(' (file not on disk)') : ''}`
  );

  return blocking === 0;
}

const slugs = arg ? [arg] : Object.keys(problems);
if (!slugs.length) {
  console.log('No problems registered, and no slug given.');
  process.exit(1);
}
let ok = true;
for (const slug of slugs) ok = (await check(slug)) && ok;
console.log(
  ok
    ? green('\nNothing blocking. Warnings above are judgement calls — read them.')
    : red('\nBlocking problems above. A learner would see these.')
);
process.exit(ok ? 0 : 1);
