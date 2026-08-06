---
name: author-case
description: Run the autonomous authoring pipeline for a new n8n Judge case — generate it, review it independently, draw its cover, write and render its narration, verify everything from our own side, and finish at a draft PR. Use when asked to author, generate or create a new case/challenge/problem end to end.
user-invocable: true
---

# Authoring a case, autonomously

You are the **orchestrator**. You do not write the case, review it, or write its narration —
sub-agents do all of that. You own the chain: run each stage, **verify its claims yourself**,
route failures, and stop at a draft PR.

This mirrors a production pipeline running on hosted cloud agents
([docs/cma-authoring-pipeline-handoff.md](../../../docs/cma-authoring-pipeline-handoff.md)),
so the stage names, statuses and failure classes here are deliberately the same ones. Keep
them that way — the port is meant to be a swap of *where* a stage runs, not a redesign.

## The two rules that matter more than the rest

**1. Never advance on an agent's word.** A sub-agent works where you cannot see and reports
its own success. A failed write, a wrong slug, or an optimistic summary all produce a
confident "done". Every claim has a cheap check on our side, and you advance on the check:

```bash
npm run case:verify -- <check> <slug>
```

**2. Automation stops at a draft PR.** You never merge. The last-mile judgement — walking
the journey, listening to the clips, agreeing that each question is worth asking — cannot be
automated honestly, so the run ends with a human holding it.

**A diagnosis is a claim too, not just a status.** An agent reported the model-picker bug and
named the fix as "one entry in `typeCategory`". That map ends with a `NODE_CATALOG` spread, so an
entry added above it is dead code — the real fix was the catalog descriptor's `category`. The
report was right about the *symptom* and wrong about the *file*. Read the code the agent points
at before you edit it; a confident wrong location costs a full cycle and looks like a fix.

**And the gate does not cover the build.** `npm test`, `typecheck` and `smoke` were all green on
a case where the learner could not attach a chat model, could not answer a field from the only
control offered, and got no reason when a phase refused to advance. Smoke opens the NDV and never
fills a field or places a node, so the entire build interaction is untested. Until that changes,
**the human walkthrough in the PR checklist is not a formality — it is the only coverage that
exists for the thing learners actually do.** Say so when you hand the PR over.

## Invocation

```
/author-case docs/case-specs/<slug>.md      # a filled-in case spec (preferred)
/author-case <slug> "a rich brief in prose"  # slug + brief
/author-case … --fake                        # rehearsal: no spend, no upload, no PR
/author-case --resume                        # pick up the run in progress
```

The spec template is [docs/case-authoring/TEMPLATE.md](../../../docs/case-authoring/TEMPLATE.md), and authors fill it in using [STARTER-PROMPT.md](../../../docs/case-authoring/STARTER-PROMPT.md). If
you were given a brief rather than a spec, **write the spec file first** from what you were
given, save it to `docs/case-specs/<slug>.md`, and proceed from it — the spec is what the
author agent reads, and having it on disk is what makes the run reproducible.

**Run `--fake` first if this pipeline has not been exercised since it changed.** It walks
every stage, agent reviews included, and skips only the four things that cost money or touch
shared state: cover render, voice render, S3 upload, PR. Thirty seconds of rehearsal is
worth more than any amount of re-reading this file.

## Before anything

```bash
npm run case:preflight            # add --fake in rehearsal
```

Everything a run needs, checked cheaply, **before** the stages that spend money. A blocking
failure here means stop and tell the user — the worst ordering is discovering a missing `gh`
login after paying for audio. Fix what it names, or report and halt.

### Resolve the spec's open questions against the CODE, first — do not hand them to an agent

A good spec ends with questions its author could not answer. **Answer them yourself, from the
engine, before `author_case` starts.** They are almost always facts, not judgement calls, and
each one changes what "correct" means — so an agent that guesses builds a case around the wrong
answer and every later stage validates the wrong thing.

The ops-request-desk spec asked seven. Three came back *against* the design and forced the case
from four outcomes to three: there is no Switch fallback exit, `nodeSetup` is keyed by node type,
and fan-out is unbuildable. All three were readable in `simulate.js`, `answerCheck.ts` and
`N8nEditor.jsx` in about ten minutes. The authoring skill's *"what the engine can and cannot
express"* table is the checklist — walk the spec's flow against it.

