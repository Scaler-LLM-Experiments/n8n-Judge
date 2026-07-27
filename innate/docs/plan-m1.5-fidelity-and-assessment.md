# M1.5 — n8n fidelity + real assessment

> Slots between **M1** (auth + problems from DB) and **M2** (persistence + tracing) in
> `docs/plan-production-platform.md`. Scope agreed 2026-07-27; UX is locked as of this doc.
>
> Grounded in the two research reports: `docs/research/n8n-core-architecture.md` and
> `docs/research/n8n-ai-nodes-and-patterns.md`.

---

## 1. Why this milestone, and why here

Judge is sold as a **grading** tool. Today it cannot fail a learner, and the correct
answer is positionally obvious on every surface that drives the build. Everything below
is measured, not estimated — see §2.

**Why before M2/M3, not after:** M2 builds the trace pipeline and M3 replays traces
through the engine to grade. Both are shaped by *what a session can contain*. Today a
session can only contain a correct graph. If we widen the answer space after M2/M3 are
built, we rework the trace schema, the worker replay, and the rubric. Doing it here is
strictly cheaper.

---

## 2. Evidence

Audited across all three shipped problems.

### 2.1 The answer is always in the same place

| Surface | Items | Correct-option index |
|---|---|---|
| `nodeSetup` fields (the NDV — drives the build) | 25 | **0 → 25/25 (100%)** |
| `dissection` (Understand screen) | 13 | **0 → 13/13 (100%)** |
| `nodeProbes` (wrong-pick MCQ) | 18 | 1 → 16, 2 → 2. **Never 0** |
| `evalQuestions` (Stress Testing) | 6 | 1 → 4, 2 → 2. **Never 0, never last** |

Always clicking the top option scores **38/38** across the two surfaces that gate the
build. On probes, "always pick the second" wins 16/18. **No correct answer anywhere sits
in the last position.**

### 2.2 The answer space is uniform and tiny

- **12 of 16** configurable nodes have **exactly 2 fields**; 1 has 1; 3 have **0**.
- **25 of 25** fields are `kind: 'select'` with **exactly 3 options**. No typed input, no
  expression entry, no booleans, no numbers, no multi-select.
- The 3 Chat Model nodes have **zero** fields — they teach nothing, despite
  temperature ≈ 0 for classification being a headline point in the research.
