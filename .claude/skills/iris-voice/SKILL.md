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

### The `shared/` clips already exist — you are not paying for them again

This is the part worth knowing **before** you decide how much to author.

Every moment you leave alone resolves to the generic phrase book, which means it resolves
to a `shared/` file that a previous problem already rendered. Only a moment you author
lands in `<slug>/` and needs new audio. So the cost of a new problem is the lines you
wrote, not the journey.

Snapshot at the time of writing — 2 problems, 980 ids, 236 distinct files:

| | files | its own | `shared/` |
|---|---|---|---|
| `email-triage` | 147 | 106 | 41 |
| `expense-approvals` | 130 | 87 | 43 |
| **distinct across both** | **236** | 193 | **43** |

Sharing removes 41 renders there, and the `shared/` half is ~13% of the characters. A third
problem would pay for roughly its own 85–110 lines and reuse those 43 for free.

Numbers move with every added problem and every reworded line, so re-derive rather than
trust them: `npm run voice:generate -- --dry-run` prints exactly what would be rendered and
what it would bill, spends nothing, and needs no API key.

**What this should and should not change about your writing.** It is not an argument for
leaving `voice.js` empty — a problem that names its own nodes and cases is the point, and
`shared/` lines say "that one" where an authored line says "Send Reply". It *is* an argument
against overriding moments that were never problem-specific in the first place: a bespoke
`phase_complete` costs a render and reads no better than "Right, that part's done." Author
where the problem's own vocabulary earns it, and let the scaffolding stay generic. `welcome`
is the extreme case and is already marked never-override below.

### The paraphrase test: if an authored line is a shared line with a word changed, delete the key

Authoring a moment replaces the shared set **wholesale** — it does not merge. So a paraphrase
bills a render per line *and cuts the variant count*, which is the worst of both.

`trial-signup-desk` authored `probe_correct` and `probe_wrong` as five rewordings each of the
shared eight ("Now put in something that can do this step" for "Now put the right one in"; one
line was byte-identical). That bought **ten renders in exchange for making both moments repeat
sooner**. Deleting both keys was a strict improvement: more variety, better copy, zero renders —
and it took the run's bill from 93 clips to 86 while *raising* speakable lines from 282 to 365.

Before authoring a moment, name the thing in **this problem's** vocabulary that your line says
and the shared one cannot. If there is nothing, the shared line is better, free, and already in
the bucket.

Where a case genuinely needs its own — `trial-signup-desk` grades node *order*, so `node_wrong`
earns the "it isn't its turn yet" framing the shared set cannot express — you must still write
the **whole** rotation, because you cannot mix. So write the rest as genuinely different lines
rather than paraphrasing the set you just replaced. Ten renders should buy ten ideas; that case
shipped ten renders buying about six.

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
| 19a | `stress_correct` `stress_wrong` | Each Stress Testing answer | Per question id. **Never restates the answer** — the written verdict beside the options already explains it, and repeating it is reading the screen. |
| 19b | `probe_correct` `probe_wrong` | Answering the wrong-node probe | Per node type. The learner got here by a mistake, so a right answer is acknowledged and moved on from, not celebrated. |
| 20 | `report_ready` | Result screen | The payoff. Excited. |

A moment with no words is silent and nothing warns you — `phase_intro` shipped with a
mascot animation and no copy for weeks. `voiceCoverage.test.js` walks every play site
and asserts a clip exists, so add there when adding a moment.

**That test's list is maintained BY HAND, and it will pass while lying to you.**
`probe_*` and `stress_*` were wired into the screens, played correctly in the app, and
every test stayed green until they were added to `playSites()`. When you add a moment
you are adding it in **four** places, and missing any one of them fails silently:

1. `LINES` in `voiceLines.js` — the words.
2. `MOMENT_CLIP` — the mascot animation, which plays even when muted.
3. `enumerateSpeakable` in `voiceCatalogue.js` — or the generator never renders it.
4. `playSites()` in `voiceCoverage.test.js` — or nothing checks the other three.

**A moment that carries a `key` must be enumerated per key**, even when its wording
has no `{variable}`. The key is part of the id the browser derives, so a keyed moment
enumerated as a plain one renders `stress-wrong--v3` while the browser asks for
`stress-wrong--retry-vs-error--v3` and gets a 404 for the rest of the session. It costs
almost nothing to do properly: the id carries the key, the FILE is hashed from the
text, and identical text across keys collapses onto one file.

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

### Variants rotate, so write enough of them

Which wording plays is `seed + times already spoken this session`, in `voice.js`:

- the **seed** is per browser session, so two learners open on different wordings;
- the **count** advances on every play, so nobody hears the same sentence twice in a row.

