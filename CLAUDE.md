# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Orientation

**Read [STATUS.md](STATUS.md) first** — it is the single source of truth for what's built,
what's next, and known issues. Keep it updated as work lands; do not start a new handoff
doc. This file covers commands, architecture, conventions, and the things that will bite
you. There is deliberately no root `README.md` — it drifted out of date behind this file
and was deleted rather than maintained twice.

"n8n Judge" is a simulator that teaches non-technical Scaler learners to build AI-agent
workflows in n8n **and grades them while they do it**. Per challenge the learner walks
**Home → Understand → Build → Stress Testing → Result**.

**Five cases ship**, in registry order (which *is* catalogue order — see
[packages/problems/index.js](packages/problems/index.js), whose own header comment still
claims email-triage is the only one and is stale):

| Case | Why it exists |
|---|---|
| `email-triage` | The fully-authored reference — voice, cover art, difficulty, brief. Copy its shape, not an older one. |
| `expense-approvals` | Same weight as email-triage (31 scored decisions), new judgement. |
| `trial-signup-desk` | Easiest (20 decisions), no AI step, no branching. |
| `ops-request-desk` | Heaviest (31 decisions, seven nodes, three ways out); its AI step must produce fields a later node maps. |
| `low-stock-morning-post` | 28 decisions, five nodes, **no AI step at all** — knowing when *not* to reach for a model, and the first case that reads a data source mid-flow. |

`lead-triage`, `meeting-notes` and `order-desk` were removed on 2026-07-31 so
`packages/problems/_template/` could be extracted from one complete problem. They live in
git history, but the same commit deleted their database rows, so restoring one means
re-registering **and** re-seeding. Anything describing "four challenges" or "one challenge"
is out of date.

The repo root **is** the monorepo — `apps/web` plus ten `@judge/*` packages. It was
restructured on 2026-07-27; anything referring to an `innate/` folder or an `app/` Vite
prototype is out of date, and both are gone.

**Three project skills hold the detail this file only summarises.** Read the matching one
before touching those paths, because they encode rules that are test-enforced:
[.claude/skills/authoring-a-problem/SKILL.md](.claude/skills/authoring-a-problem/SKILL.md)
for `packages/problems/**`,
[.claude/skills/iris-voice/SKILL.md](.claude/skills/iris-voice/SKILL.md) for anything under
`voice*` or `packages/voice-scripts`, and
[.claude/skills/author-case/SKILL.md](.claude/skills/author-case/SKILL.md) to author a whole
new case end to end (see *The agent authoring pipeline* below).

## Commands

Node 20+ locally (the Docker image builds on `node:22-bookworm-slim`), everything from the
repo root.

```bash
npm install
npm run dev        # Next.js dev → http://localhost:3000
npm run build      # production build
npm test           # vitest — packages/**/*.test.{js,ts} and apps/**/*.test.{js,ts}
npm run smoke      # full-journey runtime check (needs dev running)
npm run typecheck  # BOTH halves: typecheck:packages (root tsconfig) + typecheck:web
```

**There is no linter.** No eslint, no prettier, no `lint` script in either
`package.json` — `test` + `typecheck` + `smoke` are the entire gate. Don't go looking for
one, and match the surrounding file's style by reading it.

**And the gate does not cover the build interaction.** All three were green on a case where
the learner could not attach a chat model, could not answer a field from the only control
offered, and got no reason when a phase refused to advance: `smoke` opens the NDV but never
fills a field or places a node. So for anything touching the Build stage or the NDV, walking
the journey in a browser is the only coverage that exists — see *Design conventions*.

**`npm run typecheck` only recently covered the web app.** The root tsconfig *excludes*
`apps`, so for a while an app-level type error was invisible to every check safe to run
during development — `next build` was the only thing that caught it, and it cannot run
while `next dev` is running. One such error went straight to a failed production build.
Both halves now run; don't drop one.

Single test file: `npx vitest run packages/engine/simulate.test.js`. Watch: `npx vitest`.

**The app needs Postgres and a signed-in user to do anything.** Problems are served from
the DB, and the journey is behind auth:

```bash
cp .env.example .env   # set AUTH_SECRET (openssl rand -base64 32); POSTGRES_PORT if 5432 is taken
npm run db:up          # local Postgres via docker-compose.yml
npm run db:migrate      # apply committed migrations
npm run db:seed        # programs, batches, and every registered problem as v1 PUBLISHED
DATABASE_URL="postgresql://…" npm run db:seed:rubric   # the rubric — not optional, see below
```

**`db:seed:rubric` is the one script that ignores `.env`, on purpose.** Every other db
script runs with `--env-file=.env`; this one does not, so you must pass `DATABASE_URL`
yourself. It is the only seed safe to point at production (it does not touch problems), and
[seed-rubric.mjs](packages/db/seed-rubric.mjs) explains the reason for the friction: with no
explicit URL there is no way to think you are seeding production while actually hitting
localhost. It exits with that message rather than defaulting to anything.

Then sign up at `/signup` with a seeded invite code — `AIML-DEMO`, `DSML-DEMO` or
`SE-DEMO`. The **first** admin is a manual promotion
(`UPDATE "User" SET role='ADMIN' WHERE email='…';`); after that, `/admin` → Admins grants
by email.

**`db:seed:rubric` is load-bearing, not decoration.** With no `RubricVersion` row the
Result screen still shows a score but `POST /api/sessions/[id]/report` cannot persist a
`GradingReport`, so admin analytics has nothing to average. The route logs exactly this.

`npm run db:seed:demo` fabricates ~60 demo learners with generated traces replayed through
the real engine, so the admin dashboard has consistent numbers before real cohorts exist.
It **refuses to run against a non-local database** unless `ALLOW_REMOTE=1`; `-- --clear`
removes them (they're marked by the `demo.judge.local` email domain).

Other db scripts: `db:down`, `db:migrate:dev` (new migration from schema changes),
`db:generate`, `db:studio`.

Authoring, by hand: `problem:new`, `problem:check`, `problem:draft` — see *Problem-as-data*
below. `problem:check` is offline and safe to run on anything, including an unregistered
draft.

Authoring, as a pipeline: `case:preflight`, `case:verify`, `case:run`, `case:cma` — the
checks and run-state that `/author-case` drives. See *The agent authoring pipeline* below;
`case:verify` is the one to know, because it is how a stage's claim gets checked rather
than believed.

`npm run workflows:generate` exports each case as an importable n8n workflow JSON. A clean
export is not proof it would run — read what it emitted.

`npm run covers:generate` draws the Home cards' cover art **on this machine** (OpenAI
`gpt-image-1`, needs `OPENAI_API_KEY`), writing `apps/web/public/covers/<id>.png`. Same
deal as voice and for the same reason — **the app never calls an image API**; the output is
committed and served as a static file. It skips what already exists; `-- --force` redraws,
`-- --only <id>` does one. The per-problem *subject* is authored in the problem data
(`coverImage.prompt`) so art can be redrawn from the description that produced it; the
shared *style* lives once in [scripts/generate-covers.mjs](scripts/generate-covers.mjs),
because a row of cards has to look like one set. After drawing, set `coverImage.src` and
re-seed. All five shipped cases have art; a null `src` is a normal state for a new one.

`npm run voice:generate` renders Iris's narration **on this machine**,
`npm run voice:sync` uploads it, and `npm run voice:verify` lists the bucket back to prove
the upload landed (`railway bucket info` lies — see *Deployment*). Neither the app nor a dry
run ever polls the bucket — see *Voice* below, and read it before touching anything under
`voice*`.

**`npm run smoke` is not optional after touching components.** There are no component
tests, so a render-time bug passes both `npm test` and `next build`. Smoke drives system
Chrome via `playwright-core`; on macOS pass
`SMOKE_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`.

**Dev hash routes** (isolate one screen, all honor `?problem=<id>`, all matched with
`startsWith` — equality silently dropped the `?problem=`): `#build`, `#run-story`,
`#eval-demo`, `#report-demo`, `#run-demo`, `#playground`.

