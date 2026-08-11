# Faster Case Authoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut the wall clock of one `/author-case` run from a measured 95–153 minutes to ~40–45, without weakening a single grading guarantee.

**Architecture:** Three changes, in order of minutes saved. (1) Move work off the critical path — narration and cover art run *concurrently* with review instead of after it, and the review itself fans out into three agents that each blind-solve one surface. (2) Replace agent judgement with deterministic checks wherever the rule is mechanical — a new `@judge/authoring` package holds the pure logic (spec lint, briefing pack, case audit), thin `.mjs` CLIs wrap it, and `settings` finally enters `nodeSetupSchema` so `validateProblem()` sees the one graded surface nothing validates today. (3) Stop every agent re-reading the whole 26.6KB node library by generating a per-run briefing pack containing only the types this case could plausibly use.

**Tech Stack:** Node ≥22.6 (native TS type stripping), vitest, zod 3, npm workspaces. New logic is TypeScript inside `packages/`; CLI entry points are `.mjs` under `scripts/authoring/`, matching the three that already live there.

## Measured baseline (do not re-derive; this is why the plan is shaped this way)

| Thing | Measured on 2026-08-11 |
|---|---|
| `npm test` — 787 tests, 46 files | 7.0s |
| `typecheck` both halves | 6.0s |
| `problem:check` · `workflows:generate --check` · `voice:generate --dry-run` · `db:seed` | 0.58s · 0.45s · 0.39s · 0.51s |
| `npm run smoke` (5 cases, 36 checks + resume) | 1m59s at `SMOKE_CONCURRENCY=4`; 1m39s at 8 |
| **All mechanical gates per run** | **≈3 min — 2–3% of the run** |
| `author_case` (commit gap, two real runs) | 33 and 34 min |
| `case_review` + revisions | 29 min per round; 88 min for three rounds |
| voice author + review + register + render + cover | ~28–32 min |

**Conclusion the plan acts on:** ~97% of a run is agent wall clock. Optimising the test suite or smoke cannot move the number. Overlapping stages, cutting round count, and shrinking what each agent must read can.

## Global Constraints

- **Node ≥22.6.** `db:seed` and any `.mjs` importing a `.ts` module rely on native type stripping. Node 20 fails with `ERR_UNKNOWN_FILE_EXTENSION`.
- **There is no linter.** `npm test` + `npm run typecheck` + `npm run smoke` are the entire gate. Match the surrounding file's style by reading it.
- **TypeScript for new logic inside `packages/`**; erasable syntax only (no enums, no parameter properties) because Node strips types rather than compiling them. CLI wrappers stay `.mjs`.
- **Never weaken a grading guarantee to go faster.** Specifically: the blind solve stays blind, reviewers keep no write tools, every review round uses *fresh* agents, and the human PR checklist keeps every item no test covers.
- **Registration stays the middle gate.** `voice:generate` iterates the registry and hard-errors on an unknown slug; `covers:generate` filters `problemList` and silently draws nothing. Nothing before registration may register; nothing after it works without it. Task 7 changes *only* the cover path, deliberately and locally.
- **`npm run case:verify -- on-branch <branch>` immediately before every commit.** Two commits once landed on `main` because `git switch -c` had run many steps earlier.
- **Do not edit `packages/problems/*/` content in this plan.** The five authored cases are fixtures here. If a new check fires on one of them, that is a finding to report, not a reason to loosen the check or edit the case.
- **Commit messages** follow the repo's voice: a statement of what changed and why it matters (`Export the operation the case actually graded, not a hardcoded one`), not `feat:` prefixes. End every commit message with:
  `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`

---

## File Structure

**New package — `@judge/authoring`.** Pure, unit-tested authoring logic. It exists because `scripts/` is outside vitest's `include` (`packages/**/*.test.{js,ts}`, `apps/**/*.test.{js,ts}`), so logic that lives only in a script cannot be tested. Scripts stay as thin argument-parsing wrappers.

| File | Responsibility |
|---|---|
| `packages/authoring/package.json` | Workspace manifest. Deps: `@judge/catalog`, `@judge/engine`, `@judge/problem-schema`. |
| `packages/authoring/index.ts` | Re-exports the three modules. |
| `packages/authoring/specLint.ts` (+ `.test.ts`) | Lint a filled-in case spec against the node menu and the five unbuildable shapes. |
| `packages/authoring/briefingPack.ts` (+ `.test.ts`) | Build the per-run briefing pack: the narrow node menu plus the spec. |
| `packages/authoring/audit.ts` (+ `.test.ts`) | The mechanical half of case review, as deterministic rules. |
| `scripts/authoring/spec-check.mjs` | CLI → `case:spec-check`. |
| `scripts/authoring/brief.mjs` | CLI → `case:brief`. |
| `scripts/authoring/audit.mjs` | CLI → `case:audit`. |
| `scripts/authoring/blind.mjs` | CLI → `problem:blind`. Emits the learner-visible projection, replacing the `/tmp` harness every reviewer writes by hand. |

**Modified:**

| File | Change |
|---|---|
| `packages/catalog/catalog.js` · `index.js` | Export `LEGACY_ALIASES` — today the list lives only inside a test. |
| `packages/catalog/authoringTemplate.test.js:27` | Import that list instead of re-declaring it. |
| `packages/problem-schema/types.ts` | `settings` enters `nodeSetupSchema`. |
| `packages/problem-schema/validateProblem.ts` | Three settings rules: key is real, `correct` has a `why`, wrong values are explained. |
| `packages/problem-schema/settingKeys.ts` (+ `.test.ts`) | `GRADED_SETTING_KEYS`, with a parity test against `apps/web/src/n8n/nodeSettings.js`. |
| `scripts/problem-check.mjs` | Runs `auditProblem()` so the author sees mechanical defects on every iteration. |
| `scripts/authoring/verify.mjs` | New `audit` check, included in `all`. |
| `scripts/generate-covers.mjs:113` | Fall back to the on-disk problem folder when `--only <slug>` names an unregistered case. |
| `apps/web/scripts/smoke.mjs:22,90` | `SMOKE_ONLY` filter; default concurrency 4 → 8. |
| `.claude/skills/author-case/SKILL.md` | New stage graph: review fan-out, voice in parallel, art from t=0, the new commands. |
| `.claude/agents/case-reviewer.md` | Becomes slice-scoped; the slice is given in the spawn prompt. |
| `agents/*.agent.yaml` | Regenerated by `npm run case:cma`. Never hand-edited. |
| `package.json` | Four new scripts. |

---

### Task 1: `LEGACY_ALIASES` becomes a real export

The ten compatibility aliases are the single most consequential list in authoring — picking one produces a case built on a node a learner will never meet in real n8n. Today the list exists in a test file and in prose in three prompts, so nothing can check a spec against it.

**Files:**
- Modify: `packages/catalog/catalog.js` (append after `NODE_OPTIONS`, around line 385)
- Modify: `packages/catalog/index.js:1`
- Modify: `packages/catalog/authoringTemplate.test.js:27-31`
- Test: `packages/catalog/catalog.test.js` (append a describe block)

**Interfaces:**
- Produces: `LEGACY_ALIASES: Readonly<Record<string, string>>` — alias type → canonical replacement type. Consumed by Tasks 2 and 3.

- [ ] **Step 1: Write the failing test**

Append to `packages/catalog/catalog.test.js`:

```js
describe('LEGACY_ALIASES', () => {
  it('names ten aliases, each mapping to a canonical type that exists', () => {
    const entries = Object.entries(LEGACY_ALIASES);
    expect(entries).toHaveLength(10);
    for (const [alias, canonical] of entries) {
      expect(NODE_CATALOG[alias], `alias ${alias} is not in the catalog`).toBeTruthy();
      expect(NODE_CATALOG[canonical], `${alias} → ${canonical}, which is not in the catalog`).toBeTruthy();
      expect(canonical, `${alias} maps to itself`).not.toBe(alias);
    }
  });

  it('never maps an alias to another alias', () => {
    for (const [alias, canonical] of Object.entries(LEGACY_ALIASES)) {
      expect(LEGACY_ALIASES[canonical], `${alias} → ${canonical}, which is itself an alias`).toBeUndefined();
    }
  });
});
```

Add `LEGACY_ALIASES` to that file's existing import from `./catalog.js`.

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run packages/catalog/catalog.test.js`
Expected: FAIL — `LEGACY_ALIASES is not defined` / undefined import.

- [ ] **Step 3: Add the export**

In `packages/catalog/catalog.js`, after `NODE_OPTIONS`:

```js
/**
 * Types that exist only so the already-authored cases keep working, mapped to the
 * node a new case should use instead.
 *
 * This list used to live in `authoringTemplate.test.js` and in prose inside three
 * agent prompts, which meant nothing could check a case spec against it — the one
 * place it matters, because picking an alias builds a case on a node the learner
 * will never meet in real n8n.
 */
