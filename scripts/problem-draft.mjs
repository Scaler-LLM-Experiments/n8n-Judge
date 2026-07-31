// Draft a challenge from a brief, with Claude, into the seven files.
//
//   npm run problem:draft -- <slug> "what the learner builds, and why"
//   npm run problem:draft -- <slug> "…" --program AIML --title "Order Desk"
//   npm run problem:draft -- <slug> "…" --force        overwrite an existing draft
//
// What this is: a first pass that gets the SHAPE right — the right number of
// decisions in the right places, every field present, the vocabulary drawn from the
// real catalog — so the author spends their time on whether each question is worth
// asking. It is not a publishable problem, and the banner it writes into every file
// says so.
//
// What it is not: a way to skip the skill. Judge grades learners, so a plausible
// wrong "correct" option marks someone down for being right. Every value here needs
// a human to agree with it.
//
// Needs ANTHROPIC_API_KEY. The draft is validated before anything is written, and a
// draft that fails the schema is printed rather than saved — a half-parsed problem on
// disk is harder to fix than no problem on disk.
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { claude, MODELS, buildAuthoringPrompt } from '@judge/llm';
import { problemSchema, validateProblem } from '@judge/problem-schema';
import { NODE_CATALOG } from '@judge/catalog';
import { emailTriage } from '@judge/problems/email-triage/index.js';
// zod 3's schemas need this converter: `zod/v4`'s built-in `toJSONSchema` reads v4
// internals and throws on a v3 object.
import { zodToJsonSchema } from 'zod-to-json-schema';

