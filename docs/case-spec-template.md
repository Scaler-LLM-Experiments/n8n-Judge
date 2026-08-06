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

## 4. Node vocabulary

### The menu lives in one place

**[docs/node-library-catalog.md](node-library-catalog.md)** is the list to choose from, and it
is the only list. **200 registered types**, grouped by triggers, app/action nodes, and core /
data / AI building blocks, each row giving the **catalog `type`** you write into this spec and a
one-line description of what the node does. It also carries a "How to choose" table of
recommended node sets per case shape (form intake, email triage, scheduled sync, incoming API,
file pipeline, database changes, app event routing) — start there.

Do **not** work from the node list any older document gives you; the library grew from 23 types
to 200 and every inline list is stale by construction.

### Two rules the catalog itself states

1. **Prefer canonical types. Never pick one of the 10 compatibility aliases.** `trigger`,
   `parse`, `action`, `classify`, `chat-gemini`, `summarize`, `slack-message`, `notion-page`,
   `calendar-event` and `web-search` exist **only** so the three already-authored cases keep
   working. A new case uses the real thing: `gmail-trigger`, `edit-fields`, `gmail`,
   `text-classifier`, `google-gemini-chat-model`, `basic-llm-chain`, `slack`, `notion`,
   `google-calendar`.
2. **Never pick a deprecated descriptor** — the catalog lists five, all retained for
   compatibility only.

### The hard gate

Adding a *new* node type is outside what an authoring run may do, so the one thing that stops a
run here is asking for a node the catalogue does not list. Everything registered is fair game.

You do **not** need to worry about whether a node can be exported to real n8n: every case ships a
workflow file, and the exporter derives n8n parameters from the node's own descriptor plus the
answers you author, so any registered type produces one.

What you *should* know is that "it exported" is not the same as "it would run". A handful of nodes
whose real n8n shape is unusual carry a hand-written override, and a node set built on unusual
nodes may need a new one — which is engineering work, not authoring. The pipeline will say so.

**Nodes this case needs** (the ones that get placed, configured and run) — give the catalog
`type` for each, not the display name:

> `TODO`

**Distractors worth offering** *(optional)* — plausible wrong nodes you want the learner
tempted by, each of which earns a probe explaining what it actually does. A distractor that is
only ever probed and removed needs no export spec, so you have more freedom here.

> `TODO`

> **Notes for the author agent, not for you.** Every build phase must declare its own
> `pickable`: the picker's fallback offers only a fraction of the library, so an omitted
> `pickable` can make a required node unpickable. Icons are already in the repo — see the
> authoring skill — so a new case never needs to fetch or add one.

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