export const LEGACY_ALIASES = Object.freeze({
  trigger: 'gmail-trigger',
  parse: 'edit-fields',
  action: 'gmail',
  classify: 'text-classifier',
  'chat-gemini': 'google-gemini-chat-model',
  summarize: 'basic-llm-chain',
  'slack-message': 'slack',
  'notion-page': 'notion',
  'calendar-event': 'google-calendar',
  'web-search': 'http-request',
});
```

In `packages/catalog/index.js`, add `LEGACY_ALIASES` to the existing `./catalog.js` export list.

- [ ] **Step 4: Point the template test at it**

In `packages/catalog/authoringTemplate.test.js`, delete the local `const LEGACY_ALIASES = [...]` and import the map instead, iterating its keys:

```js
import { NODE_CATALOG, LEGACY_ALIASES } from '@judge/catalog';
// …
    for (const alias of Object.keys(LEGACY_ALIASES)) {
```

- [ ] **Step 5: Run the suite**

Run: `npm test`
Expected: PASS, 787+ tests. The template test must still pass — it asserts each alias appears in `TEMPLATE.md` only inside the "Never use these names" warning.

- [ ] **Step 6: Commit**

```bash
npm run case:verify -- on-branch <your-branch>
git add packages/catalog
git commit -m "$(cat <<'EOF'
The alias list is a rule, so make it importable rather than test-local

Ten compatibility aliases decide whether a new case is built on a node a
learner will meet in real n8n. The list lived inside authoringTemplate.test.js
and in prose in three agent prompts, so no tool could check a spec against it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `@judge/authoring` + `case:spec-check` — catch a bad spec in 1s, not after 33 min

The most expensive failure the pipeline has is a flow that must be redesigned *after* it is written: ops-request-desk lost an outcome that way. Every rule that forces such a redesign is mechanical and already stated in `TEMPLATE.md` §3.

> **Revised 2026-08-11, after the first cut shipped and was run against all three real specs.**
> Two defects in the original version below, both in the plan, not the implementer: the token
> scan was document-wide, so a spec's own slug, its schema/column field names, and prose about
> OTHER cases' aliases — all indistinguishable from a node id by shape alone — were read as node
> placements; and the section parser assumed `TEMPLATE.md`'s pristine `## N.` numbering, which a
> *resolved* spec (one already turned into a real, shipped case) is not obliged to keep verbatim.
> The fix below is "scope + soften": section-finding by heading keyword rather than a fixed
> number, every node-token rule scoped to the nodes section alone, and an unrecognised token
> demoted to a warning (`unknown-token`) because a field name shaped like a node id is the common
> case, not the rare one. The code blocks and Step 7 below reflect the corrected version.
>
> **Revised again 2026-08-11, round 2.** The coordinator confirmed the residual above was real
> and identified a second defect the first revision missed: the `type-reused` residual was one
> class of bug — reuse must be counted over the node each list item is ABOUT (its FIRST
> backticked token), not every backtick in the section, so a later item's prose can refer back to
> an already-placed node ("the brain attached to the `information-extractor` step"; a
> parenthetical citing the template's own worked `schedule` example) without that counting as
> reuse. `firstTokenOfListItems()` implements this: a list-item line (numbered `1.`/`2.` or
> bulleted `-`/`*`, with an optional leading `>` and an optional `**bold**` wrapper) contributes
> only its first backticked token; a continuation line with no list marker contributes nothing.
> Both `ops-request-desk.md` and `low-stock-morning-post.md` now pass.
>
> The second defect was the heading-keyword lists themselves being too narrow:
> `trial-signup-desk.md` uses "Node vocabulary" and "The cases the flow gets tested on", neither
> of which matched "the nodes"/"nodes this case needs" or "examples"/"test it with" — so all four
> node-token rules silently skipped on it, which is worse than erroring. The keyword lists are now
> broad word-boundaried matches: nodes on `node`/`nodes` (excluding a heading that also says
> "never use"/"alias", which also talks about node names), flow on `flow` alone, examples on
> `example(s)`/`case(s)`/`test`/`tested`. One correctness fix this required: every case spec
> carries exactly one level-1 heading, its own title ("# Case spec — …" / "# Case brief — …"),
> and that title always contains the word "case" — so without excluding level-1 headings from
> candidates, the title would win the examples-section lookup on every spec (it is always the
> first heading in the document) and "the examples section" would silently become the entire rest
> of the file. `findSection()` now only considers headings at level 2 or deeper.
>
> **With both fixes, `ops-request-desk.md` and `low-stock-morning-post.md` exit 0.
> `trial-signup-desk.md` does not — and the reason is now a genuine, different finding, not a
> linter bug in either fix above.** Its "Node vocabulary" section, previously never scanned
> because its heading didn't match, is now found and read, and it contains two things that were
> always true of the document and are only now visible:
>
> 1. **`legacy-alias` on `action`.** Row 4 of the vocabulary table gives the "Send Reply (Gmail)"
>    node's Type as `` `action` `` instead of `` `gmail` `` — a real, stale value in the spec
>    text (the case was almost certainly built correctly against the real catalog; the `.md`
>    documentation simply never got the type name updated). This is out of scope to fix here:
>    `docs/case-specs/` is a fixture this task must not edit.
> 2. **`splitter-without-paths` on `switch`.** The document's own "Distractors worth offering"
>    list includes `` `switch` `` with the note "reaching for a router in a flow that has nothing
>    to route" — i.e. `switch` is named ONLY as a wrong-answer bait node; the flow is explicitly
>    linear. `hasSplitterToken` reads from the full nodes-section token scan (unchanged by this
>    round's fix, which only narrowed `type-reused`'s source), so it cannot tell a distractor
>    mention from a real placement, and the flow section correctly has no path table for a
>    splitter that isn't actually in the flow. This is the SAME class of problem as the
>    `type-reused` fix above — a token that quotes a node without the case using it — just
>    surfacing through a different rule (`hasSplitterToken`) that this round's instructions did
>    not authorise touching ("keep every other rule ... exactly as it is now"). Flagged as a
>    known, reported, unresolved residual rather than fixed by widening scope beyond what was
>    specified.

**Files:**
- Create: `packages/authoring/package.json`
- Create: `packages/authoring/index.ts`
- Create: `packages/authoring/specLint.ts`
- Create: `scripts/authoring/spec-check.mjs`
- Modify: `package.json` (scripts)
- Test: `packages/authoring/specLint.test.ts`

**Interfaces:**
- Consumes: `LEGACY_ALIASES`, `NODE_CATALOG` from `@judge/catalog` (Task 1).
- Produces:
  - `interface SpecIssue { level: 'error' | 'warning'; rule: string; message: string }`
  - `nodeTokens(md: string): string[]`
  - `lintSpec(md: string): SpecIssue[]`

- [ ] **Step 1: Create the package manifest**

`packages/authoring/package.json`:

```json
{
  "name": "@judge/authoring",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "index.ts",
  "exports": {
    ".": "./index.ts",
    "./*": "./*"
  },
  "dependencies": {
    "@judge/catalog": "*",
    "@judge/engine": "*",
    "@judge/problem-schema": "*"
  }
}
```

`packages/authoring/index.ts`:

```ts
export { lintSpec, nodeTokens } from './specLint.ts';
export type { SpecIssue } from './specLint.ts';
```

Run `npm install` so the workspace symlink exists.

- [ ] **Step 2: Write the failing test**

`packages/authoring/specLint.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { lintSpec, nodeTokens } from './specLint.ts';

/** A minimal spec that passes every rule, so each test can break exactly one thing. Node items
 * are numbered list entries, like a real filled-in spec, so type-reused has real list items to
 * count reuse over. */
const GOOD = `
## 3. The shape of the flow
| Path name | What lands here |
|---|---|
| urgent | anything on fire |
| normal | everything else |

## 4. The nodes
**Nodes this case needs**, in the order they run:
> 1. \`form-trigger\` — captures the request.
> 2. \`text-classifier\` with \`google-gemini-chat-model\` — sorts it into a path.
> 3. \`switch\` — routes on the category.
> 4. \`slack\` — flags urgent ones.
> 5. \`gmail\` — replies to everything else.

## 5. Examples to test it with
**The awkward one — Required.**
> A submission naming a product nobody stocks, which matches no path.
`;

/**
 * A "resolved" spec shaped like `trial-signup-desk.md`: no `## 3.`/`## 4.` numbering, no `>`
 * blockquote answer format, and backticked field names sitting right next to real node names —
 * exactly the shape that turned a whole-document, TEMPLATE.md-shaped scan into a false-positive
 * machine on every already-shipped case.
 */
const RESOLVED = `
# Case spec — Ferry Booking Desk

## 1. Identity
| Field | Value |
|---|---|
| **Slug** | \`ferry-booking-desk\` |

## 2. The scenario
Passengers submit \`subject\` and \`urgency\` values; the sheet also carries a \`bean\` column left
over from a copy-pasted template — none of these are nodes.

## 3. Node vocabulary

| Stage | Node | Type | Purpose |
|---|---|---|---|
| 1 | Trigger | \`form-trigger\` | Captures the booking |
| 2 | Notify | \`gmail\` | Confirms the booking |

## 4. The cases the flow gets tested on
Nothing unusual.
`;

describe('lintSpec', () => {
  it('passes a spec that names real, canonical nodes and gives every path an ending', () => {
    expect(lintSpec(GOOD).filter((i) => i.level === 'error')).toEqual([]);
  });

  it('flags a node type that does not exist as a warning, not an error', () => {
    const issues = lintSpec(GOOD.replace('`slack`', '`slack-notifier`'));
    const unknown = issues.find((i) => i.rule === 'unknown-token');
    expect(unknown?.level).toBe('warning');
    expect(unknown?.message).toContain('slack-notifier');
  });

  it('rejects a legacy alias and names the canonical replacement', () => {
    const issues = lintSpec(GOOD.replace('`text-classifier`', '`classify`'));
    const alias = issues.find((i) => i.rule === 'legacy-alias');
    expect(alias?.level).toBe('error');
    expect(alias?.message).toContain('text-classifier');
  });

  it('rejects a splitting node with fewer than two named paths', () => {
    const oneRow = GOOD.replace('| normal | everything else |\n', '');
    expect(lintSpec(oneRow)).toContainEqual(
      expect.objectContaining({ level: 'error', rule: 'splitter-without-paths' })
    );
  });

  it('rejects the same node type used twice, because nodeSetup is keyed by type', () => {
    const twice = GOOD.replace(
      '> 5. `gmail` — replies to everything else.',
      '> 5. `slack` — replies to everything else.'
    );
    expect(lintSpec(twice)).toContainEqual(
      expect.objectContaining({ level: 'error', rule: 'type-reused' })
    );
  });

  it('rejects an AI step with no model attached', () => {
    const noBrain = GOOD.replace(' with `google-gemini-chat-model`', '');
    expect(lintSpec(noBrain)).toContainEqual(
      expect.objectContaining({ level: 'error', rule: 'ai-without-model' })
    );
  });

  it('rejects a blank awkward example, because Stress Testing is built from it', () => {
    const blank = GOOD.replace(
      '> A submission naming a product nobody stocks, which matches no path.',
      '>'
    );
    expect(lintSpec(blank)).toContainEqual(
      expect.objectContaining({ level: 'error', rule: 'no-awkward-example' })
    );
  });

  it('finds node tokens and ignores prose backticks', () => {
    expect(nodeTokens('use `switch` when `moderate` difficulty')).toContain('switch');
    expect(nodeTokens('use `switch` when `moderate` difficulty')).not.toContain('moderate');
  });

  // --- Round 1 regression coverage: a document-wide token scan, and a section parser that
  // assumed TEMPLATE.md's pristine `## N.` structure instead of tolerating a resolved spec.

  it('produces zero errors on a resolved-shaped spec whose field names look like node ids', () => {
    expect(lintSpec(RESOLVED).filter((i) => i.level === 'error')).toEqual([]);
  });

  it('does not flag a legacy alias quoted inside a "Never use these names" block', () => {
    const withAliasNote = GOOD.replace(
      '## 5. Examples to test it with',
      '### Never use these names\n\nUsing `classify` instead of `text-classifier` produces a worse challenge.\n\n## 5. Examples to test it with'
    );
    expect(lintSpec(withAliasNote).find((i) => i.rule === 'legacy-alias')).toBeUndefined();
  });

  // --- Round 2 regression coverage: `type-reused` was counting a node named again in prose
  // describing an already-placed item (not a second instance), and the nodes/examples heading
  // keywords were too narrow to find either real spec's actual heading wording.

  it('finds a nodes section headed "Node vocabulary" and actually runs its rules', () => {
    const vocab = GOOD.replace('## 4. The nodes', '## 4. Node vocabulary');
    const notFound = lintSpec(vocab).find(
      (i) => i.rule === 'section-not-found' && i.message.includes('nodes section')
    );
    expect(notFound).toBeUndefined();

    // Prove the rules actually run under this heading, not just that lookup succeeds.
    const vocabWithAlias = vocab.replace('`text-classifier`', '`classify`');
    expect(lintSpec(vocabWithAlias).find((i) => i.rule === 'legacy-alias')).toBeDefined();
  });

  it('finds an examples section headed "The cases the flow gets tested on"', () => {
    const cases = GOOD.replace(
      '## 5. Examples to test it with',
      '## 5. The cases the flow gets tested on'
    );
    const notFound = lintSpec(cases).find(
      (i) => i.rule === 'section-not-found' && i.message.includes('examples section')
    );
    expect(notFound).toBeUndefined();
  });

  it('does not flag type-reused when a later item only refers back to an earlier node in prose', () => {
    const backref = GOOD.replace(
      '> 3. `switch` — routes on the category.',
      '> 3. `switch` — routes on the category the `text-classifier` step already decided.'
    );
    expect(lintSpec(backref).find((i) => i.rule === 'type-reused')).toBeUndefined();
  });

  // A genuine reuse — two list items whose first token is the same node type — is covered above
  // by "rejects the same node type used twice, because nodeSetup is keyed by type".
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npx vitest run packages/authoring/specLint.test.ts`
Expected: FAIL — `Cannot find module './specLint.ts'`.

- [ ] **Step 4: Implement `specLint.ts`**

```ts
import { NODE_CATALOG, LEGACY_ALIASES } from '@judge/catalog';

export interface SpecIssue {
  level: 'error' | 'warning';
  rule: string;
  message: string;
}

/**
 * Backticked words in a spec that are prose, not node types. Same list as
 * `authoringTemplate.test.js` keeps, for the same reason: an author writes
 * `moderate` and `linear` in backticks because the template asks them to.
 */
const NOT_NODE_TYPES = new Set(['easy', 'moderate', 'difficult', 'linear', 'no-ai']);

/** Nodes with more than one exit. Every exit must lead somewhere or the learner is stuck. */
const SPLITTERS = ['if', 'switch', 'loop-over-items', 'compare-datasets', 'sentiment-analysis'];

/** AI roots need a model attached over `ai_languageModel`; the picker offers several. */
const AI_ROOTS = [
  'text-classifier',
  'basic-llm-chain',
  'information-extractor',
  'sentiment-analysis',
  'summarization-chain',
  'ai-agent',
];

const isModel = (type: string): boolean =>
  (NODE_CATALOG as Record<string, { category?: string }>)[type]?.category === 'model';

/**
 * Every `backticked-token` shaped like a node id, anywhere in the document, in order of first
 * appearance. Deliberately document-wide and unscoped by section — Task 3's brief-shrinker
 * consumes this directly and filters by catalog membership itself, so scoping to one section
 * belongs inside `lintSpec`, not here.
 */
export function nodeTokens(md: string): string[] {
  const raw = (md.match(/`[a-z][a-z0-9-]{2,}`/g) ?? []).map((t) => t.slice(1, -1));
  return [...new Set(raw)].filter((t) => !NOT_NODE_TYPES.has(t));
}

/** Node-shaped backticked tokens in a slice of text, in appearance order, NOT deduplicated —
 * callers that care about reuse need every occurrence, not the unique set. */
function tokensIn(text: string): string[] {
  return (text.match(/`[a-z][a-z0-9-]{2,}`/g) ?? [])
    .map((t) => t.slice(1, -1))
    .filter((t) => !NOT_NODE_TYPES.has(t));
}

/**
 * The FIRST backticked token on each nodes-section list-item LINE — numbered (`1.`, `2.`) or
 * bulleted (`-`, `*`), with or without a leading `>` blockquote marker and any `**bold**` wrapper
 * around the token. This is the node a list item is ABOUT; anything after it on the same line, or
 * on a later item's line, is that item's description, not a second placement. A continuation
 * line (no list marker) is not an item at all, so it can name the same node again in prose — "the
 * brain attached to the `information-extractor` step" — without counting as reuse.
 */
function firstTokenOfListItems(text: string): string[] {
  const itemRe = /^\s*>?\s*(?:\d+\.|[-*])\s+\*{0,2}`([a-z][a-z0-9-]{2,})`/;
  const heads: string[] = [];
  for (const line of text.split('\n')) {
    const m = line.match(itemRe);
    if (m) heads.push(m[1]);
  }
  return heads.filter((t) => !NOT_NODE_TYPES.has(t));
}

interface Heading {
  index: number;
  level: number;
  text: string;
}

/** Every markdown heading in `md`, any level, in document order, with its own text. */
function allHeadings(md: string): Heading[] {
  const re = /^(#{1,6})[ \t]+(.*)$/gm;
  const list: Heading[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    list.push({ index: m.index, level: m[1].length, text: m[2] });
  }
  return list;
}

/**
 * The body of the first heading (in document order) whose TEXT satisfies `matches`, running to
 * the next heading of the SAME OR HIGHER level (fewer or equal `#`s) — or to the end of the
 * document. Returns null when nothing matches.
 *
 * Only headings at level 2 or deeper are candidates: every case spec carries exactly one level-1
 * heading, the document's own title ("# Case spec — …" / "# Case brief — …"), and that title
 * always contains the word "case" — which the examples-section keyword list below also matches.
 * Without this floor, the title would win every examples-section lookup (it is always the FIRST
 * heading in the document) and "the examples section" would become the entire rest of the file.
 *
 * This replaces indexing on `TEMPLATE.md`'s pristine `## N.` numbering, because a spec that has
 * already been resolved into a real case rewrites its own headings ("Node vocabulary" instead of
 * "The nodes", a different heading level, extra sections appended after §10) — the numbering is a
 * fill-in-the-blank convention, not something a finished document is obliged to keep.
 */
function findSection(md: string, matches: (headingText: string) => boolean, headings: Heading[]): string | null {
  const heading = headings.find((h) => h.level >= 2 && matches(h.text));
  if (!heading) return null;
  const lineEnd = md.indexOf('\n', heading.index);
  const bodyStart = lineEnd === -1 ? md.length : lineEnd + 1;
  const next = headings.find((h) => h.index > heading.index && h.level <= heading.level);
  const bodyEnd = next ? next.index : md.length;
  return md.slice(bodyStart, bodyEnd);
}

const ALIAS_HEADING = /never use|alias/i;

/**
 * Strip the two regions a nodes section can contain that name node types WITHOUT using them:
 * a "never use these names" / aliases sub-heading (verbatim from `TEMPLATE.md`, or a spec's own
 * pre-send checklist quoting it back), and checklist lines (`- [ ]` / `- [x]`) generally, which
 * attest to a rule rather than declare a node.
 */
function stripQuotedNodeNames(text: string): string {
  const local = allHeadings(text);
  let result = text;
  for (let i = local.length - 1; i >= 0; i--) {
    const h = local[i];
    if (!ALIAS_HEADING.test(h.text)) continue;
    const next = local.find((o, j) => j > i && o.level <= h.level);
    const end = next ? next.index : text.length;
    result = result.slice(0, h.index) + result.slice(end);
  }
  return result
    .split('\n')
    .filter((line) => !/^\s*-\s\[[ xX]\]/.test(line))
    .join('\n');
}

// A heading counts as the nodes section if it names nodes at all, UNLESS it is the "never use
// these names" warning — that heading also says "names" and would otherwise self-match.
const NEVER_USE_OR_ALIAS = /\b(never use|alias(es)?)\b/i;
const nodesHeadingMatches = (text: string): boolean => /\bnodes?\b/i.test(text) && !NEVER_USE_OR_ALIAS.test(text);
const flowHeadingMatches = (text: string): boolean => /\bflow\b/i.test(text);
const examplesHeadingMatches = (text: string): boolean => /\b(example|examples|case|cases|test|tested)\b/i.test(text);

/**
 * Lint one filled-in case spec.
 *
 * Every rule here has already forced a case to be redesigned AFTER it was written, which is the
 * most expensive failure this pipeline has. All of them are decidable from the text.
 *
 * Two things this deliberately is NOT:
 *  - A whole-document token scan. A spec's own slug, its schema/column field names, and prose
 *    about OTHER cases' aliases are indistinguishable from a real node id by shape alone, and the
 *    only place node ids are actually placed is the nodes section — so every node-token rule is
 *    scoped to it, and an unrecognised token is a WARNING (`unknown-token`), never an error,
 *    because a field name shaped like a node id is the common case, not the rare one.
 *  - Reliant on `TEMPLATE.md`'s exact `## N.` heading shape or wording. A resolved spec keeps
 *    whatever heading wording and level it ended up with ("Node vocabulary", "The cases the flow
 *    gets tested on"), so each section is found by a broad keyword match, and a section this rule
 *    needs but genuinely cannot find degrades to a `section-not-found` warning naming which check
 *    it skipped, rather than guessing or erroring on the absence.
 */
export function lintSpec(md: string): SpecIssue[] {
  const issues: SpecIssue[] = [];
  const err = (rule: string, message: string) => issues.push({ level: 'error', rule, message });
  const warn = (rule: string, message: string) => issues.push({ level: 'warning', rule, message });
  const sectionSkipped = (message: string) => warn('section-not-found', message);

  const headings = allHeadings(md);
  let hasSplitterToken = false;

  // --- The nodes section: unknown-token, legacy-alias, type-reused and ai-without-model all
  // read from here, and nowhere else.
  const nodesSectionRaw = findSection(md, nodesHeadingMatches, headings);
  if (nodesSectionRaw === null) {
    sectionSkipped(
      'could not find the nodes section — skipping unknown-token, legacy-alias, type-reused, ai-without-model'
    );
  } else {
    const nodesSection = stripQuotedNodeNames(nodesSectionRaw);
    const named = tokensIn(nodesSection);

    for (const t of named) {
      if (!(t in NODE_CATALOG)) {
        warn(
          'unknown-token',
          `\`${t}\` is not a registered node type — if it names a node this spec cannot be built; if it is a field or column name, ignore`
        );
        continue;
      }
      const canonical = (LEGACY_ALIASES as Record<string, string>)[t];
      if (canonical) {
        err(
          'legacy-alias',
          `\`${t}\` is a compatibility alias kept only for existing cases — use \`${canonical}\``
        );
      }
    }

    const knownNamed = named.filter((t) => t in NODE_CATALOG);
    hasSplitterToken = knownNamed.some((t) => SPLITTERS.includes(t));

    // Reuse is counted over the node each list item is ABOUT — its first backticked token —
    // not every backtick in the section. A later item's prose is free to refer back to an
    // already-placed node ("the brain attached to the `information-extractor` step") without
    // that counting as a second instance.
    const heads = firstTokenOfListItems(nodesSection).filter((t) => t in NODE_CATALOG);
    const seen = new Set<string>();
    for (const t of heads) {
      if (seen.has(t)) {
        err(
          'type-reused',
          `\`${t}\` is named twice — nodeSetup is keyed by node type, so both copies share one answer key`
        );
        break;
      }
      seen.add(t);
    }

    if (knownNamed.some((t) => AI_ROOTS.includes(t)) && !knownNamed.some(isModel)) {
      err(
        'ai-without-model',
        'an AI step is named with no chat model — pick `google-gemini-chat-model` or `openai-chat-model`'
      );
    }
  }

  // --- The flow section: only consulted when a splitter was actually named in the nodes
  // section, because a linear case has no exits to check.
  if (hasSplitterToken) {
    const flowSection = findSection(md, flowHeadingMatches, headings);
    if (flowSection === null) {
      sectionSkipped('could not find the flow section — skipping splitter-without-paths');
    } else {
      const pathRows = (flowSection.match(/^\|(?!\s*-)(?!\s*Path name).+\|.+\|\s*$/gim) ?? []).filter(
        (r) => r.split('|').some((cell) => cell.trim().length > 0)
      );
      if (pathRows.length < 2) {
        err(
          'splitter-without-paths',
          'a splitting node is named but the flow section lists fewer than two paths — every exit must lead somewhere or a correct flow cannot complete its phase'
        );
      }
    }
  }

  // --- The examples section: the awkward row is what Stress Testing is built from.
  const examplesSection = findSection(md, examplesHeadingMatches, headings);
  if (examplesSection === null) {
    sectionSkipped('could not find the examples section — skipping no-awkward-example');
  } else {
    const awkwardAt = examplesSection.toLowerCase().indexOf('awkward');
    if (awkwardAt === -1) {
      sectionSkipped(
        'found the examples section but no "awkward" marker in it — skipping no-awkward-example'
      );
    } else {
      const awkward = examplesSection.slice(awkwardAt);
      const answered = awkward
        .split('\n')
        .filter((l) => l.trimStart().startsWith('>'))
        .some((l) => l.replace(/^\s*>\s*/, '').trim().length > 10);
      if (!answered) {
        err(
          'no-awkward-example',
          'the awkward example is blank — it is what the Stress Testing questions are built from'
        );
      }
    }
  }

  if (!nodeTokens(md).length) warn('no-nodes', 'no node types named anywhere in the spec');
  return issues;
}
```

- [ ] **Step 5: Run the test to green**

Run: `npx vitest run packages/authoring/specLint.test.ts`
Expected: PASS, 13 tests.

- [ ] **Step 6: Add the CLI**

`scripts/authoring/spec-check.mjs`:

```js
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
```

Add to `package.json` scripts:

```json
    "case:spec-check": "node scripts/authoring/spec-check.mjs",
```

- [ ] **Step 7: Run it against all three real specs**

Run: `for s in trial-signup-desk ops-request-desk low-stock-morning-post; do npm run case:spec-check -- docs/case-specs/$s.md; done`

Expected, with the round-2 implementation above:

- `ops-request-desk.md` exits **0** — the round-1 `type-reused` residual on `information-extractor`
  is gone now that reuse is counted over each list item's first token only; two `unknown-token`
  warnings on `` `detail` `` remain (a genuine AI-output field name mentioned twice in the answer
  text) but a warning never blocks.
- `low-stock-morning-post.md` exits **0**, clean — no output at all. The round-1 `type-reused`
  residual on `schedule` is gone for the same reason.
- `trial-signup-desk.md` still exits **1**, and finding its nodes section (via the broadened
  "node"/"nodes" heading match, fixing the section-not-found problem this round set out to fix)
  is exactly what surfaces it. Two genuine, different findings, neither a bug in this round's two
  fixes:
  1. **`legacy-alias` on `` `action` ``.** Row 4 of the "Node vocabulary" table gives the "Send
     Reply (Gmail)" node's Type as `` `action` `` instead of `` `gmail` `` — real, stale text in
     the spec (the built case almost certainly uses the real catalog type; the `.md` documentation
     was never updated). Out of scope to fix here — `docs/case-specs/` is a fixture this task must
     not edit.
  2. **`splitter-without-paths` on `` `switch` ``.** The document's own "Distractors worth
     offering" list names `` `switch` `` as bait ("reaching for a router in a flow that has
     nothing to route") — it is not part of the actual answer, and the flow is explicitly linear.
     `hasSplitterToken` reads the full nodes-section token scan (this round's fix only narrowed
     `type-reused`'s source, per "keep every other rule ... exactly as it is now"), so it cannot
     tell a distractor mention from a real placement. This is the same class of problem as the
     `type-reused` fix — a token that quotes a node without the case using it — surfacing through
     a different rule this round did not authorise touching. Known, reported, unresolved residual.

**If a NEW error appears here that is not one of the two above on `trial-signup-desk.md`**, or any
error at all on the other two, read it before changing the linter — all three specs were built
successfully, so a new finding is either a real latent defect worth reporting or a false positive
worth fixing. Never silence a rule to make a fixture pass without saying which of the two it was.

- [ ] **Step 8: Full gate and commit**

Run: `npm test && npm run typecheck`

```bash
npm run case:verify -- on-branch <your-branch>
git add packages/authoring package.json scripts/authoring/spec-check.mjs
git commit -m "$(cat <<'EOF'
Lint a case spec in one second, instead of discovering it after 33 minutes

Every rule in specLint has already forced a case to be redesigned after it was
written — an alias, a splitter whose exits go nowhere, one node type used twice,
an AI step with no brain. All of them are decidable from the spec text.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `case:brief` — stop five agents reading the whole library

Every agent reads a 42.7KB skill, a 26.6KB catalogue of 200 node types, and up to 190KB of reference cases before writing a line. For a case using six types, 194 catalogue entries are dead weight — read five times per run. This task narrows *only* the node menu; the authoring skill is still read in full, because it is the contract.

**Files:**
- Create: `packages/authoring/briefingPack.ts`
- Modify: `packages/authoring/index.ts`
- Create: `scripts/authoring/brief.mjs`
- Modify: `package.json`
- Test: `packages/authoring/briefingPack.test.ts`

**Interfaces:**
- Consumes: `nodeTokens()` from `specLint.ts`; `NODE_CATALOG`, `LEGACY_ALIASES`, `isRouterEntry` from `@judge/catalog`.
- Produces:
  - `candidateTypes(specMd: string): string[]` — types named in the spec, plus same-category siblings as distractor candidates, aliases excluded.
  - `nodeMenu(types: string[]): string` — a markdown table.
  - `briefingPack(input: { slug: string; specMd: string }): string`

- [ ] **Step 1: Write the failing test**

`packages/authoring/briefingPack.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { NODE_CATALOG, LEGACY_ALIASES } from '@judge/catalog';
import { candidateTypes, nodeMenu, briefingPack } from './briefingPack.ts';

const SPEC = `
## 4. The nodes
> \`form-trigger\` then \`text-classifier\` with \`google-gemini-chat-model\`, then \`switch\`, ending at \`slack\`.
`;

describe('candidateTypes', () => {
  it('includes every type the spec names', () => {
    const types = candidateTypes(SPEC);
    for (const named of ['form-trigger', 'text-classifier', 'google-gemini-chat-model', 'switch', 'slack']) {
      expect(types).toContain(named);
    }
  });

  it('adds same-category siblings, so probes still have real distractors', () => {
    expect(candidateTypes(SPEC).length).toBeGreaterThan(5);
  });

  it('never offers a legacy alias', () => {
    const types = candidateTypes(SPEC);
    for (const alias of Object.keys(LEGACY_ALIASES)) expect(types).not.toContain(alias);
  });

  it('stays far smaller than the whole catalog', () => {
    expect(candidateTypes(SPEC).length).toBeLessThan(Object.keys(NODE_CATALOG).length / 2);
  });
});

describe('nodeMenu', () => {
  it('gives one row per type, carrying the facts that decide the choice', () => {
    const md = nodeMenu(['switch', 'text-classifier']);
    const rows = md.split('\n').filter((l) => l.startsWith('| `'));
    expect(rows).toHaveLength(2);
    expect(md).toContain('router');        // switch has more than one exit
    expect(md).toContain('needs a model'); // text-classifier is an AI root
  });
});

describe('briefingPack', () => {
  it('carries the spec verbatim and the narrow menu, and points at the full contract', () => {
    const pack = briefingPack({ slug: 'demo-case', specMd: SPEC });
    expect(pack).toContain('demo-case');
    expect(pack).toContain(SPEC.trim());
    expect(pack).toContain('.claude/skills/authoring-a-problem/SKILL.md');
    expect(pack).toContain('| `switch`');
  });

  it('is a fraction of the size of the node library doc it replaces', () => {
    // docs/node-library-catalog.md is 26.6KB. The pack exists to make that read
    // unnecessary, so it has to actually be small.
    expect(briefingPack({ slug: 'demo-case', specMd: SPEC }).length).toBeLessThan(8000);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run packages/authoring/briefingPack.test.ts`
Expected: FAIL — `Cannot find module './briefingPack.ts'`.

- [ ] **Step 3: Implement `briefingPack.ts`**

```ts
import { NODE_CATALOG, LEGACY_ALIASES, isRouterEntry } from '@judge/catalog';
import { nodeTokens } from './specLint.ts';

interface Entry {
  label?: string;
  category?: string;
  needsModel?: boolean;
  branches?: unknown[];
  params?: Array<{ key: string }>;
}

const entry = (type: string): Entry | undefined => (NODE_CATALOG as Record<string, Entry>)[type];
const isAlias = (type: string): boolean => type in (LEGACY_ALIASES as Record<string, string>);

/** How many same-category siblings to offer as distractor candidates per named type. */
const SIBLINGS_PER_TYPE = 4;

/**
 * The types this case could plausibly use: the ones the spec names, plus a few
 * siblings from each of their categories.
 *
 * The siblings are not padding. A picker containing only correct answers is not a
 * question, so probes need plausible wrong nodes — and an author handed exactly six
 * types will write six weak distractors. This keeps the menu at tens of entries
 * rather than 200, which is the point, while leaving the teaching intact.
 */
export function candidateTypes(specMd: string): string[] {
  const named = nodeTokens(specMd).filter((t) => t in NODE_CATALOG && !isAlias(t));
  const wanted = new Set(named);

  const byCategory = new Map<string, string[]>();
  for (const [type, e] of Object.entries(NODE_CATALOG as Record<string, Entry>)) {
    if (isAlias(type)) continue;
    const cat = e.category ?? 'other';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(type);
  }

  for (const type of named) {
    const cat = entry(type)?.category ?? 'other';
    for (const sibling of (byCategory.get(cat) ?? []).slice(0, SIBLINGS_PER_TYPE + 1)) {
      if (sibling !== type) wanted.add(sibling);
    }
  }
  return [...wanted].sort();
}

/** One row per type, carrying only what decides whether it is the right node. */
export function nodeMenu(types: string[]): string {
  const rows = types.map((type) => {
    const e = entry(type);
    const notes = [
      e?.needsModel ? 'needs a model' : null,
      isRouterEntry(e ?? {}) ? 'router (one exit per branch)' : null,
    ]
      .filter(Boolean)
      .join(', ');
    const params = (e?.params ?? []).map((p) => p.key).slice(0, 6).join(', ');
    return `| \`${type}\` | ${e?.label ?? ''} | ${e?.category ?? ''} | ${notes} | ${params} |`;
  });
  return ['| type | label | category | notes | parameters |', '|---|---|---|---|---|', ...rows].join('\n');
}

/**
 * The pack an authoring agent is given instead of the 200-type library doc.
 *
 * It replaces ONE read (docs/node-library-catalog.md, 26.6KB) and nothing else:
 * the authoring skill is the test-enforced contract and is still read in full.
 */
export function briefingPack({ slug, specMd }: { slug: string; specMd: string }): string {
  const types = candidateTypes(specMd);
  return [
    `# Briefing pack — ${slug}`,
    '',
    'Generated by `npm run case:brief`. It replaces one read only: the 200-type node',
    'library doc. **Still read the contract in full** —',
    '`.claude/skills/authoring-a-problem/SKILL.md` — and never pick a node that is not',
    'in the table below. If this case needs something absent from it, stop and report',
    '`blocked: true`; substituting a near-miss builds a case that teaches the wrong thing.',
    '',
    `## The ${types.length} node types available to this case`,
    '',
    nodeMenu(types),
    '',
    '## The spec, verbatim',
    '',
    specMd.trim(),
    '',
  ].join('\n');
}
```

Add to `packages/authoring/index.ts`:

```ts
export { candidateTypes, nodeMenu, briefingPack } from './briefingPack.ts';
```

- [ ] **Step 4: Run the test to green**

Run: `npx vitest run packages/authoring/briefingPack.test.ts`
Expected: PASS, 7 tests. If the size assertion fails, lower `SIBLINGS_PER_TYPE` rather than raising the limit — a pack that is not small has no reason to exist.

- [ ] **Step 5: Add the CLI**

`scripts/authoring/brief.mjs`:

```js
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
```

Add to `package.json`:

```json
    "case:brief": "node scripts/authoring/brief.mjs",
```

- [ ] **Step 6: Generate a pack for a real spec and read it yourself**

Run: `npm run case:brief -- low-stock-morning-post docs/case-specs/low-stock-morning-post.md`

Then check the pack contains every type the shipped case actually uses:

```bash
node --experimental-strip-types -e "
import('./packages/problems/low-stock-morning-post/index.js').then(async (m) => {
  const p = Object.values(m).find((v) => v?.dissection);
  const pack = (await import('node:fs')).readFileSync('.authoring-runs/brief-low-stock-morning-post.md', 'utf8');
  const missing = p.nodePalette.map((n) => n.type).filter((t) => !pack.includes('\`' + t + '\`'));
  console.log(missing.length ? 'MISSING FROM PACK: ' + missing.join(', ') : 'pack covers every palette type');
});"
```

Expected: `pack covers every palette type`. A pack missing a required type is worse than no pack — if any are missing, widen `candidateTypes` (more siblings, or include every type in a named type's category) rather than shipping it.

- [ ] **Step 7: Full gate and commit**

Run: `npm test && npm run typecheck`

```bash
npm run case:verify -- on-branch <your-branch>
git add packages/authoring package.json scripts/authoring/brief.mjs
git commit -m "$(cat <<'EOF'
Hand an authoring agent the ten nodes it might use, not all two hundred

Five agents each read a 26.6KB library doc per run, for a case that uses six node
types. The pack carries the named types plus same-category siblings, so probes
still have real distractors, and points at the contract rather than replacing it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `settings` enters the schema — the graded surface nothing validates

`nodeSetup[type].settings` is absent from `nodeSetupSchema`, and zod strips unknown keys, so `validateProblem()` has never seen it. Consequences today: the template's wrong shape (`options: [{ correct: true }]`) makes `graded.correct` undefined — **every learner is marked wrong forever and the answer key ships to the browser** — and "check node settings by hand" is a permanent PR checklist item plus a slice of every review round.

All five shipped cases already use the right shape (`{ key, correct, why }`, verified 2026-08-11), so this is additive, not a migration.

**Files:**
- Modify: `packages/problem-schema/types.ts` (`nodeSetupSchema`, lines 131-246)
- Create: `packages/problem-schema/settingKeys.ts`
- Modify: `packages/problem-schema/validateProblem.ts`
- Modify: `packages/problem-schema/index.ts`
- Test: `packages/problem-schema/settingKeys.test.ts`, `packages/problem-schema/validateProblem.test.ts`

**Interfaces:**
- Produces: `GRADED_SETTING_KEYS: readonly string[]`, exported from `@judge/problem-schema`. Consumed by Task 5's audit and by the parity test.

- [ ] **Step 1: Write the failing tests**

`packages/problem-schema/settingKeys.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { SETTINGS_SPEC } from '../../apps/web/src/n8n/nodeSettings.js';
import { GRADED_SETTING_KEYS } from './settingKeys.ts';

describe('GRADED_SETTING_KEYS', () => {
  it('matches the settings the NDV can actually render', () => {
    // The editor renders SETTINGS_SPEC. A problem grading a key absent from it asks
    // a question the learner is never shown, so the two lists must agree exactly.
    expect([...GRADED_SETTING_KEYS].sort()).toEqual(SETTINGS_SPEC.map((s) => s.key).sort());
  });
});
```

Append to `packages/problem-schema/validateProblem.test.ts`:

```ts
  it('rejects the template settings shape, which silently marks every learner wrong', () => {
    const p = base();
    const type = Object.keys(p.nodeSetup)[0];
    p.nodeSetup[type].settings = [{ key: 'onError', options: [{ value: 'stopWorkflow', correct: true }] }];
    expect(validateProblem(p).valid).toBe(false);
  });

  it('rejects a graded setting the NDV cannot render', () => {
    const p = base();
    const type = Object.keys(p.nodeSetup)[0];
    p.nodeSetup[type].settings = [{ key: 'notARealSetting', correct: 'x', why: { x: 'because', y: 'no' } }];
    const errors = validateProblem(p).issues.filter((i) => i.level === 'error');
    expect(errors.some((e) => e.message.includes('notARealSetting'))).toBe(true);
  });

  it('rejects a correct setting value with no explanation of its own', () => {
    const p = base();
    const type = Object.keys(p.nodeSetup)[0];
    p.nodeSetup[type].settings = [
      { key: 'executeOnce', correct: false, why: { true: 'runs once per item' } },
    ];
    const errors = validateProblem(p).issues.filter((i) => i.level === 'error');
    expect(errors.some((e) => e.path.includes('executeOnce'))).toBe(true);
  });

  it('warns when only the correct value is explained, because the teaching is in the wrong ones', () => {
    const p = base();
    const type = Object.keys(p.nodeSetup)[0];
    p.nodeSetup[type].settings = [{ key: 'executeOnce', correct: false, why: { false: 'once per item' } }];
    const warnings = validateProblem(p).issues.filter((i) => i.level === 'warning');
    expect(warnings.some((w) => w.path.includes('executeOnce'))).toBe(true);
  });
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run packages/problem-schema`
Expected: FAIL — `settingKeys.ts` is missing, and the four `validateProblem` cases all pass nothing because `settings` is stripped before any rule can see it.

- [ ] **Step 3: Add `settingKeys.ts`**

```ts
/**
 * The node settings a problem may grade.
 *
 * This mirrors `SETTINGS_SPEC` in `apps/web/src/n8n/nodeSettings.js`, which is what
 * the NDV actually renders. A package cannot import from `apps/`, so the list is
 * duplicated here and pinned by `settingKeys.test.ts` — a problem grading a key the
 * editor does not render asks a question the learner is never shown.
 */
export const GRADED_SETTING_KEYS = Object.freeze([
  'alwaysOutputData',
  'executeOnce',
  'retryOnFail',
  'maxTries',
  'waitBetweenTries',
  'onError',
  'notes',
  'notesInFlow',
]);
```

Export it from `packages/problem-schema/index.ts`:

```ts
export { GRADED_SETTING_KEYS } from './settingKeys.ts';
```

- [ ] **Step 4: Add `settings` to `nodeSetupSchema`**

In `packages/problem-schema/types.ts`, inside `nodeSetupSchema` after the `fields` array and before the closing `})`:

```ts
  /**
   * Graded node settings — n8n's Settings tab, not its Parameters tab.
   *
   * A DIFFERENT shape from `fields` on purpose: a setting's control comes from
   * `SETTINGS_SPEC`, so the problem supplies only the answer and the explanations,
   * keyed by the value the learner chose. `why` keys are strings even when the
   * value is a boolean (`{ false: '…', true: '…' }`), because that is how a form
   * value arrives.
   *
   * This block was absent from the schema until 2026-08-11, and zod strips unknown
   * keys — so `validateProblem()` never saw it, and the template's wrong shape
   * (`options: [{ correct: true }]`) produced an undefined `graded.correct`, which
   * marks every learner wrong forever AND ships the answer key to the browser.
   */
  settings: z
    .array(
      z.object({
        key: z.string().min(1),
        correct: z.union([z.string(), z.number(), z.boolean()]),
        why: z.record(z.string().min(1)),
      })
    )
    .optional(),
```

- [ ] **Step 5: Add the three rules to `validateProblem.ts`**

Import the key list at the top of the file:

```ts
import { GRADED_SETTING_KEYS } from './settingKeys.ts';
```

Then, in the existing loop over `nodeSetup` entries, beside the field checks:

```ts
    for (const s of setup.settings ?? []) {
      const at = `nodeSetup.${type}.settings.${s.key}`;
      if (!GRADED_SETTING_KEYS.includes(s.key)) {
        err(at, `"${s.key}" is not a setting the NDV renders — see GRADED_SETTING_KEYS`);
      }
      // A form value arrives as a string, so the map is keyed by String(correct).
      const correctKey = String(s.correct);
      if (!s.why?.[correctKey]) {
        err(at, `no \`why\` for the correct value "${correctKey}" — Iris reads back the explanation for whatever was chosen`);
      }
      if (Object.keys(s.why ?? {}).length < 2) {
        warn(at, 'only one value is explained; the teaching lives in the wrong ones');
      }
    }
```

- [ ] **Step 6: Run the schema tests, then the whole suite**

Run: `npx vitest run packages/problem-schema && npm test && npm run typecheck`
Expected: PASS. **If one of the five shipped cases now fails, stop and report it** — that is the latent bug this task exists to expose. Do not edit the case and do not loosen the rule without stating which case, which key, and why.

- [ ] **Step 7: Commit**

```bash
npm run case:verify -- on-branch <your-branch>
git add packages/problem-schema
git commit -m "$(cat <<'EOF'
Validate node settings, the one graded surface nothing ever checked

`settings` was absent from nodeSetupSchema and zod strips unknown keys, so
validateProblem never saw it: no check that the key is one the NDV renders, none
that the correct value is explained, none that a wrong value teaches anything.
The template's wrong shape makes graded.correct undefined, which marks every
learner wrong forever and ships the answer key to the browser.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `case:audit` — the mechanical half of review, as code

A review round costs ~29 minutes. Much of it is applying rules, not judgement: does every wrong option teach, does every misconception have a label, does every branch reach a terminal, does `simulateAll` pass. Move all of it into a script so reviewers spend their round on the two things no script can do — **is this answerable, and is the answer key right.**

**Files:**
- Create: `packages/authoring/audit.ts`
- Modify: `packages/authoring/index.ts`
- Create: `scripts/authoring/audit.mjs`
- Modify: `scripts/problem-check.mjs`, `scripts/authoring/verify.mjs`, `package.json`
- Test: `packages/authoring/audit.test.ts`

**Interfaces:**
- Consumes: `simulateAll`, `enumerateItems` from `@judge/engine`; `openBranchIds` from `@judge/engine/branchReach.js`.
- Produces:
  - `interface AuditFinding { rule: string; level: 'blocker' | 'note'; where: string; message: string }`
  - `auditProblem(problem: unknown): AuditFinding[]`

- [ ] **Step 1: Write the failing test**

`packages/authoring/audit.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { problemList } from '@judge/problems';
import { auditProblem } from './audit.ts';

/** A deep clone, so each test can break exactly one thing. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const base = (): any => JSON.parse(JSON.stringify(problemList[0]));

describe('auditProblem', () => {
  it('finds no blocker in any shipped case', () => {
    for (const p of problemList) {
      const blockers = auditProblem(p).filter((f) => f.level === 'blocker');
      expect(blockers, `${p.id}: ${JSON.stringify(blockers, null, 2)}`).toEqual([]);
    }
  });

  it('blocks a probe misconception code with no label', () => {
    const p = base();
    const probe = Object.values<any>(p.nodeProbes).find((pr) => pr.options.some((o) => o.misconception));
    probe.options.find((o) => o.misconception).misconception = 'invented-code-with-no-label';
    expect(auditProblem(p)).toContainEqual(
      expect.objectContaining({ level: 'blocker', rule: 'misconception-unlabelled' })
    );
  });

  it('blocks a wrong field option with no `why` to teach from', () => {
    const p = base();
    const type = Object.keys(p.nodeSetup).find((t) => p.nodeSetup[t].fields?.some((f) => f.options));
    const field = p.nodeSetup[type].fields.find((f) => f.options);
    delete field.options.find((o) => !o.correct).why;
    expect(auditProblem(p)).toContainEqual(
      expect.objectContaining({ level: 'blocker', rule: 'why-missing' })
    );
  });

  it('blocks a probe option with no response, because the probe teaches through it', () => {
    const p = base();
    delete Object.values<any>(p.nodeProbes)[0].options[0].response;
    expect(auditProblem(p)).toContainEqual(
      expect.objectContaining({ level: 'blocker', rule: 'response-missing' })
    );
  });

  it('blocks a dissection question whose correctType matches no option', () => {
    const p = base();
    p.dissection[0].correctType = 'a-type-no-option-offers';
    expect(auditProblem(p)).toContainEqual(
      expect.objectContaining({ level: 'blocker', rule: 'correct-type-unreachable' })
    );
  });

  it('blocks when the deliberate gap case is missing', () => {
    const p = base();
    for (const c of p.sampleCases) if (c.branch === null) c.branch = p.branches[0].id;
    expect(auditProblem(p)).toContainEqual(expect.objectContaining({ level: 'blocker', rule: 'gap-case' }));
  });

  it('blocks a required node type the Understand quiz never unlocks', () => {
    const p = base();
    for (const d of p.dissection) d.unlocks = [];
    expect(auditProblem(p)).toContainEqual(
      expect.objectContaining({ level: 'blocker', rule: 'unlocks-incomplete' })
    );
  });

  it('blocks a required node type no phase makes pickable', () => {
    const p = base();
    for (const phase of p.buildPhases) phase.pickable = [];
    expect(auditProblem(p)).toContainEqual(expect.objectContaining({ level: 'blocker', rule: 'not-pickable' }));
  });

  it('blocks a reference graph the simulator cannot deliver', () => {
    const p = base();
    p.referenceGraph.edges = [];
    expect(auditProblem(p)).toContainEqual(
      expect.objectContaining({ level: 'blocker', rule: 'simulate-all' })
    );
  });

  it('notes an answer key clustered at the top of every list', () => {
    const p = base();
    const toFront = (options, isCorrect) => {
      const at = options.findIndex(isCorrect);
      if (at > 0) options.unshift(...options.splice(at, 1));
    };
    for (const d of p.dissection) toFront(d.options, (o) => o.type === d.correctType);
    for (const setup of Object.values<any>(p.nodeSetup)) {
      for (const f of setup.fields ?? []) {
        if (Array.isArray(f.options)) toFront(f.options, (o) => o.correct);
      }
    }
    for (const probe of Object.values<any>(p.nodeProbes ?? {})) toFront(probe.options, (o) => o.correct);
    expect(auditProblem(p)).toContainEqual(expect.objectContaining({ level: 'note', rule: 'option-spread' }));
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run packages/authoring/audit.test.ts`
Expected: FAIL — `Cannot find module './audit.ts'`.

- [ ] **Step 3: Implement `audit.ts`**

```ts
import { simulateAll, enumerateItems } from '@judge/engine';
import { openBranchIds } from '@judge/engine/branchReach.js';

export interface AuditFinding {
  rule: string;
  level: 'blocker' | 'note';
  where: string;
  message: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- problem data is typed by validateProblem, not here */
type Problem = any;

/** Every node type some build phase requires the learner to place. */
function requiredTypes(problem: Problem): string[] {
  return [...new Set((problem.buildPhases ?? []).flatMap((p: any) => p.nodeTypes ?? []))] as string[];
}

/**
 * The mechanical half of a case review.
 *
 * Every rule here was previously applied by an agent reading a checklist, at ~29
 * minutes a round. None of them need judgement, so none of them should cost a
 * revision cycle. What is deliberately NOT here: whether a question is answerable
 * from what the learner is shown, and whether the authored answer is right. Those
 * are why `case_review` still exists.
 */
export function auditProblem(problem: Problem): AuditFinding[] {
  const out: AuditFinding[] = [];
  const blocker = (rule: string, where: string, message: string) =>
    out.push({ rule, level: 'blocker', where, message });
  const note = (rule: string, where: string, message: string) =>
    out.push({ rule, level: 'note', where, message });

  const labels = new Set(Object.keys(problem.misconceptionLabels ?? {}));

  /**
   * The three graded option lists have three DIFFERENT shapes, verified against all
   * five shipped cases on 2026-08-11. Treating them alike is how an audit reports
   * defects that are not there:
   *
   *   dissection  { label, type }                    correctness is the question's `correctType`;
   *                                                  the teaching is question-level `wrongHint` + `explanation`
   *   field       { value, label, correct, why }     per-option boolean and per-option explanation
   *   probe       { text, correct, response,         `response` is the teaching, `misconception` the code
   *                 misconception? }
   *
   * `positions` collects where the correct answer sits in each list, for the balance
   * note at the end — one accumulator, because the rule is the same for all three.
   */
  const positions: number[] = [];

  // --- Understand: the correct answer must be reachable, and the teaching must exist
  for (const [i, q] of (problem.dissection ?? []).entries()) {
    const where = `dissection[${i}] (${q.id ?? ''})`;
    const at = (q.options ?? []).findIndex((o: any) => o.type === q.correctType);
    if (at === -1) {
      blocker(
        'correct-type-unreachable',
        where,
        `correctType "${q.correctType}" matches no option, so the question cannot be answered correctly`
      );
    } else {
      positions.push(at);
    }
    if (!q.wrongHint || !q.explanation) {
      blocker('why-missing', where, 'a dissection question needs both `wrongHint` and `explanation` — they are the whole teaching');
    }
  }

  // --- Build config: exactly one correct option, and every option explained
  for (const [type, setup] of Object.entries<any>(problem.nodeSetup ?? {})) {
    for (const f of setup.fields ?? []) {
      if (!Array.isArray(f.options)) continue; // text/number/expression carry their own explanations
      const where = `nodeSetup.${type}.${f.key}`;
      const correct = f.options.filter((o: any) => o.correct);
      if (correct.length !== 1) {
        blocker('no-correct-option', where, `${correct.length} options are marked correct — exactly one must be`);
      } else {
        positions.push(f.options.findIndex((o: any) => o.correct));
      }
      for (const [i, o] of f.options.entries()) {
        if (!o.why) {
          blocker(
            'why-missing',
            `${where}.options[${i}]`,
            `option "${o.label ?? o.value}" has no \`why\` — Iris reads back the explanation for whatever was chosen`
          );
        }
      }
    }
    for (const s of setup.settings ?? []) {
      if (!s.why?.[String(s.correct)]) {
        blocker(
          'why-missing',
          `nodeSetup.${type}.settings.${s.key}`,
          `no \`why\` for the correct value "${String(s.correct)}"`
        );
      }
    }
  }

  // --- Probes: every option is answered, and every wrong one names a misconception
  for (const [type, probe] of Object.entries<any>(problem.nodeProbes ?? {})) {
    const where = `nodeProbes.${type}`;
    const options = probe.options ?? [];
    if (options.filter((o: any) => o.correct).length !== 1) {
      blocker('no-correct-option', where, 'a probe needs exactly one correct option');
    } else {
      positions.push(options.findIndex((o: any) => o.correct));
    }
    for (const [i, o] of options.entries()) {
      if (!o.response) {
        blocker('response-missing', `${where}.options[${i}]`, `option "${o.text}" has no \`response\`, which is how a probe teaches`);
      }
      if (!o.correct && !o.misconception) {
        blocker(
          'misconception-missing',
          `${where}.options[${i}]`,
          `wrong option "${o.text}" names no misconception, so the belief behind it never reaches the report`
        );
      }
      if (o.misconception && !labels.has(o.misconception)) {
        blocker(
          'misconception-unlabelled',
          `${where}.options[${i}]`,
          `misconception "${o.misconception}" has no misconceptionLabels entry, so it can never reach the report`
        );
      }
    }
  }

  // --- the deliberate gap: exactly one sample case matching no branch
  if ((problem.branches ?? []).length) {
    const gaps = (problem.sampleCases ?? []).filter((c: any) => c.branch === null);
    if (gaps.length !== 1) {
      blocker(
        'gap-case',
        'sampleCases',
        `${gaps.length} sample case(s) carry branch:null — Stress Testing is built from exactly one`
      );
    }
  }

  // --- the learner can actually get every node they need
  const unlocked = new Set((problem.dissection ?? []).flatMap((d: any) => d.unlocks ?? []));
  for (const type of requiredTypes(problem)) {
    if (!unlocked.has(type)) {
      blocker(
        'unlocks-incomplete',
        'dissection[].unlocks',
        `no dissection answer unlocks "${type}", which a build phase requires`
      );
    }
    if (!(problem.buildPhases ?? []).some((p: any) => (p.pickable ?? []).includes(type))) {
      blocker(
        'not-pickable',
        'buildPhases[].pickable',
        `"${type}" is required but no phase offers it in the picker`
      );
    }
  }

  // --- the reference solution actually works
  const sim = simulateAll(problem.referenceGraph, problem);
  if (!sim.success) {
    const failed = sim.cases
      .filter((c: any) => c.case.branch !== null && !c.delivered)
      .map((c: any) => c.case.id ?? c.case.branch);
    blocker(
      'simulate-all',
      'referenceGraph',
      `simulateAll does not deliver for: ${failed.join(', ') || 'an unnamed case'}`
    );
  }
  const open = openBranchIds(problem.referenceGraph, problem);
  if (open.length) {
    blocker(
      'branch-dead-end',
      'referenceGraph',
      `branch(es) ${open.join(', ')} reach no configured terminal, so a correct flow cannot complete its phase`
    );
  }

  // --- balance: a note, because balanceProblemOptions spreads answers server-side
  const atTop = positions.filter((p) => p === 0).length;
  if (positions.length && atTop / positions.length > 0.6) {
    note(
      'option-spread',
      'every graded list',
      `${atTop} of ${positions.length} correct options sit at index 0 — the sign nobody thought about the distractors`
    );
  }

  // --- size, so difficulty is not taste
  const items = enumerateItems(problem);
  const total = Object.values<any>(items).reduce((a: number, v: any) => a + v.length, 0);
  if (total < 12) note('too-small', 'the whole case', `${total} scored decisions is thin for a graded challenge`);

  return out;
}
```

- [ ] **Step 4: Run the audit test to green**

Run: `npx vitest run packages/authoring/audit.test.ts`
Expected: PASS, 10 tests. **The first test — no blocker on any shipped case — is the important one.** If a real case trips a rule, read the case before changing the rule, then say in the commit which it was.

Export from `packages/authoring/index.ts`:

```ts
export { auditProblem } from './audit.ts';
export type { AuditFinding } from './audit.ts';
```

- [ ] **Step 5: Add the CLI**

`scripts/authoring/audit.mjs`:

```js
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