Then **rewrite the spec file on disk** to record the resolution, and commit it. The author agent
reads the spec, not this conversation; a spec still carrying the unresolved design is how the
wrong case gets built twice.

Then open the run:

```bash
npm run case:run -- init --slug <slug> --name "<Case Name>" --spec <path> [--fake]
```

One run at a time; `init` refuses if another is `queued`/`running`. Everything after this
records into `.authoring-runs/<runId>.json`, and you read that file rather than trusting your
memory of the conversation — a run that dies mid-way must be resumable without paying twice
for audio that is already uploaded.

Create the branch now, off current `main`, so every stage commits to it:

```bash
git switch -c auto/case-<slug> main
```

## The chain

```
author_case ──► case_review ──► case_audio (a) write + review narration
                                     │
                                     ▼
                                REGISTER  ◄── the gate: nothing before it may register
                                     │
                        ┌────────────┴────────────┐
                        ▼                         ▼
              case_art (non-blocking)   case_audio (b) render + sync
                        └────────────┬────────────┘
                                     ▼
                             case_finalize ──► draft PR
```

**Registration sits in the middle on purpose, and both halves of that matter:**

- **Nothing before it may register.** Registering makes leftover `TODO`s blocking, and `voice.js`
  is a scaffold full of them until `case_audio` writes it.
- **Nothing after it can work without it.** `voice:generate` looks the slug up in the registry
  and hard-errors on `Unknown problem`; `covers:generate` filters `problemList` and would
  silently draw nothing at all. An unregistered case makes both media stages report success
  having done no work.

Mark each stage `running` before you start it and record its outcome the moment you know it:

```bash
npm run case:run -- stage <stage> running --attempt
npm run case:run -- stage <stage> passed --result @/tmp/<stage>-result.json
```

---

### 1. `author_case` — write the seven files

Spawn **`case-author`** with the spec path. It scaffolds via `problem:new`, fills in
`meta` · `dissection` · `build` · `nodeSetup` · `probes` · `cases` · `index`, and iterates
against `problem:check`. It writes neither `voice.js` nor the registration.

**Then verify, yourself:**

```bash
npm run case:verify -- check <slug>         # problem:check, run by us
npm run workflows:generate -- <slug>        # every case owes an importable n8n file
npm run case:verify -- workflow <slug>
npm test && npm run typecheck
```

`workflows:generate` **fails** when the case uses a node type with no entry in
`packages/engine/n8nNodeSpecs.js`. Treat that as the same class of block as a missing catalog
type: report it and stop, rather than shipping a case whose reward is a file that does not work.

> **Do not register the case here, and do not run `case:verify files` or
> `case:verify registered` yet.** Registration is deferred to `case_audio`, after narration
> exists, and both of those checks assume a finished case.
>
> The reason, learned on the first real run: registering makes leftover `TODO`s **blocking** —
> `problem:check` only treats placeholders as fatal once a problem is registered, and
> `_template/template.test.js` scans only registered problems. `voice.js` is still the scaffold
> at this point, so registering now turns `problem:check` **and** `npm test` red over 14
> placeholders in a file this stage is forbidden to touch. Both go green the moment narration
> is authored. An unregistered case reports those placeholders as non-blocking, which is the
> correct signal for a case that is not finished yet.

**The hard human gate.** If the agent reports `blocked: true` because the spec needs a node type
that is not registered — **stop**. Do not let it substitute a near-miss node; a case built on the
wrong node teaches the wrong thing while passing every test.

The menu is [docs/node-library-catalog.md](../../../docs/node-library-catalog.md): **200
registered types**, with 10 compatibility aliases, 5 deprecated descriptors and 3 deferred
triggers that a new case must not pick. Adding a genuinely new type is four things (descriptor,
`typeCategory` + icon map, the SVG, a catalog row) and is outside an authoring run.

