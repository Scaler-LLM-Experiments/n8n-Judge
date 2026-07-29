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
| M2 persistence + tracing | ✅ complete except **resume-on-reload** (see Known issues) |
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
    because the problem has more dropdowns. Consequence: one placement is worth ~2.2 config
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

**Remaining:** resume-on-reload is only half built — the server reuses the in-progress
session (`resumed: true`), but the client ignores it and restarts at screen one.

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

## Known issues

1. **No component tests.** `npm test` covers engine, schema and problem data only. Always
   run `npm run smoke` after touching components.
2. **Resume-on-reload is half built.** The server reuses an in-progress session, but the
   browser restarts the learner at screen one. Their score is safe (decisions are recorded
   server-side and `firstTry` is preserved), but they lose their place, and the trace fills
   with duplicate `screen_transition` rows — which is what the admin funnel reads.
3. **`lead-triage` is a structural clone of `email-triage`** — identical node types, field
   keys, branch count, phase ids. Confirmed still true 2026-07-29: both use exactly the same
   ten node types. M1.5 §D1 replaces it.
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