`#build` and `#run-story` go through `BuildPreview`, which **does** create a real session
via the shared `useSession` hook — deliberately. Without one, every check returns "could
not verify" (the browser holds no answers), so `#build` could not verify a single field and
every screenshot taken from it was of a broken grader. `#eval-demo`, `#report-demo` and
`#run-demo` render a screen directly with no session, so grading there is unverified by
design — see *Server-authoritative grading* below.

## Architecture

### Entry — the app mounts client-only
[apps/web/app/page.tsx](apps/web/app/page.tsx) → `JudgeClient` → `next/dynamic(…, { ssr: false })`
around [src/App.jsx](apps/web/src/App.jsx). The whole journey (reactflow canvas, GSAP
mascot, hash routing) is browser-only. `App.jsx` dispatches the dev hash routes, then
renders `Landing` (home ⇄ journey); `MainApp` is the four-screen state machine
(`STATEMENT → DASHBOARD → EVAL → REPORT`); `BuildPreview` is the same journey minus the
intro. Both create a **Session** via `useSession` and wrap their screens in a
`TraceProvider`, threading three things: `sessionId` (how answers get graded), a `record`
callback (the local grading store, now only used for in-journey UI), and `trace` (the
outbound event queue). Screen changes go through one `goTo()` so a new screen cannot be
added without being traced — the admin timeline's "who is stuck where" is built from those
events.

**A challenge is linkable: `/?problem=<slug>`.** There is one page, so which challenge is
open is React state in `Landing` — the address bar only reflects it because `open()` writes
it there, via `writeSlugToUrl()` in
[problemsApi.js](apps/web/src/data/problemsApi.js) (`urlWithSlug()` is the pure, tested
half). Four things hang off that and are easy to break separately:

- **`slugFromUrl()` is read once, at mount**, and the state is the source of truth after
  that — except on `popstate`, where the URL wins again. That is what makes Back mean "leave
  this challenge" rather than "leave Judge": a card click **pushes**, so there is something
  to go back to. Arriving *on* a link pushes nothing, so Back exits the site, the same as any
  other page — smoke asserts the pushed case only, deliberately.
- **A slug is not trusted.** `fetchProblem` 404s on anything unpublished, and the catalogue
  fetch that a deep link triggers (Home never ran, so `catalogue.current` is empty and the
  Result screen has no "next challenge" to name) also **returns the learner to Home with the
  param stripped** when the list does not contain the slug. Not a silent fallback to other
  content — there is none to serve, and the catalogue is proof rather than a guess.
- **Login must not eat the link.** The middleware bounces a signed-out learner to
  `/login?callbackUrl=<absolute url>`; `auth-form.tsx` used to hardcode `location.href = '/'`
  and throw it away. [returnPath.ts](apps/web/src/lib/returnPath.ts) is the only thing that
  decides that value is safe — same **origin**, not merely a leading slash, because NextAuth
  sends an absolute URL and `//host` resolves to somebody else's site. Never widen it.
- **Smoke covers both entries** — `<problem>--journey-start` (card click writes the slug,
  Back returns Home) and `<problem>--deep-link` (the link opens the challenge, not Home).
  `journey-start` therefore loads `/`, **not** `/?problem=<slug>` as it once did; that URL no
  longer shows a card to click.

### Port, don't rewrite
Prototype `.jsx` moved in untouched. **All new code is TypeScript.** Workspace packages
ship raw sources and are listed in `transpilePackages` in
[next.config.mjs](apps/web/next.config.mjs) — add a new `@judge/*` package there.
(`@judge/workflow` is absent from that list and still bundles fine under Next 15.5, since
workspace symlinks resolve outside `node_modules`. If a build ever fails on raw TS from a
package, this is the first thing to check.) `serverExternalPackages` keeps `pg-boss` and
the Prisma client out of the bundle.

### Problem-as-data + registry (the key pattern)
Everything specific to a challenge is **one plain data object** in
`packages/problems/<id>/index.js`, registered in
[packages/problems/index.js](packages/problems/index.js) and threaded through the app as
the `problem` prop. To add or change a challenge you edit data, **not** the engine or UI.

**Use the `authoring-a-problem` skill** — [.claude/skills/authoring-a-problem/SKILL.md](.claude/skills/authoring-a-problem/SKILL.md)
is the procedure and every enforced rule; [docs/adding-a-problem.md](docs/adding-a-problem.md)
is now only a pointer to it plus the commands.

**A problem is seven files, not one.** `index.js` only *assembles*; the values live in
`meta.js` · `dissection.js` · `build.js` · `nodeSetup.js` · `probes.js` · `cases.js` ·
`voice.js`. `packages/problems/_template/` mirrors that structure exactly — a new challenge
is `cp -r packages/problems/_template packages/problems/<slug>`, fill the TODOs, register it.
`email-triage/assembled.snapshot.json` + `index.test.js` assert the assembled object still
deep-equals what the single-file version produced, so the split is provable; keep that
snapshot honest when the shape genuinely changes.

Removing a problem is `node packages/db/remove-problem.mjs <slug>` (`--dry-run`, `--yes`) —
every relation to `Problem` is `Restrict`, so the deletion order *is* the job and it lives
in that script rather than as ad-hoc SQL.

**The by-hand authoring pipeline is three npm scripts** (the skill is the long version; the
agent pipeline below wraps these rather than replacing them):

| Command | Does |
|---|---|
| `npm run problem:new -- <slug> "Title"` | Copies `_template`, sets the slug and export name, drops the template's own test. Deliberately does **not** register it — registering a folder of TODOs makes it the catalogue and fails `npm test`. |
| `npm run problem:check -- <slug>` | The gate to run constantly: validation, leftover TODOs, scored-decision count vs the authored `difficulty`, where the correct option sits, narration coverage, cover art. **Offline** — no database, no dev server, no API key — so it works on a problem that has never been seeded, and on one that is not registered yet. |
| `npm run problem:draft -- <slug> "brief"` | Claude drafts the seven files from a brief (needs `ANTHROPIC_API_KEY`). A first pass at the shape, banner-marked as unreviewed. |

Two things about `problem:draft` that will look like bugs otherwise:

- **It cannot use structured output.** A zod `.record()` converts to a schema-valued
  `additionalProperties`, which `output_config.format` rejects — and `nodeSetup`, `nodeProbes`
  and `voice` are all records keyed by node type or moment. The schema is handed over as
  prompt text and `problemSchema.safeParse` gates the write; a failing draft is printed, not
  saved.
- **`max_tokens` caps thinking *and* output together**, and a problem is ~10k tokens of JSON.
  At 32k the first run spent the budget thinking and stopped mid-object; it runs at 64k with
  `effort: medium`.

[packages/llm/authoringPrompt.ts](packages/llm/authoringPrompt.ts) is a **second copy of the
authoring rules**, because the model cannot read the skill file — so it is the one piece of
documentation that can rot without anyone noticing. Two of its original constraints had already
reversed before anything used it (it demanded the retired fixed topology, and *required* the
"I added it by mistake" escape hatch that `validateProblem()` now rejects), which is why
`authoringPrompt.test.ts` pins them. Change the skill, change this, or drafts will validate and
teach the wrong thing.

### The agent authoring pipeline — `/author-case`
The four cases after `email-triage` were authored this way, so it is the normal route now, not
an experiment. [.claude/skills/author-case/SKILL.md](.claude/skills/author-case/SKILL.md) is
the procedure; the stages run as the five subagents in [.claude/agents/](.claude/agents/)
(`case-author`, `case-reviewer`, `case-voice-author`, `case-voice-reviewer`,
`case-art-reviewer`), and the orchestrator's job is to **check their claims, not collect them**.

- **A case starts as a spec, on disk.** `docs/case-authoring/TEMPLATE.md` +
  `STARTER-PROMPT.md` are what an author fills in; the result lands in
  `docs/case-specs/<slug>.md` and is what `case-author` reads. Given only a brief, write the
  spec first — that is what makes a run reproducible.
