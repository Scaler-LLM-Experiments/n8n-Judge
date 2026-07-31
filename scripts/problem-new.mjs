// Start a new challenge from the template.
//
//   npm run problem:new -- <slug> ["Title"]
//
// Copies `packages/problems/_template/` and does the three mechanical edits every
// author would otherwise do by hand and one of them would forget: the slug in
// meta.js, the export name in index.js, and dropping the template's own test (it
// asserts things about the template, not about your problem).
//
// It deliberately stops short of registering the problem. Registering it makes it
// the catalogue, and a folder full of TODOs is not a challenge yet — `npm test`
// would fail on the placeholder scan, which is the right outcome but a confusing
// first experience. The line to add is printed instead.
import { cpSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';

const [slug, ...titleWords] = process.argv.slice(2);
const title = titleWords.join(' ');

if (!slug) {
  console.log('Usage: npm run problem:new -- <slug> ["Title"]');
  process.exit(1);
}
if (!/^[a-z][a-z0-9-]*$/.test(slug)) {
  // The slug is permanent: sessions, clip paths and cover filenames are keyed by it.
  console.log(`✗ "${slug}" is not a usable slug. Lower-case letters, digits and hyphens, starting with a letter.`);
  process.exit(1);
}

const root = new URL('../packages/problems/', import.meta.url);
const from = new URL('_template/', root);
const to = new URL(`${slug}/`, root);

if (existsSync(to)) {
  console.log(`✗ packages/problems/${slug}/ already exists. Delete it or pick another slug.`);
  process.exit(1);
}

cpSync(from, to, { recursive: true });
rmSync(new URL('template.test.js', to));

/** `order-desk` → `orderDesk`, the export name the registry imports. */
const exportName = slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

const edit = (file, replacements) => {
  const path = new URL(file, to);
  let text = readFileSync(path, 'utf8');
  for (const [find, replace] of replacements) text = text.split(find).join(replace);
  writeFileSync(path, text);
};

edit('meta.js', [["export const id = 'TODO-slug';", `export const id = '${slug}';`]]);
if (title) edit('meta.js', [["export const title = 'TODO Title';", `export const title = '${title}';`]]);
edit('index.js', [
  ['export const templateProblem = {', `export const ${exportName} = {`],
  ['// TODO Problem Name — copied from `packages/problems/_template/`.', `// ${title || slug} — copied from \`packages/problems/_template/\`.`],
  // The copy instructions belong to the template, not to a problem made from it.
  ['//\n// TO USE THIS TEMPLATE:', '//\n// WHAT IS LEFT TO DO:'],
  ['//   1. cp -r packages/problems/_template packages/problems/<your-slug>\n', ''],
  ['//   2. rename the export below, and fill in every TODO across the seven files', '//   1. fill in every TODO across the seven files'],
  ['//   3. register it in packages/problems/index.js (registry order = catalogue order)', '//   2. register it in packages/problems/index.js (registry order = catalogue order)'],
  ['//   4. npm test          — validateProblem() runs here and rejects authoring mistakes', '//   3. npm run problem:check -- ' + slug + '   — structure, size, balance, voice, cover'],
  ['//   5. npm run db:seed   — nothing reaches the app until you do', '//   4. npm run db:seed   — nothing reaches the app until you do'],
  ['//   6. npm run covers:generate && npm run voice:generate && npm run voice:sync', '//   5. npm run covers:generate && npm run voice:generate && npm run voice:sync'],
  ['//   7. npm run smoke     — there are no component tests; this is what catches a', '//   6. npm run smoke     — there are no component tests; this is what catches a'],
]);

console.log(`✓ packages/problems/${slug}/ — seven files, every field a TODO with the rule that governs it.

Next:
  1. Read the skill first: .claude/skills/authoring-a-problem/SKILL.md
     (or draft a starting point: npm run problem:draft -- ${slug} "what the learner builds")
  2. Fill in the TODOs. Delete the router block in nodeSetup.js if your flow is linear.
  3. npm run problem:check -- ${slug}      # works before it is registered
  4. Register it, last, once the check is clean:

       packages/problems/index.js
       + import { ${exportName} } from './${slug}/index.js';
       + [${exportName}.id]: ${exportName},          // registry order IS catalogue order

  5. npm test && npm run db:seed && npm run smoke`);
