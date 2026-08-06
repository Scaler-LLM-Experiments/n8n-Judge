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

## 6a. The node library — where to look, and what is safe to pick

**[docs/node-library-catalog.md](../../../docs/node-library-catalog.md) is the menu.** Read it
before choosing a node set; do not work from a list in any other document, including older
sections of this one. The library went from 23 types to **200**, so every inline list is stale by
construction.

Each row gives the **catalog `type`** — the string you write into `nodePalette`, `dissection`
options, `flow`, `buildPhases.pickable`, `nodeSetup` keys and `referenceGraph.nodes[].type`. The
doc opens with a "How to choose" table of recommended node sets per case shape, which is the
fastest way to a sane set.

### Three lists in that file you must not pick from

| List | Why |
|---|---|
| **10 compatibility aliases** | `trigger`, `parse`, `action`, `classify`, `chat-gemini`, `summarize`, `slack-message`, `notion-page`, `calendar-event`, `web-search` exist **only** so the three already-authored cases keep working. New cases use `gmail-trigger`, `edit-fields`, `gmail`, `text-classifier`, `google-gemini-chat-model`, `basic-llm-chain`, `slack`, `notion`, `google-calendar`. |
| **5 deprecated descriptors** | Registered for source parity only. |
| **3 deferred triggers** | Listed but not registered — picking one fails validation. |

### The gate that actually stops a case now

`validateProblem()` requires every configured or executed type to be in the catalog, and with 200
types registered that is rarely the blocker. **The export hard-fails only on a type that is not
registered at all** — `exportWorkflow.js` falls back to `genericNodeSpec()`, which derives n8n
parameters from the catalog descriptor's own `params` plus your authored correct answers, so any
registered type produces a file.

`packages/engine/n8nNodeSpecs.js` is therefore a table of **overrides**, not a whitelist. An entry
exists for the ~14 types where the generic derivation is not faithful enough:

| Needs an override because | Example |
|---|---|
| the real parameter shape is structurally different | `switch` needs `rules.values[]` with `outputKey` + `renameOutput`, which no descriptor implies |
| a value must be a resourceLocator | `google-sheets` needs `documentId` / `sheetName` as `{ __rl }` |
| the node's real n8n identity differs from the catalog's | `classify` exports as `chainLlm`, not `textClassifier` (see the reason in that file) |

**So the duty has moved from "will it export?" to "is the export faithful?"** Generic is not
verified. After choosing a node set, run the export and *read the parameters it produced for your
nodes*:

```bash
npm run workflows:generate -- <slug>
```

If a node's parameters look thin, wrongly-shaped, or would not actually run in n8n, that node
needs an override in `n8nNodeSpecs.js`. `exportWorkflow.test.js` will hold you to a stated reason
if the override changes a node's n8n type.

### Icons and logos are already in the repo — never fetch one

`apps/web/public/node-icons/*.svg` holds the marks, wired through `nodeImageIcons` in
`apps/web/src/nodes/nodeIcons.js`. Verified state: **200 of 200 types render an icon**: 190
catalog descriptors provide local assets (104 image-mode and 86 semantic), six brand aliases
reuse those assets, and four compatibility aliases use Phosphor glyphs. There are **zero broken
file references and zero remote URLs.**

So an authoring run never downloads, generates or hotlinks an asset — everything it needs is on
disk, which is the point of keeping them in-repo. Two consequences:

- If a node renders a blank chip, check its catalog asset and the shared `NodeIcon` path; types
  without a dedicated asset already fall back to their category glyph.
- **Never introduce a remote URL.** It would work in dev and fail behind the login in
  production, and it puts a third-party request on a learner's page.

Adding a genuinely new node type is therefore **three** things: a `packages/catalog/` descriptor
that points at its icon · the local asset in `public/node-icons/` · a row in
`node-library-catalog.md`. Catalog descriptors automatically populate the picker category and the
shared icon map, and the workflow exporter derives parameters from the descriptor — so no
`n8nNodeSpecs.js` entry is needed unless the generic derivation is not faithful (see the gate
above).

**A type may only be defined once.** `NODE_CATALOG` is assembled from `BASE_NODE_CATALOG` +
`CORE_NODE_CATALOG` + `APP_NODE_CATALOG`, and `catalog.test.js` asserts the three are pairwise
disjoint. The guard exists because object spread is last-wins and silent: a `core-nodes/switch.js`
once replaced the hand-authored `switch` and dropped its `branches`, which stopped it resolving as
a router — 15 tests failed, and a learner with a *correct* branching flow could not finish a build
phase.