**The export no longer blocks on an unmapped type**, so do not expect it to. `exportWorkflow.js`
falls back to `genericNodeSpec()`, which derives n8n parameters from the catalog descriptor plus
the authored answers — every registered type produces a file, and
`packages/engine/n8nNodeSpecs.js` is a table of ~14 **overrides** for the types where that
derivation is not faithful.

That moves your job from "did it fail?" to "is it right?": a clean `workflows:generate` is not
evidence the workflow would run. Read what the author agent reports about the emitted parameters,
and treat "node X's parameters look wrong for real n8n" as a finding for the PR rather than a
blocker. Do **not** accept a swap from a canonical type to a legacy alias to make an export look
tidier — that picks the wrong node for a tooling reason.

```bash
npm run case:run -- stage author_case blocked --note "needs <type>, not in the catalog"
npm run case:run -- set --status blocked --error "…"
```

Report to the user what the case needs and stop. This is a clean outcome, not a failure.

Commit when the checks pass — the case is unregistered, so this commit is inert by design:

```bash
npm run case:verify -- on-branch auto/case-<slug>    # ALWAYS, immediately before any commit
git add packages/problems && git commit -m "<slug>: the case (not yet registered)"
```

> **Check the branch before every single commit, not just the first.** On the first real run
> two commits landed on `main` instead of the case branch: `git switch -c` had succeeded many
> steps earlier and HEAD moved in between. Nothing was pushed, so nothing was lost — but "I
> created the branch earlier" is a self-report, and this file's whole rule is not to trust
> those. It is one cheap command.

### 2. `case_review` — the independent gate

