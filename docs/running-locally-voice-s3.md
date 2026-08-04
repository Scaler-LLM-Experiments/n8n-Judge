# Running locally, and proving voice comes from AWS S3

Written 2026-08-04 while actually doing it on a Mac (Apple silicon), branch
`sudhanva/authoring`. Every command below was run; the environment-specific
gotchas are the ones that actually bit.

**Goal:** render Iris's narration locally, upload it to an AWS S3 bucket, and
*prove* the running app fetches from that bucket rather than from Railway or from
local disk.

---

## TL;DR of the architecture

Voice is **never synthesised at runtime**. Three separate stages:

| Stage | Command | Where it runs | Talks to |
|---|---|---|---|
| Render | `npm run voice:generate` | your laptop | ElevenLabs |
| Upload | `npm run voice:sync` | your laptop | S3 (`PutObject`) |
| Serve | the app | dev server / prod | S3 (`GetObject`), once per clip |

The serving route **cannot** render — there is no TTS client in it and no API key
is read. A clip that was never rendered and synced is a 404, and the UI silently
degrades to on-screen captions.

---

## Part 1 — one-time local setup

### Node 22 is required (Node 20 is not enough)

`npm run db:seed` imports `packages/llm/gradingPrompt.ts` **directly**, relying on
native TypeScript stripping. Node 20 dies with:

```
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts"
```

`CLAUDE.md` says "Node 20+", which is wrong for that script. The Docker image uses
Node 22, so production is fine. Locally:

```bash
brew install node@22          # keg-only: does NOT touch your default node
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
node -v                       # v22.23.2
```

Because `node@22` is keg-only, your existing `node -v` stays whatever it was in
other shells. Export that `PATH` in any terminal where you run these commands, or
add it to your shell profile.

### Install and start Postgres

```bash
npm install
npm run db:up
```

**Port conflicts are likely.** This machine already had:

| Port | Owner |
|---|---|
| 5432 | a native Postgres **and** `business-tech-labs-main-postgres-1` |
| 5433 | `ai-coding-postgres-1` |
| 5434 | `lld-platform-postgres-1` |

Symptom of pointing at an occupied port is misleading — you connect to *someone
else's* Postgres and Prisma reports:

```
Error: P1010: User was denied access on the database `(not available)`
```

The fix is `POSTGRES_PORT` in `.env`, which this repo supports precisely for this.
It is set to **5442** here. If you change it, change `DATABASE_URL` in the same
edit, then recreate the container so the new mapping applies:

```bash
docker compose up -d --force-recreate db
docker port judge-postgres        # must print  5432/tcp -> 0.0.0.0:5442
```

`--force-recreate` is needed because Compose reuses a running container and will
not re-apply a changed port on its own. The volume is preserved.

### Migrate and seed

```bash
npm run db:migrate
npm run db:seed
```

Expected output:

```
programs: 3
batches:  3 (invite codes: AIML-DEMO, DSML-DEMO, SE-DEMO)
problem:  email-triage @ v1 (PUBLISHED)
problem:  expense-approvals @ v1 (PUBLISHED)
rubric:   "Default rubric" @ v1 (created)
```

`db:seed` seeds the rubric inline, so `db:seed:rubric` is only needed for
production (it is the one script that deliberately ignores `.env` and requires an
explicit `DATABASE_URL`, so you cannot seed prod by accident).

### Run it

```bash
npm run dev            # http://localhost:3000
curl -s localhost:3000/api/health     # {"status":"ok","db":"up",...}
```

Sign up at `/signup` with invite code `AIML-DEMO`. The journey is behind auth, and
so is every voice clip.

---

## Part 2 — the AWS-vs-Railway switch

There is exactly one setting that decides this: **`AUDIO_S3_ENDPOINT`**.

```bash
AUDIO_S3_ENDPOINT=""                  # real AWS S3
AUDIO_S3_ENDPOINT="https://…"         # S3-compatible store (Railway, R2, B2, MinIO)
```

Both `voiceCache.ts` and `sync-voice-clips.mjs` do the same two things with it:

```js
endpoint,                              // undefined when empty
forcePathStyle: Boolean(endpoint),     // path-style only for non-AWS
```

So an empty endpoint means the SDK derives the endpoint from `AUDIO_S3_REGION` and
uses virtual-host addressing — i.e. genuine AWS. **Leaving `AUDIO_S3_ENDPOINT`
empty is the whole migration off Railway.**

### Fill these into `.env`

