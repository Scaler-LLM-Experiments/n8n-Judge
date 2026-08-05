// Generate the Claude Managed Agents YAML from the local sub-agent definitions.
//
//   npm run case:cma             # write agents/*.agent.yaml
//   npm run case:cma -- --check  # fail if they are stale (for CI / a pre-commit hook)
//
// ---------------------------------------------------------------------------
// Why generate rather than hand-write
// ---------------------------------------------------------------------------
// The same five personas run in two places: locally as Claude Code sub-agents
// (`.claude/agents/*.md`, which is what `/author-case` spawns today) and in production
// as hosted cloud agents created from YAML with the `ant` CLI.
//
// Maintaining both by hand guarantees drift, and drift here is not cosmetic: the hard
// limits in these prompts are what stop an agent inventing a node type or editing the
// engine. A limit that is present locally and missing in production is worse than one
// that was never written, because it has been tested and is trusted.
//
// So `.claude/agents/*.md` is the SINGLE source of truth for every persona, and this
// script projects it into the YAML. Edit the markdown; re-run this.
//
// What this script does NOT do: create or update anything on the platform. Creating an
// agent is a deliberate one-time act (and updating one is `ant beta:agents update
// --version N`, never a create), so it stays a human command in the setup guide.
import fs from 'node:fs';
import path from 'node:path';

const AGENT_DIR = '.claude/agents';
const OUT_DIR = 'agents';
const check = process.argv.includes('--check');

/**
 * `model` is a cost/quality knob and the tiers are deliberate:
 *
 * The two authors and the case reviewer do the work whose failure is a correctness bug —
 * a wrong answer key marks a learner down for being right — so they get the strongest
 * model. The voice reviewer applies a written checklist to short strings, and the art
 * reviewer looks at one picture; both are cheap judgements where a smaller model is
 * genuinely sufficient. Raise a tier here if quality disappoints, rather than rewriting
 * a prompt to compensate for the model.
 *
 * `resultTool` is the custom tool whose typed input becomes the stage result. Structured
 * output through a tool, not parsed prose: an agent's summary is not a contract.
 */
