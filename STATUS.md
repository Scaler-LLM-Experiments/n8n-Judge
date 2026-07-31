# Status

**The single source of truth for what's built and what's next.** Update this file as work
lands — don't start a new handoff doc.

Last updated: 2026-07-29 · Branch: `sudhanva/nextjs`

---

## Where we are

The frontend-only Vite prototype has been ported into a Next.js full-stack monorepo.
**M0, M1 and M2 are complete. M4 (admin analytics) landed early. M1.5 is the current
workstream and M3 is half done** — grading is real and server-authoritative, but it runs
inside the web request rather than a worker, and ratings are not built.

Milestones have been completed out of order. What is actually true, per milestone:

| | State |
|---|---|
| M0 foundations | ✅ complete |
| M1 auth + problems from the DB | ✅ complete |
| **M1.5 fidelity + assessment** | ⬅ **current.** A1, A2, A4/C1, B1, B5 done; B6 partly; rubric wired |
| M2 persistence + tracing | ✅ complete — resume lands on the recorded point as of 2026-07-31 |
| M3 queue + grading + ratings | ⚠️ **half done** — scoring + Claude narrative live; no worker service, no ratings |
| M4 admin analytics | ✅ landed early — overview, cases, completion funnel, learners, admins |
| M5 authoring · M6 voice · M7 SQS | not started |

Verified 2026-07-29: **252/252 unit tests**, smoke green on all 20 screens.

---

## Done

### M0 — Foundations
- npm-workspaces monorepo; engine, catalog and problems extracted into `packages/`.
- `edgeMatches` deduped into one shared module.
- **Prisma data model** — 13 tables, 7 enums, initial migration committed. Not yet run
  against a live database.
- `problem-schema` (zod + `validateProblem()`), `trace` (TraceEvent contract),
  `queue` (interface + pg-boss driver + SQS stub), `llm` (Claude client + prompt builders).
- Next.js app renders the whole ported journey.

### Beyond M0
- **Topology generalised.** `engine/simulate.js` resolves each node's role from catalog
  metadata (`category`, `needsModel`, `branches`) instead of hard-coding
  `trigger → ai → parse → switch → action`. This overrode the plan's risk-#1 deferral.
  `validateProblem()` now enforces only generic structure — start at a trigger, finish at
  an action; model and routing rules apply only when those roles are used.
- **Third problem: `meeting-notes`** — linear, no router. Exists to prove the above; that
  shape could not run before.
- **Real Ask-AI** — streaming `/api/ask-ai` (Claude), scoped to problem/screen/phase/node,
  prompted never to leak answers, graceful 503 without a key.
- **Smoke test** — loads every screen of every problem, fails on any runtime error.
- **Repo restructured** (2026-07-27) — the monorepo moved from `innate/` to the repo root
  and both dead Vite prototypes were deleted. Railway's Root Directory must now be the
  repo root, not `innate`.

---

## Next

### M1 — Auth + problems from the DB ✅

1. ~~Provision Postgres, wire `DATABASE_URL`, run the migration.~~ **Done.**
   - **Local** — [docker-compose.yml](docker-compose.yml) (`npm run db:up`), 14 tables live.
   - **Railway** — Postgres service provisioned in project *n8n Judge* (production).
     `DATABASE_URL` set on the app service as a `${{Postgres.DATABASE_URL}}` reference,
     `AUTH_SECRET` generated and set. Migration `0001_init` applied; `migrate status`
     reports the schema up to date.
2. ~~Auth.js Credentials — email + password, bcrypt, roles LEARNER/ADMIN.~~ **Done.**
   JWT sessions; `auth.config.ts` is the edge-safe half (middleware) and `auth.ts` adds
   the Prisma-backed Credentials provider. `middleware.ts` guards `/` and
   `/api/problems/*`, and bounces signed-in users away from `/login` and `/signup`.
3. ~~Signup with batch invite codes; Programs as DB rows.~~ **Done.** `/signup` and
   `/login` pages; invite codes match case-insensitively; duplicate email → 409.
4. ~~`GET /api/problems`, `GET /api/problems/[slug]`; seed the three problems as v1.~~ **Done.**
5. ~~Switch the journey off the client-side registry import.~~ **Done.** The web app no
   longer depends on `@judge/problems` at all, so the client bundle no longer ships every
   problem's answer key. `apps/web/src/data/` is gone; `problemsApi.js` fetches, and
   `AsyncGate` supplies the loading/error states that async startup now needs.

**M1 is complete.** Remaining for later: `/api/problems` should filter by the caller's
batch/program via `ProblemAssignment` (the data is seeded, the filter is not written), and
there is no admin UI yet — promote an admin with
`UPDATE "User" SET role='ADMIN' WHERE email='…';`

### M1.5 — n8n fidelity + real assessment ⬅ **current**
Full plan: **[docs/plan-m1.5-fidelity-and-assessment.md](docs/plan-m1.5-fidelity-and-assessment.md)**

Progress:
- **A1 — option shuffling. Done.** Seeded by (tab session, question key) so order is
  stable while reading and identical after a reload. `EvalScreen` options carry
  `originalIndex` because `scoreEval` grades against the authored `correctIndex`.
- **A2 — authoring lint. Done.** `validateProblem()` rejects escape-hatch option text
  and probes with fewer than 3 options, and warns when a wrong option carries no
  misconception code (it would never reach the report).
