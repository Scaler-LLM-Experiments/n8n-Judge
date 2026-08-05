# Case spec — the brief you hand the authoring pipeline

Copy this file, fill it in, and hand the path to `/author-case`:

```
/author-case docs/case-specs/<slug>.md
```

**This is the only human input to an autonomous run.** Once it starts, the pipeline
writes eight files, renders cover art, renders and uploads narration, seeds Postgres and
opens a draft PR without asking you anything. So the quality of the case is decided
here — a vague spec produces a plausible case that teaches the wrong thing, and nothing
downstream can tell the difference.

Anything you leave as `TODO` the author agent will invent. That is allowed for the
soft fields (marked *optional*) and **blocking** for the rest: the pipeline halts rather
than guessing at identity, node vocabulary or the deliberate gap.

Fill in prose, not JSON. The pipeline turns this into
`packages/problems/<slug>/{meta,dissection,build,nodeSetup,probes,cases,voice,index}.js`.

---

## 1. Identity — permanent, and nothing derives it

| Field | Value |
|---|---|
| **Slug** | `TODO` |
| **Case name** | `TODO` |

The slug must match `/^[a-z][a-z0-9-]*$/` and is **permanent**: it becomes the folder,
`meta.id`, the camelCased export name, every voice clip path, the cover filename, the
`Problem.slug` row and the `?problem=` deep link. Renaming later means a re-render, a
re-generate and a new database row, so pick it once. Nothing derives it from the name.

The case name is the human title on the Home card (`meta.title`).

---

## 2. The scenario

**Who is drowning in what, and what should happen instead?** Two or three paragraphs of
plain prose. Write it the way you would explain the job to the learner — this becomes
`meta.statement`, which the problem panel, the sticky note on the canvas and Ask-AI's
context all read.

> `TODO`

**Why a human would not want to do this by hand.** One or two sentences. This is what
makes a learner care, and it feeds the tagline.

> `TODO`

---

## 3. The shape of the flow

**What starts it?** (an email arrives, a webhook fires, a schedule ticks, someone
messages a chat)

> `TODO`

**What does the AI decide or produce?** Judge has exactly two AI nodes: `classify`
(assign a label) and `summarize` (produce prose). If the job is neither, say so — it may
not be a case this platform can teach yet.

> `TODO`

**Does it branch?** If yes, name each branch and say what belongs in it. Every routing
case in the catalogue routes through `switch`, which is the only node type that carries
branches.

| Branch id | Label | What lands here |
|---|---|---|
| `TODO` | `TODO` | `TODO` |

**Where does each branch end up?** Every branch must reach a configured terminal (a
reply, a Slack message, a Notion page, a doc, a calendar event) — a branch that dead-ends
cannot complete its build phase.

> `TODO`

If the flow is **linear** rather than branching, write "linear" here and delete the
branch table. That is a legitimate shape and it makes for an easier case.

---

## 4. Node vocabulary — pick from these 23, or the run halts

**This is the hard gate.** Adding a node type is a code change in two files
(`packages/catalog/catalog.js` and `apps/web/src/nodes/nodeIcons.js`), which is outside
what an authoring run may do. If this case needs something that is not on this list, the
pipeline **stops and tells you** rather than substituting a near-miss node — a case built
on the wrong node teaches the wrong thing while passing every test.

| Category | Types |
|---|---|
| **trigger** | `trigger` (New Email) · `chat-trigger` (On chat message) · `webhook` (On webhook call) · `schedule` (On a schedule) · `manual` (Trigger manually) |
| **ai** | `classify` (Classify with AI) · `summarize` (Summarize with AI) — both need a model sub-node |
| **model** | `chat-gemini` (Gemini Chat Model) |
| **core** | `parse` (Parse Result) · `switch` (Switch — **the only branching node**) · `if` · `code` · `merge` · `filter` · `remove-duplicates` · `wait` · `http-request` · `web-search` |
| **action** | `action` (Send Reply) · `slack-message` · `google-docs` · `calendar-event` · `notion-page` |

**Nodes this case needs** (the ones that get placed, configured and run):

> `TODO`

**Distractors worth offering** *(optional)* — plausible wrong nodes you want the learner
tempted by, each of which earns a probe explaining what it actually does. A distractor
that is only ever probed and removed does not need a catalog entry, so you have more
freedom here.