### A node with more than one output IS a router — plan for it

`isRouterEntry()` resolves a router from an explicit `router` flag, a `branches` list, **or more
than one `main` output**. So `if`, `loop-over-items`, `compare-datasets`,
`sentiment-analysis` and `guardrails` are all routers now, not just `switch`. Derive the list
rather than trusting this one, because it follows from the descriptors:

```bash
# vite-node has no -e flag — write a file, like the decision-count snippet in §5
cat > /tmp/routers.mjs <<'EOF'
import { NODE_CATALOG, isRouterEntry } from '@judge/catalog';
console.log(Object.entries(NODE_CATALOG).filter(([, v]) => isRouterEntry(v)).map(([k]) => k).join(', '));
EOF
npx vite-node /tmp/routers.mjs
```

`filter` is deliberately **not** one: it has a single `Kept` output, because real n8n's Filter drops
non-matching items rather than routing them.

That decides real authoring behaviour, so choose deliberately:

- the Run walks it as a router, taking one output per case;
- **every branch must reach a configured terminal or the build phase will not complete** —
  `branchReach.js` enforces it, walking through passthrough nodes to find one;
- a case that picks a multi-output node and wires only one output has authored a dead end.

If you want a two-way node without routing semantics, do not reach for `if`.

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

**The fix is `nodeSetup[type].sampleOutput`, and most cases need it.** `catalogEntry.output` is
**one sample per type, shared by every case**, so the moment two cases use the same type one of
them is showing the other's data. Author your own and the catalog becomes the fallback:

```js
'form-trigger': {
  sampleOutput: {                       // keys must match the Form Fields you authored
    'Your name': 'Arjun Mehta',
    'Your email': 'arjun@fernwoodrobotics.com',
    'What do you need?': 'Log a new distributor lead — Riya Kapoor …',
  },
  locked: [ … ], fields: [ … ],
},
```

It survives `toPublicProblem()` (only `fields` and `settings` are rebuilt), and it feeds two
surfaces, both of which a learner reads:

- **The next node's INPUT pane, and its `Insert field…` dropdown**, which is built from
  `Object.keys(inputData)`. Get this wrong and **every option in the dropdown is a field that
  does not exist** — the discoverable control writes an answer that can never be right. On
  ops-request-desk the extractor offered trial-signup-desk's `Full Name` / `Plan` / `Referral
  Source` on the exact screen where the learner must write an expression against *this* form.
- **This node's own OUTPUT pane after Verify.** Sheets showed another case's row moments after
  the learner had mapped six columns by hand.

Author one for **every node whose output another node's pane shows** — including the router,
which passes the item straight through — **and for each terminal**, whose Output pane is the only
confirmation the learner gets that their node did the right thing. `{}` is not neutral; it reads
as "this did nothing".

### Adding a catalog type: the descriptor's `category` is authoritative

`packages/catalog/catalog.js` **plus** the icon map in `apps/web/src/nodes/nodeIcons.js`:

- **`category` on the descriptor** — this is what the editor reads. `typeCategory` in
  `nodeIcons.js` ends with `...Object.fromEntries(Object.entries(NODE_CATALOG).map(…node.category))`,
  and **that spread is last**, so for any type the catalog knows about the catalog wins and a
  hand-written line above it is dead code. Adding a line there to "fix" a category does nothing.
  `NodePickerDrawer` *filters* on the resolved map (`typeCategory[n.type] === cat`) rather than
  falling back, so a wrong category makes the type **invisible in the picker** — offered by the
  options list and impossible to click.
- **`nodeIcons`** or **`nodeImageIcons`** — a missing entry renders a blank chip.

**Get the category right for cluster nodes, or the case is unbuildable:**

| Kind | Needs | If wrong |
|---|---|---|
| AI root (`information-extractor`, `text-classifier`, `ai-agent`, `basic-llm-chain`) | `category: 'ai'` **and** `needsModel: true` | `variantOf()` → `'action'`, so the **Chat Model port never renders** and `openPicker({modelSlot:true})` — its only call site — is unreachable. The model cannot be attached and the phase can never clear. |
| Chat model (`openai-chat-model`, `anthropic-chat-model`, …) | `category: 'model'` | Not offered in the Chat Model drawer, and grouped wrongly in the picker. |

This cost a whole authoring run: `information-extractor` and `openai-chat-model` were both
`'core'`, and the case was blocked at the first AI node. **Most of the catalog is still in that
state** — 12 more AI roots and 23 more chat models. Check before designing a case around one.

`catalog.test.js` now asserts both for every catalog type. Also add the type to
`TRIGGER_OPTIONS`/`NODE_OPTIONS` if a case is expected to place it, since those are the picker's
fallback when a phase omits `pickable` — and **declare `pickable` on every phase**, because that
fallback offers only a subset.

### What the engine can and cannot express — check BEFORE writing the spec

Every one of these was discovered *after* a case had been specified around it, and each forced a
redesign. Read this list against your flow before you write anything down.

| You want | Can Judge do it? |
|---|---|
| A branch that does **two** things (write a row *and* send a mail) | **No.** The Run walk ends at the branch's first `action` node. Chaining is worse — see below. |
| One exit feeding two nodes, or two exits feeding one | **No.** The editor has no `onConnect`; every node arrives through the picker, which creates exactly one node and one edge. A learner can never wire two existing nodes together. Fan-out and fan-in are **unbuildable**, not merely unnarratable. |
| A Switch **fallback / catch-all exit** | **No.** A router's exits are exactly the branches you declare. An item matching none hits `switchNoMatch` and the walk dead-ends — it cannot reach any node. Model a catch-all as a **normal declared branch** plus an explicit category the AI is instructed to return (`needs_human`), and teach "unmatched items vanish silently" in Stress Testing instead. |
| Two nodes of the same type, configured **differently** | **No.** `nodeSetup` and `nodeProbes` are keyed by node **TYPE**. Both instances open the same NDV, ask the same question and share one answer key — so a case with "email the subject" and "reply to the requester" grades one of them backwards. Reusing a type is fine only when the config is *genuinely identical everywhere* (email-triage's three `action` instances). |
| Exits that end at **different** node types | **Yes, but you must scope them.** See below. |

**`flow.branchNext` takes two shapes, and picking the wrong one silently weakens the case:**

```js
branchNext: ['action']                                     // every exit accepts the same thing
branchNext: { log: ['google-sheets'], email: ['gmail'] }    // each exit scoped separately
```

The array can only ask *"is this a destination at all?"*. With exits ending at different types
that is not enough: the spreadsheet on the escalation exit is accepted, `allBranchesWired` is
satisfied (it reached *a* terminal), the phase goes green, and the mistake only surfaces later as
a failing Run. **If your exits end at different types, use the record form.** A wrong-exit pick
then gets its own probe — "right destination, wrong exit" is a different mistake from "that is
not a destination", and the generated sequence probe is the wrong question for it.

Also know: `flow.next` is keyed by **type**, so declaring `google-sheets → gmail` puts an "add
next" cue on *every* Sheets node and lets a learner satisfy the same `requiredEdge` by chaining
Gmail onto the wrong branch — a wrong build that passes. That is why chaining two actions is not
the escape hatch it looks like.

### Two more platform gaps a case cannot work around

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

## 6c. Learned the hard way on `ops-request-desk`

Everything here was found by a human **walking the journey**, not by `npm test`, `typecheck` or
`smoke`. All of it looked green until somebody clicked.

### Field names with spaces need bracket notation, and so does your answer key

A form trigger's keys **are the questions the form asked**, so spaces and punctuation are the
norm. Dot notation is invalid for them in real n8n:

```js
correct: '{{ $json["What do you need?"] }}'   // right
correct: '{{ $json.What do you need? }}'      // never valid
```

`expressionFor()` now brackets any key that is not a plain identifier, so the `Insert field…`
picker and drag-and-drop both write the correct form. It used to emit dot notation
unconditionally — which meant the *discoverable* control wrote an answer that could never match,
and the learner had no way to clear the node. Author the bracketed form and it lines up.

### Never grade a `resourceLocator` field

`answerCheck.ts` looks the explanation up with `options.find(o => o.value === answer)` while a
locator answer arrives as `{ __rl, mode, value }`, so **no option ever matches and `why` is
`undefined` on both verdicts** — Iris appears and has nothing to say. Grading also reads
`field.correct`, not `options[].correct`, and `validateProblem()` cannot see either problem. Use
a plain `select` until that lookup unwraps the locator.

### The `statement` is now the Understand hero, so write it as paragraphs

`DissectionScreen` renders the **full `statement`** (not `brief`) at the top of Understand, and
`ProblemNote` / `ProblemStatementPanel` render it with `white-space: pre-line`. So author it in
short paragraphs separated by blank lines — one wall of prose is what it looked like before, and
it reads as a spec sheet. `brief` still owns the Home card, where the 125-char cap and two-line
clamp are the point.

Two leak rules that bit here, on top of §6b's:

- **The statement must not name a tool that is a graded option's label.** It said "the Slack
  channel Priya already watches", and `escalate`'s four options contain exactly one channel tool.
  "the channel Priya already watches" keeps the requirement and drops the answer.
- **Nor may it enumerate an `assignmentList`'s mapping.** Saying *which* of the six columns come
  from the form hands over the answer key to the richest config surface in the case. State that
  they come from two places and that keeping them apart is the job.

### A menu of one is not a decision — offer wrong nodes on purpose

Every picker in this product is a **menu**, and the menu is deliberately *not* the answer key:

| Slot | Menu (what is offered) | Answer key (what is right) |
|---|---|---|
| First step | `TRIGGER_OPTIONS` | `flow.start` |
| Next step | the phase's `pickable` | `flow.next[sourceType]` |
| A router's exit | the phase's `pickable` | `flow.branchNext` |
| Chat Model | **`flow.modelOptions`** | `flow.modelNext` |

A wrong pick is not a failure of the case — it is the case working. The node lands with a red
pulse, Iris travels to it, a probe asks what the learner believed, and the node is removed. That
is where most of the teaching happens, and it cannot happen if the only thing on the menu is the
answer.

**So offer 5–10 plausible alternatives in every slot.** Not filler: nodes a beginner would
genuinely reach for. The Chat Model slot used to list a single model — the hardest "which brain?"
question in a case reduced to clicking the one thing on offer — which is why `flow.modelOptions`
exists. It defaults to `modelNext`, so a case that does not author one keeps the old behaviour;
author it and the choice becomes real:

```js
modelNext: ['openai-chat-model'],                    // the answer
modelOptions: [                                       // the menu
  'openai-chat-model', 'anthropic-chat-model', 'google-gemini-chat-model',
  'mistral-cloud-chat-model', 'groq-chat-model', 'ollama-chat-model',
],
```

`validateProblem()` **errors** if `modelOptions` omits anything `modelNext` grades as correct —
a menu without its own answer is the worst thing this editor can do to a learner, and it has
shipped before — and **warns** if the menu is nothing but the answer.

Two things that make the distractors earn their place:

- **Give the tempting ones a probe.** `nodeProbes` is keyed by type, so an authored probe on
  `text-classifier` or `anthropic-chat-model` argues about *that* node. Without one the learner
  still gets the generated sequence probe, which is generic — fine for a long tail, weak for the
  one wrong answer your §7 misconceptions say most learners will pick.
- **Distractors are unscored except through decay.** A wrong pick costs an attempt on the slot it
  was filling, which is already the right price. Do not also add a scored item for it.

### Say what a phase is still waiting on

A build phase can be blocked by three independent things at once and used to report none of them,
so a canvas that looked finished simply refused to advance. There is a **Still to do** panel now.
It deliberately does *not* name an unplaced node type — that is the graded decision — so it gives
a count; nodes already on the canvas and exits already drawn are named freely. If you add a new
completion condition, add it there too, or you have rebuilt the dead end.

## 6d. Every case owes a real n8n workflow file

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

- **Use node types that have an export spec.** `exportWorkflow.js` falls back to
  `genericNodeSpec()`, so a missing entry does **not** fail `problem:check` or
  `case:verify workflow` — but `packages/engine/exportWorkflow.test.js` ("covers every type any
  reference graph places") is a hard gate and turns red the moment you **register** the case.
  Expect that, and add the specs as part of the case. `information-extractor`,
  `openai-chat-model`, `gmail` and `slack` all had none; the generic fallback also drops any
  answer whose authored key is not the catalog's real n8n key (`sendTo` vs
  `messageSendSendTo`), so it exports an empty parameter rather than a wrong one.
  See §6b, "adding a catalog type", now four files.
- **A clean `workflows:generate` is not evidence the file would run.** It is a structural check.
  Read the emitted JSON and ask whether n8n would actually execute it — `case:verify workflow`
  passed on a file where every item fell to an unwired fallback output.
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