- **A4 + C1 — probe rewrite. Done.** Every probe used to end with "Added it by mistake"
  flagged `correct: true`: a free correct grading record, no misconception logged.
  Rewritten under three rules — never name the correct node, every option is a real
  position, and the correct answer describes what the *wrong* node actually does.
  The probe panel is also no longer scored green/red: the placement is already known to
  be wrong, so colouring the accurate answer green read as "you were right" and then
  the node vanished. Selection is neutral; the explanation carries the meaning.
- **B1 — canonical n8n graph model. Done.** `@judge/workflow` holds the real shape:
  connections keyed by source node NAME, `main` as an array-per-output, sub-nodes on
  typed `ai_*` connectors. `engine/simulate.js` and `validateGraph.js` reason in it;
  `asWorkflow()` normalises at the boundary so the editor still hands over React Flow
  and reference graphs stay authored as they are. A branch is now an OUTPUT INDEX, and
  a Chat Model is found over `ai_languageModel` — both were string comparisons before.
- **B5 — Settings tab. Done.** Was hard-disabled. Now sequenced: Settings unlocks only
  once Parameters verify green, and setup needs BOTH. Only what the problem grades is
  editable; the rest render at real n8n defaults but locked. Settings **change the Run** —
  On Error produces three different narrations on a failing AI node, and Always Output
  Data turns an unmatched email from "unanswered" into "blank reply sent".
- **B6 — parameter kinds. Partly done.** `FieldControl` adds text/number/boolean/
  expression alongside select. The Chat Model went from ZERO fields (temperature was
  *locked at the answer*) to a graded number field; `classify.text` became a real
  expression field with drag-to-map plus an "Insert field…" picker.
  **Still uniform 2-select shapes:** the Gmail trigger, Switch, Send Reply, and
  everything in `lead-triage` and `meeting-notes`. That is the remaining fan-out.
- **Scoring rubric — built and unit-tested, NOT yet wired to the journey.**
  [packages/engine/rubric.ts](packages/engine/rubric.ts) replaces "share of decisions
  correct on the first try", which had two defects: every decision weighed the same (so
  email-triage's 13 dropdowns outweighed its 6 node placements), and clicking through a
  3-option field until it went green cost nothing traceable.
  - **Attempt decay tied to the option count.** On an N-option question the Nth attempt is
    forced correct by elimination, so it earns ZERO. 4 options → 100/66/33/0; 3 options →
    100/50/0; open-ended (expression, number, node placement) → 100/50/0. Verified:
    answering everything by elimination now scores **0%**, where the old model scored it
    the same as answering correctly.
  - **Weights** 30 dissection / 25 placement / 25 config / 20 edge-case. The even build
    split is deliberate — without it config would carry 13/19ths of the build score purely
    because the problem has more dropdowns. Consequence: one placement is worth ~2.8 config
    items on email-triage, ~1.25 on meeting-notes, so equal scores across problems are not
    quite the same mix.
  - Denominator is **every decision the problem requires**, enumerated from problem data,
    so an abandoned session cannot look like a short perfect one. Empty buckets
    redistribute their weight rather than capping the maximum.
  - Probes are deliberately **not** scored items: the wrong placement already paid via
    decay, so scoring the probe would charge one mistake twice.
  - Item ids match the recorded decision keys, so an M3 trace replay needs no mapping.
  - `scoreBand()` supplies the plain-English meaning of the number; `problemComplexity()`
    orders the catalogue easiest-first for recommendations, so no authored `difficulty`
    field has to be kept in sync.
- **Grading prompt rewritten** ([packages/llm/gradingPrompt.ts](packages/llm/gradingPrompt.ts)).
  The schema no longer lets Claude emit `understandingScore` — the engine computes it and
  Claude explains it, which is the locked M3 decision now actually enforced by the schema.
  Output is `scoreDefinition`, `strengths` (positives), `focusAreas` (negatives),
  `nextSteps` (2-4 concrete actions naming a specific next challenge, easiest-first when the
  score is low), plus misconceptions and narrative. The rubric text states the decay maths so
  the narrative cannot contradict the number. **Seeded as `RubricVersion` v1** — re-running
  `db:seed` after editing the prompt appends v2 rather than mutating v1, because a
  GradingReport points at the exact version that produced it.
- **Placement is now recorded, so the Build score has a data source.** `placement` is a
  sixth check kind; `BuildStage` records every placement, right or wrong, and a wrong pick is
  charged to the SLOT it was standing in for (`meta.expectedTypes[0]` from the editor) so the
  attempt count lands on the scored item. The server independently verifies the placed type is
  one the problem requires — which catches a distractor. Slot *ordering* is still client-asserted,
  because `expectedNext` traversal lives in the editor.
- **The Result screen is server-authoritative and shows four things**
  (`POST /api/sessions/[id]/report`): total marks, the breakdown across the three phases the
  learner walked (Understand / Build / Stress Testing — Build folds placement + config via
  `phaseBreakdown`), then positives, negatives and next steps written by Claude.
  - The score is replayed from this session's own `TraceEvent` rows by `attemptsFromTrace()`.
    The browser's grading store is **not consulted**, which closes the "fabricate the store,
    reach a fake Report" hole. Verified end to end: a partial journey scored 53/100 with
    Understand 28/30, Build 24.8/50, Stress 0/20, all matching hand arithmetic.
  - Recorded keys and rubric item ids are NOT the same string (`setting:classify:onError` vs
    `classify:settings.onError`); the translation lives in one place, in `rubricItemId()`.
  - No `ANTHROPIC_API_KEY` is a normal state, not an error: the route returns the score with
    `report: null, reason: 'llm_unconfigured'` and the screen omits the written sections
    rather than failing. Same for a failed Claude call — a missing narrative must never cost
    a learner their score.
  - `GradingReport` rows are written with the rubric version that produced them.