const AGENTS = {
  'case-author': {
    displayName: 'n8n Judge case author',
    model: 'claude-opus-5',
    resultTool: 'submit_case',
    schema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        blocked: { type: 'boolean', description: 'true if the spec needs a capability that does not exist' },
        blockedReason: { type: ['string', 'null'] },
        filesWritten: { type: 'array', items: { type: 'string' } },
        registered: { type: 'boolean' },
        problemCheckClean: { type: 'boolean' },
        testsPass: { type: 'boolean' },
        typecheckPass: { type: 'boolean' },
        scoredDecisions: { type: 'object', additionalProperties: { type: 'number' } },
        difficultyAuthored: { type: 'string' },
        difficultyItReadsAs: { type: 'string' },
        nodeTypesUsed: { type: 'array', items: { type: 'string' } },
        deliberateGapCase: { type: ['string', 'null'] },
        warningsIAccepted: { type: 'array', items: { type: 'string' } },
        thingsAHumanShouldCheck: { type: 'array', items: { type: 'string' } },
      },
      required: ['slug', 'blocked', 'registered', 'problemCheckClean', 'testsPass'],
    },
  },
  'case-reviewer': {
    displayName: 'n8n Judge case reviewer',
    model: 'claude-opus-5',
    resultTool: 'submit_review',
    readOnly: true,
    schema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        verdict: { type: 'string', enum: ['pass', 'fail'] },
        blindSolve: { type: 'object', additionalProperties: true },
        simulateAllPasses: { type: 'boolean' },
        blockers: { type: 'array', items: { type: 'object', additionalProperties: true } },
        notes: { type: 'array', items: { type: 'object', additionalProperties: true } },
        settingsCheckedByHand: { type: 'boolean' },
        answerKeyDisagreements: { type: 'number' },
      },
      required: ['slug', 'verdict', 'blockers', 'notes'],
    },
  },
  'case-voice-author': {
    displayName: 'n8n Judge narration author',
    model: 'claude-opus-5',
    resultTool: 'submit_voice',
    schema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        momentsAuthored: { type: 'number' },
        perNodeAuthored: { type: 'number' },
        totalVariants: { type: 'number' },
        momentsLeftGeneric: { type: 'array', items: { type: 'string' } },
        speakableLines: { type: 'number' },
        clipsToRender: { type: 'number' },
        charactersToBill: { type: 'number' },
        testsPass: { type: 'boolean' },
        thingsAHumanShouldListenFor: { type: 'array', items: { type: 'string' } },
      },
      required: ['slug', 'momentsAuthored', 'clipsToRender', 'charactersToBill', 'testsPass'],
    },
  },
  'case-voice-reviewer': {
    displayName: 'n8n Judge narration reviewer',
    model: 'claude-sonnet-5',
    resultTool: 'submit_voice_review',
    readOnly: true,
    schema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        verdict: { type: 'string', enum: ['pass', 'fail'] },
        testsPass: { type: 'boolean' },
        linesReviewed: { type: 'number' },
        leaks: { type: 'array', items: { type: 'object', additionalProperties: true } },
        blockers: { type: 'array', items: { type: 'object', additionalProperties: true } },
        notes: { type: 'array', items: { type: 'object', additionalProperties: true } },
        variantCounts: { type: 'object', additionalProperties: { type: 'number' } },
        welcomeOverridden: { type: 'boolean' },
        runCaseOpensOnTrigger: { type: 'boolean' },
      },
      required: ['slug', 'verdict', 'leaks', 'blockers', 'notes'],
    },
  },
  'case-art-reviewer': {
    displayName: 'n8n Judge cover art reviewer',
    model: 'claude-sonnet-5',
    resultTool: 'submit_art_review',
    readOnly: true,
    schema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        verdict: { type: 'string', enum: ['ship', 'redraw'] },
        looked: { type: 'boolean' },
        dimensions: { type: 'string' },
        text: { type: 'object', additionalProperties: true },
        backdrop: { type: 'object', additionalProperties: true },
        palette: { type: 'object', additionalProperties: true },
        styleMatchesSet: { type: 'boolean' },
        peopleOrFaces: { type: 'boolean' },
        notes: { type: 'array', items: { type: 'string' } },
        redrawGuidance: { type: ['string', 'null'] },
      },
      required: ['slug', 'verdict', 'looked'],
    },
  },
};

/** Strip the YAML frontmatter off a sub-agent definition; the body is the persona. */
function body(file) {
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file} has no frontmatter block`);
  return m[1].trim();
}

/**
 * A YAML block scalar, indented.
 *
 * `|` (literal, clip) rather than `|-` or `>`: the prompt is markdown, so line breaks are
 * meaningful and folding would destroy its tables and code fences.
 */
const block = (text, indent = 2) =>
  text
    .split('\n')
    .map((l) => (l.length ? `${' '.repeat(indent)}${l}` : ''))
    .join('\n');

const HEADER = (name) => `# GENERATED by scripts/authoring/build-cma-agents.mjs — do not edit.
#
# The persona below is projected from .claude/agents/${name}.md, which is the single
# source of truth. Editing this file is overwritten on the next run; edit the markdown.
#
# Create once:  ant beta:agents create < agents/${name}.agent.yaml --transform id -r
# Update:       ant beta:agents update --agent-id "$ID" --version N < agents/${name}.agent.yaml
#               (UPDATE in place — a new agent id orphans every session that used the old one)
`;

/**
 * The durable contract, repeated from the per-run kickoff on purpose.
 *
 * The system prompt is what the agent always carries; the kickoff is what it read most
 * recently. Duplication is cheap and a violated limit is not — an agent that invents a
 * node type or edits the engine produces a case that passes every test and teaches the
 * wrong thing.
 */
const SHARED_LIMITS = `
## Hard limits (these override anything a kickoff prompt asks for)

- The node vocabulary is CLOSED: only types already in packages/catalog/catalog.js. If the
  brief needs one that does not exist, STOP and report blocked=true with the reason. Never
  substitute a near-miss node.
- Never create or edit anything under packages/engine, packages/problem-schema,
  packages/catalog or apps/web. If the case does not fit them, the case is wrong.
