---
name: iris-voice
description: Author or change Iris's spoken narration for an n8n Judge problem — the voice pipeline, the copy rules, and how to render and ship clips. Use whenever touching anything under voice*, packages/voice-scripts, a problem's `voice` block, the phrase book, or when adding narration to a problem that has none (lead-triage and meeting-notes currently have zero).
user-invocable: true
---

# Iris's voice

Everything below was learned the hard way on `email-triage`. `order-desk` has 53
authored lines written before these rules and needs a pass. **`lead-triage` and
`meeting-notes` have zero and run entirely on the generic phrase book.**

Read this before writing a single line. The copy rules are enforced by tests, and the
architecture rules exist because breaking them cost real money and got a set of AWS
credentials flagged.

---

## 1. The architecture, and why it is not negotiable

**Render once, on a laptop. Store. Serve the file. Nothing renders at runtime.**

The previous pipeline called the TTS vendor *during a learner's session* and asked S3
about clips one object at a time. Two generate runs was ~800 requests that produced no
audio, Scaler's S3 keys were flagged, and every line a learner heard cost a vendor call
and a visible pause. So:

| Rule | Why |
|---|---|
| The serving route **cannot** render | There is no vendor client in it. A missing clip is a 404 and the learner reads the caption. |
| The route **cannot** ask storage for an unlisted file | Every legitimate name is in a committed table, checked before any network call. A stray URL costs nothing. |
| The route **cannot** ask twice | `voiceCache` keeps one copy per container on disk and collapses concurrent misses into one fetch. |
| Deciding what to render or upload **never** touches S3 | Answered from local disk and a local ledger. |

### Commands

```bash
npm run voice:generate -- --dry-run          # what would change; calls and spends nothing
npm run voice:generate -- email-triage       # write tables, render only what is missing
npm run voice:generate -- email-triage --prune  # also delete clips no table refers to
npm run voice:sync                           # upload to the bucket (S3, not wired to prod yet)
```

`npm run db:seed` is **also required** after editing anything in a problem file —
problems are served from Postgres, so a copy edit does not reach the app until you
reseed. Forgetting this looks exactly like a broken render.

### Vendor

`VOICE_VENDOR=elevenlabs` (default), `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`,
`ELEVENLABS_MODEL_ID=eleven_v3`. Deepgram is still supported (`VOICE_VENDOR=deepgram`)
and its clips have different filenames, so both libraries coexist and switching back is
config, not a migration.

**Use v3.** It is the only model that acts on the `[tags]`, and the tags are how emotion
is produced.

### Where clips live

`.voice-clips/` locally (git-ignored). The app serves from there in development. In
production they come from S3 through `/api/voice/clip`, which is **authenticated and
`Cache-Control: private`** — narration explains correct answers, so it must stay behind
the login and cannot sit in a shared cache. Future work is a CDN, which needs signed
URLs first.

### The tables

`packages/voice-scripts/<problem>.json` — **generated and committed.** They are the
contract three places read: the generator (what to render), the server (which files it
will fetch), and the browser (which file to play). Never hand-edit them.

Two halves of a clip's name, and the distinction matters:

- **the id** (`verify-pass--classify--classify-with-ai--v0`) identifies a *moment*. It
  is derived at runtime by the browser and must be unique.
- **the `file`** (`shared/verify-pass--a1b2c3d4.mp3`) identifies a *sentence*. The hash
  covers vendor, voice, model and text. It is **never** derived at runtime, only looked
  up.

Many ids point at one file, and that is the saving. A line no problem authored lives in
`shared/` and is rendered once for the whole catalogue rather than once per problem.

---

## 2. The journey, in order

Every one of these exists. When adding narration to a problem, author against this list.

| # | Moment | When | Notes |
|---|---|---|---|
| 1 | `welcome` | The "Hi, I'm Iris" screen | **Generic. Never override per problem.** Saying hello is the same job every time; a problem hook here made the screen introduce Iris while Iris introduced the problem. |
| 2 | `problem_intro` | The statement screen | Three beats: we're starting / what the problem is / what to do. |
| 3 | `understand_start` | First question | |
| 4 | `answer_correct` `answer_wrong` `answer_wrong_again` | Per dissection question | Author per question id. |
| 5 | `idle_nudge` | Learner has gone quiet | An offer, never a prod. |
| 6 | `understand_done` | "You've got the plan" screen | Spoken on **arrival**, not on the button that leaves. |
| 7 | `build_start` | Canvas opens | |
| 8 | `phase_intro` | Each build phase opens | Per phase id. |
| 9 | `node_placed` | A node is dropped | Per node type. |
| 10 | `node_wrong` | Wrong node placed | Never names the right one. |
| 11 | `verify_params` | Parameters green, Settings still to do | Acknowledges. **Does not celebrate** — the node is not finished. |
| 12 | `verify_pass` | The node is **fully** set up | **This is the win.** Name what the learner just made work. |
| 13 | `verify_fail` | Not right yet | Points at which field, never at the value. |
| 14 | `phase_complete` | A phase finishes | Per phase id. |
| 15 | `build_complete` | The whole build finishes | Fired with the LAST phase's id. |
| 16 | `run_start` | Run begins | Frame it as checking *their* build. |
| 17 | `run_case` | Each test case enters | Per sample case id. Describe the **input**, never the destination. |
| 18 | `run_pass` `run_fail` | Run verdict | |
| 19 | `stress_start` | Stress Testing opens | |
| 20 | `report_ready` | Result screen | The payoff. Excited. |

A moment with no words is silent and nothing warns you — `phase_intro` shipped with a
mascot animation and no copy for weeks. `voiceCoverage.test.js` walks every play site
and asserts a clip exists, so add there when adding a moment.