- **Fixed a smoke coverage hole found while verifying this:** `#report-demo` matched the hash
  by *equality*, so `#report-demo?problem=lead-triage` fell through to Landing — all three of
  smoke's report-demo checks were rendering email-triage. Now `startsWith`, like `#build`.
  `#run-demo` and `#playground` still use equality and are unverified in this respect.
- Still to wire: the score is computed on demand in the request rather than by the M3 worker,
  and `runOutcome`/`timeline` are passed to Claude as `null`/`[]` — the Run result and session
  chronology are not yet in the digest.
- Still to do: rest of B6, B2/B3 (cluster Agent, Text Classifier etc.), B4 (full
  INPUT/Params/OUTPUT NDV), A3/A5 (widened answer space, assessed mode), C2/C3 (run
  narration, coach copy), D1/D2 (de-clone lead-triage).

### Security — answers and grading moved server-side ✅

`GET /api/problems/[slug]` used to return `ProblemVersion.data` verbatim: ~25KB of which
~24KB was answer material. Any signed-in learner could read every answer with one fetch
in devtools. Option shuffling did nothing about this.

Now:
- `toPublicProblem()` strips every marker of correctness at the API boundary.
- `POST /api/sessions` creates an attempt pinned to a ProblemVersion.
- `POST /api/sessions/[id]/check` grades one answer **and records it** as a TraceEvent.
  The recording is the security property: a check that only evaluates is a free oracle,
  and guessing would be cheaper than reading the answers ever was. Because every attempt
  is recorded, guessing is allowed and scores like guessing.
- All five graded surfaces (dissection, field, setting, probe, stress) call it.
- Verified: the extraction script that pulled every answer now returns `[]` for all of
  them, and a real journey still renders the server's hint on a wrong pick and the
  explanation on the retry, with both rows in `TraceEvent`.

**Still client-side, deliberately:**
1. The **final score tally**. `/check` fixes "what is the answer", not "what did I
   score" — a learner can still fabricate the grading store and reach a fake Report.
   Closes when the worker tallies its own recorded decisions (M3).
2. `referenceGraph`, `testCases`, `flow`, `sampleCases` — listed in
   `KNOWN_REMAINING_LEAKS` with a test pinning the list. They can only go once the Run
   moves server-side, because the client cannot simulate without the expected outcomes.

**Decided for M3:** the Understanding score is engine arithmetic replayed from recorded
decisions, NOT a Claude output — it has to be auditable, reproducible, and cheap to
re-run when an admin edits rubric weights. Claude writes the narrative, area summaries
and misconception explanations around that number. `GradingReport` already encodes the
split: `understandingScore` is a column, `reportJson` is the LLM part, and the token/cost
columns meter only the latter.

Judge currently cannot fail a learner. An audit of the three shipped problems found the
correct option at index 0 in **25/25** NDV fields and **13/13** dissection items, every
wrong-pick probe shipping a free `correct: true` escape, and probe copy that names the
right node outright. Separately, the editor is not faithful to how n8n actually works
(no cluster-node Agent, no typed AI connectors, Settings tab disabled, 2×3-dropdown
config on every node).

Sits before M2 deliberately: M2 builds the trace pipeline and M3 replays it to grade, and
both are shaped by what a session can contain.

### M2 — Persistence + tracing ✅

Done, in three slices:
- **The contract + ingest.** `@judge/trace` holds the event schemas; `POST /api/sessions/[id]/events`
  ingests batches, idempotent on `(sessionId, clientSeq)`. `seq` is assigned **server-side**
  under the same per-session advisory lock `/check` uses — a client counter cannot know about
  server-written rows, and letting it try was what produced the intermittent grading bug.
  `CLIENT_FORBIDDEN_TYPES` blocks the client from posting `decision` events at all.
- **The outbound queue.** [traceQueue.js](apps/web/src/lib/traceQueue.js) never throws at the
  caller, never renumbers, caps at 500 pending, and backs off exponentially to ~2 min on
  consecutive failures — because a batch the server will never accept was retried every 2s,
  each attempt taking a per-session DB lock, which starved answer checking on the same session.
  Unsent events mirror into `sessionStorage` so a reload doesn't drop them.
- **Full coverage.** `TraceContext` gives every screen one `trace()` without prop-threading;
  screen transitions go through a single `goTo()` so a new screen cannot be added untraced.
  Graph mutations, NDV opens, run results and Ask-AI turns all report.

**Resume is built** (2026-07-31): the server reuses the in-progress session (`resumed: true`)
and `GET /api/sessions` reports where the learner was — screen, Build phase, questions
answered, canvas — all replayed from their own trace. See Home §1 above for the rules and
what is still not restored (field values inside a node).

### M3 — Queue + grading + ratings ⚠️ half done

**Done:** the Result screen is server-authoritative. `POST /api/sessions/[id]/report` replays
the session's own `TraceEvent` rows through `attemptsFromTrace()` → `scoreSession()`, persists
the score before calling Claude (one upserted `GradingReport` per session), and degrades to
score-only when there is no API key.

