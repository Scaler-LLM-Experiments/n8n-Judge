# Authoring a case (a "problem")

A practical runbook for adding a new challenge, verified against the code on
2026-08-04 (branch `sudhanva/authoring`, HEAD `5a9454b`).

**This doc is the process.** The field-by-field reference lives in
[.claude/skills/authoring-a-problem/SKILL.md](../.claude/skills/authoring-a-problem/SKILL.md)
and the narration rules in
[.claude/skills/iris-voice/SKILL.md](../.claude/skills/iris-voice/SKILL.md).
Both are test-enforced; read the matching one before touching those paths. Don't
duplicate their content here — this file tells you what to *run* and what will
*bite you*.

---

## The mental model, in three sentences

A case is **one folder of plain data** under `packages/problems/<slug>/`. Nothing
in that folder reaches a learner until you register it in
`packages/problems/index.js` **and** run `npm run db:seed` — the web app reads
problems from Postgres, never from the repo. Adding a case is therefore a
data-authoring job, not an engine change, *provided* you reuse the existing node
vocabulary in `packages/catalog/catalog.js`.

---

## The process

### 0. Read the skill, with the reference problem open beside it

`packages/problems/email-triage/` is the fully-authored example. Copy its
*structure*. Do **not** copy its option ordering — see the balance trap below.

### 1. Scaffold

```bash
npm run problem:new -- <slug> "Human Title"
```

The slug is **permanent** — sessions, voice clip paths and cover filenames are
keyed by it. Must match `/^[a-z][a-z0-9-]*$/`.

This copies `_template/`, deletes `template.test.js` (that test is about the
template, not your problem), sets `meta.id`, and renames the export in
`index.js` to the camelCased slug. It deliberately **does not register** the
problem — a folder full of `TODO`s would fail `npm test` and make the catalogue
look broken. It prints the two lines you'll add in step 4.

**Optionally, draft it with Claude first:**

```bash
npm run problem:draft -- <slug> "what the learner builds, and why"
```

Needs `ANTHROPIC_API_KEY`. It's handed the whole node catalog as vocabulary so it
can't invent node types, and a draft that fails schema validation is dumped to
`.draft-<slug>.json` rather than written as source. Treat every value it writes
as unreviewed — **and note it silently drops `settings`** (see trap 1).

### 2. Fill in every value

Nine files, eight in a real problem:

| File | Responsibility | Required |
|---|---|---|
| `meta.js` | Identity + catalogue copy: title, statement, tagline, brief, difficulty, cover | yes |
| `dissection.js` | The Understand quiz; `unlocks` gates the build palette; 30% of score | yes |
| `build.js` | `nodePalette`, `branches`, `flowSummary`, `flow`, `buildPhases` | yes |
| `nodeSetup.js` | The NDV per node **type**: `credential`, `locked`, `fields`, `settings` | yes |
| `probes.js` | `nodeProbes` (wrong-node questions) + `misconceptionLabels` | yes |
| `cases.js` | `referenceGraph`, `testCases`, `sampleCases`, `evalQuestions` | yes |
| `voice.js` | Iris's narration | **optional** — the generic phrase book covers the journey |
| `index.js` | Assembles the above. No logic. | yes |
| `template.test.js` | Only in `_template/`. Deleted by `problem:new`. | n/a |

If your flow is linear, delete the router block in `nodeSetup.js`.

### 3. Check, constantly

```bash
npm run problem:check -- <slug>    # works on an unregistered draft
npm run problem:check              # every registered problem
```

Offline and safe — no DB, no dev server, no API key. One pass reports validation
errors, leftover `TODO`s, your scored-decision count against the
difficulty/minutes you claimed, **where the correct option sits in every graded
list**, authored voice coverage, and whether cover art exists.

Exit code is non-zero only on validation errors and (once registered)
placeholders. **Voice and cover art are reported but never blocking.**

### 4. Register

Edit `packages/problems/index.js` — two lines:

```js
import { yourSlug } from './your-slug/index.js';

export const problems = {
  [emailTriage.id]: emailTriage,
  [yourSlug.id]: yourSlug,
};
```

**Position matters: registry order is the catalogue order** on Home. Put the case
where a learner should meet it.

### 5. The gate

```bash
npm test
npm run typecheck
```

`npm test` is where `validateProblem()` runs per problem and where the
placeholder scan runs. See "Known-red test" below before you panic.

### 6. Into Postgres — the step people forget

```bash
npm run db:up        # local Postgres, if not already running
npm run db:migrate   # fresh database only
npm run db:seed      # NOTHING you edited reaches the app until this runs
```

`db:seed` is the publish path — there is no separate publish command. It calls
`publishProblem()`, which compares a key-sorted serialisation of your problem
against the current `PUBLISHED` version and, if anything changed, **appends**
version N+1 and archives the old one. Versions are immutable because a Session
pins the version it started against and the web server caches versions with no
invalidation.

**Re-seed after every edit**, including copy-only and voice-only ones.

> `db:seed` needs **Node ≥ 22.6** — it imports a `.ts` file directly and relies on
> native type stripping. On Node 20 it dies with
> `ERR_UNKNOWN_FILE_EXTENSION ... gradingPrompt.ts`. See
> [running-locally-voice-s3.md](running-locally-voice-s3.md) for the fix.

### 7. Cover art

Author `coverImage.prompt` in `meta.js`, then:

```bash
npm run covers:generate -- --only <slug>
```

Needs `OPENAI_API_KEY`; runs on your machine and writes
`apps/web/public/covers/<slug>.png`, which is committed and served as a static
file — the app never calls an image API. Then set `coverImage.src` to
`/covers/<slug>.png` and **re-seed**.

The per-problem *subject* lives in the problem data; the shared *style* lives once
in `scripts/generate-covers.mjs`, because the cards have to look like one set.

### 8. Voice

```bash
npm run voice:generate -- --dry-run    # character count, spends nothing
npm run voice:generate -- <slug>
npm run voice:sync
npm run db:seed                        # again
```

Same shape as covers: rendered on your machine, uploaded once, served as files.
A copy edit changes the clip's fingerprint, so **an edited line needs
`voice:generate` again or it silently degrades to a caption** — which looks
exactly like a broken render. Full detail in
[running-locally-voice-s3.md](running-locally-voice-s3.md).

### 9. Smoke — the real gate

```bash
npm run dev     # in another terminal
npm run smoke
```

There are no component tests, so a render-time bug passes both `npm test` and
`next build`. Smoke drives real Chrome through every screen of every registered
problem. On macOS:

```bash
SMOKE_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run smoke
```

### 10. Walk it yourself, start to finish

The gate cannot tell you whether a question is worth asking.

---

## Definition of done

1. **Gate green** — `npm test`, `npm run typecheck`, `npm run smoke`, and the
   correct option spread across positions rather than parked at index 0.
2. **The Run works end to end** — `simulateAll` passes on the reference graph.
3. **Its own narration** — a `voice.js` naming this problem's nodes and cases,
   rendered and synced.
4. **Cover art** — prompt authored, image rendered, `src` set.

---

## Traps — verified against current code

### 1. `_template/nodeSetup.js` authors the WRONG `settings` shape

This is the worst one, because it's in the file you're told to copy.

```js
// ✗ what the template scaffolds — silently broken
settings: [{ key: 'onError', options: [{ value: 'stopWorkflow', correct: true, why: '…' }] }]

// ✓ what both shipped problems actually use
settings: [{ key: 'onError', correct: 'continueErrorOutput', why: { continueErrorOutput: '…', stopWorkflow: '…' } }]
```

`why` is a **map keyed by the value the learner chose**, so they're told why
*their* answer is right or wrong.

With the template shape, `checkAnswer` compares `answer === graded.correct` where
`graded.correct` is `undefined` — so **every learner is marked wrong forever, with
no explanation on either verdict**. Worse, the public projection strips
`correct`/`why` from the top level only, so a template-shaped setting **ships its
own answer key to the browser**.