---

## 3. The copy rules

Tests enforce most of these. They are in `voiceLines.test.js`, each problem's
`index.test.js`, and `validateProblem()`.

### Use contractions. Always.

All 99 lines once avoided them: *"It is watching the inbox now"*, *"Let us see"* — while
the screen underneath said *"I'm your mentor"*. The writing contracted everywhere except
the one place spoken aloud. **Nobody has ever said "let us see".**

### Short, but complete. Never clipped.

`"You've got one tab left"` is barely longer than `"One tab left"` and sounds like a
person rather than a status readout. Fragments are what make narration mechanical.

### Keep the "hmm"s and "ah"s.

A one-word sentence is a problem when it is a **status** — `"Set."` `"Done."` `"There."`
is a machine reporting. It is the opposite when it is how people talk: **"Hmm.", "Ah.",
"Yes.", "Right.", "Exactly."** are acknowledgement and hesitation, they are why Iris
sounds like someone in the room, and they are deliberate. **Do not tidy them away.**

Place them where a person would actually hesitate: before delivering bad news, and when
noticing something. Roughly a third of lines, not all — a marker on every line is as
mechanical as none.

### Word cap is per moment

**26 words on an arrival** (`welcome`, `problem_intro`, `understand_start`,
`understand_done`, `build_start`, `build_complete`, `stress_start`, `report_ready`),
**22 everywhere else.** The cap stops a line outlasting the moment it describes, which
is a real risk mid-task; on a transition the learner has just landed and is reading, so
orienting them properly is worth the extra second.

### Exclamation marks: seven moments only

`welcome`, `understand_done`, `phase_complete`, `build_complete`, `run_pass`,
`stress_start`, `report_ready`. Never stacked (`!!` fails a test). Everywhere else a
"!" reads as cheerleading by the fifth hearing.

### Celebrate on a ladder

| Moment | Times per session | Energy |
|---|---|---|
| A field verifies | ~19 | none. The green tick is the feedback. |
| A node is fully set up | 6 | a real, specific win |
| A phase completes | 3 | warm |
| Build done / run passes | 1 each | the payoff |

### Never reveal an answer the learner has not given

Narrower than "never name a node". Naming what they just *did* is the difference between
a person and a screen reader. What must never happen is naming the answer to a question
still open. `run_case` on the case that matches no rule must point at it
(*"keep an eye on this one"*) and stop — the destination is the Stress Testing answer.

### Do not read the screen

The phase label, the statement and the explanation are all visible. Iris says the thing
that is **not** written down, or she says nothing.

### No em dashes

They do not read aloud.

---

## 4. The v3 tags — measured, not assumed

Rendered the same words each way against the production voice:

| | vs baseline |
|---|---|
| `[pause]` inline | **+0.95s** — a real beat. This is how you pause on v3. |
| an ellipsis `...` | **−0.46s** — does *not* pause. Reads slightly faster. |
| `[cheerfully]` | −0.35s, lifts and quickens |
| `[excited]` | −0.23s, lifts |
| `[warmly]` | −0.57s, softens |

**None are read aloud, so a tag is safe.** Two things follow:

1. **Pacing tricks do not transfer between vendors.** On Deepgram there are no tags and
   punctuation is the only lever, where fragmenting a sentence slowed delivery ~24%. On
   v3 the ellipsis does nothing and `[pause]` is the mechanism.
2. **`[laughs]` is deliberately unused.** It moved duration only 0.22s — too little to
   tell an executed laugh from a swallowed one without listening, and a misfire is a
   strange noise in a learner's ear.

Every line must open with a tag (`/^\[[a-z]+\]/`) — a test requires it. `captionFor`
strips tags, so the caption a learner reads is always clean.

---

## 5. Traps that have actually bitten

- **Changed a line and did not render.** The fingerprint changes, so the file name
  changes, so the browser asks for something that does not exist. Run `voice:generate`.
- **Changed a problem file and did not reseed.** Problems come from Postgres.
- **Two places speaking one event.** The NDV had `speakVerdict` *and* a second call in
  the results handler, both firing every verify, so Iris said "that's done" twice per
  node. There must be exactly one speaker per event.
- **Deriving a path on both sides.** The browser and the generator each computed clip
  names and drifted, so every authored per-node line was silent. Ids come from one
  shared function; files come from the table. Never rebuild a file name.
- **`speakingVars`** decides which variables belong in an id — only the ones the
  resolved wording actually interpolates. An authored line that names the node in prose
  must not carry the node in its id.
- **Playing a line from the handler that leaves a screen.** `goTo` stops narration on a
  screen change, so the line is started and cut in the same instant. Speak on arrival.
- **React StrictMode.** A cleanup calling `voice.stop()` fires a fraction of a second
  after mount, and child effects run before the parent's, so the first line of the
  session was killed before a word came out. `VoiceContext` defers the stop by a tick.

---

## 6. Checklist for giving a problem its voice

1. `npm run voice:generate -- --dry-run` first. Know the character count before spending.
2. Read the problem: statement, `dissection`, `buildPhases`, `nodeSetup`, `sampleCases`.
   The copy has to name real things.
3. Author the arc in §2 order. Every `verify_pass` names what that node now *does in
   this flow*; every `verify_fail` names which field to look at.
4. `npm test` — the copy rules are tests, not suggestions.
5. `npm run voice:generate -- <problem>` then `npm run db:seed`.
6. Verify the clips actually serve, not just that the table looks right. Request each
   file through `/api/voice/clip` with a session cookie.
7. **Listen.** No test can tell you whether `[excited]` sounds different from `[calm]`.