**Not done:** there is no **worker service** — grading happens inline in the request, so there
is no queue consumer, no SSE, and no re-grade path. **Ratings are not built** (the `Rating`
table exists; nothing writes to it). `runOutcome`/`timeline` still reach Claude as `null`/`[]`.

### M4 — Admin analytics ✅ (landed early)

`/admin` — Overview · Cases · Completion · Learners · Admins, over `/api/admin/analytics`
plus a read-only timeline of any single attempt. Every number is aggregated **in SQL**
([analytics.ts](apps/web/src/server/analytics.ts)); 60 demo learners already make ~6k trace
events, so counting in JavaScript would stop working quietly and early. The funnel is built
from `screen_transition` events, **not** `Session.currentScreen`, which is only written on
completion and would report every unfinished learner as stuck on screen one.

Granting admin by email writes an `AdminAllowlist` row **and** promotes the account if it
exists, so an email added before signup is promoted when they sign up.
`npm run db:seed:demo` fabricates learners whose scores are replayed through the real engine,
and refuses to run against a non-local database without `ALLOW_REMOTE=1`.

**Not done:** rubric editor with versions and re-grade; ratings view (nothing to show yet).

### M5 — Authoring pipeline
`draft-with-ai` → hybrid form/JSON editor with `validateProblem()` and live
`BuildPreview` → versioned publish → assign. Then ship more problems through it.

### M6 — Voice / mascot (flag-gated, parallel)
Per [docs/mascot-system-porting-guide.md](docs/mascot-system-porting-guide.md). Nothing
exists yet; the mic button is decorative.

### M7 — AWS/SQS swap (deferred)
Implement `sqsDriver`, flip `QUEUE_DRIVER`.

---

## Locked decisions

Do not re-litigate these.