const findings = auditProblem(problem);
for (const f of findings) {
  const mark = f.level === 'blocker' ? '\x1b[31m✗\x1b[0m' : '\x1b[33m!\x1b[0m';
  console.log(`  ${mark} ${f.rule.padEnd(24)} ${f.where}\n      ${f.message}`);
}
const blockers = findings.filter((f) => f.level === 'blocker');
console.log('');
console.log(blockers.length ? `\x1b[31m${blockers.length} blocker(s)\x1b[0m` : '\x1b[32mno mechanical defects\x1b[0m');
process.exit(blockers.length ? 1 : 0);
```

In `package.json`:

```json
    "case:audit": "node scripts/authoring/audit.mjs",
```

- [ ] **Step 6: Fold it into `problem:check`**

In `scripts/problem-check.mjs`, inside `check()` immediately before the `// --- cover art` block, so an author sees it on every iteration:

```js
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
```

- [ ] **Step 7: Verify against every shipped case, both ways**

Run: `for s in email-triage expense-approvals trial-signup-desk ops-request-desk low-stock-morning-post; do npm run case:audit -- $s || echo "AUDIT FAILED: $s"; done`
Expected: no `AUDIT FAILED` line. Then `npm run problem:check -- low-stock-morning-post` shows the audit line and still completes in about a second.