Copy the `settings` shape from `packages/problems/email-triage/nodeSetup.js`, not
from `_template/`.

### 2. `settings` is not validated at all

`settings` is absent from `nodeSetupSchema`, and zod strips unknown keys — so
`validateProblem()` never even sees it. No exactly-one-correct check, no `why`
coverage, no check that the key exists in `SETTINGS_SPEC`. Fields get all three
checks; settings get none. This is also why `problem:draft` loses any `settings`
the model wrote.

**Check settings by hand, in the browser.**

### 3. Never park the correct option at index 0

An audit found the correct answer sitting first in 25/25 fields and 13/13
dissection items — a learner clicking the top option every time would have
passed. `problem:check` reports the distribution and warns above 60%.

`balanceProblemOptions` does redistribute options server-side before they reach
the browser, so a clustered authored order isn't a live grading bug — but it's the
signal nobody thought about the distractors. Note it deliberately leaves
`evalQuestions` alone, since `correctIndex` points into the authored array.

`email-triage` itself violates this rule (20/20 at index 0). Don't copy that.

### 4. Known-red test: `balanceOptions.test.ts`

`npm test` currently fails on exactly one test:

> `the authored data really is biased — this is what we are fixing > puts the correct option first in every graded list`

That test is **inverted** — it asserts the live registry *is* biased, as a
characterisation of the corpus written when `email-triage` was the only problem.
Any problem that follows rule 3 now fails it. `expense-approvals` does, so it's
red.

The intended fix is to point that one `describe` at a biased fixture, since its
job is to document the *input* to `balanceProblemOptions`, not to constrain the
catalogue. It was left red deliberately rather than clustering the answers to
green it, which would make the rule dead prose.

**So: one failing test is expected right now.** Anything else failing is yours.

### 5. `flowSummary` label check is half-broken

It reads `NODE_CATALOG[...].title`, but catalog entries carry `label` — so the
"don't name a node" check only ever sees palette labels. It's also a substring
match, so a palette containing `If` or `Code` wrongly rejects the legitimate
labels `"classify"` (contains "if") and `"verify it"`.

### 6. `sampleCase.urgency` is an email-shaped required enum

`z.enum(['LOW','MEDIUM','HIGH'])`, required, no default. Every non-email case has
to invent a value. Same story for `from`/`subject` — read them as "who this came
from" and "what it says".

### 7. `publishProblem` does not validate

Neither `publishProblem.mjs` nor `seed.mjs` calls `validateProblem()`. A problem
that fails validation still seeds cleanly if you skip `npm test`. **The test suite
is the only gate.**

### 8. `expense-approvals` is not a finished exemplar

`coverImage.src` is null, there's no cover PNG, and it has no rendered voice
table. Its outstanding list is: cover art, voice generation, smoke, walkthrough.
Use `email-triage` as the reference for completeness — and `expense-approvals` as
the reference for option balance.

### 9. Per-problem voice copy rules are effectively unenforced

The tag-opening rule, exclamation-mark whitelist and contraction rule are tested
only against the shared phrase book and, separately, `email-triage`. A new
problem's `voice.js` is checked only for `{{` (an error), em dashes (a warning)
and the word cap (a warning). The rest is on you and the skill.

### 10. `docs/adding-a-problem.md` is a stub

It predates `problem:new` / `problem:check` / `problem:draft` and tells you to
`cp -r` by hand. Use this doc and the skill instead.

---

## Quick reference

```bash
npm run problem:new -- <slug> "Title"   # scaffold
npm run problem:draft -- <slug> "..."   # optional AI first pass
npm run problem:check -- <slug>         # offline fitness report
npm test && npm run typecheck           # the gate (1 known failure)
npm run db:seed                         # publish — required after EVERY edit
npm run covers:generate -- --only <slug>
npm run voice:generate -- <slug> && npm run voice:sync
npm run dev && npm run smoke            # the real gate
```