| Decision | Value |
|---|---|
| Approach | **Port, don't rewrite.** Existing `.jsx` moved in untouched; all new code is TypeScript. |
| Models | Sonnet for grading and authoring, Haiku for Ask-AI. Set via `JUDGE_*_MODEL`. |
| Auth | Email + password self-signup as a throwaway interim; federate to Scaler SSO later. |
| Queue | SQS-shaped abstraction, pg-boss driver now, separate worker service. |
| DB | Postgres + **Prisma 6.x** (pinned — Prisma 7's config/adapter model is too new). |
| Topology | **Data, not code.** Overrides the original plan's deferral. |
| Grading | **Server-authoritative** — the worker replays trace events through the same engine. Never trust a client score. |
| Versioning | A `Session` pins its `ProblemVersion`; republishing never changes a running session's basis. |
| LMS | Parked. |

---

## Deployment state — live

**`https://n8n-judge-production.up.railway.app` is the Next.js app and it is healthy.**
`/api/health` returns `{"status":"ok","db":"up"}`. The earlier note here — that the URL
served the dead Vite prototype — is obsolete; that was fixed by the 2026-07-27 flatten.

| | |
|---|---|
| Project / service | `n8n Judge` / `n8n-Judge` (plus a `Postgres` service) |
| **Deploys from** | **`sudhanva/nextjs`** — *not* `main`. A push to this branch deploys. |
| `main` | ~42 commits behind, still the old prototype. Nothing deploys from it. |
| Root Directory | repo root (correct — the root Dockerfile *is* the Next.js one) |
| Health check | `/api/health` |
| Variables set | `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `AUTH_URL`, `ANTHROPIC_API_KEY` |

Production data: the three problems at v1 `PUBLISHED`, and the default rubric at v1
(installed with `npm run db:seed:rubric`, pointed at `DATABASE_PUBLIC_URL`).

**Traps this cost us, both worth remembering:**

1. **A Railway variable name with a trailing newline is invisible in the dashboard.**
   `ANTHROPIC_API_KEY` was stored as `'ANTHROPIC_API_KEY\n'`, so `process.env` could not
   see it and Ask-AI kept returning 503 while the UI showed the variable as present.
   `railway variables --json | python3 -c "...print(repr(k))"` is how you catch it.
2. **A push deploys.** Because the service tracks this branch, a type error that
   `npm run typecheck` used to miss went straight to a failed production build. That gap
   is now closed — see `typecheck:web` below.

The Railway **MCP** still holds a stale token and reports `Unauthorized` even though the
CLI is logged in; it needs a Claude Code restart. The CLI works, so this is not blocking.

### Fixed: the same answer graded correct sometimes and wrong other times ✅

The worst class of bug a grading tool can have, and it was two bugs stacked — which
is why it presented as random.

1. **A race on the trace sequence number.** The NDV verifies every field of a node in
   ONE `Promise.all`, so one "Verify setup" press fires several concurrent POSTs to
   `/check`. `seq` was allocated read-`MAX`-then-insert, so two requests read the same
   value; `TraceEvent` has a unique index on `(sessionId, seq)`, one insert violated it,
   and the request **500'd**. Reproduced before fixing: 2 concurrent checks → 1 failed,
   6 → 2 failed. Now serialised with a per-session `pg_advisory_xact_lock` inside the
   transaction — 0 failures at 2, 6 and 12 concurrent.
   The **attempt count** moved inside the same lock: it was also unsynchronised, so
   concurrent checks of one id all counted zero priors and all claimed `firstTry`.
   Verified: 5 concurrent checks of one question now number 1,2,3,4,5 with exactly one
   `firstTry`.
2. **The client turned that 500 into a wrong answer.** `checkAnswer` returns null on a
   non-ok response and the NDV fell back to local grading — but the browser holds no
   answers, because `toPublicProblem` strips `correct`/`why`/`accepts`/`whyCorrect`/
   `whyWrong`. So the fallback graded *every* answer including the right one as WRONG,
   with no explanation: the empty "NOT QUITE" bubble in the screenshots.
   `isCorrectValue` now returns **null for "cannot judge here"** and the NDV renders
   three states. Absence is detected with `in`, not truthiness, because `correct: false`
   is a real answer for a boolean. An unverified field is no longer recorded as a
   decision — that was writing an answer the learner never gave into the grading store.

**The dev routes had no session at all**, so `#build` could not verify a single field and
every screenshot taken from it was of a broken grader. Session creation is now a shared
`useSession` hook used by both the real journey and `BuildPreview`.

**A trap this exposed:** `npm run typecheck` runs against the root tsconfig, which
**excludes `apps`** — it never type-checks the web app. Only `next build` does, and that
cannot run while `next dev` is running (they share `.next`). An app-level type error is
therefore invisible to every check that is safe to run during development, and one of
them broke the Railway build this session. Stop dev and run a real build before pushing
route or component changes.

### Fixed: ProblemVersions are immutable again ✅

`seedProblems` used to refresh version 1's `data` **in place**, which is the one thing
[problemVersions.ts](apps/web/src/server/problemVersions.ts) says must never happen — a
Session pins its version, and the server caches versions with no invalidation *because*
they cannot change. Editing v1 silently rewrote what "correct" meant underneath anyone
mid-attempt and left every running server serving the stale copy from cache.

Publishing now lives in [packages/db/publishProblem.mjs](packages/db/publishProblem.mjs)
and **appends**: identical content is a no-op, changed content mints the next version,
publishes it, archives the one it replaced and moves `currentPublishedVersionId`. Old
versions are never touched. Comparison is key-sorted, because Postgres `jsonb` does not
preserve key order and a plain `JSON.stringify` compare made every re-seed look like a
change. Verified: unchanged → no-op, reordered keys → no-op, changed → v2 published with
v1 archived and v1's `data` byte-identical to what it was.

`npm run db:seed` is therefore safe against production now. It was not before.

### Fixed: typecheck covers the web app ✅

`npm run typecheck` ran only the root tsconfig, which **excludes `apps`** — so it never
type-checked the web app. Combined with "never build while `next dev` is running", an
app-level type error was invisible to every check safe to run during development, and one
went straight to a failed production build (`status: 'DONE'` where the enum wanted
`SUCCEEDED`).

Now `typecheck` = `typecheck:packages` + `typecheck:web`. Confirmed by reintroducing that
exact error and watching `typecheck:web` catch it.

### n8n behaviour is now documented from source ✅

**[docs/n8n-reference/00-how-n8n-actually-works.md](docs/n8n-reference/00-how-n8n-actually-works.md)**
is n8n's real behaviour read out of n8n's own repo (v2.33.0, commit `eb38e10`) rather than its
docs: the connection model, the node contract, parameters and `displayOptions`, `typeVersion`,
the NDV and the exact Settings tab, the execution and error model, expressions, cluster nodes,
a per-node behaviour catalogue, and a section comparing all of it to Judge's model. Every claim
cites a file and line. §1 has the sparse-clone commands to reproduce it.

It immediately paid for itself. **The On Error dropdown labelled `continueRegularOutput`
"Continue (using last valid data)", which is the opposite of what n8n does** — n8n passes the
*error* as an item on the regular output, carrying nothing usable forward. `email-triage`
grades that exact setting and its explanation was already correct, so the dropdown contradicted
the feedback on the same question. Now n8n's wording, with the meaning moved into the hint.
Two label typos fixed alongside (`Max. Tries`, `Display Note in Flow?`).

The doc's §14 lists the remaining fidelity gaps in priority order — conditional fields
(`displayOptions`), the four structurally-different parameter types, `maxConnections`, dynamic
outputs, and the copy worth adopting verbatim.

### Fixed: smoke never tested the Understand screen ✅

Two bugs stacked, and together they meant the Understand quiz — options, server verdicts, the
node canvas — was **never rendered by any check**, for any problem:

1. Journey-start clicked the *first* "Try this judge" button regardless of `?problem=`, so all
   three checks entered email-triage. Home cards now carry `data-problem`, and smoke targets
   the right one.
2. Even then it stopped on Iris's greeting. Understand opens on two narrated beats before the
   quiz, and the second advances on "Let's dissect it", not "Continue" — so a
   `/continue/i`-only match broke out of the loop. Smoke now walks both beats and **asserts it
   reached "Question 1 of N"**, so this cannot silently regress.

Verified by screenshot: `meeting-notes--journey-start` now shows the Meeting Notes quiz.

---

---

## UI rework — agreed 2026-07-30, half landed

An exhaustive pass from the product owner after walking the built prototype. **This is
the current workstream and it comes BEFORE problem templatisation**, because three of the
items add problem fields (`coverImage`, `difficulty` on every problem, an estimated
duration) and freezing the template first would mean rewriting it.

**Landed 2026-07-30:** 4, 5, 8, 9, 10, 12, 13, 15 (marked below). **Still open:** 1, 2, 3
(Home, and the problem fields they need), 6, 7, 11, 14 (voice, which needs a render on a
laptop). Verified by `npm run typecheck` (both halves) and 453/453 unit tests. **Not
verified visually or by smoke** — the dev server on :3000 was wedged (listening, refusing
connections) during this pass, so no screenshot of the redesigned Result or the restacked
Stress Testing exists yet. That review is the first thing to do next.

### Home

1. ~~**"Continue where you left off"** section at the top of Home.~~ **Done, and it
   restores the canvas too.** `GET /api/sessions` returns the open attempt; Home offers it
   above the grid; taking the offer resumes the same session, lands on the screen they left
   and seeds the editor with the graph they had built.
   - **Both halves are read from the TRACE, not from `Session.currentScreen` /
     `builtGraphSnapshot`.** Those columns exist and look authoritative but are only written
     when a session completes, so trusting them offers every learner screen one and an empty
     canvas. `screen_transition` says where they went; `graph_mutation` carries the whole
     graph on every change, so the last one is the canvas.
   - Understand runs its beats **and its whole quiz** without a `screen_transition` (the
     first fires on the way to Build), so "has this learner done anything" counts `decision`
     events too, and a missing transition means Understand rather than nothing.
   - Resuming cannot cost marks: `attemptsFromTrace` keeps the **lowest** attempt that was
     correct, so re-verifying a field is free. `report` is deliberately not resumable — the
     session is still IN_PROGRESS and there is nothing graded to land on.
   - **Two bugs found by testing it, both fixed.** The tracer was recording
     `{id, type}` per node, so a restored graph had no positions and React Flow threw
     `reading 'x'` while seeding — it now carries `position` and `data.configured`, and the
     endpoint refuses any graph whose nodes lack numeric positions so sessions recorded
     before today resume to the screen with a fresh canvas instead of crashing. And
     `seedNodes` hardcoded `configured: true` (it was written for the dev routes' finished
     reference flow), which marked every restored node as set up and let a learner walk past
     configuration they never did; it now honours `data.configured` when the graph says.
   - **It resumes to the POINT, not to the screen** (fixed 2026-07-31). It used to carry
     `{screen, graph}` and nothing finer: `phase_transition` was not even in the route's
     `type` filter, and each screen hardcoded its own start. So Build reopened at phase one
     with the restored canvas already satisfying it, which fired the phase-clear effect and
     walked the learner through a celebration for every phase they had already earned; the
     two quizzes asked every question again. The payload now carries `phaseId`, the
     `answered` question ids per quiz and the `unlockedTypes` their right answers earned,
     derived in [resumePoint.ts](apps/web/src/server/resumePoint.ts) (pure, 15 tests), and
     the three screens take a starting position.
     - A question counts as answered whether it was right or **wrong** — both quizzes advance
       on either, so re-asking would hand out a second attempt at something already recorded.
       Reloading must not be a way to improve a score.
     - `unlockedTypes` is resolved server-side from the pinned version, for correct answers
       only. Without it the Understand summary came back saying "here is your toolkit" over an
       empty row.
     - Guarded by `npm run smoke` (the `resume` check): it synthesises a mid-quiz and a
       mid-Build state through `/check` and `/events`, then asserts the quiz reopens at the
       next unanswered question and Build reopens on the right phase with no celebration
       replay. Verified to FAIL when the fix is reverted.
   - **Field values come back too** (2026-07-31), and fixing that turned up a second bug:
     **the canvas had never actually been restorable in real use.** `handleGraph` mapped the
     graph twice and the traced copy read `position` off the already-stripped one, so every
     recorded node had `position: undefined` and the endpoint refused the lot — 52 of the 60
     mutations in the local database had no positions, and the 8 that did came from a test.
     The mapping is now one tested function,
     [traceGraph.js](apps/web/src/lib/traceGraph.js), which also carries `values` and
     `settings`; `seedNodes` puts them back and the NDV opens on them.
     - Only nodes that verified green carry values — that is when the editor stores them —
       which matches what happens inside a sitting: closing the NDV half-filled has never
       kept anything.
     - Verdicts are NOT restored, so Verify is pressed again; a green tick is the server's to
       give. A filled-but-unverified field therefore says **VERIFY ME** rather than "set me
       up", and the footer says "These are the answers you gave".
     - The spotlight intro is suppressed when a canvas is restored. It teaches the first `+`
       on an empty canvas and is a full-screen overlay, so it pointed at nothing and swallowed
       the learner's first click.
2. ~~Below it, the full list of problems.~~ **Done** (the list was already there; it is now
   two-up).
3. ~~**Problem card** gets, in this order: cover image, `difficulty | time`, title,
   description, CTA.~~ **Done, reviewed on screen.** Cards went from three-up to **two-up**:
   at the old 260px floor the two-line description wrapped to four lines, which is the same
   copy failing to be two lines because the column was too narrow. Descriptions are clamped
   to two lines as a floor under the authoring cap.

~~**New problem fields this needs**~~ **— all three landed:**
- `difficulty` on all four (was only `order-desk`) and `estimatedMinutes`, both **sized from
  each problem's real decision count** via `enumerateItems` rather than guessed: meeting-notes
  14 → easy · 15 min, lead-triage 23 → moderate · 20 min, email-triage 30 → moderate · 25 min,
  order-desk 61 → difficult · 45 min.
- `coverImage: { prompt, src, alt }` — `/api/problems` serves `src`/`alt` and **never the
  prompt**. A null `src` still draws the card's own placeholder, but **all four are now
  drawn**: `npm run covers:generate` (OpenAI `gpt-image-1`, `OPENAI_API_KEY`, laptop-only —
  the app never calls an image API) wrote `apps/web/public/covers/<id>.png` and they are
  committed. Style is isometric flat-vector per the reference the product owner supplied,
  recoloured to **brand blue** rather than the reference's green, since four green cards
  would be the loudest thing on a blue-and-white page. One constant in
  `scripts/generate-covers.mjs` restyles the whole set.
- Cards render the art `contain` inside a padded slot, not `cover`: filling the slot cropped
  the scene and drove the illustration into the card border.
- `brief` — the two-line description, capped at 125 characters. See the copy rules below.

**Two authoring rules came out of reviewing this, and both are now enforced** (see CLAUDE.md
→ *IMPORTANT — copy rules for anything a learner reads BEFORE building*). **Carry both into
the problem-authoring skill when M5 lands:**
- **`flowSummary` labels must describe the job, never the node.** All four problems were
  labelling steps `Classify with AI`, `Parse Result`, `Send Reply` — i.e. the "shape of it"
  sketch on the Understand screen was handing over the answers to the dissection quiz that
  screen is about to ask. Rewritten to plain language, and `validateProblem()` now rejects any
  label containing a palette label or catalog title.
- **The pre-build description is two lines.** `statement` stays the full brief (the panel, the
  sticky note and Ask-AI's context all read it); `brief` is the short one.

Also found while in here: **`flowSummary.caption` is authored in all four problems and
rendered nowhere**, and `EvalScreen`'s node strip is a **hardcoded email-triage path**
(`REFERENCE_PATH`) shown on every problem — both worth a decision.

### Voice indicator

4. ~~Hide the corner glow on the three screens where the mascot is already centred and
   large: greet, "you've got the plan", and Result.~~ **Done.** A screen claims the corner
   with `useHideVoiceGlow()` (VoiceContext), which is ref-counted and **unmounts** the
   glow rather than hiding it — the bloom runs its own rAF loop through `gsap.quickTo`, so
   a hidden-but-mounted one would animate detached nodes for the rest of the session.

### Copy

5. ~~"Nice — you've got the plan." plus its body: remove the em dashes, and write a better
   title.~~ **Done.** Now "You know what to build.", and the body names what they did
   instead of opening on "Nice".

### Voice gaps found by using it

6. The **build-start line sounds like it needs re-rendering** — verify the stored clip
   matches the current text. **Moot after the 2026-07-30 regeneration**, which re-rendered
   every clip; confirm by ear.
7. ~~**`verify_fail` repeats verbatim.**~~ **Done, and the design STATUS asked for.**
   Variant choice is now `seed + times already spoken this session` (`spokenCount` in
   `voice.js`): the seed still decides where a learner *starts* in the list, and the count
   advances on every play so nothing repeats back to back. **Preloading survives** because
   the count only moves when a line is actually spoken, so `setUpcoming` and the play that
   follows compute the same index — which is exactly what a random pick broke.
   `verify_fail` and `node_wrong` now carry **10** wordings each, `probe_*` and `stress_*`
   eight. `node_wrong` is also keyed by the node type placed wrongly, so a problem can
   author a per-node line later.
11. **`run_case` copy is not trigger-aware.** It opens "Their app crashes…" when it
    should be "a customer sends an email saying the app crashes" — the learner needs the
    trigger in the sentence to connect the case to the flow.
11b. **Stress Testing and the wrong-node probe now speak.** `stress_correct` /
    `stress_wrong` fire per answer (keyed by question) and `probe_correct` /
    `probe_wrong` per probe verdict (keyed by node type). Neither restates the answer —
    the written verdict is already on screen, and repeating it is reading the screen.
    Nothing is spoken when a check did not complete (`correct: null`), because reacting
    to that would tell a learner they were wrong when nobody graded them.
    **The wrong-node probe itself also stopped repeating**: authored `nodeProbes` differ
    by node type, but the *generated* `sequenceProbe` was a single hardcoded question, so
    every out-of-order placement asked the identical thing. Four framings of the same
    rule now rotate.
12. ~~**No voice when the run passes.** `run_pass` exists; confirm whether it fires at
    all.~~ **Done — it never fired, and here is why.** The finishing timer read a bare
    `success`, which does not exist in that effect's scope (it is a local inside
    `startRun`). The callback threw *after* `setRunFinished(true)`, so the screen looked
    right and only the audio was missing. Now `run.success`, and `skipRun` speaks the same
    verdict because it cancels the timer that would have. Whether each case should also
    confirm as it lands is still open.
14. **No voice in Stress Testing.** `stress_start` exists; same check.

All of 7, 11, 12, 14 must also be written into
[.claude/skills/iris-voice/SKILL.md](.claude/skills/iris-voice/SKILL.md), which is the
contract the other three problems will be authored against.

### The Run

8. ~~**"Run it" should start the animation immediately**, and the bottom bar during the run
   goes away.~~ **Done.** The last phase's "Run it" called `continueFromClear`, which set
   `stage: 'complete'` and rendered a bottom bar carrying a SECOND "Run" button: the learner
   pressed the thing labelled "Run it" and nothing ran. It now calls `startRun()`. That bar
   survives only for stopping and coming back ("Run again"), and its copy no longer says
   "sample emails" — wrong for meeting-notes and order-desk.
9. ~~Add a secondary **skip-run** button, bottom centre.~~ **Done.** `skipRun` skips the
   ANIMATION, not the result: it cancels the timers, jumps to the finished state the run was
   going to reach, and speaks the same verdict.
   **Also found while in here:** the mascot was hidden for the entire run
   (`setMascotVisible(false)` in `startRun`), so Iris narrated every case with nothing on
   screen. She now parks and stays. Her park spot moved to x=96 because React Flow's zoom
   controls own the bottom-left corner and drew on top of her at x=24.
10. ~~**React warning while running:** "Updating a style property during rerender
    (borderBottom) when a conflicting property is set (border)".~~ **Done — it was not in
    `BuildStage.jsx`.** The candidates listed there set only longhands. The single element
    in the codebase mixing `border` with `borderBottom` was the NDV tab button
    (`Ndv.jsx`), whose underline changes with `active`, so it warned on every tab switch.
    Now longhands only.

### Stress Testing

13. ~~Restack the screen and drop the node animation.~~ **Done.** One column in reading
    order: section header (which says what Stress Testing is for, and sits outside the
    per-question container so it does not re-animate every question) → question number →
    question → node strip → options → verdict, with Continue in the fixed footer. Column
    width dropped from the 1040px two-column grid to a 720px reading width. **"The node
    animation" was confirmed to mean the post-answer `NodeReplay`**, which is gone —
    entrance animations stay. `NodeReplay.jsx` therefore has **no importers left**, and
    `EvalScreen` no longer takes a `graph` prop (the replay was its only reader).

### Result

15. ~~**Redesign from scratch** — it should read as a report, not a screen.~~ **Done, and
    reviewed on screen.** An 880px sheet: navy hero (greeting + band definition left, the
    total right), then white — breakdown, positives and negatives side by side (a
    `minmax(260px, 1fr)` auto-fit grid, so it collapses to one column without a media
    query), next steps as bullets, and a bottom action bar. The decision list, the
    misconception cards and the per-test-case alerts are **deliberately gone** ("contents,
    and only these").
    - The greeting comes from the rubric **band**, not the number, and uses the learner's
      first name via `useSignedInUser()` — there is no `<SessionProvider>` in this SPA, so
      that hook reads `/api/auth/session`, the way TopBar's UserMenu always has. No name
      is a normal state and the wording works without one.
    - Three actions: **redo** remounts `MainApp` under a new key (a fresh attempt: the
      Result marked the old session COMPLETED, so the next `POST /api/sessions` opens a new
      row), **next** reads the catalogue Landing remembered when the learner left Home, and
      **home** returns. Only actions that were given a handler render.
    - **Review fixes, same day:** hero text sets its own colour, because the global
      stylesheet gives `h2`/`p` a `color: var(--fg-1)` that beats inheritance and the
      greeting rendered near-black on navy; drop shadow reduced; redo and home are
      icon-only (with `title` and `aria-label`); and the missing-narrative case now says so
      instead of silently dropping two sections — `ANTHROPIC_API_KEY` is empty in `.env`, so
      the server correctly returned `report: null, reason: 'llm_unconfigured'`. The canned
      fallback also now lists **one pointer per imperfect area** rather than one in total,
      which is why "what to do next" had a single bullet.


## Known issues

1. **No component tests.** `npm test` covers engine, schema and problem data only. Always
   run `npm run smoke` after touching components.
2. **Resume is complete as of 2026-07-31** — screen, Build phase, answered questions, the
   canvas and each node's field values all come back. What it still does not carry: values on
   a node whose setup was never verified green (the editor only stores them then, so there is
   nothing recorded to restore), and the verdicts themselves, which are re-earned by pressing
   Verify. Guarded by the `resume` check in `npm run smoke`.
4. **Beware `replace_all` edits in `.jsx`.** A past `ReferenceError` came from replacing
   every `<TopBar activeStage="statement" />`, including inside inner components with no
   `problem` prop. Check enclosing function scope.
5. **Next.js can pollute the root `tsconfig.json`** if `next dev` runs from the monorepo
   root — it injects `jsx`/`plugins`/`.next/types`, which belong in `apps/web/tsconfig.json`.
   Revert if it appears in a diff.
6. **Never run `npm run build` while `next dev` is running** — they share `.next` and
   it corrupts the running server. Symptoms are alarming and misleading: every route
   500s, smoke fails on all 19 screens, and API calls return HTML. Kill dev first.
   Recover with `rm -rf apps/web/.next` and restart.
7. **Problems are served from Postgres.** Editing `packages/problems/*/index.js` changes
   nothing in the app until you run `npm run db:seed`. This bites every content change.
8. **A stray `package-lock.json` sits one level above the repo**, which makes Next infer
   the wrong workspace root. Harmless in dev; can affect output file tracing on build.
9. **`#run-story` shows a leftover "General question" case label** for `meeting-notes` —
   cosmetic, dev route only.
10. **Ask-AI is deliberately unhelpful about answers.** Asked "which node?", it teaches the
    concept and asks a guiding question. Intended.

Cleared 2026-07-29: all six dev hash routes now match with `startsWith`, so every one honours
`?problem=` — the earlier note that `#run-demo`/`#playground` still used equality is obsolete.
The stray `tr2-tmp.mjs` at the repo root is deleted.
