# Case spec — TerraTrek Gear, Free-Trial Signup Desk

Adapted from `docs/sample cases/q1-no-ai-signup-desk.md` for the `/author-case` pipeline.
Revision 2, 2026-08-05.

**Two deliberate departures from the source document**, both agreed before authoring:

1. **`google-sheets` and `form-trigger` now exist** in `packages/catalog/catalog.js` (added
   2026-08-05 for exactly this case), so the node vocabulary the source asks for is available.
2. **The graded hazards are reframed.** The source grades a *real* n8n run: it POSTs 13 rows to
   a live webhook and reads a real Google Sheet back, so it can check byte-level fidelity —
   accents, CJK, apostrophes, embedded newlines surviving a real write. **Judge is a simulator
   that grades decisions, not executions**, so it cannot check any of that. What it *can* grade
   is the decision underneath every one of those hazards: **which incoming field goes under
   which column**, **which path in the FX response holds the rate**, and **what the flow does
   when a field is blank**. That is the same teaching, asked in the form this platform can mark.

---

## 1. Identity — permanent, and nothing derives it

| Field | Value |
|---|---|
| **Slug** | `trial-signup-desk` |
| **Case name** | TerraTrek Gear — Free-Trial Signup Desk |

---

## 2. The scenario

TerraTrek Gear runs free-trial signups through a web form. Every signup should be logged to a
spreadsheet automatically; the current USD→INR reference rate should be fetched live and stored
alongside it, so the team can quote local pricing; and the new user should get an instant
welcome email. All of it with zero manual work.

Four fields arrive per signup: `Full Name`, `Email`, `Plan` (Basic / Plus / Pro) and
`Referral Source`. The referral text is messy — people write commas, quotes, apostrophes, whole
sentences and other alphabets into it — and it has to land in its own column rather than
spilling into the next one. Names and referral text can also be blank, and a blank must still
produce a logged row rather than stopping the run.

**Why a human would not want to do this by hand.** Someone is currently copying names and
emails off form submissions into a spreadsheet, looking up an exchange rate, and typing a
welcome email — for every single signup, and getting the columns wrong whenever somebody's
answer contains a comma.

---

## 3. The shape of the flow

**What starts it?** A signup form submission — the `form-trigger` node, publishing a form that
captures the four fields.

**What does the AI decide or produce?** **Nothing. This case has no AI step at all** — the
source calls it the beginner "5 core nodes" build. It is field-mapping plus one external fetch.
This is deliberate: it is the case a learner meets before any AI node.

**Does it branch?** **Linear.** The source states explicitly: "There is no data-cleaning and no
branching in this task."

**Where does it end up?** Two terminals, both of which must fire for every signup: a row
appended to the `Signups` sheet, and a welcome email sent to the person.

The order matters and is worth grading: the FX fetch has to happen **before** the row is
appended, because the row carries the rate.

---

## 4. Node vocabulary

All five are now in the catalog:

| Stage | Node | Type | Purpose |
|---|---|---|---|
| 1. Trigger | On form submission | `form-trigger` | Publishes the signup form, captures the four fields |
| 2. Enrich | HTTP Request | `http-request` | `GET https://api.frankfurter.app/latest?from=USD&to=INR` |
| 3. Log | Google Sheets — Append Row | `google-sheets` | One row per signup to the `Signups` sheet |
| 4. Notify | Send Reply (Gmail) | `action` | Welcome email personalised with name + plan |

**Distractors worth offering** — each is a plausible wrong pick with a real misconception
behind it:

- `webhook` — "a form is just an HTTP call, isn't it?" The source itself uses a Webhook as its
  grading entry point, which makes this genuinely tempting. The distinction worth teaching: a
  webhook receives a body somebody else designed; a form trigger **owns its own fields**, which
  is what makes them mappable downstream.
- `google-docs` — "log it" sounds like a document. It has no columns, so nothing can be mapped
  under a heading.
- `code` — "I'll just write JavaScript to do the mapping", the reflex the whole no-code lesson
  exists to unlearn.
- `switch` — reaching for a router in a flow that has nothing to route.

---

## 5. The cases the flow gets tested on

The source's full 13-row dataset. Every row must land all four fields in their own columns with
a populated numeric `USD_INR_Rate` **identical across the whole run**.