> `TODO`

> **Note for the author agent, not for you:** every build phase must declare its own
> `pickable`. The picker's fallback offers only 9 of the 23 types, so an omitted
> `pickable` can make a required node unpickable.

---

## 5. The cases the flow gets tested on

Three to five concrete examples. Write the **input** in the words it would actually
arrive in, and say where it should end up.

| # | What arrives | Where it should go |
|---|---|---|
| 1 | `TODO` | `TODO` |
| 2 | `TODO` | `TODO` |
| 3 | `TODO` | `TODO` |

**The deliberate gap — required, but it depends on the shape above.**

*If the flow branches:* one case must match **no** branch and fall through. This is not an
oversight to be fixed; it is what the Stress Testing screen exists to ask about, and a
branching case without one has nothing interesting to test.

> What arrives, and why no branch claims it: `TODO`

*If the flow is linear:* there is no branch for a case to miss, so a `branch: null` case
would be vacuous. Name the **degraded path** instead — the input that must still complete
without crashing, and what "handled correctly" looks like for it (a blank required field, a
missing upstream value, an item the fetch returned nothing for). That is what Stress Testing
asks about in a linear case.

> The input that stresses it, and what must still happen: `TODO`

---

## 6. Size

| Field | Value |
|---|---|
| **Target difficulty** | `easy` \| `moderate` \| `difficult` — `TODO` |
| **Estimated minutes** | *optional, the pipeline sizes this* |

Difficulty is sized from the real scored-decision count, not from taste, and
`problem:check` will tell you whether the label it produced matches what it built.
Anchors: **≤20 decisions → easy / 15 min**, **21–45 → moderate / 25 min**,
**46+ → difficult / 45 min**. `email-triage` is 30 decisions and authored
moderate / 25 min.

---

## 7. Cover art subject *(optional but recommended)*

Describe the **colour and the motif only** — the shared style lives once in
`scripts/generate-covers.mjs` so the cards look like one set, and it is authoritative. Read it
before writing this, because it forbids more than it allows.

The house style is an **abstract atmospheric poster**: a bright, high-chroma colour field with
heavy film grain and spray-paint noise, and **exactly one** soft-edged geometric motif family
sitting off-centre. Ultra-wide 21:9, full-bleed to every edge. Explicitly **no** isometric
objects, no screens, no computers, no envelopes, no characters, no UI chrome, no text.

So a good entry here is two things: a colour, and one simple shape. The shipped set:

| Case | Colour | Motif |
|---|---|---|
| `email-triage` | electric blue → cyan | one large soft diagonal chevron, upper-left |
| `expense-approvals` | coral → peach | three four-point sparkles, right half |
| `trial-signup-desk` | lime → sunny yellow | a loose lattice of rounded squares, right half |

Pick a colour nobody has used and one motif nobody has used, and say which half of the frame it
sits in. Brightness is load-bearing — muted or near-black reads as a dead tile on a white
catalogue.

> `TODO`

Leave this blank and the run still completes: cover art is deliberately non-blocking, and
a missing image becomes an unchecked item on the PR rather than a failure.

---

## 8. What learners get wrong *(optional)*

The most valuable thing you can put in this file, and the hardest for an agent to invent.
Every wrong option needs a misconception it represents, and every probe has to be a
position a real person would hold.

> `TODO`

---

## 9. Narration notes *(optional)*

Iris narrates the whole journey. She will speak either way — an unauthored moment falls
back to the shared phrase book — so this section is for **this case's own vocabulary**:
the words that make her say "Send Reply" instead of "that one".

Anything she should name, avoid, or never give away before it is asked:

> `TODO`

---

## What the pipeline fills in without asking

So you do not waste time on it: the dissection quiz and its `unlocks`, `flowSummary`
labels, `buildPhases` and their `pickable` lists, every NDV field and its options and
`why` copy, node `settings`, the probes, the reference graph, `sampleCases`,
`evalQuestions`, the ≤125-character `brief`, the tagline, and `voice.js`.

## What it will never do

Register a node type that does not exist · touch `packages/engine`,
`packages/problem-schema` or `apps/web/**` · hand-edit the generated
`packages/voice-scripts/*.json` · merge its own PR.