```bash
AUDIO_S3_BUCKET="your-bucket-name"        # name only, no s3:// and no URL
AUDIO_S3_REGION="ap-south-1"              # MUST match where the bucket lives
AUDIO_S3_ACCESS_KEY_ID="AKIA…"
AUDIO_S3_SECRET_ACCESS_KEY="…"
AUDIO_S3_PREFIX="voice-clips"
AUDIO_S3_ENDPOINT=""                      # ← keep empty

ELEVENLABS_API_KEY="…"
```

A wrong region fails with `PermanentRedirect`, not a helpful message.

### IAM policy — deliberately tiny

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET/voice-clips/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET/voice-clips/*"
    }
  ]
}
```

**No `ListBucket` and no `HeadObject` are needed, by design.** Nothing in this
codebase ever lists or probes the bucket — "what needs rendering?" and "what needs
uploading?" are answered from local disk and a local ledger. An earlier version
asked S3 about every clip on every run, which is what got a set of Scaler
credentials flagged. Don't reintroduce that by granting it.

Keep the bucket **private**. Narration explains correct answers, so it has to stay
behind the login; bytes transit the app rather than a CDN.

### Don't change the voice ID casually

A clip's filename contains a fingerprint of `vendor/voiceId/model` plus the exact
sentence. The committed table `packages/voice-scripts/email-triage.json` was
rendered with:

```
elevenlabs/7M69Y78mYqPLZS5ZZSTT/eleven_v3
```

`.env` is pre-set to that voice ID, and it matters — verified this session:

| `ELEVENLABS_VOICE_ID` | Effect on `email-triage.json` |
|---|---|
| `7M69Y78mYqPLZS5ZZSTT` | `unchanged` — the 147 committed filenames still match |
| anything else | `updated` — every clip renamed, whole library re-renders |

---

## Part 3 — render and upload

Always dry-run first. It spends nothing, writes nothing, and needs no API key:

```bash
npm run voice:generate -- --dry-run
```

Current state of this branch:

```
unchanged  packages/voice-scripts/email-triage.json       (533 lines)
updated    packages/voice-scripts/expense-approvals.json  (447 lines)
236 distinct clips across 2 problem(s); 236 missing, 0 already rendered.
17845 characters to bill, of 17845 total.
```

Two things to know about that output:

- **236 clips, ~17.8k characters.** `email-triage` accounts for 147; the rest is
  `expense-approvals`, which has authored narration but has never been rendered.
- **`expense-approvals.json` and `voice-scripts/index.js` are generated and
  tracked**, so a real run produces a git diff. That is expected — it is the
  missing piece from the last commit.

Then render and upload:

```bash
npm run voice:generate            # ~18k chars via ElevenLabs
npm run voice:sync -- --dry-run   # lists what would upload
npm run voice:sync
```

`voice:generate` writes into `.voice-clips/` (git-ignored), four at a time, temp
file then atomic rename. Re-running is cheap: an unchanged line already exists
under the name it would be given, so it is skipped.

`voice:sync` uploads with `CacheControl: private, max-age=31536000, immutable` and
records each success in `.voice-clips/.uploaded.json`. **That ledger is why sync
costs zero bucket reads** — never delete `.voice-clips/` without meaning to lose
it. `--force` rebuilds it by re-uploading everything.

---

## Part 4 — proving it actually came from AWS S3

### The trap that makes a naive test worthless

`voiceCache` searches local disk **before** it asks storage, and one of the
directories it searches is `VOICE_CLIP_DIR` — the folder `voice:generate` just
wrote:

```js
export const clipCache = createClipCache({
  dir: process.env.VOICE_CACHE_DIR || '.voice-cache',
  alsoRead: [process.env.VOICE_CLIP_DIR || '.voice-clips'],   // ← the trap
  fetchObject: s3Fetch,
});
```

That is intentional — it means you can hear your own audition with no bucket at
all. But it also means that **on the machine that rendered the clips, every clip
plays from local disk and S3 is never contacted.** "It plays" proves nothing.

The diagnostics endpoint is explicit about this state:

> `Every clip for this problem plays from local disk (0 cached, 147 rendered here).
> Storage is not being touched at all.`

### The verification script

```bash
npm run voice:verify                        # report only, touches nothing
npm run voice:verify -- --isolate           # the conclusive test
npm run voice:verify -- --restore-only      # put your clips back
npm run voice:verify -- expense-approvals   # a different problem
```

It signs in with the smoke account, reports the storage configuration (flagging
red if `endpoint` is set, i.e. not AWS), then with `--isolate`:

1. **moves** `.voice-clips/` to `.voice-clips.parked` — moved, not deleted, so the
   upload ledger travels with it
2. deletes `.voice-cache/`
3. fetches one clip through `/api/voice/clip/...`
4. re-reads diagnostics and checks whether the **`cached` counter grew**

That counter is the proof: it only ever increases via `s3Fetch`. If it goes up,
the bytes came over the network from `AUDIO_S3_BUCKET`.

A confirmed run prints:

```
CONFIRMED: the bytes came from storage, not local disk.
The cache counter only increases via s3Fetch, and it grew by 1.
Source: AWS S3  s3://your-bucket/voice-clips/email-triage/answer-correct--1d081954.mp3
```

**Restore afterwards:**

```bash
npm run voice:verify -- --restore-only
```

### Two extra checks worth doing once

**Negative control** — the strongest local proof. Temporarily set
`AUDIO_S3_BUCKET` to a name that does not exist, restart `npm run dev`, and fetch
with `--isolate`. You should get a 404 plus this in the server log:

```
[voice] could not fetch clip …
```

Put the real bucket back and the same request returns 200. That rules out any
possibility the bytes came from somewhere local.

**Confirm at the AWS end.** Enable S3 server access logging or check CloudTrail
data events for `GetObject` on the prefix. If Railway is still configured
anywhere, the request will be absent here.

### Reading the diagnostics endpoint directly

```
GET /api/voice/diagnostics?problem=email-triage
```

It makes **no** storage calls, and splits the two numbers that matter:

- `cached` — fetched **from storage** into `.voice-cache/`
- `renderedLocally` — output of `voice:generate` in `.voice-clips/`, probably
  un-synced

For a real S3 test you want `renderedLocally: 0` and `cached` climbing.

---

## Gotchas, collected

| Symptom | Cause |
|---|---|
| `ERR_UNKNOWN_FILE_EXTENSION ".ts"` on `db:seed` | Node 20. Use Node 22. |
| `P1010: User was denied access` | `DATABASE_URL` port is occupied by another Postgres. |
| `docker port` shows no mapping | Compose reused the container; `--force-recreate`. |
| Clip 404s, everything looks configured | Never rendered/synced, or the fingerprint changed after a copy edit. |
| Narration silent, no errors | By design — a missing clip degrades to a caption. Check diagnostics. |
| Every clip plays but S3 shows no traffic | The `alsoRead: ['.voice-clips']` trap. Use `--isolate`. |
| `PermanentRedirect` from S3 | `AUDIO_S3_REGION` does not match the bucket's region. |
| Whole library re-renders unexpectedly | `ELEVENLABS_VOICE_ID` or model changed — it is in every fingerprint. |
| `voice:sync` re-uploads everything | `.voice-clips/.uploaded.json` was lost. |
| `npm run smoke` fails only on `resume` | Timing flake, not a real failure — see below. |

### The smoke `resume` check is timing-sensitive

`resumeCheck` waits 15s for Home's **Continue** button. On a **cold** `next dev`
server the first compile of `/` plus `/api/sessions` can exceed that, and the run
dies with:

```
locator.waitFor: Timeout 15000ms exceeded.
  - waiting for getByRole('button', { name: /^Continue$/ })
```

Observed here: it failed on the very first run against a cold server, then passed
on every subsequent run (verified three times, both with a clean `Session` table
and with 19 leftover rows). **Warm the server first** — load `localhost:3000` in a
browser once — then run smoke. Everything before `resume` passing while only
`resume` fails is the signature of the flake, not of a broken journey.

### Latent: a 0-event session can hide a real resume

Worth knowing because it looks identical to "resume is broken".
`GET /api/sessions` takes the newest `IN_PROGRESS` session **across all problems**
and returns `{ resume: null }` if that one has no trace events — it does not fall
back to the next-newest session that *does* have events.

Reproduced directly: with two open sessions, a newer `expense-approvals` one with
0 events and an older `email-triage` one with 6, the endpoint returned
`resume: null`. Deleting only the empty shell made it immediately return the
correct email-triage resume point with both answered questions.

Nothing is lost — the session and its trace are intact, only the Continue
affordance disappears. To clear shells locally:

```sql
delete from "Session" s
where s.status = 'IN_PROGRESS'
  and not exists (select 1 from "TraceEvent" t where t."sessionId" = s.id);
```

A fix would be to prefer the newest session that has events rather than bailing on
the newest overall. **Not changed here** — which session should win is a product
decision that also touches attempt counting.

---

## What is NOT set up

`.env` leaves these empty because the voice/S3 path does not need them:

- `ANTHROPIC_API_KEY` — Ask-AI, LLM grading commentary, `problem:draft`
- `OPENAI_API_KEY` — `covers:generate` only

Also note `.gitignore` covers `.voice-clips/` but **not** `.voice-cache/` or
`.voice-clips.parked/`. Worth adding if you plan to commit from this checkout.

See [authoring-a-case.md](authoring-a-case.md) for adding new challenges.