- [ ] **Step 8: Add it to `case:verify`**

In `scripts/authoring/verify.mjs`, add an `audit` check following the existing `checkWorkflow` pattern exactly — load the problem with `loadFromDisk`, return `pass`/`fail` results, register it in the CLI switch, in the `all` bundle, and in `USAGE`:

```js
/** The mechanical review rules, so a reviewer's round is spent on judgement. */
async function checkAudit(slug) {
  const problem = await loadFromDisk(slug);
  if (!problem) return [fail('audit', 'problem does not load from disk')];
  const { auditProblem } = await import('@judge/authoring');
  const findings = auditProblem(problem);
  const blockers = findings.filter((f) => f.level === 'blocker');
  if (blockers.length) {
    return [fail('audit', `${blockers.length} mechanical defect(s): ${blockers[0].rule} at ${blockers[0].where}`)];
  }
  const notes = findings.length;
  return [pass('audit', `no mechanical defects${notes ? ` (${notes} note(s) — read them)` : ''}`)];
}
```

Run: `npm run case:verify -- audit low-stock-morning-post` and `npm run case:verify -- all low-stock-morning-post`. The new line appears in both. `voice-rendered`/`voice-uploaded` may still fail on this machine after a clip prune — expected and unrelated.

- [ ] **Step 9: Full gate and commit**