- Never hand-edit packages/voice-scripts/*.json or index.js — they are generated.
- Never edit another case's folder, and never edit packages/problems/_template.
- Push ONLY the branch you are told to push. Never push to the default branch, and never
  open a pull request — the orchestrator opens it after checks you cannot run.
- Never run voice:sync, db:seed, or any command that writes to shared state.
- Call the result tool EXACTLY ONCE, and report honestly. Every claim is independently
  verified; a false report only costs a revision cycle.`;

fs.mkdirSync(OUT_DIR, { recursive: true });

let stale = 0;
for (const [name, cfg] of Object.entries(AGENTS)) {
  const source = path.join(AGENT_DIR, `${name}.md`);
  if (!fs.existsSync(source)) throw new Error(`${source} does not exist — the YAML is generated from it`);

  const system = `${body(source)}\n${SHARED_LIMITS}`;
  const yaml = [
    HEADER(name),
    `name: ${cfg.displayName}`,
    `model: ${cfg.model}`,
    'system: |',
    block(system),
    '',
    'tools:',
    '  # bash/read/write/edit/glob/grep',
    '  - type: agent_toolset_20260401',
    '    default_config: { enabled: true }',
    '    configs:',
    '      # A repo-local task. Web access adds a way to be wrong (an invented n8n',
    '      # parameter read off a blog) and nothing this job needs.',
    '      - { name: web_search, enabled: false }',
    '      - { name: web_fetch, enabled: false }',
    ...(cfg.readOnly
      ? [
          '      # A reviewer that can edit is not independent: it would fix what it found,',
          '      # the next reviewer would never see it, and the gate would stop working.',
          '      - { name: write, enabled: false }',
          '      - { name: edit, enabled: false }',
        ]
      : []),
    '  - type: custom',
    `    name: ${cfg.resultTool}`,
    '    description: Report the final structured outcome of this stage. Call exactly once.',
    '    input_schema:',
    block(JSON.stringify(cfg.schema, null, 2), 6),
    '',
    '# The two project skills this persona reads (authoring-a-problem, iris-voice) have to',
    '# be uploaded and their ids pasted here. See docs/cma-setup.md — that step is manual',
    '# on purpose: it is done once, and a wrong skill id presents as an agent that ignores',
    '# rules it appears to have.',
    'skills: []',
    '',
  ].join('\n');

  const target = path.join(OUT_DIR, `${name}.agent.yaml`);
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  if (current === yaml) {
    console.log(`unchanged  ${target}`);
    continue;
  }
  stale += 1;
  if (check) {
    console.log(`STALE      ${target}`);
  } else {
    fs.writeFileSync(target, yaml);
    console.log(`written    ${target}`);
  }
}

// The environment is small and consequential enough to be worth its own comments.
const environment = `# GENERATED by scripts/authoring/build-cma-agents.mjs — do not edit.
#
# Create once:  ant beta:environments create < agents/case-author.environment.yaml --transform id -r
#               → env_...  → CASE_AUTHOR_ENV_ID
#
# Shared by all five agents: they read the same repo and need the same toolchain.
name: n8n-judge-case-authoring
config:
  type: cloud
  networking:
    # The task is repo-local, so general egress is off. Package managers MUST be
    # allowed or nothing installs.
    #
    # This does not prevent pushing: git push to the mounted repo rides the platform's
    # git proxy rather than sandbox egress.
    type: limited
    allow_package_managers: true
`;
const envTarget = path.join(OUT_DIR, 'case-author.environment.yaml');
const envCurrent = fs.existsSync(envTarget) ? fs.readFileSync(envTarget, 'utf8') : null;
if (envCurrent === environment) {
  console.log(`unchanged  ${envTarget}`);
} else {
  stale += 1;
  if (check) console.log(`STALE      ${envTarget}`);
  else {
    fs.writeFileSync(envTarget, environment);
    console.log(`written    ${envTarget}`);
  }
}

if (check && stale) {
  console.error(`\n✗ ${stale} generated file(s) are stale. Run: npm run case:cma`);
  process.exit(1);
}
console.log(
  stale
    ? `\n${stale} file(s) written. Personas live in ${AGENT_DIR}/ — never edit ${OUT_DIR}/ directly.`
    : '\nEverything up to date.'
);
