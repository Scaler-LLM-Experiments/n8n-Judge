# Handoff: Building a Cloud-Agent Authoring Pipeline (Claude Managed Agents to GitHub PR)

**What this is.** A complete, portable write-up of the automated content-authoring
pipeline we built for Debug Sim: an admin submits a brief, hosted Claude Managed
Agents (CMA) do the creative work in a cloud sandbox with the repo mounted, a
second independent agent reviews the output, deterministic worker stages add
media, and the run finishes at a **draft GitHub PR** that a human merges.

**Who it is for.** An engineer standing up the same pattern on a different
project. The Debug Sim specifics are marked as examples; everything else is
meant to be lifted directly.

**Why it exists.** Roughly 70% of the build effort went not into the agent
prompts but into **environment problems**: the CMA sandbox behaving differently
from a laptop, the worker host's build environment poisoning child builds, git
clone reuse breaking in non-obvious ways, and the gap between "the agent says it
pushed" and "the branch is actually on origin". Those are catalogued in Part 3.
If you read only one section, read that one.

**Source of truth in this repo:** `src/lib/cma.ts`, `src/lib/case-pipeline.ts`,
`src/lib/authoring/*.ts`, `agents/*.yaml`, `db/migrations/019_case_pipeline.sql`.
Design history: `docs/automated-authoring-plan.md`. Operator guides:
`docs/pipeline-setup-guide.md`, `docs/pipeline-worker-infra.md`,
`docs/pipeline-staging-runbook.md`.

---

## Table of contents