- **Never advance on an agent's word.** `npm run case:verify -- <check> <slug>` is the cheap
  check on our side for each stage's claim, and `case:preflight` runs everything a run needs
  *before* the stages that spend money (cover render, voice render, S3 upload, PR).
  `npm run case:run` is the run-state. `-- --fake` rehearses the whole chain with no spend.
- **A diagnosis is a claim too.** An agent correctly reported the model-picker bug and named
  the wrong file. Read the code it points at before editing.
- **Automation stops at a draft PR.** Nothing merges, because the human walkthrough is the
  *only* coverage the build interaction has (see the gate note in *Commands*).

Stage names, statuses and failure classes deliberately match the hosted design in
[docs/cma-authoring-pipeline-handoff.md](docs/cma-authoring-pipeline-handoff.md) — the port is
meant to be a change of *where* a stage runs, not a redesign.

Key fields: `branches`, `flow` (`start`/`next`/`branchNext`/`modelNext` — the last two
optional), `flowSummary`, `buildPhases`, `nodeSetup` (per-node NDV: `credential` +
disabled `locked[]` + editable `fields[]` whose `options` carry `{value,label,correct,why}`,
plus graded `settings[]`), `nodeProbes`, `sampleCases` (`branch:null` = intentional
fall-through), `dissection`, `nodePalette`, `referenceGraph`, `testCases`, `evalQuestions`,
`misconceptionLabels`, optional `simulation`, optional `voice` (per-problem and per-node
narration overrides), and optional `difficulty` (`easy|moderate|difficult`) +
`difficultyNote` — surfaced by `/api/problems` and shown on the Home cards. Note the
rubric's `problemComplexity()` still derives ordering from the content, so `difficulty` is
label copy, not the thing that sorts the catalogue.

**Field kinds have outgrown `select`.** `FieldControl` and `answerCheck.ts` now cover
`select | text | number | boolean | expression | resourceLocator | ruleList |
assignmentList`. The last three are n8n's structurally-different parameter shapes:

- **`resourceLocator`** is n8n's "which record?" control (`{ __rl: true, mode, value }`).
  Only `value` is graded — the resource, not the lookup mode used to reach it. The
  `resourceValue()` helper exists on both sides and must stay in sync.
- **`ruleList`** (Switch `rules`) and **`assignmentList`** (Edit Fields) are repeatable
  groups the learner *builds*, so the node's shape becomes a consequence of its
  configuration — add a rule, get an output. One algorithm serves both
  ([packages/problem-schema/ruleList.ts](packages/problem-schema/ruleList.ts)); the UI is
  [RuleListControl.jsx](apps/web/src/n8n/RuleListControl.jsx). The authored answer lives in
  `expect.rules` / `expect.assignments`, not in `correct`.
- **A rule list is always exactly three scored items** — `count`, `categories`,
  `conditions` — whatever the learner builds, because a variable-length answer has no
  option count to decay against and per-rule scoring would make the denominator move
  between attempts. Their check ids are `<type>:<fieldKey>#<aspect>`, all open-ended
  (100/50/0). Downstream code still only ever sees the authored branches, because a phase
  cannot complete until the list verifies green.
- **The FEEDBACK is per row, though the score is not.** Three verdicts stacked under a
  five-branch Switch say "what each branch tests — not right" and leave the learner to work
  out which of five. `gradeListItems()` re-runs the same comparison **per entry**, the check
  response carries it as `items[]` (+ a `missing` count), and each row shows its own message
  with its own Iris bubble; `count` and any failure whose rows all pass (an entry is
  *absent*, not wrong) stay at list level. Rules that hold this together:
  - **Presentation only.** No new check ids, no per-row decisions recorded, denominator
    unchanged. If you find yourself adding a scored item per row, re-read
    [ruleList.ts](packages/problem-schema/ruleList.ts).
  - **`missing` is a count, never the names.** Telling a learner a branch is absent is fair;
    naming it answers the question being asked.
  - **Server-only.** The browser has no `expect` to compare rows against, so `rowResults` is
    null without a session and the list falls back to its three list-level lines.
  - The rolled-up "Not right — ask Iris why" line is **suppressed for a list** — it has no
    `why` of its own (explanations are authored per aspect) and it duplicated the rows.

**Fields can be conditional, and that changes grading.**
[packages/problem-schema/fieldVisibility.ts](packages/problem-schema/fieldVisibility.ts)
implements real n8n's `displayOptions.show` as a field's `showWhen` (a map of other-field-key
→ accepted values; every key must match, any listed value satisfies a key). n8n states the
grading rule explicitly in `getParameterIssues`: **a required parameter only counts as
missing if it is currently displayed.** So "Verify setup" must only require fields the
learner can see, the rubric must not score a hidden field against them, and a field that
becomes hidden must have its **value dropped** — n8n stores only displayed parameters, so
leaving it behind submits an answer to a question no longer being asked. **No shipped problem
uses `showWhen` yet**; this is built and tested infrastructure waiting for the first author
who needs it.

**`packages/problems` is the seed source, not the served source.** The web app does not
import `@judge/problems` at all — [src/data/problemsApi.js](apps/web/src/data/problemsApi.js)
fetches `/api/problems` and `/api/problems/[slug]`, and `AsyncGate` supplies the
loading/error states. There is deliberately no fallback to the in-repo registry: a silent
fallback would serve content the server won't grade against.

> **Editing a problem file changes nothing in the app until you `npm run db:seed`.** This
> bites every content change.

### Server-authoritative grading (read this before touching any graded surface)
`GET /api/problems/[slug]` used to return `ProblemVersion.data` verbatim — ~25KB, of which
~24KB was answer material readable in devtools. The fix was the projection, not the
storage, and it has three parts:

1. **[`toPublicProblem()`](packages/problem-schema/publicProjection.ts)** strips every
   marker of correctness at the API boundary — `correct`, `correctIndex`, `correctType`,
   `explanation`, `wrongHint`, `unlocks`, `isDistractor`, per-option `why`.
   `KNOWN_REMAINING_LEAKS` (`referenceGraph`, `testCases`, `flow`, `sampleCases`) is the
   pinned list of what still ships, **with a test asserting the list**; those four can only
   go once the Run itself moves server-side (M3), because the client cannot simulate
   without expected outcomes.
2. **`POST /api/sessions`** creates an attempt pinned to a `ProblemVersion` (and reuses the
   one in progress rather than opening a new row per page load);
   **`POST /api/sessions/[id]/check`** grades one answer via
   [`checkAnswer()`](packages/problem-schema/answerCheck.ts) — one function for all six
   kinds (`dissection | field | setting | probe | stress | placement`) — **and records it as
   a `TraceEvent`**. The recording *is* the security property: a side-effect-free check
   endpoint is a free oracle, so guessing is allowed and scores like guessing, because
   `firstTry` is what Understanding is built on. An unknown id records
   `suspicious_check` and 400s. `seq` is server-assigned; the response carries only the
   verdict, the `why` for the chosen option, and (on a correct dissection pick) `unlocks`
   — the misconception code stays server-side.
3. **[src/lib/grader.js](apps/web/src/lib/grader.js)** is the only client entry point, and
   **[src/lib/verdict.js](apps/web/src/lib/verdict.js)** (`resolveServerVerdict`) is the one
   place that turns a response into a verdict. It returns **three** states, because
   `correct: null` — "the check did not complete" — is a real answer the UI must show as
   such. Both guesses have shipped and both were bugs: the NDV guessing *wrong* produced
   the "same answer, different verdict" report, and Understand/Stress Testing guessing
   *correct* turned every option green, unlocking progress nobody earned. An unverified pick
   is also **not recorded as a decision** — that was writing answers the learner never gave
   into the grading store. Only a *verified correct* answer returns `unlocks`.

[src/server/problemVersions.ts](apps/web/src/server/problemVersions.ts) caches
`ProblemVersion` rows in memory **with no invalidation**, which is sound only because a
version is immutable by construction. That is enforced by
[packages/db/publishProblem.mjs](packages/db/publishProblem.mjs), which **appends**:
identical content is a no-op, changed content mints the next version, publishes it, archives
its predecessor and moves `currentPublishedVersionId`. Old rows are never touched (seeding
used to rewrite v1's `data` in place — that silently changed what "correct" meant under
anyone mid-attempt). Content comparison is key-sorted, because `jsonb` does not preserve key
order and a plain `JSON.stringify` compare made every re-seed look like a change.