- The **Settings tab is hard-disabled** (`Ndv.jsx:16` — "nothing there matters for this
  problem"), so On Error / Retry / Always Output Data / Execute Once never appear.

### 2.3 Every probe ships a free correct answer

Every entry in `nodeProbes` ends with an escape option — *"Added it by mistake"* —
flagged `correct: true`, always last. Consequences:

1. Any probe is dodged by clicking the bottom option.
2. `recordDecision` stores a **correct** decision for what was a **wrong node placement**,
   inflating `understandingScore`.
3. No misconception is recorded, so the Report under-reports.

### 2.4 Probe copy redirects to the answer

Verbatim from `email-triage`:

- `chat-trigger` → "…A support inbox needs **an email trigger**."
- `if` → "…You have three categories — **that's what Switch is for**."
- `code` → "…**Let an AI read it** instead."
- `webhook` → "…**use the email trigger**."

Each names the correct node. The probe is meant to surface a misconception; it currently
resolves it for free, then deletes the wrong node.

### 2.5 The rails

Five independent mechanisms hand over the next step:

| Mechanism | Where |
|---|---|
| `pickable` — picker scoped to 4–5 nodes, always containing the answer | `buildPhases[].pickable` |
| `coach` copy names the step | `buildPhases[].coach` |
| `expectedNext` → `awaitingNext` pulse on the next correct slot | `problem.flow` → `N8nEditor` |
| Wrong picks auto-deleted | `BuildStage.jsx:145` `removeNode` |
| NDV is multiple-choice with retry-until-green | `Ndv.jsx` |

### 2.6 Content duplication

`lead-triage` is a structural clone of `email-triage`: identical node types, field keys,
branch count, `buildPhases` ids, and `flow` keys. Only labels differ.

### 2.7 Run narration

`DEFAULT_NARRATION` in `engine/simulate.js` is email-triage-shaped in the *generic
defaults* (`onNew: 'New email from {from}…'`, `switchNoMatch: 'Switch: …'`,
`actionSend: '… sends the reply to {from}'`). `meeting-notes` overrides it; anything that
doesn't inherits email copy. This is a live authoring trap for M5's AI-authored problems.
The narration also only *describes* — it never explains why a step matters.

---

## 3. Part A — Assessment integrity

**A1. Randomize option order.** Shuffle at render for `nodeSetup` fields, `dissection`,
`nodeProbes`, `evalQuestions`. Seed deterministically per `(sessionId, questionId)` so a
reload shows the same order and the admin timeline can reconstruct it. Decisions record
the chosen **value**, never an index — verify no consumer depends on index.

**A2. Add an authoring lint.** `validateProblem()` gains checks that fail CI:
- correct-option index distribution across a problem must not be degenerate
- no option text may be a giveaway (`correct: true` on an "I made a mistake"-style escape)
- minimum field count and option-count variety per node

Without the lint, A1 fixes today's data and the next author reintroduces the bias.

**A3. Widen the answer space** (see Part B for the per-node schema work):
vary field counts per node (1–6), vary option counts (2–6), and introduce non-select
field kinds — typed text, number, boolean toggle, multi-select, expression.

**A4. Remove the escape hatch.** Delete the `correct: true` "added it by mistake" option.
A wrong node placement is a wrong decision; the probe measures *why*. If we keep an
"unsure" affordance it must record as incorrect-with-low-confidence, never correct.

**A5. Assessment mode.** Add a per-assignment difficulty flag: `guided` (today's rails,
for practice) vs `assessed` (rails off, graded). Concretely, in `assessed`:
- full node picker with search, no `pickable` scoping
- wrong nodes **stay on the canvas** — the learner debugs; the trace records it
- `coach` copy drops to goal-level, never node-level
- no `awaitingNext` / next-slot cues
- NDV fields accept typed input where the real n8n param is free-text

---

## 4. Part B — n8n fidelity

**B1. Graph model → real n8n shape.** Move to `connections` keyed by **source node name**,
`main: [[…]]` arrays-per-output, and typed AI connectors (`ai_languageModel`, `ai_memory`,
`ai_tool`, `ai_outputParser`). Nodes gain `name` (unique), `typeVersion`, `position`.
The research doc calls this "the single most load-bearing structure to get right."
**Do this first — B2–B5 and the M2 trace schema all sit on it.**

**B2. AI Agent as a real cluster node.** Root + sub-nodes on typed connectors. Enforce
n8n's actual rules: a Chat Model is required ("A Chat Model sub-node must be connected"),
and the Tools Agent requires ≥1 Tool. Add Memory and Output Parser connectors.

**B3. New root nodes.** Basic LLM Chain (no memory, no tools — the Agent-vs-Chain
distinction is a top-listed misconception), Text Classifier, Sentiment Analysis,
Information Extractor. Text Classifier and Sentiment emit **one output per category**,
which gives us branching without a Switch. Text Classifier's *When No Clear Match:
Discard vs Other branch* becomes a real parameter — it is exactly today's hardcoded
`branch: null` fall-through, promoted to something the learner decides.

**B4. Real NDV.** Three columns: INPUT / Parameters / OUTPUT. **Drag a field from INPUT
into a parameter to generate `{{ $json.field }}`** — the research calls this "the single
highest-leverage interaction to nail." Parameters render from a per-node schema
(string / number / boolean / options / collection / resourceLocator / json), each
toggleable to expression mode.

**B5. Enable the Settings tab.** Real n8n Settings: **On Error** (Stop Workflow / Continue
using last valid data / Continue using error output), **Retry On Fail** (Max Tries, Wait
Between Tries), **Always Output Data**, **Execute Once**, **Notes**. On Error is genuinely
teachable and maps to failure modes the Run can then demonstrate. Settings choices become
gradable decisions like any field.

**B6. Per-node parameter depth from real schemas.** Replace the uniform 2×3-dropdown
shape with each node's actual n8n parameters, e.g.:
- **Gmail Trigger** — Poll Times, Simplify, Max Emails, Filters (Include Spam/Trash,
  Labels, Search, **Read Status**, Sender)
- **Gmail Send** — To, Subject, Email Type, Message + CC/BCC, Attachments, Reply-To
- **Switch** — Mode (Rules vs Expression), per-output rules, **Rename Output**,
  **Fallback Output** (None / Extra / Output 0), Ignore Case, Send to all matching
- **Chat Model** — Model, **Temperature**, Max Tokens, Top P/Top K
- **Structured Output Parser** — JSON Schema

Not every parameter must be learner-facing; the ones that aren't stay as locked context,
which is also what makes the NDV *look* like n8n.

**B7. Catalogue expansion** toward the research doc's ~30-node curriculum shortlist.

---

## 5. Part C — Copy

**C1. Probe copy.** Rewrite every `nodeProbes` entry against three rules:
1. **Never name the correct node.** Explain why *this* choice fails on *this* problem;
   send the learner back to choose, don't choose for them.
2. **Every option is a real position someone holds.** Source distractors from §5 of
   `n8n-ai-nodes-and-patterns.md` (IF-vs-Switch, silent Switch fallback, rules-vs-AI,
   Agent-vs-Chain, poll-vs-event, hardcoding vs `{{ $json }}`).
3. **Uniform depth** — 3–4 substantive options, no escape hatch, correct answer position
   randomized by A1.

**C2. Run narration.** Make `DEFAULT_NARRATION` domain-neutral so an un-overridden
problem never inherits email copy (`onNew: 'New input: …'`, `actionSend: '{targetLabel}
runs.'`). Add per-step *why* alongside *what*, especially at dead ends — an unmatched
route should teach the fallback concept, not just report silence. Drop the raw-JSON
`parse` line in favour of the real INPUT/OUTPUT item view from B4.

**C3. Coach copy.** Rewrite `buildPhases[].coach` to goal-level for `assessed` mode;
keep the current step-level copy for `guided`.

---

## 6. Part D — Problem content

**D1. De-clone `lead-triage`.** Give it its own topology and node vocabulary — the
research doc's pattern table has 20 candidates. Best fit: **Lead Scoring & Routing**
(Webhook → HTTP Request enrich → AI Agent score → Switch → HubSpot + Slack), which
exercises enrichment and an Agent rather than re-running email triage in a sales costume.

**D2. Re-author all three problems** against the widened schema from A3/B6, with the
lint from A2 green.

---

## 7. Grading model changes

Once wrong states persist, `firstTry` stops being the only signal. Extend the rubric:

| Signal | Meaning |
|---|---|
| First-try correctness | Retained, but no longer load-bearing alone |
| Attempts to correct | How many tries per decision |
| Dead-ends entered | Wrong nodes placed and left wired |
| Self-recovery | Fixed without a probe firing |
| Config depth | Correct on non-obvious parameters, not just the required two |
| Settings reasoning | On Error / Retry choices |

This has to land with the M3 rubric seeding, not after it.

---

## 8. Sequencing

```
B1 (graph model)  ─┬─> B2 (cluster agent) ─> B3 (root nodes)
                   ├─> B4 (real NDV) ─> B5 (Settings) ─> B6 (param depth)
                   └─> [M2 trace schema depends on B1]

A1 (shuffle) ─> A2 (lint)          ── independent, ship first, cheap
A4 (escape hatch) ─> C1 (probe copy)
A3 ─ depends on B6
A5 (assessment mode) ─ depends on A3 + C3
D1/D2 ─ last, once the schema is final
```

**Suggested order:** A1 + A2 + A4 first (small, immediately raises the floor) →
B1 → B4/B5/B6 → B2/B3 → A3/A5 → C1/C2/C3 → D1/D2.

---

## 9. Risks

- **B1 is a breaking change** to `engine/`, `n8n/`, every problem's `referenceGraph`, and
  the tests. It is also the thing everything else needs. Sequence it early, land it in one
  pass, keep the engine tests as the contract.
- **`assessed` mode changes what "done" means** in `BuildStage` — phase completion
  currently assumes only correct nodes exist on the canvas.
- **Re-authoring three problems is real content work**, not a code task. Budget it
  separately, and do it after the schema stops moving.
- **No component tests.** Every item here touches rendering. `npm run smoke` after each,
  and the smoke journey-start hole (it always clicks the first card, so `lead-triage` and
  `meeting-notes` Understand screens are untested) should be fixed before this milestone
  starts, not during.