Run: `npm test && npm run typecheck`

```bash
npm run case:verify -- on-branch <your-branch>
git add packages/authoring scripts/authoring scripts/problem-check.mjs package.json
git commit -m "$(cat <<'EOF'
Decide the mechanical half of a case review in a second, not in a 29-minute round

Missing explanations, unlabelled misconceptions, a gap case that is not there, a
required node the quiz never unlocks or no phase offers, a reference graph the
simulator cannot deliver, a dead-end branch. None of it needs judgement, so none
of it should cost a revision cycle. Reviewers keep the two things no script can
do: is this answerable, and is the answer key right.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `problem:blind` — ship the harness every reviewer writes by hand

`case-reviewer.md:33-40` tells each reviewer to `cat` a script into `/tmp` and run it under `vite-node`. That is setup time on every round, and an agent that mis-writes it reports the wrong thing confidently.

**Files:**
- Create: `scripts/authoring/blind.mjs`
- Modify: `package.json`
- Modify: `.claude/agents/case-reviewer.md:32-40`

- [ ] **Step 1: Write the script**

`scripts/authoring/blind.mjs`:

```js
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
```

In `package.json`:

```json
    "problem:blind": "node scripts/authoring/blind.mjs",
```

- [ ] **Step 2: Prove it strips what it claims**

```bash
npm run problem:blind -- low-stock-morning-post --out /tmp/blind.json
grep -c '"correct"' /tmp/blind.json; grep -c '"misconception"' /tmp/blind.json
```

Expected: the file is written, and both `grep -c` calls print `0` (grep exits 1 on no match — that is the pass, not a failure).

- [ ] **Step 3: Point the reviewer prompt at it**

In `.claude/agents/case-reviewer.md`, replace the `cat > /tmp/blind-<slug>.mjs` heredoc and its `npx vite-node` line with:

```bash
npm run problem:blind -- <slug> --out /tmp/blind-<slug>.json
```

Keep every sentence around it — what the projection strips, and the four things that make a blind solve worthless.

- [ ] **Step 4: Regenerate the CMA YAML, gate, and commit**

Run: `npm run case:cma && npm run case:cma -- --check && npm test`

```bash
npm run case:verify -- on-branch <your-branch>
git add scripts/authoring/blind.mjs package.json .claude/agents/case-reviewer.md agents
git commit -m "$(cat <<'EOF'
Ship the blind-solve harness instead of asking each reviewer to write it