**The score is server-authoritative too, now.**
`POST /api/sessions/[id]/report` is the Result screen's only source: it replays this
session's own `TraceEvent` rows through `attemptsFromTrace()` → `scoreSession()`, so the
browser's grading store is **not consulted** and a fabricated store can no longer reach a
fake Report. Two halves, deliberately split — the **number** is engine arithmetic (auditable,
reproducible, cheap to re-run when rubric weights change) and the **words** are Claude
(positives, negatives, next steps). Consequences worth knowing:

- The score is persisted **before** Claude is called, one `GradingReport` row per session,
  upserted not appended — reloading the Result screen would otherwise double-count that
  learner in every average.
- No `ANTHROPIC_API_KEY` is a normal state: the route returns the score with
  `report: null, reason: 'llm_unconfigured'` and the screen omits the written sections. A
  missing narrative must never cost a learner their score.
- Reaching the report marks the session `COMPLETED`, which is what stops "reuse the session
  in progress" from handing a learner their previous attempt forever.
- Recorded decision keys and rubric item ids are **not** the same strings
  (`setting:classify:onError` vs `classify:settings.onError`); the translation lives in one
  place, `rubricItemId()`.

When adding a graded surface, route it through `/check` — do not reintroduce a local answer
comparison.

### The trace pipeline (M2) — how anything gets recorded
Everything the journey observes flows through one path, and the invariants are not
negotiable because the grading worker replays this data.

- **[src/lib/traceQueue.js](apps/web/src/lib/traceQueue.js)** — an outbound queue that sits
  between the screens and the network. Three rules: **never throw at the caller** (a dropped
  request must not break the Build stage; the worst outcome is a gap in the admin timeline),
  **never renumber** (each event gets a `clientSeq` once, for life), and **never grow without
  limit** (500 pending max). Consecutive failures back off exponentially to ~2 minutes — a
  batch the server will never accept was retried every 2s forever, and because each attempt
  takes a per-session database lock, the trace route **starved answer checking on the same
  session**. That is how a missing migration turned into learners seeing no verdicts.
- **[src/lib/useTrace.js](apps/web/src/lib/useTrace.js)** — creates the queue *before* the
  session exists (starting a session is a round trip; anything the learner does in that
  window would otherwise be lost) and mirrors unsent events into `sessionStorage` so a reload
  doesn't silently drop them.
- **[src/lib/TraceContext.jsx](apps/web/src/lib/TraceContext.jsx)** — `useTraceContext()`,
  because the Ask-AI drawer lives inside `TopBar` and the NDV is three levels deep. The
  default is a **no-op, not an error**: dev routes and tests must keep working.
- **`POST /api/sessions/[id]/events`** — batch ingest, idempotent on `(sessionId, clientSeq)`,
  validated by `clientTraceBatchSchema`. `seq` is allocated **here**, never by the client.
  `CLIENT_FORBIDDEN_TYPES` in [packages/trace/events.ts](packages/trace/events.ts) blocks the
  client from posting `decision` events at all — those are server-written by `/check`, and a
  learner who could forge them could forge their own grade.

**Both `/check` and `/events` write to one table with a unique `(sessionId, seq)`, and both
serialise on `pg_advisory_xact_lock(hashtext(sessionId))` inside the transaction.** Do not
add a third writer without taking the same lock. The NDV verifies every field of a node in
one `Promise.all`, so concurrent checks are the normal case, not an edge case — read-`MAX`-
then-insert produced duplicate `seq`, a 500, and a client that turned that 500 into a wrong
answer. The **attempt count** lives inside the same lock too: unsynchronised, every
concurrent check of one id counted zero priors and all claimed `firstTry`.

### Resume — "Continue where you left off"
**The offer is on the challenge's own card**: a card whose challenge has an attempt open
swaps its Start for **Start over / Resume** (`HomeScreen`). The strip that used to sit above
the grid was removed on 2026-08-11 — same title, same two buttons, second place to look, and
it pushed the catalogue down the page. Anything describing a "Continue where you left off"
banner is out of date; `resume` is still the prop, the cards are what read it.

`GET /api/sessions` answers **where this learner was**, and every part of that answer is
replayed from their own `TraceEvent` rows, never from `Session.currentScreen` /
`builtGraphSnapshot` (nothing writes those until a session completes, so trusting them offers
everyone screen one and an empty canvas). The derivation is one pure, tested function —
[src/server/resumePoint.ts](apps/web/src/server/resumePoint.ts) — because the route itself
cannot be unit tested and a resume that is merely *close* to the right place still looks like
a working feature.

**The trace holds progress at four granularities and the payload must carry all four.** It
used to carry two, and that was the bug: `phase_transition` was not even in the route's
`type` filter, so Build reopened at phase one — where the restored canvas satisfied it
instantly, fired the phase-clear effect, and walked the learner through a celebration for
every phase they had already earned. The two quizzes asked every question again.

| Event | Becomes | Consumed by |
|---|---|---|
| `screen_transition` | `screen` | `MainApp` (`RESUMABLE_SCREENS` — `report` is excluded) |
| `phase_transition` | `phaseId` | `BuildStage` `resumePhaseId` → initial `phaseIndex`, and it suppresses the first-`+` spotlight |
| `decision` | `answered.{dissection,stress}`, `solved.dissection` | `DissectionScreen` / `EvalScreen` `resume` → initial question index |
| `graph_mutation` | `graph` (positions, `configured`, field `values`, `settings`) | `BuildStage` `initialGraph` → `seedNodes` → the NDV |

Rules worth keeping:

- **A question counts as answered whether it was right or wrong.** Both quizzes advance on
  either verdict, so re-asking one hands out a second attempt at something already recorded —
  reloading must not be a way to improve a score.
- **`solved` is narrower than `answered`** and exists for one reason: `unlockedTypes` in the
  payload, resolved server-side from the pinned version for correct answers only. Without it
  the Understand summary says "here is your toolkit" over an empty row.
- **A graph with no numeric node positions is refused** — React Flow reads `position.x` while
  seeding and throws, taking the whole Build screen down. Returning null costs the canvas and
  nothing else. **Which is why what gets traced is built by one function,
  [traceGraph.js](apps/web/src/lib/traceGraph.js), and not mapped inline.** It was mapped
  twice in `handleGraph`, and the second copy read `n.position` off a list the first copy had
  already stripped it from — so every recorded graph had `position: undefined` and the
  endpoint refused all of them. 52 of the 60 mutations recorded locally had no positions, and
  the 8 that did were written by a test. Resume looked implemented and gave back nothing.
- **Field values and node settings are traced too, and restored three levels down**:
  `traceableGraph` records `data.values` / `data.settings` → `seedNodes` puts them back on the
  node → the `ndvNode` memo passes them → the NDV opens on them. A node used to come back
  marked configured over blank inputs, which reads as lost work. Only nodes whose setup
  verified green carry values (that is when the editor stores them), which also means the
  badge and hint copy has to name the state: a filled-but-unverified field says **VERIFY ME**,
  not "set me up".
- **Verdicts are deliberately NOT restored.** `results` starts null, so Verify must be pressed
  again. A green tick is the server's to give, and re-checking an answer that was already
  right cannot cost marks.