| # | Full Name | Plan | Referral Source | What it tests |
|---|---|---|---|---|
| 1 | Aarav Sharma | Pro | Google search | the normal path |
| 2 | Bella Ng | Plus | `A friend said "best gear ever", so I joined` | quotes and a comma in one cell |
| 3 | Chen Liu | Basic | *(blank)* | a blank optional field still logs a row |
| 4 | José Álvarez | Pro | Instagram | accented characters |
| 5 | Dana Okoro | Plus | Newsletter *(email `dana+trial@example.com`)* | a `+`-alias email |
| 6 | Evan Reyes | Basic | *(a 90-character sentence)* | long text, not truncated |
| 7 | Farah Qureshi | Pro | `Line one` ⏎ `Line two` | an embedded newline |
| 8 | Gita Rao | Basic | YouTube review | the normal path |
| 9 | Hiro Tanaka | Plus | `友達の紹介` | a non-Latin script |
| 10 | Ivy O'Brien | Pro | O'Brien family discount | an apostrophe |
| 11 | Kofi Mensah | Basic | Reddit r/hiking | a slash in the text |
| 12 | Lena Vogel | Plus | `Comma, separated, values, test` | comma-heavy text in one cell |
| 13 | *(blank)* | Basic | No name given | a blank **name** still logs, and the email degrades gracefully |

**The deliberate gap — the degraded path** (this flow is linear, so there is no branch for a
case to miss):

> **Row 13, the blank name.** The row must still be appended and the email must still send. A
> flow configured to treat a missing field as an error stops here and the signup is lost
> silently — the person filled in the form and hears nothing back. What "handled correctly"
> looks like: the row lands with an empty Name cell, the other three columns are unshifted, and
> the email still goes to a real address with a greeting that reads acceptably without a name.

This is what Stress Testing should ask about.

---

## 6. Size

| Field | Value |
|---|---|
| **Target difficulty** | `easy` — the source says "level: beginner (non-coder)" |
| **Estimated minutes** | *let the pipeline size it from the real decision count* |

Four nodes and no branching, so if the scored-decision count comes out above ~20 the case has
probably grown NDV fields that are not really decisions. Report the count rather than forcing
the label.

---

## 7. Cover art subject

A wide isometric scene: a signup form on the left feeding a conveyor that splits into a
spreadsheet grid and an outbound envelope on the right, with a small currency-rate dial plugged
in above the conveyor. Left-to-right, plenty of empty space around it.

---

## 8. What learners get wrong

The misconceptions this case exists to catch — reframed as *decisions*, so each can be graded:

- **Mapping a field to the wrong column.** The commonest real error, and the one every messy
  referral string in the dataset is really about. `Referral Source` under the `USD_INR_Rate`
  heading is silent and wrong.
- **Reading the wrong path out of the FX response.** The value lives at `rates → INR`. Picking
  the response root, or `rates`, or `INR` alone, all look plausible in the data pill picker.
- **Fetching the rate in the wrong place**, so the row is appended before the rate exists and
  the column comes out blank — or the rate is re-fetched per row and the run ends up with
  several different rates instead of the one it is supposed to record.
- **Choosing the wrong sheet operation.** `Append Row` adds a signup; `Update Row` overwrites
  one, so every signup replaces the last and the sheet never grows past one line.
- **Treating a blank optional field as an error** and stopping the run instead of logging the
  row — the degraded path above.
- **Believing the email "fired" because the node is on the canvas.** It is on the canvas and it
  is wired, which is not the same as having run for every item.
- **Reaching for `code`** to do the mapping, when the whole point is that the mapping is
  point-and-click.

---

## 9. Narration notes

The vocabulary this case owns: the four form fields, the `Signups` sheet, the `USD_INR_Rate`
column, the FX lookup, the welcome email.

Iris should never supply an expression. When a column mapping is wrong she points at **which
column** looks off and stops — the mapping is the graded answer. Same for the FX path: she can
say the rate is not arriving, never where it lives in the response.

There is no AI step here, so nothing should be narrated as though there were — this is the case
that teaches wiring before it teaches intelligence.

---

## Provenance

Source: `docs/sample cases/q1-no-ai-signup-desk.md`. What did **not** transfer, and why: its
grading-sheet spec, its `Expected_*` columns and its reference-workflow export all belong to an
execution grader (submit a webhook URL, grader POSTs the dataset, reads your Sheet back via the
n8n executions API). Judge simulates, so it grades the decisions that would produce that
outcome instead. What transferred: the scenario, the node vocabulary, all 13 dataset rows, the
hazards, and the misconceptions.