Every review round hand-wrote the same projection script into /tmp. That is setup
time per round, and a harness an agent can get subtly wrong while reporting
success.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Cover art from t=0

`covers:generate` filters `problemList`, so an unregistered case draws nothing and says so in a way that reads as success. That is the only reason art waits for registration — and it puts a 3-5 minute stage plus its review in the tail.

**Files:**
- Modify: `scripts/generate-covers.mjs:113`

- [ ] **Step 1: Add the disk fallback**

Replace:

```js
const targets = problemList.filter((p) => (only ? p.id === only : true));
if (!targets.length) {
  console.error(only ? `No problem with id "${only}".` : 'No problems found.');
  process.exit(1);
}
```

with:

```js
/**
 * Load one case straight from its folder, registered or not.
 *
 * Art needs exactly one authored value — `coverImage.prompt` — which exists the
 * moment the author stage finishes. Filtering `problemList` was the only thing
 * making the cover wait for registration, and registration cannot move earlier
 * (voice.js is still a scaffold full of TODOs at that point). So the cover stage
 * reads the disk instead, and stops being on the critical path.
 */
async function fromDisk(slug) {
  const file = path.resolve(`packages/problems/${slug}/index.js`);
  if (!existsSync(file)) return null;
  const mod = await import(`file://${file}`);
  return Object.values(mod).find((v) => v && typeof v === 'object' && 'coverImage' in v) ?? null;
}