1. [The shape of the system](#1-the-shape-of-the-system)
2. [The pipeline, stage by stage](#2-the-pipeline-stage-by-stage)
3. [How Claude Managed Agents are actually used](#3-how-claude-managed-agents-are-actually-used)
4. [Environment problems: the full catalogue](#4-environment-problems-the-full-catalogue)
5. [Failure routing: the three classes](#5-failure-routing-the-three-classes)
6. [Cost, safety and blast-radius controls](#6-cost-safety-and-blast-radius-controls)
7. [Porting this to another project](#7-porting-this-to-another-project)
8. [What we would do differently](#8-what-we-would-do-differently)

---

## 1. The shape of the system

### 1.1 The core idea

Three kinds of work, deliberately separated, because they fail differently:

| Kind of work | Runs where | Why there |
|---|---|---|
| **Creative / reasoning** (write the content) | Hosted cloud agent sandbox (CMA) | Needs a full agent loop, file tools, skills, many turns. Anthropic hosts the loop and the sandbox; we only stream events. |
| **Judgement** (is the content good?) | A **second, independent** cloud agent | Must share zero context with the author, or it rubber-stamps. Its file-write tools are disabled. |
| **Deterministic** (media, build, lint, PR) | Your own worker host | Needs real secrets, real binaries (`git`, `ffmpeg`), a reliable network and a full toolchain. Secrets must never enter a sandbox. |

The orchestrator is a **Postgres job queue**, not a workflow engine. Each stage
is a job that enqueues the next one. We reused the queue that already ran our
scoring jobs (`FOR UPDATE SKIP LOCKED` claiming, exponential backoff, dedup
keys, a stale-lock reaper). That reuse was the single best structural decision:
retries, idempotency and crash recovery came free.

### 1.2 The run graph

```
brief submitted at /admin/pipeline
   │
   ▼
author_case      [CMA session]      write all content files, self-check, push branch auto/case-{id}
   │
   ▼
case_review      [CMA session #2]   fresh reviewer blind-solves the content, grades itself, verdicts
   │  FAIL ─────────────────────────────► back to author_case (bounded loop, see §5.3)
   │  PASS
   ├──────────────┬──────────────────┐
   ▼              ▼                  │
case_audio     case_art              │   (parallel, both on the worker host)
   │              │                  │
   └──────┬───────┘                  │
          ▼                          │
    case_finalize  [worker host]  ◄──┘   authoritative build + lint + critic gate
          │                              → draft PR via GitHub REST → Slack ping
          ▼
    status = awaiting_review    (human reviews, calibrates, merges)
```

Two things to notice:

- **The PR is opened by the orchestrator, not the agent.** The agent only ever
  pushes a branch. This keeps the PR-writing token off the sandbox, keeps the PR
  body (a review checklist) in version-controlled code, and guarantees the PR
  only appears after media and the authoritative build are done.
- **Automation deliberately stops at a draft PR.** The last-mile judgement
  (in our case, calibrating that a strong candidate scores materially higher
  than a weak one) cannot be automated honestly. Pick your equivalent gate and
  stop there rather than pretending.

### 1.3 Data model

Two domain tables plus the existing queue:

- `case_pipeline`: one row per run. `id`, content id, `status`
  (`queued|running|blocked|awaiting_review|failed|merged`), `current_stage`,
  `brief` (jsonb), `branch`, `pr_url`, `revision_cycles`, `error`, timestamps.
- `case_pipeline_stages`: one row per stage per run. `run_id`, `stage`,
  `status`, **`cma_session_id`**, `log_tail`, `attempts`, `heartbeat_at`.
- `jobs`: the execution engine, untouched by the domain model. Handlers write
  **through** to the domain rows so the admin UI never has to read the queue.

A **partial unique index** enforces "one authoring run at a time":

```sql
CREATE UNIQUE INDEX case_pipeline_single_active_idx
  ON case_pipeline ((true)) WHERE status IN ('queued','running');
```

Only `queued`/`running` hold the slot, so a run parked at `awaiting_review` or
`blocked` never blocks a new submission. The intake API pre-checks and returns
409 with the active run's id.

---

## 2. The pipeline, stage by stage

Debug Sim's stages are on the left; the generic role is on the right. When
porting, keep the roles and swap the bodies.

| Stage | Generic role | Runs where | Blocking? |
|---|---|---|---|
| `author_case` | Generate the artifact | CMA sandbox | Yes (hard gate on "needs a capability that doesn't exist") |
| `case_review` | Independent quality gate | CMA sandbox (fresh agent) | Yes, but routes back to author |
| `case_audio` | Deterministic media A | Worker host | Content failures route to author; infra failures retry then block |
| `case_art` | Deterministic media B | Worker host | **Non-blocking** (failure becomes an unchecked PR checklist item) |
| `case_finalize` | Authoritative verification + delivery | Worker host | Yes, but build/lint failures route back to author |

### 2.1 `author_case`: the generative stage

Creates (or re-attaches to) a CMA session with the repo mounted, sends a kickoff
prompt built from the brief, and drives the session until it reports a
structured result through a custom tool.

The kickoff prompt is worth studying as a pattern. It contains, in order:

1. **Identity of the work item** (id, track, level, branch name) with "use
   EXACTLY this" language, because a drifting id breaks every downstream stage.
2. **A numbered, ordered requirement list.** Ordering matters where it matters:
   our language-simplification pass must run BEFORE sealing and BEFORE audio
   synthesis, so the prompt says so explicitly and repeats it in the revision
   prompt.
3. **An explicit "do NOT touch" list.** Ours names the three generated registry
   files. Without it the agent helpfully hand-edited generated files that get
   overwritten at build time.
4. **Hard limits with an escape hatch.** "Never create a new component. If the
   brief needs one that does not exist, STOP and report `blocked=true` with a
   reason." This converts the most dangerous failure mode (agent invents
   platform code to satisfy a brief) into a clean human gate.
5. **One instruction to call the result tool exactly once, honestly.**

There is a second prompt, `revisionKickoff`, used when a downstream gate sends
work back. It differs in three ways: it says the work already exists on a
branch, it lists the specific blockers, and it warns that an independent
reviewer will re-check, so a superficial patch will bounce again.

### 2.2 `case_review`: the independent gate

A **separate agent id**, a **fresh session every time**, and **write tools
disabled**. The reviewer:

1. Blind-solves from only the consumer-visible content, writing answers down
   before opening any answer key.
2. Opens the keys, grades its own blind run, then audits fairness, internal
   consistency of the data, and style rules.
3. Reports pass/fail plus concrete blockers through its own custom tool.

Two prompt details that materially changed behaviour:

- **Explicitly separating "blocker" from "note."** The first version failed
  cases for cosmetic nits, and every failure costs a full author cycle. The
  prompt now says: fail only if a consumer cannot fairly complete the task;
  everything else goes in `notes` for a human to tidy.
- **Telling the reviewer that a build failure in the sandbox is probably a
  sandbox limitation, not a defect.** See §4.1.1. Without this the reviewer
  failed good content because `npm run build` could not finish.

The reviewer never fixes what it finds. Only the author fixes. That is what
keeps the gate independent, and it is worth defending against the obvious
efficiency argument.

### 2.3 `case_audio` and `case_art`: deterministic media

Both clone the pushed branch on the worker host and run existing repo scripts
unchanged. Secrets (TTS, image API, S3) live only here.

Design notes worth copying:

- **Reuse your existing CLI scripts rather than reimplementing in the stage.**
  Our audio stage literally shells out to the same `node scripts/...` commands a
  human would run. Zero drift between manual and automated paths.
- **Media stages skip cleanly when unconfigured** rather than failing. An unset
  API key marks the stage `skipped` and adds an unchecked item to the PR
  checklist. The run still completes.
- **One of the two is non-blocking by design.** Cover art is nice to have, so a
  failing image loop can never dead-end a good piece of content.
- **Install the minimum.** The audio stage needs only Node built-ins plus
  `ffmpeg`, so it runs from the clone with no install at all, then does a
  single-package `npm install --no-save` just for the S3 client. Full `npm ci`
  only happens in `finalize`, where the build genuinely needs it.

### 2.4 `case_finalize`: authoritative verification and delivery

This is where truth is established. It clones the branch, installs deps, runs
the **authoritative production build**, re-runs the deterministic content lint,
runs an LLM critic gate, opens the draft PR through the GitHub REST API, and
pings Slack.

Key design decision: **the build at author time is advisory; the build here is
authoritative.** The sandbox often cannot complete a cold production build
(§4.1.1), so an honest `buildPass:false` from the agent is logged as a warning
and the chain continues. Real build errors therefore surface here, which is why
this stage must be able to route failures back to the author rather than
dead-ending.

The critic gate is **advisory too**, and the reason is instructive: our critic
checks whether the answer is derivable from the visible evidence. But every
solvable case has a derivable answer, so the critic flags almost everything. It
cannot distinguish "the answer is stated in the scaffolding" (a real leak) from
"the answer is derivable from the evidence" (the intended experience). So its
output became an unchecked item on the PR checklist instead of a blocker. **If
your automated check cannot separate the failure mode from the intended
behaviour, it is a checklist item, not a gate.**

---

## 3. How Claude Managed Agents are actually used

### 3.1 One-time setup (not per run)

Agents and their sandbox environment are **created once** from
version-controlled YAML using the `ant` CLI, and referenced afterwards by id
from environment variables. Nothing in the running code ever creates an agent.

```bash
# 1. Upload the skills the agent should have
node scripts/upload-authoring-skills.mjs
#    → prints a `skills:` block of ids; paste it into the agent YAML

# 2. Create the sandbox environment
ant beta:environments create < agents/case-author.environment.yaml --transform id -r
#    → env_...        → CASE_AUTHOR_ENV_ID

# 3. Create both agents
ant beta:agents create < agents/case-author.agent.yaml   --transform id -r  # → CASE_AUTHOR_AGENT_ID
ant beta:agents create < agents/case-reviewer.agent.yaml --transform id -r  # → CASE_REVIEW_AGENT_ID

# Later prompt edits: UPDATE in place, do not create a new agent
ant beta:agents update --agent-id "$AGENT_ID" --version N < agents/case-author.agent.yaml
```

**The environment YAML is small and consequential:**

```yaml
name: debug-sim-case-author
config:
  type: cloud
  networking:
    type: limited
    allow_package_managers: true
```

`limited` networking plus package managers allowed. The task is repo-local, so
general egress is off; but package managers must be allowed or nothing installs.
Note that **git push to the mounted repo rides the platform's git proxy, not
sandbox egress**, so limited networking does not prevent pushing.

**The agent YAML** carries the durable persona and the tool contract:

```yaml
name: Debug Sim case author
model: claude-sonnet-5          # cost/quality knob; upgrade here if quality disappoints
system: |
  <role, the skills to follow, and the HARD LIMITS repeated from the kickoff>
tools:
  - type: agent_toolset_20260401   # bash/read/write/edit/glob/grep
    default_config: { enabled: true }
    configs:
      - { name: web_search, enabled: false }   # repo-local task: no web wandering
      - { name: web_fetch,  enabled: false }
  - type: custom
    name: submit_result
    description: Report the final structured outcome. Call exactly once.
    input_schema: { ...typed fields including blocked/blockedReason... }
skills:
  - { type: custom, skill_id: skill_..., version: latest }
```

Put the hard limits in **both** the agent `system` prompt and the per-run
kickoff. The system prompt is the durable contract; the kickoff is what the
model has most recently read. Duplication is cheap; a violated limit is not.

### 3.2 The client wrapper: what `src/lib/cma.ts` owns

The wrapper is ~400 lines and exists because five separate patterns are needed
to make hosted sessions reliable. Each maps to a bug we hit.

**a. Create-or-resume by persisted session id.**

```ts
export async function createOrResumeSession(args): Promise<{sessionId, resumed}> {
  if (args.existingSessionId) {
    const existing = await client().beta.sessions.retrieve(args.existingSessionId);
    if (existing.status !== "terminated" && !existing.archived_at)
      return { sessionId: existing.id, resumed: true };
    // terminated/archived: fall through and create fresh
  }
  const session = await client().beta.sessions.create({
    agent: config.agentId,
    environment_id: config.environmentId,
    resources: [{ type: "github_repository", url, authorization_token, checkout }],
    metadata: { pipeline_run_id, case_id },
  });
  return { sessionId: session.id, resumed: false };
}
```

The caller **persists the returned id to the stage row BEFORE starting the long
drive**. That ordering is the whole point: a worker restart re-attaches instead
of spawning a duplicate paid session.

**b. Stream-first with reconnect-and-consolidate.** The event stream has no
replay. If you reconnect, you lose whatever arrived while disconnected. So on
every connect: open the stream first, then fetch history via `events.list`, and
dedupe by event id across both.

```ts
let stream = await c.beta.sessions.events.stream(sessionId);
if (kickoff) await sendKickoff(kickoff);
while (true) {
  for await (const ev of c.beta.sessions.events.list(sessionId)) { /* dedupe by id, handle */ }
  for await (const ev of stream)                                  { /* dedupe by id, handle */ }
  stream = await c.beta.sessions.events.stream(sessionId);  // server closed it: reconnect
}
```

**c. The correct idle gate.** A session going idle does not mean it is done:

```ts
} else if (type === "session.status_idle") {
  const reason = ev.stop_reason?.type;
  if (reason !== "requires_action") return true;   // end_turn / retries_exhausted = really done
  // requires_action = idle WAITING FOR US. Keep going.
}
```

Treating every idle as terminal truncates sessions mid-work. This one-line
condition was a multi-hour debugging session.

**d. Structured output through a custom tool.** Do not parse the agent's prose.
Define a custom tool with a typed `input_schema`, capture its input as the
stage result, acknowledge it, and keep draining until the session actually
idles:

```ts
} else if (type === "agent.custom_tool_use" && ev.name === resultTool) {
  result = ev.input as T;
  await c.beta.sessions.events.send(sessionId, { events: [{
    type: "user.custom_tool_result",
    custom_tool_use_id: ev.id,
    content: [{ type: "text", text: "Result recorded. Finish up and end the turn." }],
  }]});
}
```

Also handle **unknown** custom tools by replying with `is_error: true`. An
unanswered tool call parks the session forever. Never let an unrecognised tool
name deadlock the drive loop.

**e. A hard wall-clock budget.** Every drive takes `budgetMs` and returns an
outcome of `result_and_idle | idle_no_result | terminated | timeout`. Ours:
author 25 min, review 20 min. Without this a confused session bills until
someone notices.

**Plus two hygiene functions:**

- `archiveSession()` when a session will never be resumed. **Archive, not
  delete**: archiving frees the container while keeping the event trace
  viewable for debugging. Deleting destroys your only forensic record. Always
  best-effort; never let cleanup fail a stage.
- `sessionUsage()` reads the real cumulative token usage the platform reports,
  which we record per stage. Do not estimate cost from your own counting; ask
  the platform. Note the usage shape has both a flat
  `cache_creation_input_tokens` and a nested per-TTL breakdown, so read the flat
  total when present or you under-report.

### 3.3 Live observability

Every stage row stores its `cma_session_id`, and the admin UI renders a link to
the platform Console for that session. During development this was the single
most useful debugging affordance: when a stage looked stuck, you could watch the
agent's actual turns instead of guessing from a log tail.

```ts
export function consoleUrl(sessionId: string): string {
  const workspace = process.env.ANTHROPIC_WORKSPACE_SLUG ?? "default";
  return `https://platform.claude.com/workspaces/${workspace}/sessions/${sessionId}`;
}
```

---

## 4. Environment problems: the full catalogue

This is the section that will save you the most time. Each entry is
**symptom → root cause → fix → the portable lesson**.

### 4.1 Problems inside the CMA sandbox

#### 4.1.1 A cold production build cannot finish in the sandbox

- **Symptom:** the agent honestly reports `buildPass: false` on perfectly good
  content, every time. The reviewer agent independently failed good content for
  the same reason.
- **Root cause:** the sandbox has limited networking and a cold environment. A
  full install plus a production build of a large framework app (hundreds of MB
  of dependencies) frequently cannot complete there.
- **Fix, in three parts:**
  1. **Build became advisory at author time.** A `false` is logged as a warning
     and the chain proceeds.
  2. **Lint stayed a hard gate.** Linting runs reliably in the sandbox, so a
     lint failure is a real defect the agent should have fixed.
  3. **The authoritative build moved to the worker host** in `finalize`, which
     has the full toolchain, and that stage can route failures back to the
     author.
  We also told the reviewer explicitly, in its prompt, that a sandbox build
  failure is probably not a defect.
- **Lesson:** decide, per check, whether the sandbox can run it *reliably*. Any
  check it cannot is advisory there and authoritative on your own host. Never
  let an unreliable check be a hard gate, and never silently drop it either.

#### 4.1.2 "The agent said it pushed" is not evidence the branch exists

- **Symptom:** author stage green, `lintPass:true`, `buildPass:true`, branch
  name reported. The next stage died with a cryptic git error.
- **Root cause:** the agent works in its own sandbox and self-reports. A failed
  push, a silent auth problem, or a slightly wrong branch name all still produce
  a confident success report.
- **Fix:** an authoritative, cheap check on our side before advancing:

  ```ts
  export async function remoteBranchExists(env, branch): Promise<boolean> {
    const out = await runCommand({
      cmd: "git", argv: ["ls-remote", "--heads", cloneUrl(env), branch], ...
    });
    return out.trim().length > 0;      // ls-remote exits 0 with EMPTY output when absent
  }
  ```

  A missing branch is **retriable**: the retry re-attaches to the same session
  and nudges it to push. After max attempts it blocks for a human, because a
  persistent failure is usually a token scope problem a retry cannot fix.
- **Lesson:** never let a self-reported side effect be the only evidence a side
  effect happened. Verify every cross-boundary claim from your own side, cheaply.
  This is the single highest-value guard in the whole pipeline.

#### 4.1.3 A resumed session rejects your kickoff with a 400

- **Symptom:** on resume, sending the continuation message fails with
  `400 ... waiting on responses to events [...]; only user.tool_confirmation,
  user.custom_tool_result, user.tool_result, or user.interrupt may be sent`.
- **Root cause:** the session is parked in `requires_action`, waiting for a
  response to a tool call that the previous (timed-out or restarted) attempt
  never answered. In that state a fresh `user.message` is not allowed.
- **Fix:** detect that specific 400, send `user.interrupt` (always accepted; it
  closes the pending call and idles the session), wait, and resend. Retry a few
  times because the interrupt is processed asynchronously.

  ```ts
  const sendKickoff = async (text: string) => {
    try { await sendUserText(text); return; }
    catch (err) { if (!isAwaitingToolResult(err)) throw err; }
    for (let attempt = 0; attempt < 4 && Date.now() < deadline; attempt++) {
      await c.beta.sessions.events.send(sessionId, { events: [{ type: "user.interrupt" }] }).catch(() => {});
      await new Promise(r => setTimeout(r, 2500));
      try { await sendUserText(text); return; } catch (err) { if (!isAwaitingToolResult(err)) throw err; }
    }
    await sendUserText(text);  // exhausted: let the job-level retry see it
  };
  ```
- **Lesson:** every resilience path you build (long tasks, worker restarts,
  revision loops) funnels through resume. Resume must handle a session parked
  mid-tool-call, or all of them are theoretical.

#### 4.1.4 Worker restart spawns a duplicate paid session

- **Symptom:** two sessions authoring the same thing, double spend, racing
  pushes.
- **Root cause:** the session id was only known in memory during the drive.
- **Fix:** persist `cma_session_id` to the stage row **immediately after
  creation and before the drive**, and always create-or-resume from it.
- **Lesson:** for any expensive external resource, persist its handle before you
  start using it, not after you finish.

#### 4.1.5 The stale-lock reaper kills healthy long jobs

- **Symptom:** a 25-minute job gets requeued at 5 minutes and restarts forever.
- **Root cause:** the existing queue reaped any `running` job whose `locked_at`
  was older than 300 seconds. That value was tuned for short scoring jobs.
- **Fix:** long stages refresh a `heartbeat_at` column from inside the event
  loop, throttled to about once every 5 seconds, and the reaper judges liveness
  by `GREATEST(heartbeat_at, locked_at)`. Short jobs keep working unchanged
  because `heartbeat_at` is null for them and `locked_at` still applies.

  ```sql
  WHERE status = 'running'
    AND GREATEST(heartbeat_at, locked_at) < now() - ($1 || ' seconds')::interval
  ```
- **Lesson:** adding long jobs to a queue tuned for short ones will silently
  break the long ones. Add liveness, do not just raise the timeout, or you lose
  fast detection for the short jobs.

#### 4.1.6 Secrets must never enter the sandbox

- **Rule we enforced:** never mount `.env*` into the sandbox; the TTS, image,
  S3 and PR-writing credentials live only on the worker host. The sandbox gets
  exactly one credential: a repo token scoped to pushing branches.
- **Lesson:** treat the sandbox as semi-trusted. Give it the minimum credential
  that lets it do its one job, and keep every other secret on the host stage
  that needs it. This is also why the PR is opened by the orchestrator.

#### 4.1.7 The agent must live in the same org/workspace as your API key

- **Symptom:** the author stage 404s the agent id.
- **Root cause:** the agents were created with a different account or workspace
  than the `ANTHROPIC_API_KEY` deployed to the worker.
- **Lesson:** put "created in the same workspace as the deployed key" in your
  setup checklist. It presents as a confusing not-found, not as an auth error.

### 4.2 Problems on the worker host (the build environment)

#### 4.2.1 The big one: the worker's own framework internals poisoned the child build

- **Symptom:** every finalize build failed, on every branch, deterministically,
  instantly, with:

  ```
  > next build
  > Build error occurred
  TypeError: generate is not a function
      at ignore-listed frames
  ```

  Worker-only. Could not be reproduced on a laptop in any configuration.
- **The investigation (and the wrong turn).** We could not reproduce on macOS.
  On arm64 Linux in Docker we hit a *different* error, `EACCES: copyfile
  .git/objects/... -> .next/standalone/...`, which went away when `.git` was
  removed. We shipped that fix on the assumption it was the same bug. It was
  not. Two real bugs were wearing one symptom.
- **Actual root cause:** the worker container boots via the framework's
  generated standalone `server.js`, which sets
  `__NEXT_PRIVATE_STANDALONE_CONFIG` (the deployment's own config,
  JSON-serialized) in the worker process. Our command runner spawned children
  with `{ ...process.env }`, so the cloned branch's `npm run build` **inherited
  it**. The framework then short-circuits config loading when that variable is
  present and uses the JSON instead. `JSON.stringify` had dropped every function
  field, including `generateBuildId`. The first thing the build does after
  loading config is call it. Hence `generate is not a function`.
- **Reproduced byte-for-byte** on a laptop once understood:
  `__NEXT_PRIVATE_STANDALONE_CONFIG="$(serialized config)" npx next build`.
- **Fix:** strip framework-internal variables at the single spawn chokepoint.

  ```ts
  function sanitizedProcessEnv(): NodeJS.ProcessEnv {
    const env = { ...process.env };
    for (const key of Object.keys(env)) if (key.startsWith("__NEXT_PRIVATE_")) delete env[key];
    return env;
  }
  // used by every runCommand() spawn, so all stages are covered at once
  ```
- **Lessons, and there are four:**
  1. **A parent process's private environment can silently reconfigure a child
     build.** If your orchestrator is itself built with the framework it is
     building, you *will* hit some version of this.
  2. **Sanitize the environment at one chokepoint**, not per call site.
  3. **A fix that makes a symptom go away is not a root cause.** Our `.git` fix
     was real but addressed a different bug. Both stayed in the code, with
     comments explaining which is which, precisely so the next person does not
     delete one as redundant.
  4. **Architecture differences hide bugs.** All local reproduction was arm64;
     the worker was amd64. Reproduce on the target architecture before
     concluding "cannot reproduce".

#### 4.2.2 Hidden stack frames made the error undebuggable

- **Symptom:** `at ignore-listed frames`, no stack, and the log was truncated.
- **Fix:** set `__NEXT_SHOW_IGNORE_LISTED=true` for the build so real
  `node_modules` frames survive into the log, and keep a bounded but generous
  output tail (we keep the last 8 KB of combined stdout/stderr and surface the
  last 1.5-2 KB in errors).
- **Lesson:** the worker log is your only view of a remote failure. Turn off
  every "helpful" frame-hiding feature in automation contexts, and make sure
  your log tail is long enough to contain a real stack trace.

#### 4.2.3 `output: "standalone"` builds die inside a git clone

- **Symptom:** `EACCES: copyfile .git/objects/... -> .next/standalone/...`.
- **Root cause:** standalone output tries to copy the working tree, including
  the clone's read-only `.git` objects.
- **Fix:** remove `.git` from the clone before building. We also added an env
  flag to disable standalone output, but that only helps when the *cloned
  branch's* config honours it, and older branches predate the flag. We control
  the worker, not the branch's config, so stripping `.git` is the fix that works
  for every branch.
- **Lesson:** when fixing a build problem for code you clone, prefer fixes on
  the side you control. A fix that requires the cloned revision to cooperate
  will not work for old revisions.

#### 4.2.4 A dev worker leaks `NODE_ENV=development` into production builds

- **Symptom:** inconsistent build behaviour and prerender failures when running
  the worker locally via the dev server.
- **Fix:** force `NODE_ENV=production` explicitly for the verification build.
  Dependencies are installed beforehand, so forcing production at build time
  does not omit dev dependencies.
- **Lesson:** never rely on the ambient `NODE_ENV` in a spawned verification
  build. Set it.

#### 4.2.5 `npm ci` omits dev dependencies under `NODE_ENV=production`

- **Symptom:** the build failed on missing tooling that is a dev dependency.
- **Fix:** `npm ci --include=dev --no-audit --no-fund`.
- **Lesson:** a build needs dev dependencies even when it produces a production
  artifact. Be explicit; do not let the ambient environment decide.

#### 4.2.6 Reusing a `--single-branch` clone directory silently breaks the second run

This one is subtle and worth reading twice.

- **Symptom:** the second and subsequent runs failed with
  `'origin/<branch>' is not a commit`, surfaced as our misleading
  "branch not found on origin, the author may not have pushed it" message. The
  branch was definitely on origin.
- **Root cause:** we reuse one clone directory per stage kind so git objects and
  `node_modules` survive between runs. That directory was first created with
  `git clone --single-branch --branch <first-branch>`, which pins
  `remote.origin.fetch` to that one branch. A later bare
  `git fetch origin <different-branch>` then updates only `FETCH_HEAD` and never
  creates `refs/remotes/origin/<different-branch>`, so the checkout of
  `origin/<branch>` fails.
- **Fix:** fetch with an explicit refspec, which creates the tracking ref
  regardless of the pinned single-branch config.

  ```ts
  await git(["fetch", "origin", `+refs/heads/${branch}:refs/remotes/origin/${branch}`], 600_000);
  await git(["checkout", "-B", branch, `origin/${branch}`]);
  await git(["reset", "--hard", `origin/${branch}`]);
  await git(["clean", "-fd"]);
  ```
- **Lesson:** if you cache clone directories across different branches, always
  fetch with an explicit refspec. And when you translate a cryptic git error
  into a friendlier message, make sure the friendly message cannot be wrong:
  ours confidently blamed the agent for a git configuration problem.

#### 4.2.7 The slim production image cannot run pipeline work

- **Symptom:** stages failing at the first `git` or `ffmpeg` call.
- **Root cause:** our existing worker reused the web app's slim standalone
  image. That image has `node` and nothing else: no `git`, no `ffmpeg`, and it
  does not even contain the repo's `scripts/` directory.
- **Fix:** a separate build target producing a **full-source image**: repo
  source, installed dependencies, built app, plus `git` and `ffmpeg`.

  ```dockerfile
  FROM builder AS pipeline
  RUN apt-get update && apt-get install -y --no-install-recommends git ffmpeg ca-certificates \
      && rm -rf /var/lib/apt/lists/*
  ENV NODE_ENV=production SENTRY_AUTH_TOKEN=
  CMD ["node", ".next/standalone/server.js"]
  ```
- **Lesson:** an orchestrator that runs your repo's own scripts needs your
  repo, not your deployment artifact. Budget for a second, fatter image.

#### 4.2.8 An unscoped worker will eat jobs it cannot run

- **Symptom (anticipated and prevented):** the moment pipeline code shipped, the
  existing slim score worker would have claimed `author_case` jobs and failed
  them instantly.
- **Root cause:** our claim query took any pending row; there was no kind filter,
  and an unset filter meant "claim everything".
- **Fix:** a `WORKER_KINDS` environment variable scoping which kinds each
  service claims, set on **both** services:

  ```bash
  # pipeline worker
  WORKER_KINDS=author_case,case_review,case_audio,case_art,case_finalize
  # existing score worker (this line is mandatory, not optional)
  WORKER_KINDS=score,partner_webhook,slack_alert,deliver_bug_report
  ```
- **Lesson:** when you add a new job kind to a shared queue, scoping the
  **existing** consumers is part of the change, not a follow-up. Ship both
  halves together, and roll the existing worker before enabling the feature.

#### 4.2.9 Deploying mid-run kills a live agent job

- **Symptom:** a deploy during an active authoring run wastes the whole run.
- **Root cause:** no SIGTERM handling. The task dies at the stop timeout, the
  reaper requeues the stage, and it restarts from scratch on the new task.
- **Status:** accepted, documented, not fixed. It costs money, not correctness.
- **Lesson:** either handle SIGTERM by checkpointing, or write the operational
  rule down ("check for a running stage before deploying") and put it in the
  runbook. Do not leave it undiscovered.

#### 4.2.10 Small ones worth knowing

- **`next start` is a hard error when `output: "standalone"` is set.** Run the
  standalone server directly. The worker loop starts from instrumentation either
  way.
- **A new service will churn image-pull errors** until the first real image is
  pushed. Expected bootstrap noise, not a failure.
- **Set worker concurrency to 1** for authoring. Two 25-minute agent jobs at
  once is rarely what you want, and it interacts badly with the single-active-run
  index.
- **Health checks must tolerate a busy job.** A naive "no response means kill"
  policy will repeatedly murder healthy 15-minute jobs.
- **Cache the dependency install by lockfile hash.** We write a marker file
  containing the lockfile's SHA-256 into `node_modules` and skip `npm ci` when it
  matches. This turned a multi-minute install into a no-op on most runs.

### 4.3 GitHub and PR problems

#### 4.3.1 Token scope

A fine-grained token limited to the one repository, with **Contents:
read/write** (push branches) and **Pull requests: read/write** (open the draft
PR). Nothing else. The sandbox receives this token as the repository resource's
authorization token; the worker uses the same token for the REST call.

If you want stricter separation, use two tokens: a push-only one for the sandbox
and a PR-only one for the worker. We did not, and it is the one thing I would
tighten first.

#### 4.3.2 The agent must never open the PR

Three reasons, all of which bit us in design review:

1. The PR body is a **review checklist** that must live in version-controlled
   code, not in a prompt where it can drift or be summarised away.
2. The PR must only appear after media and the authoritative build are done. An
   agent that opens its own PR opens it too early, by definition.
3. It keeps a PR-writing credential off a long-lived sandbox.

We also told the agent in its system prompt: "Push ONLY the branch you are told
to push. Never push to the default branch and never open a pull request."

#### 4.3.3 PR creation must be idempotent

Retries will re-run the finalize stage. The GitHub API returns 422 when a PR
already exists for the branch, so treat 422 as "look it up and return the
existing URL", not as an error:

```ts
if (res.status === 201) return { url: json.html_url, existed: false };
if (res.status === 422) {
  const existing = await findPullRequest(args);   // ?head=owner:branch&state=all
  if (existing) return { url: existing, existed: true };
}
throw new Error(`github create PR: ${res.status} ...`);
```

We used plain `fetch` against the REST API rather than the `gh` CLI,
specifically so the worker image needs no extra binary.

#### 4.3.4 The auth token ends up in the clone URL, so redact everywhere

We clone with `https://x-access-token:${token}@github.com/${repo}.git`. That
string appears in git output, error messages, and log tails. Every path that can
emit text runs through a redactor:

```ts
export function redactToken(text: string): string {
  const token = process.env.GITHUB_AUTHORING_TOKEN;
  return token ? text.split(token).join("***") : text;
}
```

Applied in the command runner's output handler, its error messages, and the
heartbeat logger. Also refresh the remote URL on each reuse
(`git remote set-url origin ...`) so token rotation does not break cached clone
directories.

**Lesson:** if a credential can appear in a subprocess's output, redact at the
subprocess boundary, not at each log call site.

---

## 5. Failure routing: the three classes

The most useful conceptual model we arrived at. Every stage failure is one of
three things, and conflating them produces either dead-ended runs or infinite
loops.

### 5.1 Infrastructure failure → retry, then block

Network blips, API 5xx, an S3 upload failing. These throw normally, so the
queue's backoff and retry handle them. After max attempts the run blocks for a
human.

### 5.2 Configuration or policy failure → block immediately, no retry

Missing environment variables, a brief that needs a capability that does not
exist, exhausted revision cycles. Retrying cannot help, so a dedicated error
type settles the job without retrying:

```ts
export class StageBlockedError extends Error {
  constructor(message: string, readonly runStatus: "blocked" | "failed" = "blocked") { super(message); }
}
```

### 5.3 Content failure → route back to the generating agent

This is the interesting one and the one most people miss. A review rejection, a
failed build on the branch, a missing or invalid media input: these are all
**defects in generated content**, which means the thing that generated it can
fix them.

```
case_review   FAIL ──► author_case (revision) ──► case_review   (re-review from scratch)
case_audio    FAIL ──► author_case (revision) ──► case_audio    (skip re-review)
case_finalize FAIL ──► author_case (revision) ──► case_finalize (skip re-review + media)
```

Three implementation details that make this work:

- **`resumeStage` decides where the chain re-enters.** A build fix on content
  that already passed review goes straight back to finalize; it does not need a
  second blind review or a second round of paid media generation.
- **A hard cap.** `MAX_REVISION_CYCLES = 2` automatic cycles, then the run
  blocks for a human, who can trigger one more fix manually from the admin UI.
  Without a cap you have built an expensive infinite loop.
- **Generation-suffixed dedup keys.** Every cycle's jobs include the revision
  count in the dedup key, or the enqueue silently no-ops against the previous
  cycle's job and the loop stalls with no error.

  ```ts
  export const stageDedupKey = (runId, stage, generation = 0) =>
    generation === 0
      ? `pipeline:${runId}:${stage}`            // first pass
      : `pipeline:${runId}:${stage}:r${generation}`;   // revision cycle N
  ```

Each stage also declares whether it fails the run at all. Our art stage passes
`failRunStatus: null` and an `onFinalFailure` hook that still fans in to
finalize, because missing cover art must never dead-end good content.

---

## 6. Cost, safety and blast-radius controls

| Control | What it does | Why it matters |
|---|---|---|
| Wall-clock budget per stage | Aborts a stuck session (author 25 min, review 20 min) | A confused agent bills until stopped |
| `maxAttempts` 1-2 on agent stages | Not the queue default of 5 | Each retry is a paid session |
| Single-active-run index | One authoring run at a time | Bounds concurrent spend and simplifies reasoning |
| `MAX_REVISION_CYCLES = 2` | Caps the author/review loop | Prevents an expensive oscillation |
| Per-stage cost recording | Reads real usage from the platform and stores it per run | You cannot manage spend you do not measure |
| **Fake mode** | `CASE_PIPELINE_FAKE=1` stubs every external call | Exercise the whole flow with only Postgres, for free |
| Fake failure injection | `..._FAKE_REVIEW_FAIL=N`, `..._FAKE_FINALIZE_FAIL=N`, `..._FAKE_AUDIO_FAIL=N` | Test the revision loops, cap-block and manual-recovery paths without spending anything |
| Scale to zero when idle | Set the service's desired count to 0 between campaigns | Jobs queue harmlessly until it returns |
| Draft PR, never a merge | The agent cannot ship | The human gate is structural, not procedural |

**Fake mode deserves emphasis.** Being able to run all five stages end to end in
about thirty seconds with no API spend is what made the orchestration
debuggable. It should be built on day one, not retrofitted. The failure-injection
variables matter just as much: the revision loops are the hardest logic in the
system and you do not want to test them with real money.

---

## 7. Porting this to another project

### 7.1 What transfers unchanged

- The three-way split of work (cloud agent / independent agent / your host).
- The queue-as-orchestrator approach, with domain tables written through from
  handlers.
- The entire `cma.ts` wrapper: create-or-resume, stream-and-consolidate, the
  idle gate, custom-tool structured output, budgets, archive, usage.
- The three failure classes and the bounded route-back-to-author loop.
- Fake mode plus failure injection.
- Every environment fix in Part 4.

### 7.2 What you must define for your domain

| Question | Ours | Yours |
|---|---|---|
| What is the unit of work? | One training case | ? |
| What files does the agent produce? | 6 files, explicit list in the prompt | ? |
| What must the agent NEVER touch? | Engine, scoring, generated registries | ? |
| What is the hard human gate? | "Needs a module that does not exist" | ? |
| What can the sandbox verify reliably? | Lint yes, production build no | ? |
| What is authoritative on your host? | Production build, content lint, critic | ? |
| What is the finish line? | Draft PR with a calibration checklist | ? |
| What is non-blocking? | Cover art | ? |

### 7.3 Build order that would have saved us time

1. **Domain tables and the queue chain first**, with every stage stubbed. Get a
   run to flow end to end doing nothing real.
2. **Fake mode and failure injection**, immediately. Before any API call exists.
3. **The CMA wrapper** against one trivial agent that just calls the result tool.
   Nail create-or-resume, the idle gate and reconnect-with-consolidation here,
   where iteration is cheap.
4. **The real author stage**, and expect to spend most of your time on the
   kickoff prompt's "do not touch" list and hard limits.
5. **Your host-side verification stage next, not last.** This is where the
   environment bugs live (Part 4.2), and everything upstream is blocked behind
   them. We did this last and it cost us weeks.
6. **The reviewer agent.**
7. **Media stages**, which are the easiest because they are just your existing
   scripts.
8. **Infra**: the second image, the second service, and scoping the existing
   worker.

### 7.4 Setup checklist for a new project

- [ ] Agent YAML, reviewer YAML and environment YAML in version control
- [ ] Skills uploaded; ids pasted into the agent YAML
- [ ] Agents created **in the same workspace as the deployed API key**
- [ ] Repo token created: single repo, Contents RW, PRs RW
- [ ] Domain migration applied
- [ ] Full-source worker image with `git`, `ffmpeg` and your repo's scripts
- [ ] New worker service, concurrency 1, kind-scoped
- [ ] **Existing** workers kind-scoped (this is the easy one to forget)
- [ ] Health checks tolerate a 15+ minute busy job
- [ ] Secrets on the worker host only; never mounted into the sandbox
- [ ] Fake-mode run green before any real spend
- [ ] Runbook note: do not deploy while a run is active

---

## 8. What we would do differently

1. **Build the host-side verification stage before the agent stage.** Almost
   every hard bug was in the build environment, not the agent, and they all
   blocked the fun part.
2. **Verify every cross-boundary claim from day one.** The `git ls-remote` check
   should have existed the first time an agent reported success.
3. **Do not ship a fix you cannot reproduce.** Our `.git` fix was real but was
   not the bug we were chasing. Reproducing on the target architecture first
   would have saved days.
4. **Design the three failure classes up front.** We discovered "content failure
   routes back to the generator" incrementally, once per stage, and each
   discovery meant reworking that stage.
5. **Split the GitHub token in two.** Push-only for the sandbox, PR-only for the
   worker.
6. **Prewarm the sandbox base image.** Still not done. A cold dependency install
   per session is slow and is the direct cause of the advisory-build compromise
   in §4.1.1. If we fixed this, the build could become a hard gate at author
   time, where the agent can actually fix it.
7. **Handle SIGTERM.** A deploy currently wastes an in-flight run.

---

## Appendix: environment variables

| Variable | Used by | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | worker | Must belong to the workspace the agents were created in |
| `ANTHROPIC_WORKSPACE_SLUG` | worker | Only for building Console links; defaults to `default` |
| `CASE_AUTHOR_AGENT_ID` | worker | From `ant beta:agents create` |
| `CASE_REVIEW_AGENT_ID` | worker | Separate agent, fresh persona |
| `CASE_AUTHOR_ENV_ID` | worker | From `ant beta:environments create` |
| `GITHUB_REPO` | worker + sandbox | `owner/repo` |
| `GITHUB_AUTHORING_TOKEN` | worker + sandbox | Contents RW + PRs RW, single repo |
| `GITHUB_DEFAULT_BRANCH` | worker | PR base; defaults to `main` |
| `WORKER_MODE` | worker | `1` starts the job loop |
| `WORKER_KINDS` | **all** workers | Comma-separated; unset means claim everything |
| `WORKER_CONCURRENCY` | pipeline worker | Set to 1 |
| `AUTHORING_WORKDIR` | worker | Root for reusable clone directories |
| `AUTHOR_CASE_BUDGET_MS` | worker | Default 25 min |
| `CASE_REVIEW_BUDGET_MS` | worker | Default 20 min |
| `CASE_AUDIO_BUDGET_MS` | worker | Default 20 min |
| `CASE_FINALIZE_BUILD_TIMEOUT_MS` | worker | Default 15 min |
| `CASE_PIPELINE_FAKE` | worker | `1` stubs every external call |
| `CASE_PIPELINE_FAKE_REVIEW_FAIL` / `_FINALIZE_FAIL` / `_AUDIO_FAIL` | worker | Fail the first N runs to exercise revision loops |
| Media keys (TTS, image, object storage) | worker only | Never in the sandbox; unset means the stage skips |