const argv = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const at = argv.indexOf(`--${name}`);
  return at === -1 ? fallback : argv[at + 1];
};
const has = (name) => argv.includes(`--${name}`);
const positional = argv.filter((a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--'));
const [slug, brief] = positional;

if (!slug || !brief) {
  console.log(`Usage: npm run problem:draft -- <slug> "what the learner builds, and why" [--program AIML] [--title "…"] [--force]`);
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.log('✗ ANTHROPIC_API_KEY is not set. Drafting is the one authoring step that calls an API.');
  process.exit(1);
}

const dir = new URL(`../packages/problems/${slug}/`, import.meta.url);
if (existsSync(dir) && !has('force')) {
  console.log(`✗ packages/problems/${slug}/ exists. Pass --force to overwrite it, or pick another slug.`);
  process.exit(1);
}

// The catalog is the model's entire vocabulary, so it is handed over in full rather
// than summarised: an invented node type is the one mistake that cannot be corrected
// by editing copy.
const catalogSummary = Object.entries(NODE_CATALOG)
  .map(([type, entry]) => `- ${type}: ${entry.label}${entry.category ? ` [${entry.category}]` : ''}${entry.needsModel ? ' (needs a chat model sub-node)' : ''}`)
  .join('\n');

/**
 * The problem schema as JSON Schema — for the PROMPT, not for `output_config.format`.
 *
 * Structured output would be the obvious choice here and cannot be used: it accepts a
 * subset of JSON Schema, and the problem schema lands outside it in a way that cannot be
 * worked around. Every object must carry `additionalProperties: false`, and a schema-valued
 * `additionalProperties` is rejected outright — which is exactly what a zod `.record()`
 * converts to. `nodeSetup` and `nodeProbes` are records keyed by node type, `voice` is a
 * record of moments, `flow.next` is a record of transitions. Rewriting each into a list of
 * pairs for the API and rehydrating it afterwards is a translation layer that would drift
 * from the schema it exists to mirror.
 *
 * So the schema is handed over as reference text and the response is parsed instead. The
 * gate does not move: `problemSchema.safeParse` runs on the way back and nothing is written
 * unless it passes, which is the same guarantee `output_config.format` would have given —
 * just enforced by us rather than by the sampler.
 */
function jsonSchemaForProblem() {
  try {
    return zodToJsonSchema(problemSchema, { $refStrategy: 'none' });
  } catch (e) {
    console.log(`  (schema conversion failed: ${e.message} — the exemplar carries the shape instead)`);
    return null;
  }
}

/**
 * The JSON object out of a model response that was asked for JSON.
 *
 * Tolerates a ```json fence and any sentence before or after the object, because those are
 * the two things a model does when it is not being constrained by a sampler.
 */
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('no JSON object in the response');
  return JSON.parse(body.slice(start, end + 1));
}

const { system, user, schema } = buildAuthoringPrompt(
  {
    statement: brief,
    program: flag('program', 'AIML'),
    title: flag('title') ?? undefined,
    slug,
  },
  // Reference material for the prompt. See jsonSchemaForProblem() for why this is not
  // handed to `output_config.format`.
  jsonSchemaForProblem(),
  catalogSummary,
  [emailTriage]
);

console.log(`Drafting "${slug}" with ${MODELS.authoring()}…`);
// Streamed because a whole problem is a long output — a non-streaming request at this
// `max_tokens` risks an HTTP timeout rather than an answer.
//
// 64k, not 32k: `max_tokens` caps thinking AND the response together, and a whole problem
// is ~10k tokens of JSON on its own. At 32k the first attempt spent the budget thinking and
// stopped mid-object. `effort: medium` is the other half of that fix — this is a long
// mechanical generation against an exemplar, not a reasoning problem.
const stream = claude().messages.stream({
  model: MODELS.authoring(),
  max_tokens: 64000,
  thinking: { type: 'adaptive' },
  output_config: { effort: 'medium' },
  system: `${system}\n\n## The shape your JSON must have\n\n${JSON.stringify(schema)}`,
  messages: [{ role: 'user', content: user }],
});
const message = await stream.finalMessage();
const usage = message.usage;
console.log(`  ${usage.input_tokens} in / ${usage.output_tokens} out`);

if (message.stop_reason === 'refusal') {
  console.log('✗ The model declined this request. Nothing was written.');
  process.exit(1);
}
if (message.stop_reason === 'max_tokens') {
  console.log('✗ The draft was cut off at max_tokens, so the JSON is incomplete. Nothing was written.');
  process.exit(1);
}

const text = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
let data;
try {
  data = extractJson(text);
} catch (e) {
  const dump = new URL(`../.draft-${slug}.txt`, import.meta.url);
  writeFileSync(dump, text);
  console.log(`✗ Could not read JSON out of the draft (${e.message}). Raw text kept at .draft-${slug}.txt`);
  process.exit(1);
}

// The slug is ours, not the model's: paths are keyed by it.
data.id = slug;

const parsed = problemSchema.safeParse(data);
if (!parsed.success) {
  console.log('\n✗ The draft does not fit the schema, so nothing was written:');
  for (const issue of parsed.error.issues.slice(0, 12)) {
    console.log(`    ${issue.path.join('.')}: ${issue.message}`);
  }
  const dump = new URL(`../.draft-${slug}.json`, import.meta.url);
  writeFileSync(dump, JSON.stringify(data, null, 2));
  console.log(`\n  Raw draft kept at .draft-${slug}.json so you can salvage it.`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Render the seven files.
// ---------------------------------------------------------------------------
// A drafted file loses the template's teaching comments, so each one gets a header
// that says where the rules live and that every value is unreviewed. `json()` is
// deliberate about quoting: the output is source a human is about to edit, so it
// should look like the hand-written files next to it.
const p = parsed.data;
const json = (value) => JSON.stringify(value, null, 2).replace(/\n/g, '\n');

const BANNER = (what) => `// ${what}
//
// DRAFTED BY AI on the brief below, and reviewed by nobody yet. Judge grades learners,
// so a plausible-but-wrong "correct" option marks someone down for being right: read
// every value here against .claude/skills/authoring-a-problem/SKILL.md before this is
// registered. \`npm run problem:check -- ${slug}\` reports what can be checked
// mechanically; the rest is judgement.
//
// Brief: ${brief.replace(/\n+/g, ' ')}
`;

const files = {
  'meta.js': `${BANNER('Who this challenge is, and how it is advertised.')}
export const id = ${JSON.stringify(p.id)};
export const title = ${JSON.stringify(p.title)};
export const statement = ${JSON.stringify(p.statement)};
export const tagline = ${JSON.stringify(p.tagline)};
/** ≤125 characters: a Home card clips it mid-word beyond that. */
export const brief = ${JSON.stringify(p.brief ?? '')};
export const difficulty = ${JSON.stringify(p.difficulty ?? 'moderate')};
export const difficultyNote = ${JSON.stringify(p.difficultyNote ?? '')};
export const estimatedMinutes = ${p.estimatedMinutes ?? 25};
export const coverImage = ${json(p.coverImage ?? { prompt: '', src: null, alt: '' })};
`,
  'dissection.js': `${BANNER('The Understand quiz: one node-pick per decision the flow requires.')}
export const dissection = ${json(p.dissection)};
`,
  'build.js': `${BANNER('The shape of the flow, and the order it gets built in.')}
export const nodePalette = ${json(p.nodePalette)};

export const branches = ${json(p.branches)};

/** Labels: three words maximum, describing the JOB and never the node. */
export const flowSummary = ${json(p.flowSummary)};

export const flow = ${json(p.flow)};

export const buildPhases = ${json(p.buildPhases)};
`,
  'nodeSetup.js': `${BANNER('The node detail view, per node TYPE — not per instance.')}
export const nodeSetup = ${json(p.nodeSetup)};
`,
  'probes.js': `${BANNER('Wrong-pick probes. Never name the correct node; no escape hatches.')}
export const nodeProbes = ${json(p.nodeProbes)};

export const misconceptionLabels = ${json(p.misconceptionLabels)};
`,
  'cases.js': `${BANNER('The finished flow, and everything the Run and Stress Testing measure against.')}
export const referenceGraph = ${json(p.referenceGraph)};

export const testCases = ${json(p.testCases)};

/** One case with \`branch: null\` on purpose — the gap Stress Testing asks about. */
export const sampleCases = ${json(p.sampleCases)};

export const evalQuestions = ${json(p.evalQuestions)};
`,
  'voice.js': `${BANNER("Iris's narration for this problem.")}
// READ .claude/skills/iris-voice/SKILL.md before changing a line, and after ANY edit run
// BOTH \`npm run voice:generate\` (the file name is a hash of the text) and
// \`npm run db:seed\` (problems are served from Postgres).
export const voice = ${json(p.voice ?? {})};
`,
  'index.js': `${BANNER(`${p.title} — assembled.`)}
import * as meta from './meta.js';
import { dissection } from './dissection.js';
import { nodePalette, branches, flowSummary, flow, buildPhases } from './build.js';
import { nodeSetup } from './nodeSetup.js';
import { nodeProbes, misconceptionLabels } from './probes.js';
import { referenceGraph, testCases, sampleCases, evalQuestions } from './cases.js';
import { voice } from './voice.js';

export const ${slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())} = {
  id: meta.id,
  title: meta.title,
  statement: meta.statement,
  tagline: meta.tagline,
  brief: meta.brief,
  difficulty: meta.difficulty,
  difficultyNote: meta.difficultyNote,
  estimatedMinutes: meta.estimatedMinutes,
  coverImage: meta.coverImage,

  dissection,
  nodePalette,
  referenceGraph,
  testCases,
  branches,
  flowSummary,
  flow,
  buildPhases,
  nodeSetup,
  nodeProbes,
  voice,
  misconceptionLabels,
  sampleCases,
  evalQuestions,
};
`,
};

mkdirSync(dir, { recursive: true });
for (const [name, contents] of Object.entries(files)) {
  writeFileSync(new URL(name, dir), contents);
}

// Say straight away what a human still has to fix, rather than letting them discover
// it after registering.
const { issues } = validateProblem(p);
const errors = issues.filter((i) => i.level === 'error');
const warnings = issues.filter((i) => i.level === 'warning');

console.log(`\n✓ packages/problems/${slug}/ — seven files written.`);
console.log(`  ${errors.length} validation error(s), ${warnings.length} warning(s).`);
for (const e of errors.slice(0, 8)) console.log(`    ✗ ${e.path}: ${e.message}`);
for (const w of warnings.slice(0, 5)) console.log(`    ! ${w.path}: ${w.message}`);

console.log(`
Now do the part that cannot be delegated:
  1. Read every "correct" option and every "why". A wrong one marks a learner down
     for being right.
  2. npm run problem:check -- ${slug}
  3. Register it in packages/problems/index.js, then npm test && npm run db:seed
  4. npm run covers:generate && npm run voice:generate && npm run voice:sync
  5. npm run smoke, then walk it yourself start to finish.`);