let targets = problemList.filter((p) => (only ? p.id === only : true));
if (!targets.length && only) {
  const unregistered = await fromDisk(only);
  if (unregistered) {
    console.log(`- ${only}: not registered yet, loaded from disk`);
    targets = [unregistered];
  }
}
if (!targets.length) {
  console.error(only ? `No problem with id "${only}", registered or on disk.` : 'No problems found.');
  process.exit(1);
}
```

Confirm `path` and `existsSync` are imported at the top of the file; add whichever is missing.

- [ ] **Step 2: Prove it finds an unregistered case without spending anything**

Comment out the `low-stock-morning-post` import and registry line in `packages/problems/index.js`, then:

`npm run covers:generate -- --only low-stock-morning-post`

Expected: it prints `not registered yet, loaded from disk`, then `already drawn (pass --force to redraw)` — **no API call, no spend**, because the PNG exists. Restore `packages/problems/index.js` immediately and confirm `git diff packages/problems/index.js` is empty.

- [ ] **Step 3: Commit**

```bash
npm run case:verify -- on-branch <your-branch>
git add scripts/generate-covers.mjs
git commit -m "$(cat <<'EOF'
Draw a case's cover before it is registered, so art leaves the critical path

covers:generate filtered problemList, so an unregistered case drew nothing and
reported it in a way that reads as success. The cover needs one authored value,
which exists as soon as the seven files are written.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Smoke scoping — small, but it stops compounding

