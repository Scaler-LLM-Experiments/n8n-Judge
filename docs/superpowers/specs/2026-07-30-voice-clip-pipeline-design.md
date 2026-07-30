# Voice clips: render once, upload once, read once

**Status:** design, approved 2026-07-30
**Supersedes:** the derived-path scheme in `voicePath.js` / `voiceCatalogue.js` and the
manifest in `voiceManifest.ts`.

---

## Why

Scaler's S3 credentials were flagged after ~1500 calls in a short window, narration was
re-rendering through ElevenLabs during learner sessions, and clips took a visible pause to
start. Four separate causes, all measured against the current code:

1. **The browser and the generator disagreed on every keyed clip.** `BuildStage` plays with
   the node type in `vars.key` ([BuildStage.jsx:280](../../../apps/web/src/screens/BuildStage.jsx#L280)),
   so it requests `…/node-placed--classify--classify-with-ai--v0.mp3`. `enumerateSpeakable`
   keeps `key` beside `vars` rather than in it, so the generator stored that line **without**
   the key segment. Every `node_placed`, `verify_pass`, `verify_fail`, `answer_*` and
   `phase_complete` play therefore missed storage and fell into the route's self-heal:
   one S3 GET (miss) → one ElevenLabs render → one S3 PUT. That is the latency, the vendor
   spend, and a large share of the call volume.
2. **Existence was checked one object at a time.** `generate-voice.mjs` calls `hasClip` for
   all 387 clips on every run, *including `DRY_RUN=1`*. The admin route's `partition()` does
   the same for up to 500 clips at 24 concurrent. Two runs is ~900 requests that render
   nothing.
3. **Different sentences collided onto one path.** 17 paths each hold 2–3 distinct
   sentences, because the composite id omits the key. Learners hear the wrong explanation.
4. **A private bucket cannot be shared-cached.** `Cache-Control: private` means every
   learner's first play of every clip is its own S3 GET. A 60-person cohort is ~18,000.

Measured today: 500 (problem, moment, variant) combinations → 387 stored paths → 17
collisions → 22,917 characters.

## Decisions

| | |
|---|---|
| Phrasing variants | **Kept.** 307 clips, ~19,400 characters, ~25 MB. |
| Where clips live | **Private S3 bucket.** Not committed, not in the image. |
| How they reach a learner | **Authenticated proxy** with a read-through disk cache. |
| Who renders | **A laptop, deliberately.** The app has no vendor credentials in its request path. |
| Vendor | **Deepgram Aura** (`aura-2-helena-en`). An Aura model names the speaker, so model and voice are one setting. |

Workflow, as the stakeholder put it: *generate locally → sync to S3 → the app reads from S3.
Minimal calls, no regeneration.*

## Design

### 1. A committed script table per problem

Replaces derivation. Modelled on `for-emergent`'s `audio-scripts/<caseId>.json`.

```
packages/voice-scripts/email-triage.json
packages/voice-scripts/lead-triage.json
packages/voice-scripts/meeting-notes.json
packages/voice-scripts/order-desk.json
```

```jsonc
{
  "version": 1,
  "problem": "email-triage",
  "renderedWith": "deepgram/aura-2-helena-en",
  "clips": {
    "verify-pass--classify--classify-with-ai--v0": {
      "text": "Yes, Classify with AI is set up right.",
      "file": "shared/verify-pass--a1b2c3d4.mp3"
    }
  }
}
```

Generated from the phrase book and problem data, then **committed**. It is a reviewable
script — you can read everything Iris says for one problem in one file — and it is the single
source of truth the generator, the server and the browser all read.

`file` may point at `shared/…` when no problem authored that wording, so a line every problem
says is rendered once. There is no separate `shared.json` for the client: each problem's table
is complete on its own and simply points wherever the audio lives.

**One function builds the id** (`clipId(moment, key, vars, variant)`), used by the generator
and the browser. Only the readable part is derived; the fingerprint is never computed at
runtime, only looked up. A test enumerates every id the client can produce from real problem
data and asserts each exists in the table, so the two cannot drift.

**How each side gets the table.** The server `import`s the four JSON files directly — they are
committed, small, and static, so the bundler traces them and there is no filesystem read to get
wrong in a container. The browser receives its problem's table **inside the existing
`GET /api/problems/[slug]` response**, added by the route as a `voiceClips` field: it is
the request the journey already makes, it is already authenticated, and it keeps the table
scoped to the one problem being played (~15 KB). No new endpoint, no new fetch, no new auth
surface. The table carries only text the browser already has — `voiceLines.js` is bundled and
`problem.voice` is already served — so this exposes nothing new.

`renderedWith` records the model the fingerprints were computed against. An Aura model *is*
the voice, so changing it changes every fingerprint and correctly re-renders the whole
library; that is the one case where a full re-render *is* right, and it should be deliberate.

### 2. Clip identity = readable slug + content fingerprint

`shared/verify-pass--a1b2c3d4.mp3`

The fingerprint is the first 8 hex characters of a SHA-256 of `(spoken text, model)` — enough that an accidental clash across a few hundred clips is not a practical
concern, short enough to keep the name readable. It buys three things at once:

- **Rewording is self-invalidating.** Clips are served `immutable` with a one-year cache. Under
  a stable filename, editing a line would leave every learner hearing the old audio for a year
  with no way to tell them to clear it. A new fingerprint is a new URL, so reworded lines land
  immediately and untouched lines stay cached.
- **It removes the staleness manifest entirely.** `voiceManifest.ts` exists only to detect
  "the words changed"; the filename now answers that.
- **It makes the ETag free.** The fingerprint *is* the validator, so revalidation never
  touches S3.

Collisions become impossible: two different sentences cannot share a filename, because the
sentence determines the filename.

### 3. Generation — local, and it never touches S3

`npm run voice:generate [problem…] [--dry-run]`

1. Build the table for each problem from the phrase book + problem data.
2. Write `voice-scripts/<problem>.json`.
3. For each distinct `file`, render it **only if that file is absent from the local clip
   directory**. Existence is a stat on local disk. Zero network calls to answer "what is
   missing".
4. Render via Deepgram `POST /v1/speak?model=…`, bounded concurrency, retry with backoff
   on 429/5xx, fail-fast on 4xx. The phrase book's `[warm]`-style tags were ElevenLabs v3
   audio tags; Deepgram would read them aloud, so the tag-free caption is what is sent —
   which also makes the audio and the on-screen text provably identical.

`--dry-run` reports counts and characters and calls nothing.

Local clips live in `.voice-clips/` — the existing `VOICE_CLIP_DIR` default, already
git-ignored. **The durable copy is S3**, so the bucket should have versioning enabled; a fresh
clone re-syncs down rather than re-rendering.

Anything currently sitting in a bucket is orphaned by the new filenames. There is nothing to
migrate: the paths the browser asks for today were never stored, so no learner is losing audio
that was working.

### 4. Sync — one explicit step, no per-object questions

`npm run voice:sync [--dry-run] [--force]`

Uploads local clips to `s3://$AUDIO_S3_BUCKET/$AUDIO_S3_PREFIX/<file>`. What has already been
uploaded is tracked in a local ledger (`voice-clips/.uploaded.json`), so deciding what to
upload costs **zero** S3 reads — the mistake that produced the 387-HEAD runs. `--force`
ignores the ledger.

Objects are written with `Content-Type: audio/mpeg` and
`Cache-Control: private, max-age=31536000, immutable`.

The S3 client supports `AUDIO_S3_ENDPOINT` + path-style addressing, so R2, B2 and MinIO work
without further changes.

### 5. Serving — `GET /api/voice/clip/[...path]`

Authenticated exactly as today. Three properties, in order of importance:

1. **It cannot render.** No TTS client, no key read, no fallback. A clip that is not in
   the bucket is a 404 and the learner reads the caption. This is a deletion, not a config
   flag.
2. **It only asks S3 for paths it knows exist.** At boot the server loads every table and
   builds a set of valid `file` values. A request outside that set 404s **without touching
   S3**, so a stray or malicious URL costs nothing.
3. **It is a read-through cache onto local disk.** On a request: serve from `VOICE_CACHE_DIR`
   (default `.voice-cache`) if present; otherwise one S3 GET, write to disk (temp file then
   rename, so a partial download is never served), then serve. Concurrent first-plays of the
   same clip share one in-flight fetch, so ten learners arriving together cost **one** GET, not
   ten. A failed S3 read is a 404 and a once-per-message log — never a retry loop, because the
   client already degrades to a caption and a retry storm is the failure mode being designed
   out.

Consequences: S3 GETs are bounded by *distinct clips actually played*, ≤307 per container
lifetime, then zero regardless of cohort size. The cache is ephemeral and resets on deploy,
which is correct — fingerprinted filenames mean a stale entry cannot exist.

Response headers: `Cache-Control: private, max-age=31536000, immutable`, `ETag` = the
fingerprint, `Accept-Ranges: bytes`, plus Range support (unchanged).

`private` is deliberate: narration explains correct answers, so it must stay behind login and
out of any shared cache.

### 6. Deleted

- The self-heal render in the clip route, and its reverse-lookup (`spokenTextFor`).
- **`POST /api/admin/voice/generate`** — the 500-HEAD offender. Generation is a laptop job now.
- `voiceManifest.ts` and its tests — the fingerprint replaces it.
- `hasClip`/`clipMeta` as S3 operations, and `writeClip` from any request path.
- `FEATURE_VOICE` as a render gate (nothing renders at runtime). It remains only as the
  client-side on/off switch if still wanted.

`GET /api/voice/diagnostics` is kept but rewritten to answer from the tables and the local
cache, with zero S3 calls.

### 7. Testing

- `clipId()` is stable and total; every id the client can produce exists in the table
  (enumerated from the real registry).
- No two distinct sentences share a `file` — the collision invariant, which today fails 17
  times.
- Changing a line's text changes its `file`; changing nothing changes nothing.
- The route 404s an unknown path with **zero** S3 calls (mocked client, asserted call count).
- N concurrent cold requests for one clip produce **exactly one** S3 GET.
- A cached clip is served with no S3 call at all.
- Existing `voiceScope`/`voiceLines` tests are kept and re-pointed at the table.

### 8. Rollout

1. Land the table, `clipId`, generation and tests. Nothing touches S3; nothing is deployed.
2. Render locally with the ElevenLabs key. Review `voice-scripts/*.json` as a script.
3. `npm run voice:sync` once.
4. Switch the route to table + disk cache; deploy.
5. Delete the old derivation path, the live render and the admin generate route.

Steps 1–2 are safe to do before any bucket exists.

## Non-goals

CDN or signed URLs; regenerating from the deployed app; per-learner or dynamic narration;
changing the phrase book's copy.

## Follow-up noted, not fixed here

`toPublicProblem` does not strip `problem.voice`, and `voiceLines.js` ships to the browser, so
authored `answer_correct:*` lines are already readable client-side. That is a pre-existing
exposure independent of audio, and worth a separate look.
