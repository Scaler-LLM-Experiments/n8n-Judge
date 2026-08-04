# Handoff — authoring new cases

Scope: **authoring challenges only** (`packages/problems/**` and the voice that goes
with them). Written 2026-08-04, branch `sudhanva/authoring`, HEAD `5a9454b`.

[STATUS.md](STATUS.md) remains the source of truth for the project overall — this file
does not replace it. Everything below was verified against the running code, not
recalled.

**Read these, in this order, before authoring anything:**

1. [.claude/skills/authoring-a-problem/SKILL.md](.claude/skills/authoring-a-problem/SKILL.md) — the contract. Test-enforced.
2. [.claude/skills/iris-voice/SKILL.md](.claude/skills/iris-voice/SKILL.md) — narration contract. Also test-enforced.
3. [docs/authoring-a-case.md](docs/authoring-a-case.md) — the step-by-step runbook.
4. `packages/problems/email-triage/` — the fully-authored reference. Copy its
   *structure*, not its option ordering (see trap 3).

---

## 1. Get running on this machine

Three environment facts that cost real time to discover:

```bash
# Node 22 is REQUIRED. `db:seed` imports a .ts file directly and needs native type
# stripping; Node 20 dies with ERR_UNKNOWN_FILE_EXTENSION. Installed keg-only, so
# your default `node -v` is untouched. Export this in every shell.
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"

npm run db:up          # Postgres on port 5442, NOT 5432
npm run db:migrate     # fresh DB only
npm run dev            # http://localhost:3000
```

**Postgres is on 5442** because 5432/5433/5434 are taken by other projects on this
machine (a native Postgres, `business-tech-labs`, `ai-coding`, `lld-platform`).
Pointing `DATABASE_URL` at an occupied port fails with the misleading
`P1010: User was denied access` — you reached someone else's database.
`POSTGRES_PORT` and `DATABASE_URL` in `.env` must change together, and the container
needs `docker compose up -d --force-recreate db` to pick up a new port.

Sign in at `/signup` with invite code `AIML-DEMO`, `DSML-DEMO` or `SE-DEMO`.

`.env` is filled in and git-ignored: ElevenLabs key, AWS S3 (bucket `scaler-uxr`,
region `us-west-2`, prefix `n8n-judge-voice-clips`, endpoint deliberately empty = real
AWS). `ANTHROPIC_API_KEY` is **empty** — set it if you want `npm run problem:draft`.

---

## 2. Where the catalogue stands

Two problems registered, in this order (registry order **is** catalogue order):

| | `email-triage` | `expense-approvals` |
|---|---|---|
| Registered | yes | yes |
| Seeded | v1 PUBLISHED | v1 PUBLISHED |
| Cover art | `/covers/email-triage.png` | **missing** (`src: null`) |
| Voice authored | yes | yes |
| Voice rendered | yes | yes |
| Voice synced to S3 | yes | yes |
| `assembled.snapshot.json` + `index.test.js` | yes (split-proof only) | no — and correctly so |

`email-triage` is the complete reference. `expense-approvals` was authored *through*
the pipeline as a test of it and is deliberately incomplete: **no cover art**. Do not
treat it as a finished exemplar — but do copy its option balance (see trap 3).

Three other problems (`lead-triage`, `meeting-notes`, `order-desk`) were deleted on
2026-07-31 so the template could be extracted from one complete problem. They exist in
git history, but the same commit deleted their database rows, so restoring one means
re-registering **and** re-seeding. Anything describing "four challenges" is stale.

Voice library: 236 distinct clips, all rendered and uploaded (`.voice-clips/.uploaded.json`
records 236). Of those, **43 live in `shared/`** and are reused by every problem — see
trap 6.

---

## 3. Uncommitted work in progress — read before you touch anything

`git status` is dirty. Nothing here is committed.

**Mine (docs/tooling, safe):**

- `.claude/skills/iris-voice/SKILL.md` — new section documenting that `shared/` clips
  already exist and a new problem only pays for its own lines.