- **Seeding is the other half of tracing, and it broke twice in the same place — the editor's
  id space and its edge dialect.** Both shipped as one reported symptom: *come back to a build
  and nodes have vanished and the wiring is a mess.* Fixed 2026-08-11, tested in
  [seedGraph.test.js](apps/web/src/n8n/seedGraph.test.js):
  - **Node ids must come from the canvas, not a counter.** `nextNodeId(nodes)` reads the
    highest `n<N>` already present. It used to be a module-level `let idc = 0`, which a reload
    reset while the restored nodes kept `n1…nN` — so the next node placed was a **duplicate
    id**. React Flow keys `nodeInternals` by id and keeps the last, so the restored node
    disappeared from the canvas while still in React state, wires re-routed to the impostor,
    `removeNode` deleted **both**, and `nodes.find(byId)` handed the NDV the wrong one.
  - **`seedEdges` must read both dialects.** A branch is an output handle, and authored graphs
    call it `branch` while the editor — and therefore `traceableGraph` — calls it
    `sourceHandle`. Reading only `branch` dropped the handle off every restored branch wire:
    React Flow's `getHandle()` then falls back to the node's first handle (all exits collapse
    onto one), and `asWorkflow`/`branchReach` see no branch at all, so a learner whose routing
    was **correct** before the reload was refused the phase and mis-simulated on the Run.
  - The lesson generalises: anything `traceGraph.js` records, `seedNodes`/`seedEdges` must be
    able to read back **in the editor's own vocabulary**. The dev routes seed `referenceGraph`,
    which speaks the authored one, so testing only those hides every resume bug.
- **Guarded by `npm run smoke`** (the `resume` check, which is stateful and runs after the
  page checks). It builds a mid-quiz and a mid-Build state through `/check` and `/events`,
  then asserts the quiz reopens at the next unanswered question and Build reopens on the right
  phase with no celebration replay, that a restored node's selects still hold the learner's
  answers, that a node placed **by clicking** comes back at all (the API-seeded scenarios
  cannot see the position bug above), and that **placing a node after resuming adds one**
  rather than silently replacing a restored one. Every part was verified to fail when its fix
  is reverted; keep it that way, and keep every wait condition-based.
  - The mid-Build state is seeded with a **learner's** node id (`n1`), not an authored one.
    With `trigger-1` there the id spaces cannot overlap, so the duplicate-id bug above was
    unreachable from the check that existed to catch exactly this.
  - Two traps cost real time in that check, both worth knowing before adding to it:
    `getByText(x).first()` is first in **DOM order, not the first visible** match, and the NDV's
    fields are real `<select>` elements whose `<option>`s Playwright counts as invisible — so
    assert on `select.value`, not on the option's label. And the node picker has no Escape
    handler: clicking near its header to dismiss it lands on a node in its own list and **adds
    one**, after which the NDV opens on a brand new empty node.

