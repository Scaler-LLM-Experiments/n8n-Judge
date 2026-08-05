---
name: authoring-a-problem
description: Build a new n8n Judge challenge, or change an existing one — the data model, the enforced rules, the pipeline from empty folder to a problem a learner can be graded on. Use whenever touching packages/problems/**, adding a challenge, or changing a problem's questions, nodes, cases or copy.
---

# Authoring a problem

A challenge is **one plain data object**. There is no per-problem code: the engine, the
grader, the canvas and the Result screen all read the same shape, so authoring is editing
data and the interesting work is pedagogical, not technical.

**Judge is a grader, so an authoring mistake is a correctness bug.** A dropdown whose
"correct" option is wrong marks a learner down for being right. `validateProblem()` and
the test suite catch the mistakes that can be caught mechanically; the rest of this file
is the ones that cannot.

`packages/problems/email-triage/` is the reference. It is the only registered problem, and
it is fully authored — voice, cover art, every field. Read it alongside this.

---

## 1. The pipeline

```bash
npm run problem:new -- <slug> "Title"     # copies _template, sets the slug + export name
# …or start from a draft instead:
npm run problem:draft -- <slug> "what the learner builds, and why"   # Claude, needs a key

# fill in / correct every value, then:
npm run problem:check -- <slug>   # structure, size, answer balance, voice, cover — offline
# register it in packages/problems/index.js   ← registry order IS the catalogue order

npm test                  # validateProblem() runs per problem; copy rules are tests
npm run db:seed           # NOTHING reaches the app until this runs
npm run covers:generate   # OpenAI, laptop-only → apps/web/public/covers/<slug>.png
npm run voice:generate    # ElevenLabs, laptop-only → .voice-clips + committed tables
npm run voice:sync        # upload to the bucket
npm run db:seed           # again, if voice or any problem file changed
npm run smoke             # there are no component tests — this is the real gate
```

**`problem:check` is the one to run constantly.** It needs no database, no dev server and no
API key, so it works on a problem that has never been seeded — which is exactly when you want
it. It reports, in one pass: `validateProblem()` errors and warnings (separating "still a
placeholder" from "wrong", so an unfinished draft is readable); leftover `TODO`s, blocking only
once the problem is registered; the scored-decision count from `enumerateItems` against the
`difficulty` you authored; where the correct option sits across every graded list; how much
narration exists and whether its clips are rendered; and whether the cover art is on disk.
Warnings are judgement calls — read them rather than clearing them.

**`problem:draft` is a first pass at the SHAPE, not a problem.** It gets the field count and
the vocabulary right (the real catalog is in the prompt, so it cannot invent a node type) and
writes the seven files with a banner saying every value is unreviewed. Judge grades learners,
so a plausible-but-wrong `correct` marks someone down for being right: read every option and
every `why` before registering it. Two things about the call, both non-obvious:

- **It does not use structured output.** The problem schema cannot be expressed in the
  supported JSON Schema subset — a zod `.record()` becomes a schema-valued
  `additionalProperties`, which is rejected, and `nodeSetup`, `nodeProbes` and `voice` are all
  records. The schema goes into the prompt as reference text and `problemSchema.safeParse`
  gates the write instead; a draft that fails it is printed, never saved.
- **`max_tokens` covers thinking and output together.** A whole problem is ~10k tokens of
  JSON; at 32k the first attempt spent the budget thinking and stopped mid-object. It runs at
  64k and `effort: medium`, because this is a long mechanical generation against an exemplar
  rather than a reasoning problem.

**The two commands people forget, and what forgetting looks like:**

| Forgot | Symptom |
|---|---|
| `db:seed` | Your edit has no effect at all. Problems are served from Postgres, not from the repo. |
| `voice:generate` after a copy edit | Silence on that line. The clip's filename is a hash of its text, so changing the words changes the filename, and the browser asks for a file that was never rendered. |

---

## 2. The seven files

Each part file opens with the rules that apply to it. In short:

| File | Holds | The thing to get right |
|---|---|---|
| `meta.js` | id, title, statement, brief, difficulty, minutes, cover | `statement` is the FULL brief (the panel and Ask-AI read it). `brief` is the two-line version, capped at 125 chars. |
| `dissection.js` | the Understand quiz | Each correct pick `unlocks` node types for the build. 30% of the score. |
| `build.js` | palette, branches, flowSummary, flow, buildPhases | `flowSummary` labels describe the job in ≤3 words and never name a node. |
| `nodeSetup.js` | the NDV, per node TYPE | Keyed by type, not instance — see the trap below. |
| `probes.js` | wrong-node questions + misconception labels | Never name the correct node. |
| `cases.js` | referenceGraph, testCases, sampleCases, evalQuestions | One `branch: null` case is what Stress Testing is *for*. |
| `voice.js` | Iris's narration | An authored entry REPLACES the phrase book for that moment. |

`index.js` only assembles. A snapshot test asserts the assembled object still equals what
existed before the file was split, which also catches a value renamed in a part file but
not in the assembly.

---

## 3. Field kinds — where the answer lives changes per kind

Most fields are a `select` with one `correct: true` option. The rest are n8n's other
parameter shapes, and each puts the answer somewhere else. Getting this wrong does not fail
quietly: `validateProblem()` checks all of them.

| `kind` | The learner sees | Where the answer lives | Explanation lives in |
|---|---|---|---|
| `select` | a dropdown | `options[].correct` (exactly one) | per-option `why` |
| `text` · `number` · `expression` | a typed input | `correct`, or `accepts: []` for several right answers | `whyCorrect` / `whyWrong` |
| `boolean` | a toggle | `correct: true \| false` | `whyCorrect` / `whyWrong` |
| `resourceLocator` | n8n's "which record?" control | `correct` (or `accepts`) — the **resource**, never the lookup mode used to reach it | `whyCorrect` / `whyWrong` |
| `ruleList` | Switch `rules`, a list they build | `expect.rules[]` | `why.<aspect>.correct` / `.wrong` |
| `assignmentList` | Edit Fields `assignments` | `expect.assignments[]` | `why.<aspect>.correct` / `.wrong` |

**The two list kinds are graded as exactly three items** — `count` / `categories` /
`conditions` for rules, `count` / `names` / `values` for assignments — whatever the learner
builds. A variable-length answer has no option count to decay against, and per-entry scoring
would make the denominator move between attempts. So:

- every aspect needs **both** `why.<aspect>.correct` and `why.<aspect>.wrong` (warned);
- `expect` may only name keys the options offer (**error** — otherwise the right answer is
  unbuildable);
- write the `why` as advice about **one branch**, not a summary of the list: the NDV shows
  each verdict on the row it came from, so "your branch names are wrong" appears next to a
  specific branch.

**Conditional fields: `showWhen`.** A map of other-field-key → accepted values (every key
must match; any listed value satisfies a key), mirroring n8n's `displayOptions.show`. It
changes grading, not only rendering, because n8n's own rule is that a required parameter is
only missing while it is *displayed*: Verify requires only visible fields, the rubric does
not score a hidden one, and a field that becomes hidden has its value **dropped** — n8n
stores only displayed parameters, so keeping it submits an answer to a question no longer
being asked. All handled; `_template/nodeSetup.js` carries the example. No shipped problem
uses it yet, so there is no precedent to copy — only the mechanism.

---

## 4. Rules that are enforced

These fail `npm test`. They are here so you know *why*, not just *that*.

**`flowSummary` labels describe the job, never the node, in three words or fewer.**
The summary is drawn as the "shape of it" sketch on the Understand screen — the same
screen that then asks *which node does each job*. A step labelled `Classify with AI`
hands over the answer to a graded question, in your own words, before the quiz starts.
Write `read and label`. Three words because the sketch wraps at two words per line in a
~96px column, so a four-word label is three lines tall and drags the row out of line —
`read it and label it` reads fine in prose and looks broken here. The router step shows
`N ways` plus a dot per branch, because joining branch names produced a five-line cell.

**`brief` is ≤125 characters.** The cap comes from the narrower of the two surfaces it
appears on: a Home card is 13.5px in a ~440px column and clamps to two lines. Measured,
after 180 was tried and cut mid-word.

**A wrong option needs a misconception code.** Without one it can never reach the report,
so the learner is marked down for a belief nobody names for them.

**Probes need ≥3 options and no escape hatches.** "I clicked it by mistake" lets a learner
skip the teaching, and it is never true — they clicked it because they believed something.

**No `TODO` in a registered problem.** A half-filled copy of the template seeds and renders
perfectly well with `TODO Field Label` on a dropdown, and nothing else complains.

**A probe key must be reachable** — in the catalog, the palette, or some phase's
`pickable` list. A probe on a node the learner can never place is dead copy.

**A misconception code must have an entry in `misconceptionLabels`.** The code is what the
report groups by; an unlabelled one has nothing to print.

---

## 5. Rules that are not enforced, and matter more

**Never park the correct option at index 0.** An audit found it there in 25/25 fields and
13/13 dissection items — a learner who always clicks the top option would have passed.
`apps/web/scripts/verify-option-balance.mjs` reports the distribution; keep it spread.

**`nodeSetup` is keyed by node TYPE, not instance.** Use a type twice and both instances
get the same NDV, grading one decision that may only make sense for one of them. Give each
job its own type unless the same configuration genuinely is right everywhere.
(`order-desk` repeated `action` legitimately: "send the customer a reply" really was the
same setup four times.)

**Write `why` for the wrong options too.** Iris reads back the `why` for the option the
learner actually chose. The wrong ones are where the teaching is.

**Ask about behaviour at the edges, not recall.** The best Stress Testing questions point
at the `branch: null` case, at what a setting changes, or at what happens when something
upstream fails. "Which node routes?" is a dissection question, and it has already been
asked.

**Size `difficulty` and `estimatedMinutes` from the real decision count**, not from taste.
`enumerateItems` returns the four buckets the rubric scores, which is the same count the
learner actually works through:

```bash
cat > /tmp/count.mjs <<'EOF'
import { enumerateItems } from '@judge/engine/rubric.ts';
import { problems } from '@judge/problems';
for (const [id, p] of Object.entries(problems)) {
  const g = enumerateItems(p);
  const counts = Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.length]));
  console.log(id, Object.values(counts).reduce((a, b) => a + b, 0), counts);
}
EOF
npx vite-node /tmp/count.mjs   # vite-node, not tsx — the packages ship raw TS
```

Anchors: **email-triage is 30** (5 understand, 6 placements, 17 config, 2 stress) and is
authored `moderate` / 25 min. The retired problems bracketed it — 14 was easy / 15 min,
61 was difficult / 45 min.

**Every node type must exist in `@judge/catalog`** if it gets configured or executed.
A genuinely new node type also needs a `nodeIcons.js` mapping. Distractors that are only
ever probed and removed can live outside the catalog — `validateProblem()` warns.

---

## 6. Voice and cover art

Voice has its own contract: **read `.claude/skills/iris-voice/SKILL.md`** before writing a
line. The three things that bite hardest:

- an authored entry **replaces** the generic phrase book for that moment, so a single
  string means no rotation and it repeats verbatim — give frequently-fired moments
  (`verify_fail`, `node_wrong`) several variants;
- `run_case` opens on the **trigger** ("a customer sends an email saying…") and never
  names the destination;
- a copy edit means `voice:generate` **and** `db:seed`.

**A moment you do not author costs nothing to voice.** It falls back to the phrase book,
which resolves to a `shared/` clip an earlier problem already rendered — so a new problem
only bills for the lines it wrote itself (~85–110, against ~43 reused). That is a reason to
author where this problem's own vocabulary earns it and to leave the journey scaffolding
(`phase_complete` and friends) generic — not a reason to ship an empty `voice.js`, since
naming this problem's nodes and cases is the point and is part of done. `npm run
voice:generate -- --dry-run` prints the real cost before you spend it.

Cover art: author `coverImage.prompt` (wide, sparse, left-to-right — the slot is 2:1),
run `covers:generate`, then set `src`. The prompt is production material and is stripped
at the API boundary; it never reaches a browser.

---

## 6b. Learned the hard way on `trial-signup-desk`

The first case authored end to end by the `/author-case` pipeline (2026-08-05, PR #3). Every
item below is a defect that shipped into a review, or a platform gap it exposed. None was
caught by a test at the time; some are now.

### Never print a graded answer where the learner can read it

This is the same rule as the `flowSummary` labels in §4, but it leaks through **six** surfaces
and the review found it in four of them at once. The case graded "which Sheets operation?" while
the answer, `Append Row`, was printed in:

| Surface | Why it leaks |
|---|---|
| the **catalog `label`** | it is the node's caption on the canvas |
| the problem's **`nodePalette` label** | the picker shows it before the field is answered |
| a **`dissection` option label** and its **`explanation`** | read before the build starts |
| **`referenceGraph.requiredLabel`** | display-only today, but client-visible |
| a **`testCase` description** | on screen in the Run checklist |
| the catalog entry's default **`params` value** | inert today, one renderer away from live |

**So: before authoring a graded field, grep the whole repo for its correct value.** A node's
label must name the node, never the operation a case might grade — `Google Sheets`, not
`Google Sheets — Append Row`.

### A `why` must not be verbatim a Stress Testing answer

The `executeOnce` setting's `why.true` said, in substance, "send thirteen signups through with
this on and twelve never reach the sheet" — which was the answer to the edge-case question worth
~6.7% of the score. Two separate defects: only a learner who got the setting **wrong** sees that
text, so it *rewards the earlier mistake*; and the concept is then scored twice, which is exactly
why §5 leaves probes unscored. Explain the mechanism and ask a guiding question; leave the
consequence to be derived.

### The `statement` must not answer a Stress Testing question either

Same rule, one surface up. This case's statement said "a blank must still produce a logged row
and a welcome email, never a stopped run" — the first stress question's correct option in the
author's own words, sitting on the sticky note for the whole session and inside Ask-AI's context.

State the **requirement** the learner must meet ("blanks are allowed in and must not stop the
run"); never the **behaviour** the question grades ("the row lands with an empty cell and the
mail still goes out"). The brief sets the job; the edge-case quiz tests whether they can predict
what the job produces.

### Check the facts in your `why` copy

A wrong-option `why` claimed a reversed FX request would "fill the column with something like
0.012". It would not — `?from=INR&to=USD` returns `rates: { USD }`, so a mapping reading
`rates.INR` yields a **blank** cell. The teaching point (it fails silently, with no error)
survived; the stated symptom was simply false, and a learner who tried it would have seen
something else. **If a `why` predicts an observable outcome, verify the outcome.**

### Zero at index 0 is also a pattern

§5 says never *park* the correct option at index 0. Following that literally produced 0 of 15
lists with the answer on top — the inverse tell, and just as learnable. Aim for the uniform
expectation (`{0:4, 1:4, 2:4, 3:3}` across 15 lists here), not for absence. `problem:check`
prints the distribution.

### A linear case has no `branch: null` gap — name the degraded path

`branch: null` means "matched no branch". A flow that declares no branches has nothing to miss,
so **every** sample case carries `null` and the convention says nothing. `validateProblem()`
warns and that warning is correct; the warning is not the gap.

The gap in a linear case is the input that must still complete **without stopping the run** — a
blank required field, a missing upstream value. Author the edge-case questions against that.

### Sample I/O is a chain, not a per-node fact

`catalogEntry.output` is what the **next** node's NDV Input pane displays, so it reads as a claim
about what the previous node really returned. Two failures found here, both grading-relevant:

- `http-request.output` still held a deleted problem's `{ order: … }` payload, so on the Google
  Sheets screen the pane asserted **a different API's response** — on the exact screen teaching
  the learner to read the FX response, contradicting the field's own subtitle.
- `google-sheets.output` was `{ ok: true }`, so the downstream email node's Input pane contained
  **none of the `$json` fields its graded options reference**. A learner reading the pane could
  rationally conclude no option resolves and pick a hardcoded address — defensible from what
  they were shown, and marked wrong.

**When a case puts a node mid-chain for the first time, walk the Input pane of every node after
it.** Judge's model is that the item accumulates fields; each `output` has to be consistent with
that or the pane teaches the opposite of the field.

### Adding a catalog type is three files, not two

`packages/catalog/catalog.js` **plus** two maps in `apps/web/src/nodes/nodeIcons.js`:

- **`typeCategory`** — `NodePickerDrawer` *filters* on it (`typeCategory[n.type] === cat`) rather
  than falling back, so a missing entry makes the type **invisible in the picker**: offered by
  the options list and impossible to click. `remove-duplicates`, `wait` and `http-request` were
  all in that state and nothing caught it.
- **`nodeIcons`** or **`nodeImageIcons`** — a missing entry renders a blank chip.

`catalog.test.js` now asserts both for every catalog type. Also add the type to
`TRIGGER_OPTIONS`/`NODE_OPTIONS` if a case is expected to place it, since those are the picker's
fallback when a phase omits `pickable` — and **declare `pickable` on every phase**, because that
fallback offers only a subset.

### Two platform gaps a case cannot work around

Know these before designing a flow around them:

- **`simulate.js` ends the walk at the first `action`-category node.** So a linear flow with
  **two terminals in series** — "log it *and* notify" — narrates only up to the first, and the
  second never lights up during the Run. `google-sheets` is category `action`, so a
  log-then-email flow hides the email. Order the chain so the more important artefact is first,
  and know the later node's `simulation` copy is dead.
- **Judge's expressions accumulate; real n8n's HTTP Request replaces the item.** Every shipped
  case relies on accumulation (`$json.from` two nodes downstream of the trigger), and Judge has
  no node-reference syntax at all. Putting an HTTP Request mid-chain makes the divergence visible.
  Stay consistent with the platform; do not invent `$('Node').item.json` in one case.

## 6c. Every case owes a real n8n workflow file

A learner who scores **80 or more** is offered the case's flow as a file they import into their
own n8n and run. So a case is not finished until it exports one.

```bash
npm run workflows:generate -- <slug>     # writes packages/problems/<slug>/workflow.n8n.json
npm run workflows:generate -- --check    # CI: fails if any file is stale or invalid
npm run case:verify -- workflow <slug>
```

The file is **generated, never authored** — from `referenceGraph` plus the correct answers in
`nodeSetup`, by `packages/engine/exportWorkflow.js`. It is committed anyway, for three reasons:
it is the case's answer key expressed as something that *runs*, so a diff on it is the clearest
signal that an authoring change altered the flow's behaviour; it is the CI gate; and it is what
you drag into n8n to test, with no dev server or session needed.

**What this asks of you as an author:**

- **Use node types that have an export spec.** `problem:check` and `case:verify workflow` both
  fail on a type with no entry in `packages/engine/n8nNodeSpecs.js`. That is deliberate: a partial
  export is a file that imports into n8n and then does not work, which is worse than no file. If a
  case needs a new type, the spec is part of adding it — see §6b, "adding a catalog type is three
  files", now four.
- **A `valueOptions` label should be a real n8n expression.** The exporter resolves each
  `expect.assignments` token back through `valueOptions` to that option's **label**, because the
  token (`form.name`) is a Judge id and the label (`{{ $json["Full Name"] }}`) is the thing the
  learner actually picked. A label that is prose instead of an expression exports as a literal
  string and silently writes that prose into the spreadsheet cell.
- **Do not hand-write expressions for real n8n lineage.** Author them in Judge's accumulating
  model, as every case already does. The exporter rewrites them: it walks the chain, and any field
  the immediate predecessor does not produce becomes `$('That Node').item.json['field']`. This is
  the fix for the accumulate-vs-replace divergence that both case reviews raised — real n8n's HTTP
  Request *replaces* the item, so `$json["Full Name"]` after it is undefined and the cell lands
  empty. The catalog's `output` samples are the source of truth for which node produces what, which
  is one more reason a stale sample (§6b) is a real bug.

## 7. Definition of done

A problem is finished when all four are true:

1. **The gate is green** — `npm test`, `npm run typecheck`, option balance spread,
   `npm run smoke` clean on its screens.
2. **The Run works end to end** — `simulateAll` passes on the reference graph, so the
   Build stage has something real to animate and Stress Testing can reference true
   outcomes.
3. **It has its own narration** — a `voice.js` that names this problem's nodes and cases,
   rendered and synced. Without it the problem still speaks, entirely from the generic
   phrase book, which is why the retired problems sounded flat.
4. **It has cover art** — prompt authored, image rendered, `src` set.

Then walk it yourself, start to finish. The gate cannot tell you whether a question is
worth asking.