- `.claude/skills/authoring-a-problem/SKILL.md` — §6 gained the same cost note.
- `packages/voice-scripts/README.md` — corrected stale counts (claimed "500 ids across
  four problems → 307 files"; actually 980 ids across 2 → 236 files), and generalised
  the re-render warning to cover `ELEVENLABS_VOICE_ID`/`MODEL_ID`, not just Deepgram.
- `docs/authoring-a-case.md`, `docs/running-locally-voice-s3.md` — new.
- `scripts/verify-voice-s3.mjs` + `voice:verify` npm script — proves a clip came from
  S3 rather than local disk.
- `docs/adding-a-problem.md`, `.gitignore`, `package.json` — small pointer/ignore edits.

**Authoring content — needs a decision (see §5):**

- `packages/problems/email-triage/voice.js`, `packages/problems/expense-approvals/voice.js`
  — a `phase_intro` line rewritten in both; breaks two documented copy rules.
- `packages/problems/email-triage/assembled.snapshot.json` — re-taken for that edit, but
  now one character stale. This is the second `npm test` failure.
- `packages/voice-scripts/email-triage.json`, `index.js`, `expense-approvals.json`
  — regenerated tables. `expense-approvals.json` is new and *should* be kept: it is the
  missing piece from the last commit.

**⚠ Parallel app work — NOT authoring, do not revert or stash it.** Someone is mid-flight
on the runtime in the same working tree: **351 insertions / 166 deletions across 12 files**
under `apps/web/`, plus two new test files (`src/lib/grader.test.js`,
`src/lib/voiceLevel.test.js` — which is why the suite grew from 465 to 473 tests).

Heaviest: `mascot/MascotPlayer.jsx` (+113), `app/api/sessions/route.ts` (+84),
`src/App.jsx` (+77), `components/AsyncGate.jsx` (+54), `lib/voiceLevel.js` (+53),
`screens/HomeScreen.jsx` (+50). The sessions route now filters the resume query by
`?slug=` and accepts a `restart` flag, which looks like a fix for the resume-shadowing
issue described in
[docs/running-locally-voice-s3.md](docs/running-locally-voice-s3.md).

**Nothing in this repo is committed yet.** Before you author, consider committing the
authoring-side work separately from the app-side work so the two do not have to land
together — `git add packages/problems packages/voice-scripts docs .claude scripts` keeps
them apart.

---

## 4. The process, in one block

Full detail in [docs/authoring-a-case.md](docs/authoring-a-case.md). The commands:

```bash
npm run problem:new -- <slug> "Human Title"      # scaffolds 8 files; does NOT register
npm run problem:draft -- <slug> "what the learner builds"   # optional AI first pass
# ... fill in every value ...
npm run problem:check -- <slug>                  # offline, works before registering
# ... register: 2 lines in packages/problems/index.js ...
npm test && npm run typecheck                    # 1 known failure, see trap 4
npm run db:seed                                  # NOTHING reaches the app until this
npm run covers:generate -- --only <slug>         # then set coverImage.src, re-seed
npm run voice:generate -- <slug> && npm run voice:sync && npm run db:seed
npm run dev && npm run smoke                     # the real gate
```

**8 files per case** — `meta.js`, `dissection.js`, `build.js`, `nodeSetup.js`,
`probes.js`, `cases.js`, `voice.js` (the only optional one), `index.js` (assembles, no
logic). `_template/` shows 9 because it carries its own test, which `problem:new`
deletes for you.

**The slug is permanent and you must supply it.** Nothing derives it from the title.
It becomes the folder, `meta.id`, the camelCased export name, the voice clip paths, the
cover filename, the `Problem.slug` row and the `?problem=` deep link. Renaming later is
a re-render plus a re-generate plus a new DB row.

**Two commands people forget:** `db:seed` after *any* edit (problems are served from
Postgres, not the repo), and `voice:generate` after *any* copy edit (a clip's filename
is a hash of its text).

---

## 5. Open items

**a) Decide what to do with the `phase_intro` voice edit.** Both problems had their
first `phase_intro` line replaced with the same string:

```
"[calm] Now that you know the exact nodes, lets dive in deeper. Lets get started."
```

Four problems with it, none of which any test will catch:

1. **`"let's dive in"` is explicitly banned** — `apps/web/src/lib/voiceLines.js:26`:
   *"Plain words. No idioms, no \"let's dive in\", no \"nailed it\"."*
2. **`lets` is missing its apostrophe**, twice. The phrase book rule is "USE
   CONTRACTIONS. Always." The same string is the on-screen caption, so it is visible.
3. **It defeats the purpose of the moment.** The comment directly above it says these
   lines *"give the question to hold in your head while you look at the palette, and
   never the node that answers it."* The new line gives no question, and "now that you
   know the exact nodes" gestures at the answer.
4. **Identical text in two problem-scoped files renders twice.** Because it is
   authored, it lands in `email-triage/` and `expense-approvals/` rather than
   `shared/` — two files, same audio, billed twice. This is precisely what the
   `shared/` scope exists to avoid.

The lines it replaced were problem-specific and good: *"Nothing here runs until
something starts it, so begin at the top."* / *"...until something notices a claim."*

Either revert (`git checkout -- packages/problems/*/voice.js`) or rewrite to obey the
copy rules. Then re-run `voice:generate` and `voice:sync`.

It also left `email-triage`'s snapshot one character out of date, which is the second
`npm test` failure — see trap 4. `assembled.snapshot.json` was re-taken once and then the
source gained a trailing full stop. Whichever way you resolve the copy, finish by
re-taking the snapshot (one-liner at the top of
`packages/problems/email-triage/index.test.js`) or by reverting both files together.

Note the reason `voice.js` edits ripple this far: an edit changes the assembled problem
object (snapshot test), the clip fingerprints (`voice:generate`), the uploaded set
(`voice:sync`) **and** the published version (`db:seed`). Four steps, and only the first
is enforced by a test.

**b) Two clips are stale right now.** `voice:generate --dry-run` reports
`2 missing, 234 already rendered` — the two edited `phase_intro` lines have new
fingerprints and were never rendered, so they 404 and degrade to captions. The two
superseded clips are now orphans in the bucket (`--prune` removes local orphans).

**c) The database is behind the source.** `voice.js` was edited but `db:seed` has not
been re-run, so Postgres still serves v1 with the *old* lines. Verified directly. Re-seed
to publish v2 — and note that is the reason the app currently looks fine.

**d) `expense-approvals` needs cover art** — author `coverImage.prompt`, run
`covers:generate --only expense-approvals`, set `src`, re-seed. Until then its Home card
shows a generic placeholder, which learners see first.

---

## 6. Traps — all verified against current code

**1. `_template/nodeSetup.js` authors the WRONG `settings` shape.** The worst one,
because it is in the file you copy.

```js
// ✗ template — silently broken
settings: [{ key: 'onError', options: [{ value: 'stopWorkflow', correct: true, why: '…' }] }]
// ✓ what both shipped problems use
settings: [{ key: 'onError', correct: 'continueErrorOutput', why: { continueErrorOutput: '…', stopWorkflow: '…' } }]
```

`why` is a map keyed by the value the learner chose. With the template shape,
`checkAnswer` compares against `graded.correct` which is `undefined`, so **every learner
is marked wrong forever with no explanation** — and because the public projection strips
`correct`/`why` only at the top level, a template-shaped setting **ships its answer key
to the browser**. Copy `settings` from `email-triage/nodeSetup.js`.

**2. `settings` is not validated at all.** It is absent from `nodeSetupSchema`, and zod
strips unknown keys, so `validateProblem()` never sees it. No exactly-one-correct check,
no `why` coverage, no `SETTINGS_SPEC` key check. Fields get all three. This is also why
`problem:draft` silently drops any `settings` the model wrote. **Verify settings by hand
in the browser.**

