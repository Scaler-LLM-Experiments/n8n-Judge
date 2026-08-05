# Porting the authoring pipeline to Claude Managed Agents

The local pipeline (`/author-case`) and the production one run the **same five personas**.
Locally they are Claude Code sub-agents in `.claude/agents/*.md`; in production they are
hosted cloud agents created from `agents/*.agent.yaml`. Those YAMLs are **generated** from
the markdown, so the personas cannot drift apart:

```bash
npm run case:cma            # regenerate agents/ from .claude/agents/
npm run case:cma -- --check  # fail if stale — worth wiring into CI
```

**Edit `.claude/agents/*.md`. Never edit `agents/`.**

The architecture, the failure classes and every environment bug this design already accounts
for are in [cma-authoring-pipeline-handoff.md](cma-authoring-pipeline-handoff.md). Read that
first. This file is only what is specific to n8n Judge.

---

## What runs where, and why

The split is not arbitrary — the three kinds of work fail differently.

| Work | Runs | Stages |
|---|---|---|
| **Creative** — write the case, write the narration | CMA sandbox | `author_case`, the authoring half of `case_audio` |
| **Judgement** — is it good? | CMA sandbox, **separate agent, fresh session** | `case_review`, the review half of `case_audio` and `case_art` |
| **Deterministic** — media, seed, build, smoke, PR | **Your host** | `case_art`, the render half of `case_audio`, `case_finalize` |

**Three things in this repo cannot run in a sandbox**, and they decide the split:

| Step | Why it is host-only |
|---|---|
| `npm run db:seed` | Needs Postgres. Nothing an author writes reaches the app without it. |
| `npm run smoke` | Needs system Chrome **and** a warm dev server. It is the real gate — there are no component tests, so a render-time bug passes both `npm test` and `next build`. |
| `voice:generate` · `voice:sync` · `covers:generate` | Hold the ElevenLabs, OpenAI and S3 credentials, which must never enter a sandbox. |

**What the sandbox *can* verify reliably**, and should therefore hard-gate at author time:
`npm run problem:check` (offline by design — no database, no dev server, no API key),
`npm test`, `npm run typecheck`. All three are fast and hermetic here.

> Judge is smaller than the app in the handoff doc, so `npm test` is likely to complete in
> the sandbox where that project's production build could not. **Verify that before trusting
> it as a hard gate** (§4.1.1): if a cold install plus suite proves unreliable there, demote
> it to advisory at author time and keep it authoritative in `case_finalize` — but never
> silently drop it.

---

## One-time setup

```bash
# 1. Upload the two project skills the personas read, and paste the returned ids into
#    the `skills:` block of each agent YAML.
#      .claude/skills/authoring-a-problem/SKILL.md
#      .claude/skills/iris-voice/SKILL.md
#    Both are test-enforced contracts. An agent without them writes plausible content
#    that breaks rules it appears to know.

# 2. The sandbox environment (shared by all five agents)
ant beta:environments create < agents/case-author.environment.yaml --transform id -r
#   → env_…   → CASE_AUTHOR_ENV_ID

# 3. The agents
ant beta:agents create < agents/case-author.agent.yaml         --transform id -r  # → CASE_AUTHOR_AGENT_ID
ant beta:agents create < agents/case-reviewer.agent.yaml       --transform id -r  # → CASE_REVIEW_AGENT_ID
ant beta:agents create < agents/case-voice-author.agent.yaml    --transform id -r  # → CASE_VOICE_AUTHOR_AGENT_ID
ant beta:agents create < agents/case-voice-reviewer.agent.yaml  --transform id -r  # → CASE_VOICE_REVIEW_AGENT_ID
ant beta:agents create < agents/case-art-reviewer.agent.yaml    --transform id -r  # → CASE_ART_REVIEW_AGENT_ID
```

**Later prompt edits are an UPDATE, never a create:**

```bash
npm run case:cma      # regenerate first
ant beta:agents update --agent-id "$CASE_AUTHOR_AGENT_ID" --version N < agents/case-author.agent.yaml
```

A new agent id orphans every session that referenced the old one.

**The agents must be created in the same org/workspace as the `ANTHROPIC_API_KEY` the worker
deploys with.** A mismatch presents as the author stage 404-ing the agent id — a confusing
not-found, not an auth error.

---

## Setup checklist

- [ ] `agents/*.yaml` regenerated and committed (`npm run case:cma -- --check` clean)
- [ ] Skills uploaded; ids pasted into all five agent YAMLs
- [ ] Agents created **in the same workspace as the deployed API key**
- [ ] Repo token: single repo, **Contents RW** (push branches) + **Pull requests RW**
- [ ] Full-source worker image — needs the repo's `scripts/`, `git`, Chrome for smoke, and
      `node ≥ 22.6` (`db:seed` imports a `.ts` file and relies on native type stripping)
- [ ] Postgres reachable, migrations applied, **`db:seed:rubric` run** — without a
      `RubricVersion` row the score is never persisted and admin analytics is silently empty
- [ ] Existing workers kind-scoped **before** enabling this (the easy one to forget)
- [ ] Worker concurrency 1
- [ ] Health checks tolerate a 15+ minute busy job
- [ ] Secrets on the host only; never mounted into the sandbox
- [ ] A `--fake` run green before any real spend
- [ ] Runbook note: do not deploy while a run is active

---

## Judge-specific traps for whoever builds the worker

**`voice:generate` rewrites every problem's clip table, not just the new case's.** A shared
line changing is a real change to the other cases' tables, so the commit legitimately touches
`packages/voice-scripts/*.json` for problems the run never authored. Do not "fix" that by
scoping the write.

**A clip is addressed by a hash of its own text, so the bucket and the deployed code must
match.** Re-rendering narration renames every file. Until the build carrying the new
`packages/voice-scripts` tables is deployed, production asks for the previous names and gets
404s — which degrades to captions by design and looks exactly like a broken upload.

**Deciding what to render or upload must never touch S3.** Answer it from local disk and the
local ledger. Asking the bucket per object is what got Scaler's keys flagged. Verification is
the one exception, and even then it is a single paginated `ListObjectsV2` over the prefix, not
a HEAD per clip — see `checkVoiceUploaded` in `scripts/authoring/verify.mjs`.

**`publishProblem` does not validate.** Neither it nor `seed.mjs` calls `validateProblem()`, so
a broken case seeds cleanly if the suite is skipped. The test suite is the only gate — never
let the worker seed without it.

**Every writer to `TraceEvent` must take the per-session advisory lock.** Not something an
authoring run does today, but it is the worst bug this project has had, so if a stage ever
writes trace rows, read the *The trace pipeline* section of `CLAUDE.md` first.

---

## What the local pipeline already gives you

Reusable as-is when the worker is built — these are host-side by nature and do not care
whether the creative work came from a sub-agent or a CMA session:

| Local | Becomes |
|---|---|
| `scripts/authoring/preflight.mjs` | the worker's startup self-check |
| `scripts/authoring/verify.mjs` | the cross-boundary verifiers, unchanged — including `branch`, which is the `git ls-remote` guard from §4.1.2 |
| `scripts/authoring/run-state.mjs` | `case_pipeline` + `case_pipeline_stages`; the JSON fields are already the columns, and stage `sessionId` is where the CMA session id goes |
| `.claude/skills/author-case/SKILL.md` | the stage chain, the three failure classes, and the PR checklist |

The PR body in that skill is deliberately version-controlled prose rather than something an
agent composes, and **the orchestrator opens the PR, never an agent** — it must appear only
after media and the authoritative gate are done, and it keeps a PR-writing credential off a
long-lived sandbox.