Smoke builds `1 + problems × 7` checks: 36 today at 1m59s, 43 at six cases, 50 at seven. Every case authored makes every future run slower.

**Files:**
- Modify: `apps/web/scripts/smoke.mjs:22,90`

- [ ] **Step 1: Add the filter and raise the default concurrency**

Replace line 22:

```js
const PROBLEMS = problemList.map((p) => p.id);
```

with:

```js
/**
 * Which problems to sweep.
 *
 * The journey is checked per problem, so the run grows by seven checks with every
 * case authored — 36 at five cases, 50 at seven. During an authoring run only the
 * new case can have changed, so `SMOKE_ONLY=<slug>` gates the sweep to it; home and
 * the stateful resume check always run. The full sweep stays the default, and is
 * what `case_finalize` and CI use.
 */
const ONLY = process.env.SMOKE_ONLY?.trim();
const ALL_PROBLEMS = problemList.map((p) => p.id);
const PROBLEMS = ONLY ? ALL_PROBLEMS.filter((id) => id === ONLY) : ALL_PROBLEMS;
if (ONLY && !PROBLEMS.length) {
  console.error(`SMOKE_ONLY="${ONLY}" matches no registered problem — refusing to run an empty sweep`);
  process.exit(1);
}
```

And line 90:

```js
// Measured 2026-08-11: 36 checks take 1m59s at 4 and 1m39s at 8, on a machine
// where the dev server is the shared bottleneck rather than the browser.
const CONCURRENCY = Number(process.env.SMOKE_CONCURRENCY ?? 8);
```

- [ ] **Step 2: Run all three modes against a warm dev server**

```bash
npm run dev &   # then load http://localhost:3000 once, or the resume check flakes on a cold server
SMOKE_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run smoke
SMOKE_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" SMOKE_ONLY=low-stock-morning-post npm run smoke
SMOKE_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" SMOKE_ONLY=nope npm run smoke
```

Expected: full sweep green in ~1m40s; the scoped run does 8 checks plus resume and finishes well under a minute; the third exits 1 with the refusal message. Kill the dev server afterwards.

- [ ] **Step 3: Commit**

```bash
npm run case:verify -- on-branch <your-branch>
git add apps/web/scripts/smoke.mjs
git commit -m "$(cat <<'EOF'
Let an authoring run smoke-test the case it just wrote

The sweep grows by seven checks per case authored, so every run gets slower for
every case that already shipped. SMOKE_ONLY gates it during a run; the full sweep
stays the default and is what finalize uses. Concurrency 8 measured at 1m39s
against 1m59s at 4.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Rewire the pipeline — review fan-out and narration in parallel

The structural change, and the one that saves the most: ~40-55 min from fanning review out by surface, ~25-28 min from running narration authoring concurrently with review. Everything before this task exists to make these two safe.

**Files:**
- Modify: `.claude/agents/case-reviewer.md`
- Modify: `.claude/skills/author-case/SKILL.md`
- Regenerate: `agents/*.agent.yaml` via `npm run case:cma`

- [ ] **Step 1: Make the reviewer slice-scoped**

In `.claude/agents/case-reviewer.md`, after the "Why this stage exists" section, insert:

```markdown
## Your slice

The orchestrator gives you **one** of these. Blind-solve only your slice, and audit
only the rules that belong to it. Three reviewers run concurrently, each on a
different slice, none knowing the others exist — the point is that a full round costs
one slice's wall clock instead of three.

| Slice | Blind-solve | Audit |
|---|---|---|
| `understand` | every dissection question · every probe | probes never name the correct node · every option is a position someone really holds · `unlocks` reaches every required type |
| `config` | every graded field in every `nodeSetup` · every graded setting | `nodeSetup` keyed by TYPE is genuinely right for each use · every `why` teaches · every settings value is explained |
| `edges` | every `evalQuestion` | exactly one `branch: null` sample case, and the questions ask about it · `referenceGraph` delivers · every branch reaches a terminal · nothing a learner reads before building gives away an answer |

Report `slice` in your JSON. Give score fractions for the surfaces in your slice only
and leave the others `null` — do not guess at work you were not asked to do.

**The mechanical rules are already checked**, by `npm run case:audit -- <slug>`. Run
it, report its output, and do not spend your round re-deriving what it decides. Your
round is for the two things it cannot: **is every question answerable from what the
learner is shown, and is the authored answer right.**
```

Then, in its report schema, add `"slice": "understand" | "config" | "edges"` and allow every `blindSolve` surface to be `null`.

- [ ] **Step 2: Rewrite the chain in the skill**

In `.claude/skills/author-case/SKILL.md`, replace the ASCII chain with:

```
author_case ──┬──► case_review ×3 (understand · config · edges, concurrent)
              │
              ├──► case_audio (a) write narration + review it
              │
              └──► case_art (non-blocking, unregistered-safe)
                              │
                    all three ▼ done
                         REGISTER  ◄── still the gate: nothing before it may register
                              │
                              ▼
                    case_audio (b) render + sync
                              │
                              ▼
                      case_finalize ──► draft PR
```

and immediately below it:

```markdown
**Three things now start at once, and the reason each is safe is different:**

- **`case_review` fans out to three agents**, one per surface — `understand`, `config`,
  `edges`. Each blind-solves only its slice, so a round costs one slice's wall clock
  rather than the sum, and every blocker in the case surfaces in the *same* round
  instead of a second batch appearing after the first fix. Still fresh agents, still no
  write tools, still `verdict: fail` if and only if blockers exist. Merge the three
  reports before routing: one author cycle fixes all of them.
- **Narration is authored in parallel with review.** `case-voice-author` writes only
  `voice.js`; the reviewers write nothing. Disjoint files, same inputs. A content
  revision may invalidate a line, and that is cheap on purpose — nothing has been
  rendered yet, and rendering still happens after registration.
- **Cover art starts immediately.** `covers:generate -- --only <slug>` now loads an
  unregistered case from disk, so art and its review overlap everything instead of
  sitting in the tail. Still non-blocking; still never dead-ends a case.

**Registration has not moved**, and the two reasons below are unchanged.

**The revision cap is per ROUND, not per reviewer.** Three reviewers failing one round
is one cycle, not three.
```

In `### 1. author_case`, add as the first thing the stage does:

```bash
npm run case:spec-check -- docs/case-specs/<slug>.md   # 1s. A bad spec costs 33 minutes.
npm run case:brief -- <slug> docs/case-specs/<slug>.md # the pack the author agent reads
```

and add `npm run case:audit -- <slug>` to that stage's verify list.

In `### 2. case_review`, describe the three-way spawn and the merge, keeping the 2-cycle cap.

In the PR body template, report all three slices on the blind-solve line, and replace the
`settings` checklist item with:

```markdown
- [x] `settings` validated by `validateProblem()` (hand-checked until 2026-08-11)
```

- [ ] **Step 3: Regenerate the CMA YAML**

Run: `npm run case:cma && npm run case:cma -- --check`
Expected: `agents/case-reviewer.agent.yaml` picks up the slice section and the schema change; `--check` exits 0.

- [ ] **Step 4: Rehearse the whole pipeline for free**

Run `npm run case:preflight -- --fake`, then walk a `--fake` run of `/author-case` against an existing spec (`docs/case-specs/trial-signup-desk.md`) on a scratch branch. Fake mode exercises every stage, agent reviews included, and skips only cover render, voice render, S3 upload and the PR.

Expected: the three reviewers run concurrently, narration authoring runs alongside them, and the run reaches `case_finalize` without touching the bucket. **Record the wall clock — this is the number that says whether the plan worked.** Delete the scratch branch afterwards.

- [ ] **Step 5: Commit**

```bash
npm run case:verify -- on-branch <your-branch>
git add .claude agents
git commit -m "$(cat <<'EOF'
Review three surfaces at once, and write the narration while it happens

A round used to be one agent blind-solving every dissection question, every field,
every setting and every edge case in series: 29 minutes, and a second batch of
blockers only after the first fix landed. Three slices run concurrently and all
blockers arrive in one round. Narration authoring and cover art move off the
critical path — disjoint files, and nothing is rendered until after registration.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Verification of the whole plan

Run after the last task, in this order:

```bash
npm test                                    # expect 800+ passing, 0 failing
npm run typecheck                           # both halves
for s in email-triage expense-approvals trial-signup-desk ops-request-desk low-stock-morning-post; do
  npm run problem:check -- $s || echo "CHECK FAILED: $s"
  npm run case:audit   -- $s || echo "AUDIT FAILED: $s"
done
npm run case:cma -- --check                 # the personas have not drifted from their YAML
npm run workflows:generate -- --check       # no case's export went stale
npm run db:seed && npm run case:verify -- servable x
npm run dev &   # warm it, then:
SMOKE_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run smoke
```

**The acceptance test is a timed `--fake` run end to end.** Target: `author_case` starting
to `case_finalize` finishing, with zero revision cycles, under **40 minutes**; with one
revision round, under **50**. If it lands above that, the remaining cost is `author_case`
itself — 33 min, untouched by this plan — and the next lever is the out-of-scope item below.

## Deliberately out of scope

- **Fanning out `author_case` into parallel writers** (est. 8-12 min). Real coherence risk:
  `probes` reference misconceptions that `dissection` and `nodeSetup` create, and `cases`
  references branches from `build`. Worth doing only after the wins above are measured, as
  its own plan.
- **Shrinking the voice leg.** After these tasks the critical path is bounded by narration
  authoring, not review. The lever there is editorial — fewer authored moments, which the
  voice brief already recommends — not more agents, because Iris's tone has to stay
  consistent across one writer.
- **Making the tests or gates faster.** Measured at ~3 min total per run, 2-3% of wall
  clock. There is nothing to win.