**3. Never park the correct option at index 0.** An audit found it there in 25/25 fields
and 13/13 dissection items. `balanceProblemOptions` does redistribute server-side before
options reach the browser, so a clustered order is not a live grading bug — it is the
signal nobody thought about the distractors. `problem:check` reports the distribution.
`email-triage` violates this (20/20 at index 0); `expense-approvals` is the good example
(4/20).

**4. `npm test` is currently 471 passed, 2 failed.** One is permanent-by-design, one is
live drift you should fix.

*Expected, leave it:* `packages/problem-schema/balanceOptions.test.ts` → *"puts the
correct option first in every graded list"*. That test is **inverted** — it asserts the
live registry *is* biased, written as a characterisation when `email-triage` was the only
problem. Any problem that follows trap 3 fails it. The intended fix is to point that one
`describe` at a fixture rather than the registry.

*Live drift, fix it:* `packages/problems/email-triage/index.test.js` → *"assembles to
exactly the object that existed before the file was split"*. This is the `assembled.snapshot.json`
guard, and failing on a deliberate content change is its whole purpose — the test says so:
*"When you change authored content ON PURPOSE, this test fails — that is the point.
Re-take it deliberately."* Right now the snapshot is **one character behind** the source:
it stores `"…Lets get started"` where `voice.js` now has `"…Lets get started."` (trailing
full stop). Either revert the voice edit per open item (a), or re-take the snapshot with
the one-liner documented at the top of that test file.

Anything red beyond those two is yours.

**5. `flowSummary` label check is half-broken.** It reads `NODE_CATALOG[...].title` but
catalog entries carry `label`, so the "don't name a node" check only ever sees palette
labels. It is also a substring match, so a palette containing `If` or `Code` wrongly
rejects the legitimate labels `"classify"` and `"verify it"`.

**6. Unauthored moments are free; authored ones are not.** A moment you leave alone
falls back to the phrase book and resolves to a `shared/` clip that already exists. Only
an authored moment needs new audio. So author where the problem's own vocabulary earns
it, and leave journey scaffolding (`phase_complete` and friends) generic — see open item
(a) for what going the other way costs. This is now documented in both skills.

**7. Per-problem voice copy rules are effectively unenforced.** `validateProblem()`
checks only `{{` (error), em dashes (warning) and the word cap (26 on arrival, 22
elsewhere — warning). The tag-opening rule, exclamation whitelist, contraction rule and
banned idioms are tested against the shared phrase book and `email-triage` only. A new
problem's `voice.js` is unchecked. Open item (a) is a live example of this gap.

**8. `sampleCase.urgency` is an email-shaped required enum** —
`z.enum(['LOW','MEDIUM','HIGH'])`, no default. Every non-email case invents a value.
Same for `from`/`subject`: read them as "who this came from" and "what it says".

**9. `publishProblem` does not validate.** Neither it nor `seed.mjs` calls
`validateProblem()`. A broken problem seeds cleanly if you skip `npm test`. **The test
suite is the only gate.**

**10. `docs/adding-a-problem.md` is a stub** that predates `problem:new`/`check`/`draft`.
Use `docs/authoring-a-case.md`.

---

## 7. Definition of done

1. **Gate green** — `npm test` (bar trap 4), `npm run typecheck`, `npm run smoke`, and
   the correct option spread rather than parked at index 0.
2. **The Run works end to end** — `simulateAll` passes on the reference graph.
3. **Its own narration** — a `voice.js` naming this problem's nodes and cases, rendered
   and synced.
4. **Cover art** — prompt authored, image rendered, `src` set, re-seeded.

Then walk it yourself, start to finish. The gate cannot tell you whether a question is
worth asking.

> `npm run smoke` needs a **warm** server — its resume check waits 15s for Home's
> Continue button and flakes against a cold `next dev`. Load `localhost:3000` once
> first. On macOS pass
> `SMOKE_CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`.