This replaced a seed-only choice, which was stable for the whole session and therefore
identical every time a moment repeated — `node_wrong` and `verify_fail` were the same
recording on the fourth mistake as on the first. Rotating on a **count** rather than at
random is what keeps preloading working: the count only moves when a line is actually
spoken, so `setUpcoming` and the play that follows compute the same index. A random pick
per call made every play a cold fetch, which is why the seed existed in the first place.

**So the number of variants is a design decision, not decoration.** How many depends on
how often the moment can fire in one sitting:

| Moment | Fires | Variants |
|---|---|---|
| `verify_fail` | a dozen+ times | 10 |
| `node_wrong` | once per wrong placement | 10 |
| `probe_*`, `stress_*` | a handful | 8 |
| `phase_complete`, `run_pass` | once or twice | 2–3 is plenty |

A moment that can only fire once needs one good line, not ten mediocre ones.

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

### `run_case` opens on the trigger, every time

Name the thing the learner wired up. "**A customer sends an email saying** the app
crashes when they log in" ties the case to the trigger node sitting on their canvas;
"Their app crashes every time they log in" describes a situation with no visible
connection to the flow they built. The trigger is the whole point of the sentence —
it is why this case is entering *their* graph rather than being a story about a
customer. Applies to whatever the trigger is: a webhook problem says "a transcript
arrives", not "the call ended".

Still no destination — see *Never reveal an answer the learner has not given*.

### A `run_case` line may only describe what that case's own data renders

`sampleCases` carries `from`, `subject` and `category`, and the run card shows those. A person's
name, or any field the case **spec** had and the problem's data does not, is invisible at that
moment — so a line built on it points at nothing while the learner looks straight at the card.

`trial-signup-desk` drafted *"an apostrophe in the name and in the referral"* for a case whose
only rendered name is `ivy.obrien@example.com`. The spec's row 10 said `Ivy O'Brien`; the shipped
`sampleCases` never did. **Author from the problem files, never from the spec document.**

### `verify_params` names the tab and stops

It is the only moment that speaks about a graded field *before* the learner has answered it, and
therefore without that field's own `why` on screen beside it. So it may say which tab is left,
and nothing about the setting.

Never characterise it. *"Its name is misleading"* **is** the answer when the setting is a boolean
whose correct value is the default, because the name is the only argument for the other value.
`SETTINGS_SPEC` already prints the honest hint next to the toggle, and the shared line ("That's
the parameters right. You've got one tab left.") already does the rest, for free.

Watch for the nudge **relocating**: deleted from `verify_params`, it reappeared in
`verify_fail:http-request` — where it is worse, because the rotation cannot tell which field
failed and Settings is locked until Parameters verify green, so it can tell a learner stuck on
the URL to re-read a field they cannot open. **A `verify_fail` rotation on a multi-field node
must be field-agnostic.**

### Nothing spoken on arrival may assert a score

Both quizzes advance on a wrong answer, so `understand_done` plays for a learner who missed half
the questions. *"Four jobs, four nodes, and you named every one"* congratulates that learner for
something they did not do — over an unlocked-types row that may be empty. An arrival line says
**where they are**, never how they did.

### `run_pass` may say the run passed and no more

On a flow with a deliberate gap, *"that's the whole job, done without you"* reads as a claim that
every case survived end to end — which on `trial-signup-desk` is the first Stress Testing answer.
Say the count with its noun and stop: *"All six signups held up in your flow!"*

### Say what a number counts

`run_pass` was "All four of them!" — a count with nothing attached, and if the
learner clicked through the celebration the clip was cut before the sentence that
would have explained it. Put the noun on the number ("All four **test cases**
passed") and put it **first**, so a line that gets cut still lands. Anything a
learner can click past should carry its meaning in the opening clause.

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
- **Quoting a field's `subtitle` in `verify_fail`.** "Look at what this node does to the sheet
  each time it runs" was the Operation field's subtitle word for word. Pointing at the field is
  the job; reciting its label is reading the screen.
- **`voice:generate` rewrites EVERY problem's table, not just the one you name.** That is
  deliberate (a shared line changing is a real change to their tables), but it means the commit
  legitimately touches `packages/voice-scripts/*.json` for problems you never authored — and it
  means **two worktrees must never render narration concurrently.** A catalog change in one
  worktree alters what `enumerateSpeakable` produces, so the tables diverge and the merge reads
  as a broken render rather than a conflict. Render from one worktree, and re-run
  `voice:generate -- --dry-run` after any catalog merge.
- **Editing the shared phrase book bills the next case.** `voiceLines.js` was edited on a branch
  and never re-rendered, so three `shared/idle_nudge` clips were missing — and the next case's
  generate run paid for them. Not a defect, but do not read those characters as over-authoring.

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