### Scoring — the rubric ([packages/engine/rubric.ts](packages/engine/rubric.ts))
Replaced "share of decisions correct on the first try", which had two defects: every decision
weighed the same (email-triage's 13 dropdowns outweighed its 6 node placements), and clicking
through a 3-option field until it went green cost nothing.

- **Attempt decay is tied to the option count.** On an N-option question the Nth attempt is
  forced by elimination, so it earns **zero**. 4 options → 100/66/33/0; 3 → 100/50/0;
  open-ended (expression, number, placement) → 100/50/0. Answering everything by elimination
  now scores 0%.
- **Weights** 30 dissection / 25 placement / 25 config / 20 edge-case. The even build split is
  deliberate — otherwise config carries 13/19ths of the Build score purely because the problem
  has more dropdowns.
- The **denominator is every decision the problem requires**, enumerated from problem data, so
  an abandoned session cannot look like a short perfect one. Empty buckets redistribute their
  weight rather than capping the maximum.
- **Probes are deliberately unscored** — the wrong placement already paid via decay, and
  scoring the probe would charge one mistake twice.
- `scoreBand()` gives the plain-English meaning of the number; `problemComplexity()` orders
  the catalogue easiest-first so "practise more" can name a real next challenge without an
  authored `difficulty` field to keep in sync.
- The grading prompt ([packages/llm/gradingPrompt.ts](packages/llm/gradingPrompt.ts)) **cannot
  emit a score** — the schema doesn't allow it. It's seeded as `RubricVersion` v1; editing the
  prompt and re-seeding appends v2, because a `GradingReport` points at the exact version that
  produced it.

### Admin — [/admin](apps/web/app/admin/page.tsx)
`AdminDashboard.jsx` (Overview · Cases · Completion · Learners · Admins) over
`/api/admin/analytics`, `/api/admin/learners/[id]/sessions` and `/api/admin/sessions/[id]`
(a read-only timeline of one attempt). Every number is computed in
[src/server/analytics.ts](apps/web/src/server/analytics.ts), **aggregated in SQL** — 60 demo
learners already produce ~6k trace events, so "fetch then count in JavaScript" would stop
working quietly and early. Nothing is derived in the browser, so no panel can disagree with
the database.

**The funnel is computed from `screen_transition` events, not `Session.currentScreen`** —
`currentScreen` is only written when a session completes, so trusting it reports every
unfinished learner as stuck on the first screen, which is exactly the number the funnel
exists to get right.

Admin routes each call their own `requireAdmin()` (401/403); the middleware matcher covers
`/admin/:path*` but authorisation is per-route. Granting admin by email writes an
`AdminAllowlist` row **and** promotes the account if it exists, so an email added before
signup is promoted when they sign up — "ask them to sign up first, then tell me again" is a
step everyone forgets.

### Canonical workflow model — `@judge/workflow`
The engine reasons in **real n8n's shape**, not React Flow's. Connections are keyed by
**source node name**; `main` is an array-per-output (so **a branch is an output index**,
not a handle string); sub-nodes attach over typed `ai_*` connectors (`ai_languageModel`,
`ai_memory`, `ai_tool`, `ai_outputParser`, …) rather than the grey main wire.

The editor still hands over a flat React Flow graph and problems are still *authored* that
way, so [`asWorkflow()`](packages/engine/asWorkflow.js) normalises at the boundary and
anything already canonical passes through. [`hasConnection()`](packages/engine/connectionMatches.js)
replaced the old `edgeMatches` — authored requirements keep the readable vocabulary
(`branch: 'bug_report'`, `targetHandle: 'ai_model'`) and the translation to output index /
connector name happens there. Basis: [docs/research/n8n-core-architecture.md](docs/research/n8n-core-architecture.md).

### Topology is data, not code
[packages/engine/simulate.js](packages/engine/simulate.js) resolves each node's role from
**catalog metadata** (`category`, `needsModel`, `branches`) → `trigger | ai | router |
action | passthrough` and walks the graph generically. Linear flows, routers whose
branches pass through several nodes, multiple actions, and alternative node *types* all
work as pure data. `validateProblem()` enforces only generic structure. Node **settings**
also feed the simulation — `onError` and `alwaysOutputData` change what a Run narrates.

**The node library is now 200 registered types, and
[docs/node-library-catalog.md](docs/node-library-catalog.md) is the menu.** Read it before
choosing nodes for a case — it gives the catalog `type` per node, a "how to choose" table per
case shape, and three lists a new case must NOT pick from: **10 compatibility aliases**
(`trigger`, `parse`, `action`, `classify`, `chat-gemini`, `summarize`, `slack-message`,
`notion-page`, `calendar-event`, `web-search` — they exist only so the three authored cases keep
working; use `gmail-trigger`, `edit-fields`, `gmail`, `text-classifier`,
`google-gemini-chat-model`, `basic-llm-chain`, `slack`, `notion`, `google-calendar` instead), 5
deprecated descriptors, and 3 deferred triggers. Any inline node list elsewhere is stale — the
library grew from 23 types.

**Icons are all in the repo:** `apps/web/public/node-icons/*.svg`, wired through
`nodeImageIcons`. 200 of 200 types covered, no remote URLs — an authoring run never fetches an
asset, and must never introduce a hotlink.

**Still coupled:** a genuinely new *node type* is **five** things — a descriptor under
[packages/catalog/](packages/catalog/), a `typeCategory` **and** icon entry in `nodeIcons.js`
(missing the former makes it invisible in the picker, which *filters* on that map rather than
falling back), the SVG asset, and a row in the catalogue doc. That's by design.

**A type may only be defined once.** `NODE_CATALOG` is assembled from `BASE_NODE_CATALOG` plus
`CORE_NODE_CATALOG` plus `APP_NODE_CATALOG`, and `catalog.test.js` asserts those three are pairwise
disjoint. That guard exists because object spread is last-wins and silent: a `core-nodes/switch.js`
once replaced the hand-authored `switch` and dropped its `branches`, which stopped it resolving as
a router — 15 tests failed and a learner with a *correct* branching flow could not finish a build
phase. A router is now recognised by `isRouterEntry()` (an explicit `router` flag, `branches`, or
more than one `main` output), so a multi-output node is a router automatically.

> **Every case owes an importable n8n workflow**, and the exporter no longer needs a per-type
> entry: `exportWorkflow.js` falls back to `genericNodeSpec()`, which derives real n8n parameters
> from the descriptor plus the authored answers. So
> [packages/engine/n8nNodeSpecs.js](packages/engine/n8nNodeSpecs.js) is a table of ~14 **overrides**
> for the nodes whose real shape the descriptor cannot imply — `switch`'s `rules.values[].outputKey`,
> `google-sheets`'s `{ __rl }` locators, `classify` exporting as `chainLlm`. The remaining duty is
> to read what a case actually emitted, because a clean export is not proof it would run.

### Packages
| Package | What |
|---|---|
| `@judge/engine` | Pure, unit-tested `(studentGraph, problem)` logic: `validateGraph` (gates the Run), `simulateCase`/`simulateAll`, `scoreEval`, `grading`, `asWorkflow`/`inferBranches`, `hasConnection`, `branchReach` (does every branch reach a reply), and the **rubric** (`scoreSession`, `attemptsFromTrace`, `phaseBreakdown`, `scoreBand`, `problemComplexity`, `enumerateItems`) |
| `@judge/workflow` | The canonical n8n workflow model (TS) + React Flow ⇄ n8n conversion |
| `@judge/catalog` | `NODE_CATALOG` — node vocabulary, params, sample I/O |
| `@judge/problems` | The five shipped cases (seven files each) + `_template/` + registry + tests (seed source). **Registry order is the catalogue order** |
| `@judge/problem-schema` | zod `Problem` schema, `validateProblem()`, `toPublicProblem()`, `checkAnswer()`, `ruleList.ts` (rule/assignment lists) |
| `@judge/trace` | `TraceEvent` contract + `ingest.ts` — decision, screen/phase transition, ndv_open, graph_mutation, run_result, ask_ai_turn; `CLIENT_FORBIDDEN_TYPES` |
| `@judge/queue` | Queue interface + pg-boss driver + SQS stub |
| `@judge/llm` | Claude client + grading / authoring / ask-ai prompt builders |
| `@judge/db` | Prisma 6.x schema + migrations + client singleton + `publishProblem.mjs` and the seed scripts |
| `@judge/voice-scripts` | **Generated, committed.** One clip table per problem (`id → {text, file}`) + `VALID_CLIP_FILES`. The contract the generator, the server and the browser all read — see *Voice* |

`grading` is **pure functions**, not a Zustand store — the UI holds one store in React
state and appends. `recordDecision` keeps the *earliest* decision per id, so re-answering
never inflates the first-try signal that Understanding is scored on.

### Auth
Split across two files because middleware runs on the edge runtime and cannot load Prisma:
[auth.config.ts](apps/web/auth.config.ts) is the edge-safe half (JWT session, callbacks,
session claims `id`/`role`/`batchId`) and [auth.ts](apps/web/auth.ts) adds the
Prisma-backed Credentials provider. [middleware.ts](apps/web/middleware.ts) matches only
`/`, `/login`, `/signup`, `/admin/:path*`, `/api/problems/*` — **`/api/sessions/*` and
`/api/admin/*` are guarded inside the route handlers**, which also check that the session
belongs to the caller (writing into someone else's session would let one learner forge
another's trace, which is the input grading replays). Keep both halves in sync when adding a
claim.

### Screens — [apps/web/src/screens/](apps/web/src/screens/)
- `HomeScreen` — challenge cards from `problemList`.
- `DissectionScreen` (Understand) — Iris-narrated node-pick quiz.
- **`BuildStage` (Build) — the most complex file.** A storytelling board: one traveling
  Iris mascot (GSAP), a spotlight intro on the first `+`, guided `buildPhases`, wrong-pick
  handling (node placed with a red pulse, Iris travels to it, a draggable floating MCQ
  probes, then it's removed), the NDV as a centered modal, and the Run animation
  (test-case stepper, traveling sticky note ~2s/node, active node highlighted while the
  rest dim, all-pass confetti). Phase completion requires every phase node-type placed
  **and** configured — and for a router phase, every `branch` reaching a configured reply.
  That last check is [`branchReach.js`](packages/engine/branchReach.js), not an inline
  comparison: it resolves a terminal by catalog **category** (Slack, Notion, Calendar and
  Docs all end a run) and **walks through passthrough nodes** to find it. The old inline
  rule (`target.type === 'action'` on the immediate target) made "topology is data" false
  exactly where a learner would notice — a correct flow whose branch formats then sends, or
  replies on Slack, could pass its Run and still refuse to advance the phase.
- `EvalScreen` (Stress Testing) — one column in reading order: section header → question
  number → question → node strip → options → verdict, with Continue in a fixed footer.
  Options are shuffled per (tab session, question key) and carry `originalIndex`, because
  `scoreEval` grades against the authored `correctIndex`. The post-answer `NodeReplay` was
  removed on 2026-07-30, which left **`components/NodeReplay.jsx` with no importers** and
  `EvalScreen` with no need for the learner's `graph`.
- `PlaygroundScreen` — behind `#playground` only, not part of the graded journey and not
  reachable from Home. It exercises the n8n component kit in isolation: blank canvas → "Add
  first step" → picker drawer → "Set me up" → NDV. Use it when working on the editor layer
  rather than on a problem.
- `ReportScreen` (Result) — renders what `POST /api/sessions/[id]/report` returns and
  **does not compute the score**: a navy hero (band greeting by first name, band definition,
  the total), then the per-phase breakdown, positives and negatives side by side, next steps,
  and a bottom bar (redo / next / home, each rendered only if given a handler). Two things
  to know before editing it: **text on the hero must set its own `color`**, because the global
  stylesheet gives `h2`/`p` a `color: var(--fg-1)` that beats the container's inherited
  white; and when `report` is null (`reason: 'llm_unconfigured'` with no `ANTHROPIC_API_KEY`,
  or `'llm_failed'`) the screen **says the written feedback is missing** rather than quietly
  dropping two sections — silently omitting them reads as a bug, which is exactly how it was
  reported.
- `AdminDashboard` — see *Admin* above.

### n8n editor layer — [apps/web/src/n8n/](apps/web/src/n8n/)
Built from scratch (not n8n's assets), on `reactflow` v11.
- `N8nEditor` — `forwardRef` exposing `removeNode`/`fitAll`; `initialGraph` seeds a
  finished flow; a `displayNodes` memo injects per-node cue flags (`needsSetup`,
  `awaitingNext`, `hasModel`, `openBranches`, `running`, `dimmed`). `EditorContext`
  provides `openPicker`/`openNdv`/`branches` — **not `removeNode`**, on purpose.
- **A learner cannot delete a node** (removed 2026-08-11). The per-node hover trash button is
  gone and `deleteKeyCode={null}` turns off React Flow's Backspace, because hiding the button
  while leaving the key would keep deletion as an accident with nothing on screen to explain
  it. The only remover is `BuildStage` clearing a wrong pick over the editor's ref, *after*
  Iris has probed it — that probe is the teaching, so a learner quietly deleting the node
  skips it. Keep `removeNode` off `EditorContext`; putting it back puts the button back in
  reach of any node component.
- `N8nFlowNode` / `N8nNodeView` — the **AI node is identified by `variantOf === 'ai'`** and
  **router branches come from `problem.branches`** via context. Neither is hardcoded.
- `Ndv` — INPUT | Parameters/Settings | OUTPUT. A node is configured in **two ordered
  stages**: Parameters must verify green before the Settings tab unlocks, and setup needs
  **both**. Verify calls the server per field/setting; per-field Iris explanations come
  from the response. Touching a setting must not reset the parameter stage (that was a
  real bug).
- `SettingsForm` + [nodeSettings.js](apps/web/src/n8n/nodeSettings.js) — `SETTINGS_SPEC` is
  shared across node types, matching n8n. Only what the problem grades
  (`nodeSetup[type].settings`) is editable; the rest render at real n8n defaults but
  locked.
- `FieldControl` — every field kind (see *Problem-as-data* above). Its `isCorrectValue` and
  `resourceValue` logic is mirrored server-side in `answerCheck.ts`; **keep the two in
  sync** (there are tests on both sides). `RuleListControl` handles `ruleList` /
  `assignmentList`.
- `NodePickerDrawer` — the node library drawer.

### Ask-AI
[app/api/ask-ai/route.ts](apps/web/app/api/ask-ai/route.ts) streams Claude on the cheap
tier, scoped to problem/screen/phase/node. It is **deliberately unhelpful about answers** —
asked "which node?", it teaches the concept and asks a guiding question. Intended. Without
`ANTHROPIC_API_KEY` it returns 503 and the UI degrades gracefully.

### Voice — Iris speaks (ElevenLabs v3)
**Read [.claude/skills/iris-voice/SKILL.md](.claude/skills/iris-voice/SKILL.md) before
touching anything under `voice*`, `packages/voice-scripts`, or a problem's `voice`
block.** It is the whole contract: the pipeline, the 23 moments in journey order, the
copy rules (all test-enforced), the measured v3 tag table, and the traps that have
actually bitten.

The two rules that matter most, in case the skill is not loaded:

- **Nothing renders at runtime.** Clips are pre-rendered on a laptop
  (`npm run voice:generate`), stored, and served as files. The serving route has no
  vendor client, refuses any path not in a committed table, and never asks storage twice
  (`voiceCache` keeps one copy per container and collapses concurrent misses). The
  previous design called the vendor mid-session and asked S3 per object, which flagged
  Scaler's credentials.
- **Two things must both happen after a copy edit**: `npm run voice:generate` (the
  fingerprint changed, so the file name changed) and `npm run db:seed` (problems are
  served from Postgres). Skipping either looks identical to a broken render.

**Where the code is**, since the skill covers the contract rather than the file map:

- [src/lib/voiceLines.js](apps/web/src/lib/voiceLines.js) — the phrase book, **shared by the
  generator and the browser** so the words you hear and the caption you read cannot drift.
- [src/lib/voiceCatalogue.js](apps/web/src/lib/voiceCatalogue.js) — enumerates every line
  that can *ever* be spoken. This is what makes pre-rendering possible, and why line
  variables come from a closed set (`{node}`, `{answer}`) drawn from problem data rather
  than free text.
- [src/lib/voicePath.js](apps/web/src/lib/voicePath.js) — `<folder>/<id>--<fingerprint>.mp3`.
  The **id is derived** identically by generator and browser; the **fingerprint is of the
  text**, which is why a copy edit renames the file.
- [src/lib/voice.js](apps/web/src/lib/voice.js) — the player: a "moment" abstraction, a busy
  latch, a single-slot pending queue, and silent degradation. Callers do
  `voice.play('verify_pass')` and never handle an error, because narration must never break
  a screen.
- [src/lib/VoiceContext.jsx](apps/web/src/lib/VoiceContext.jsx) — **two** contexts on
  purpose: `amplitude` changes every animation frame to drive Iris's glow, so merging it with
  the actions would re-render every consumer 60×/s and re-run any effect depending on
  `voice`. Keep them split. UI: `components/VoiceBubble.jsx`, `VoiceoverIndicator.jsx`.
- **`GET /api/voice/clip/[...path]`** — serves one clip at a cacheable URL, auth-gated, path
  validated against `VALID_CLIP_FILES`; the browser streams and honours Range.
- **`GET /api/voice/diagnostics`** (optional `?problem=`) — answers "why is narration not
  playing?" without devtools. Every voice failure is silent by design (the learner just sees
  captions), so this is the only way to tell a missing bucket from an ungenerated problem.

Design: [docs/superpowers/specs/2026-07-30-voice-clip-pipeline-design.md](docs/superpowers/specs/2026-07-30-voice-clip-pipeline-design.md).
Copy proposal and rationale: [docs/voice-copy-email-triage.md](docs/voice-copy-email-triage.md).

**Coverage today: all five cases are narrated.** Each one's authored lines live in
`packages/problems/<slug>/voice.js` and are rendered into
`packages/voice-scripts/<slug>.json` — every line the catalogue says can *ever* be spoken,
authored plus generic: email-triage 533, ops-request-desk 533, low-stock-morning-post 543,
expense-approvals 447, trial-signup-desk 365. A case with no table falls back to the generic
phrase book until `voice:generate` runs for it.

### Legacy inside apps/web/src
`nodes/*.jsx` (`ActionNode`, `ChatModelNode`, `ClassifyNode`, `ProcessNode`, `TriggerNode`,
`SwitchNode`, `NodeCard`, `nodeTypes.js`) have no importers — the live canvas is the
`n8n/` layer. **Exception:** `nodes/nodeIcons.js` is live and imported by eight files.
`components/NodeReplay.jsx` joined this list on 2026-07-30: the Stress Testing replay and
the Result screen's decision rows were its only two callers and both are gone. Kept, not
deleted, because it is the one component that animates a case through a learner's own
graph — but nothing renders it today.

**Screenshot scripts can also go stale.** `apps/web/scripts/shoot-mn.mjs` targets
`meeting-notes`, which no longer exists, so it cannot run; `shoot-askai.mjs` and
`shoot-verify.mjs` name removed problems too. `smoke.mjs` is the one that survived the
removal, because it derives its targets from `problemList` instead of hardcoding slugs —
copy that habit into any new script.

## Design conventions

Follows `design-source/syntax-design-system/SKILL.md`, styled inline via CSS custom
properties (`--brand-primary` `#0055FF`, `--surface-*`, `--fg-*`, `--border-*`,
`--status-*` — never raw hex). Zero `border-radius` on app chrome; 1px hairline borders;
no decorative gradients; Plus Jakarta Sans for UI, Clash Grotesk for headlines.
**Exception:** n8n node *bodies* (`N8nNodeView`) use rounded corners for n8n fidelity.
Primitives live in [apps/web/src/design-system/](apps/web/src/design-system/).

The user reviews this product **by looking at it** — screenshot after UI changes rather
than only asserting the code is right. `apps/web/scripts/shoot-*.mjs` drive system Chrome.

## Assessment conventions

Judge is a grader, so authoring mistakes are correctness bugs. `validateProblem()` lints
them and will reject:

- escape-hatch option text ("Added it by mistake") and probes with fewer than 3 options;
- a wrong option with no misconception code — it would never reach the report.

Probe copy follows three rules: **never name the correct node**, every option is a real
position someone would hold, and the correct answer describes what the *wrong* node
actually does. Probe selections are rendered neutral, not green/red — the placement is
already known to be wrong. Never park the correct option at index 0 as a habit; an audit
once found it there in 25/25 fields and 13/13 dissection items
(`apps/web/scripts/verify-option-balance.mjs` checks this).

**[balanceOptions.ts](packages/problem-schema/balanceOptions.ts) is wired, and it runs
FIRST.** `toPublicProblem()` calls `balanceProblemOptions(problem)` on line 1 of its body —
deterministically spreading each correct answer's position **while the correctness markers
still exist**, because a moment later they are stripped and nothing downstream can tell which
option to move. Don't reorder that call. The reason it exists: EvalScreen's per-tab shuffle is
uniform *on average* yet draws each field **independently**, so an individual tab can be
degenerate (the unluckiest measured session had the answer on top for 18 of 24 fields, and
averages are no comfort to the learner living in that tab). `evalQuestions` are deliberately
left alone by it — `scoreEval` grades against the authored `correctIndex`. Authored balance
plus `verify-option-balance.mjs` remain the defence for anything the projection never sees.

### IMPORTANT — copy rules for anything a learner reads BEFORE building
Also stated in the `authoring-a-problem` skill, which is the fuller version. Both are
enforced, so a violation fails `npm test` rather than reaching a learner.

0. **`flowSummary` labels are three words maximum.** The sketch lays each step out in a
   ~96px column and `wrapLabel` breaks at two words per line, so a four-word label is three
   lines tall and drags the whole row out of alignment. Enforced. The router step is worse
   than a long label: it used to print every branch name joined with `·` ("Bug Report ·
   Feature Request · Urgent Complaint"), a five-line cell. It now shows `N ways` plus one
   dot per branch — the names are in the statement and on the canvas the learner is about to
   build.
1. **`flowSummary` labels describe the JOB, never the node.** The summary is drawn as the
   "shape of it" sketch on the Understand screen — the same screen that then asks *which
   node does each job*. Labelling a step `Classify with AI` or `Send Reply` hands over the
   answer to a graded question in the author's own words, before the quiz starts. Write
   `read it and label it`, `send the right reply`. `validateProblem()` rejects any label
   containing a palette label or catalog title, and
   [ConceptFlow.jsx](apps/web/src/components/ConceptFlow.jsx) was written for plain language
   from the start — it began leaking the moment it started rendering authored labels instead
   of its own hardcoded sketch.
2. **Two lines, not a paragraph.** `statement` is the full brief and must stay complete: the
   problem panel, the sticky note and **Ask-AI's context** all read it. The short version is
   **`brief`**, capped at 125 characters by the schema and shown on the Understand hero and
   the Home card. The cap comes from the narrower surface — a Home card is 13.5px in a ~440px
   column and clamps to two lines, so longer copy is cut mid-word. Measured, after that
   happened.

Two related fields exist for the same "choosing" moment: `estimatedMinutes` (authored, sized
from the real decision count) and `coverImage` (`{prompt, src, alt}` — the **prompt is
authored now and the art generated later**, so a null `src` is normal and the card draws its
own placeholder). `/api/problems` serves `src` and `alt` but **never the prompt**.

**`nodeSetup` is keyed by node TYPE, not by node instance.** Using the same type twice in
one problem gives both instances the same NDV and grades one decision that may only make
sense for one of them, so a large problem should use each type once unless the same
configuration is genuinely right everywhere (the removed `order-desk` repeated `action`
because "send the customer a reply" really was the same setup four times, and gave every
other job its own type — that is the bar for reusing a type).

## Deployment

Railway builds from the root [Dockerfile](Dockerfile), so the service **Root Directory
must be the repo root**. It runs `npm ci --include=dev` (lifecycle hooks run
`prisma generate` and sync the dotLottie wasm into `public/`), builds `@judge/web`, and
starts [scripts/start-production.sh](scripts/start-production.sh). Health check
`/api/health` (returns `{status, db}`). Needs `DATABASE_URL`, `AUTH_SECRET` and
`ANTHROPIC_API_KEY`; voice additionally needs `FEATURE_VOICE`, `ELEVENLABS_*` and (for the
`s3` backend) `AUDIO_S3_*`. Env template: [.env.example](.env.example) — its *Pre-rendered
voice clips* comments still describe the old content-addressed scheme; the live design is
slug paths plus a manifest (see *Voice*). The service deploys from
**`sudhanva/nextjs`, not `main`** — a push deploys, so a type error reaches production.

**Voice in production is a Railway bucket, wired 2026-07-30.** Object storage, not a
volume: the serving route already speaks S3 (`AUDIO_S3_*`), a bucket survives service
re-creation and is shared by every replica, and clips are written from a laptop rather
than by the app — a volume would mean baking ~90MB of audio into the image or copying it
in at deploy. The bucket is `portable-organizer-9e47x` (project *n8n Judge*, production,
region `sin`) behind `https://t3.storageapi.dev`, prefix `voice-clips`, and the service
carries `AUDIO_S3_*` + `FEATURE_VOICE=true`. `railway bucket credentials -b <name>` prints
the S3 keys; **`railway bucket info` lags badly** and reported `0 objects` for a bucket
that already held 550, so verify with a `ListObjectsV2` against the endpoint instead of
believing the dashboard.

**A clip is addressed by a hash of its text, so the bucket and the deployed code have to
match.** Re-rendering narration changes every file name, which means uploading is only
half the job: until the build carrying the new `packages/voice-scripts` tables is
deployed, production asks for the previous names and gets 404s. That degrades to captions
by design, but it looks exactly like a broken upload.

**`start-production.sh` runs `prisma migrate deploy` before serving, and that is not
optional.** A schema change and the code that needs it arrive in the same deploy, so they
have to be applied in the same step. A deploy without it shipped code needing a column the
database lacked: every trace batch 500'd, the client retried every 2s taking a per-session
lock each time, answer checking contended behind those failing transactions and timed out,
and the client — getting no verdict — fell back to calling every answer correct. Migrations
run at **start**, not during the build, because the build has no database.

Also remembered from Railway: **a variable name with a trailing newline is invisible in the
dashboard.** `ANTHROPIC_API_KEY` was stored as `'ANTHROPIC_API_KEY\n'`, so `process.env`
could not see it while the UI showed it as present. Catch it with
`railway variables --json` and print `repr()` of the keys.

## Gotchas

- **Never run `npm run build` while `next dev` is running.** They share `.next` and it
  corrupts the running server. Symptoms are alarming and misleading — every route 500s,
  smoke fails on every screen, API calls return HTML. Kill dev, `rm -rf apps/web/.next`,
  restart.
- **Editing `packages/problems/*` does nothing until `npm run db:seed`.**
- **Beware `replace_all` edits in `.jsx`** — check enclosing function scope. A past
  `ReferenceError` came from replacing every `<TopBar activeStage="statement" />`,
  including inside inner components with no `problem` prop.
- **Next.js pollutes the root `tsconfig.json`** if `next dev` runs from the monorepo root.
  Revert it if it shows up in a diff.
- **Don't put a fixed delay in smoke.** Journey-start now enters each problem by its own
  card (`button[data-problem="…"]`) and **waits** for each step; it used to click
  `.first()`, so every problem's check actually opened email-triage. The replacement was
  briefly timing-based, passed at a 3s settle and started failing at 2.2s with four pages
  loading — a flaky check on a grading surface is worse than none, because you learn to
  ignore it.
- **Any new writer to `TraceEvent` must take the per-session advisory lock.** See *The trace
  pipeline*; skipping it reproduces the worst bug this project has had.
- **A missing `RubricVersion` silently stops scores being persisted** — run
  `npm run db:seed:rubric`. The Result screen still looks fine, so the symptom appears as
  empty admin analytics.
- **A stray `package-lock.json` one level above the repo** makes Next infer the wrong
  workspace root. Harmless in dev; can affect output file tracing on build.
- Full list of known issues lives in [STATUS.md](STATUS.md).

## Reference docs

**[docs/n8n-reference/00-how-n8n-actually-works.md](docs/n8n-reference/00-how-n8n-actually-works.md)
— read this before touching `@judge/workflow`, `@judge/catalog`, `simulate.js` or the NDV.** It
is n8n's real behaviour read out of n8n's own source (v2.33.0): the connection model, the node
contract, parameters and `typeVersion`, the NDV and the exact Settings tab, the execution and
error model, expressions, cluster nodes, and a per-node behaviour catalogue — plus a section
comparing all of it to Judge's model.

[STATUS.md](STATUS.md) · [docs/understanding.md](docs/understanding.md) (intent + locked
decisions) · [docs/plan-production-platform.md](docs/plan-production-platform.md) ·
[docs/plan-m1.5-fidelity-and-assessment.md](docs/plan-m1.5-fidelity-and-assessment.md) ·
[docs/adding-a-problem.md](docs/adding-a-problem.md) ·
[docs/research/](docs/research/) (how real n8n works from the docs — the basis for M1.5) ·
[docs/n8n-reference/](docs/n8n-reference/) · [docs/reference/](docs/reference/)