Spawn **`case-reviewer`** — a *fresh* agent with no shared context, which is what stops it
rubber-stamping. It blind-solves the `toPublicProblem()` projection (the exact payload a
learner's browser gets, answer key stripped), writes its answers down, grades itself against
the key, then audits fairness, consistency and the unvalidated `settings` surface.

Read its report. **`blockers` route back to the author; `notes` travel to the PR.** That split
is deliberate and load-bearing: every blocker costs a full author cycle, so a cosmetic nit
must not spend one.

The finding to take most seriously is **`answerKeyDisagreements > 0`** — the reviewer solved
it correctly and the authored `correct` disagrees. Nothing else in this pipeline can catch
that, and it is the defect that marks a learner down for being right.

**On `verdict: "fail"`:**

```bash
npm run case:run -- stage case_review failed --attempt --result @/tmp/review.json
npm run case:run -- set --revision
```

Re-spawn `case-author` with a **revision** brief: say the work already exists on the branch,
list the specific blockers verbatim, and warn that an independent reviewer will re-check from
scratch — so a superficial patch bounces again. Then re-run `case_review` **with a fresh
agent**, never the same one.

**Cap: 2 automatic revision cycles.** On the third failure, stop:

```bash
npm run case:run -- set --status blocked --error "review blockers survived 2 revision cycles"
```

Report the surviving blockers to the user. An uncapped loop is an expensive oscillation, and
a case that fails twice usually needs a human judgement the loop cannot supply.

### 3. `case_art` — the cover (non-blocking, host-only)

**Runs after registration** (`case_audio` step 3), in parallel with the render half of
`case_audio` — `covers:generate` filters `problemList`, so on an unregistered case it draws
nothing and says so in a way that is easy to read as success. **This stage can never fail the
run.**

```bash
npm run covers:generate -- --only <slug>
```

Then set `coverImage.src` to `/covers/<slug>.png` in `meta.js` and re-seed later with the
rest. Spawn **`case-art-reviewer`**, which opens the PNG and the two existing covers and
judges whether it belongs to the set — the check that matters is legible garbled text, which
`gpt-image-1` adds despite being told not to.

`verdict: "redraw"` → adjust `coverImage.prompt` from its guidance and run
`covers:generate -- --only <slug> --force` **once**. If the second attempt also fails:

```bash
npm run case:run -- stage case_art skipped --note "art failed review twice; PR carries an unchecked item"
```

and carry on. In `--fake` mode skip the render entirely and mark the stage `skipped`.

### 4. `case_audio` — narration (host-only)

**Author and review the copy before rendering a single clip.** A clip's filename is a hash of
its text, so a line fixed after rendering costs a re-render, a re-upload, and an orphan in a
shared bucket.

1. Spawn **`case-voice-author`**. It writes `packages/problems/<slug>/voice.js` and reports
   the `voice:generate --dry-run` numbers — clips to render, characters to bill.
2. Spawn **`case-voice-reviewer`** (fresh, read-only). Its blocking category is **leaks**: a
   line that names an answer to a question still open. `verdict: "fail"` → back to
   `case-voice-author` with the blockers, same 2-cycle cap.
3. **Register the case now** — narration exists, so the placeholders are gone and registration
   is finally safe. Append two lines to `packages/problems/index.js` (the import and the
   registry entry), **last**, using the `registrationLines` the author stage reported. Registry
   order is the catalogue order on Home.

   This is also what makes the rest of this stage possible: `voice:generate` iterates the
   **registry**, so an unregistered case renders no clips at all — it would report success
   having done nothing.

```bash
npm run case:verify -- files <slug>        # NOW the TODO scan must be clean
npm run case:verify -- registered <slug>
npm run case:verify -- check <slug>
npm test                                    # the template placeholder scan must pass too
```

4. Only once all of that passes:

```bash
npm run voice:generate -- --dry-run       # confirm the cost yourself, do not take it on trust
npm run voice:generate -- <slug>
npm run voice:sync
```

**Then verify both halves from our side:**

```bash
npm run case:verify -- voice-rendered <slug>    # every clip the table names is on disk
npm run case:verify -- voice-uploaded <slug>    # every clip is really in the bucket
```

`voice-uploaded` lists the bucket prefix once and compares locally. It deliberately does
**not** trust `.voice-clips/.uploaded.json` — that ledger is our own claim to have uploaded,
and it will tell you when the ledger is wrong.

In `--fake` mode: stop after the dry run, mark the stage `passed`, note that nothing was
rendered.

Commit:

```bash
git add packages/problems packages/voice-scripts apps/web/public/covers
git commit -m "<slug>: narration and cover"
```

> `packages/voice-scripts/*.json` and `index.js` are generated, and `voice:generate` rewrites
> the tables for **every** problem, not just this one. Expect the other cases' tables in the
> diff and commit them — a shared line changing is a real change to their tables.

### 5. `case_finalize` — authoritative gate, then the PR

Where truth is established. Everything before this was advisory.

```bash
npm run db:seed                                  # nothing you wrote reaches the app until this
npm run case:verify -- seeded <slug>             # Postgres serves THIS content, not an older version
npm test && npm run typecheck
```

`seeded` compares byte-for-byte with the same key-sorted serialisation `publishProblem` uses,
because "a PUBLISHED row exists" is not the same as "it holds what you just wrote" — a
forgotten re-seed leaves a healthy row serving the previous wording, which is invisible in
the app and looks exactly like a broken voice render.

Then the real gate — there are no component tests, so a render-time bug passes both `npm test`
and `next build`:

```bash
# dev server must be running AND warm: load localhost:3000 once first, or the
# resume check flakes on a cold server
SMOKE_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run smoke
```

**On a smoke failure: one repair attempt, then halt.** A smoke failure on a new case is
almost always a render-time bug in the authored data, so hand the output to `case-author` as a
revision, re-run smoke once, and if it is still red:

```bash
npm run case:run -- set --status blocked --error "smoke failed after one repair attempt"
```

Halt **before opening the PR**. Nothing half-broken gets a PR.

**Prove the gate against the BRANCH, not against your working tree.** This is the subtler half of
"never advance on a self-report", and it caught me on the first real run: `npm test` was green at
482/482 — with an uncommitted test fix in the working tree that the branch did not contain. The PR
would have arrived red. A working tree is not what a reviewer or CI checks out.

```bash
# a detached worktree at the branch's own commit — works even though the branch is checked out here
SHA=$(git rev-parse auto/case-<slug>)
rm -rf /tmp/verify-branch && git worktree add --detach -q /tmp/verify-branch "$SHA"
ln -s "$PWD/node_modules" /tmp/verify-branch/node_modules
(cd /tmp/verify-branch && npx vitest run)
git worktree remove /tmp/verify-branch --force && git worktree prune
```

Anything the suite needs that is not committed to the branch is part of this case's PR — on that
run it was `packages/problem-schema/balanceOptions.test.ts`, whose old form asserted the live
registry was answer-biased and therefore went red the moment a case followed the balance rule.

Then verify the branch is really on origin, and open the PR yourself:

```bash
git push -u origin auto/case-<slug>
npm run case:verify -- branch auto/case-<slug>    # ls-remote exits 0 even when absent
gh pr create --draft --base main --head auto/case-<slug> \
  --title "<Case Name> (<slug>)" --body-file /tmp/pr-body.md
npm run case:run -- set --pr <url> --status awaiting_review
npm run case:run -- stage case_finalize passed
```

**You open the PR, never a sub-agent** — it must appear only after media and the
authoritative gate are done, and the body is a review checklist that belongs in this file
rather than in a prompt where it can drift.

## The PR body

Write `/tmp/pr-body.md` with the run's real numbers and the notes every reviewer produced:

```markdown
## <Case Name> — `<slug>`

Authored by the `/author-case` pipeline. Run `<runId>`, `<n>` revision cycle(s).

**Scored decisions:** <total> (<understand> understand / <placement> placement /
<config> config / <stress> stress) → reads as <difficulty>, authored <difficulty>.
**Narration:** <n> authored moments, <n> clips rendered, <chars> characters billed.
**Cover:** /covers/<slug>.png

### Verified automatically
- [x] `problem:check` clean · `npm test` · `npm run typecheck`
- [x] Independent blind solve: <dissection> dissection, <fields> fields, <stress> stress
- [x] `simulateAll` passes on the reference graph
- [x] `<n>` clips present on disk **and** in `s3://<bucket>/<prefix>/`
- [x] Postgres serves v<n>, byte-identical to this branch
- [x] `npm run smoke` green

### A human still has to do these — no test covers them
- [ ] **Read every `correct` and every `why`.** A plausible-but-wrong answer key marks a
      learner down for being right, and nothing here can catch it.
- [ ] **Check node `settings` in the browser.** `settings` is absent from `nodeSetupSchema`
      and zod strips unknown keys, so `validateProblem()` never sees it: no
      exactly-one-correct check, no `why` coverage, no `SETTINGS_SPEC` key check.
- [ ] **Listen to the narration.** No test can tell whether `[excited]` sounds different
      from `[calm]`.
- [ ] **Walk the journey start to finish.** The gate cannot tell you whether a question is
      worth asking.
- [ ] Look at the Home card next to the others.

### Reviewer notes (non-blocking, for you to judge)
<the `notes` arrays from case-reviewer, case-voice-reviewer and case-art-reviewer>

### Unchecked by the run
<anything skipped: cover art that failed review twice, a stage marked skipped, and why>
```

Never tick a box the run did not actually verify. A checklist that lies is worse than none.

## Failure routing — three classes, and do not conflate them

| Class | Examples | What to do |
|---|---|---|
| **Infrastructure** | ElevenLabs 5xx, S3 timeout, network blip, Postgres down | Retry the step up to twice with a pause. Then `--status blocked` for a human. Do **not** send it to an agent — there is nothing for it to fix. |
| **Configuration / policy** | needs a node type that does not exist · missing key · revision cap exhausted | `--status blocked` **immediately, no retry.** Retrying cannot help. Report what is needed. |
| **Content** | review blockers · voice leaks · `npm test` red · smoke red · `simulateAll` failing | Route back to the **generating** agent with the specific findings, bounded at 2 cycles. |

Two details that make content routing work:

- **Re-enter the chain where the failure was found, not at the start.** A smoke fix on a case
  that already passed review goes back to `case_finalize` — it does not need a second blind
  review or a second paid render. Record it with `set --revision` so the count is honest.
- **Always re-review with a fresh agent.** Re-using the reviewer that already read the case
  loses the independence the stage exists for.

## Cost and blast radius

| Control | Why |
|---|---|
| `--fake` walks everything and spends nothing | The orchestration is the hard part; debug it for free |
| One active run (`init` refuses a second) | Bounds concurrent spend |
| 2 revision cycles per stage, then block | An uncapped loop is an expensive oscillation |
| `voice:generate --dry-run` before every real render | You see the character count before billing it |
| Only `packages/problems`, `packages/voice-scripts`, `apps/web/public/covers` are ever committed | An unrelated edit in the tree can never ride into the PR |
| Draft PR, never a merge | The human gate is structural, not procedural |
| `case:verify` never renders, uploads, seeds or pushes | Safe to re-run at any point, including on a half-finished run |

## Resuming

```bash
npm run case:run -- show                  # where it got to, and what each agent returned
npm run case:verify -- all <slug>         # what is actually true on disk, in S3, in Postgres
```

Trust `case:verify` over the run file when they disagree: the run file records what a stage
*reported*, the verifier checks what *is*. Re-enter at the first stage the verifier says is
incomplete. Never re-run `voice:generate`/`voice:sync` for clips `voice-uploaded` already
confirms — that is paying twice for bytes already in the bucket.

## Abandoning

```bash
npm run case:run -- set --status failed --error "abandoned: <reason>"
git switch main && git branch -D auto/case-<slug>
```

If clips were already rendered and uploaded they stay in the bucket as orphans. That is
harmless — every clip is addressed by a hash of its own text, so an orphan is unreachable
rather than wrong. `voice:generate -- --prune` clears the local copies.

## The database does not roll back when you `git switch`

**The single most confusing failure this pipeline has produced.** Read it before moving a case
between branches.

Postgres is branch-independent. A case seeded on its own branch stays `PUBLISHED` after you
switch to a branch that never had it — and the app keeps serving it, pointing at files that are
no longer on disk. The learner sees:

- **a missing cover image** — the served problem still names `/covers/<slug>.png`, which now 404s;
- **no audio at all** — `packages/voice-scripts/<slug>.json` is absent, so none of its files are
  in `VALID_CLIP_FILES` and the route refuses every request *by design*, degrading silently to
  captions. Which looks exactly like a broken render, and sends you to the wrong problem entirely.

**Every other check in this file passed while this was broken**, because they all ran on the
branch that had the files. So:

```bash
npm run case:verify -- servable x    # every PUBLISHED problem still has its cover + clip table
```

It asks about **all** published problems, not the one you are working on, because switching
branches breaks whichever cases the new branch never had. Run it after any `git switch`,
`git merge` or branch move, and before telling anyone the app works. It is part of
`case:verify all`.

The fix is always the same: get the files and the database back into agreement — check out (or
merge) the branch that carries the case. Do **not** re-seed to "fix" it; re-seeding an
unregistered case does nothing, and re-seeding a case whose files you cannot see is how a
version gets published from a half-populated tree.

## Another worktree may be editing the catalog — check before you start

The `@judge/catalog` node vocabulary is being extended in a **separate worktree**, and it collides
with this pipeline in three places. Check `git worktree list` before a run, and if another worktree
is live, say so in your final report.

| Shared file | Why it collides |
|---|---|
| `packages/catalog/catalog.js` | A new node type changes what `enumerateSpeakable` produces, so the clip tables change |
| `apps/web/src/nodes/nodeIcons.js` | `catalog.test.js` now asserts every catalog type has a `typeCategory` **and** an icon — a batch of new types with no icon entries turns the suite red, in the other worktree's favour or yours depending on who runs last |
| `packages/voice-scripts/*.json` | **Generated, committed, and rewritten for every problem** by one `voice:generate` run |

**Never render narration from two worktrees.** The tables would diverge and the merge reads as a
broken render rather than as a conflict. After any catalog merge, re-run
`npm run voice:generate -- --dry-run` before trusting a cost estimate — and note that a clip is
addressed by a hash of its text, so a table that disagrees with the bucket degrades to captions,
which looks exactly like a failed upload.

If a run's `case:verify` disagrees with what you expect, check whether the other worktree moved a
shared file underneath you before assuming the case is at fault.

## Reporting to the user at the end

Say plainly: the PR URL, the scored-decision count and difficulty, what was rendered and what
it cost, how many revision cycles each stage burned, **every stage that was skipped and why**,
and the checklist items that still need a human. If anything was left out, say so explicitly —
scaling the work down is the user's call, not yours.
