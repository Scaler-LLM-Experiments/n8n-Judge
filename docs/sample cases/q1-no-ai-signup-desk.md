# Question 1 (No AI): TerraTrek Gear — Free-Trial Signup Desk

**Type:** n8n workflow build · **AI:** none · **Level:** beginner (non-coder)
**Nodes used (all taught in Class 6):** Form Trigger, HTTP Request, Google Sheets (Append Row), Gmail (Send a message).
**Provided for you (scaffolding, copy-paste):** a Webhook trigger (grading entry point) and a trace Code node.

> **What's graded is the middle of your workflow** — the HTTP Request, Google Sheets, and
> Gmail nodes you build with the nodes you learned. The Webhook trigger and the trace step
> are handed to you ready-made; you only wire them in and follow the instructions.

---

## Scenario

**TerraTrek Gear** runs free-trial signups through a web form. Every signup should be logged
to a spreadsheet automatically, the current **USD→INR reference rate** (so the team can quote
local pricing) should be fetched live and stored alongside it, and the new user should get an
instant welcome email — with zero manual work.

## Required Workflow Structure

| Stage | Node | Purpose |
| :-- | :-- | :-- |
| 1. Trigger (build) | **Form Trigger** ("n8n Form") | Public signup form capturing `Full Name`, `Email`, `Plan`, `Referral Source`. |
| 1b. Trigger (provided) | **Webhook** | Grading entry point. Pre-built — you paste it in. It carries the same four fields. |
| 2. Enrich | **HTTP Request** | GET `https://api.frankfurter.app/latest?from=USD&to=INR`; returns today's rate. |
| 3. Log | **Google Sheets → Append Row** | One row per signup to a `Signups` tab. |
| 4. Notify | **Gmail → Send a message** | A welcome email personalised with the person's name + plan. |
| 5. Trace (provided) | **Code + Google Sheets → Append Row** | Records each node's output to a `NodeTraces` tab. Copy-paste — see below. |

There is **no data-cleaning and no branching** in this task — everything is straight
field-mapping and one external fetch. (That is deliberate: it's the Class-6 "5 core nodes"
build.)

## Success Criteria

| Node | Success criteria |
| :-- | :-- |
| Trigger | Every submission produces `Full Name`, `Email`, `Plan`, `Referral Source`. A blank `Full Name` or `Referral Source` still produces a logged row (never a crash, never a shifted column). |
| HTTP Request | Returns the FX payload; the `rates.INR` value is present and numeric. |
| Log | One row per signup in `Signups`, each field under the correct header. `USD_INR_Rate` is filled from `rates.INR` (a number, the **same value for every row in one grading run**). Commas, quotes, and line breaks in `Referral Source` must NOT shift columns. |
| Notify | The Gmail node runs for every signup; the email body contains the person's `Full Name` and `Plan`. |
| Trace | One row per run in `NodeTraces`, one column per traced node; a node that didn't run shows an explicit marker, never a blank cell. |

## Required Test Dataset

POST body per row: `{"Full Name": ..., "Email": ..., "Plan": ..., "Referral Source": ...}`.
Each gradeable output has an `Expected_*` value. (`Expected_USD_INR_Rate` is not a fixed
number — the rule is "populated, numeric, identical across all 13 rows in the run.")

| # | Full Name (input) | Email (input) | Plan | Referral Source (input) | Expected row logged (Name / Email / Plan / Referral verbatim) | What it tests |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| 1 | Aarav Sharma | aarav@example.com | Pro | Google search | verbatim | normal |
| 2 | Bella Ng | bella@example.com | Plus | `A friend said "best gear ever", so I joined` | verbatim (quotes + comma preserved, no column shift) | quotes/commas |
| 3 | Chen Liu | chen@example.com | Basic | *(blank)* | verbatim; Referral cell empty but row still logged | blank optional field |
| 4 | José Álvarez | jose@example.com | Pro | Instagram | verbatim (accented characters intact) | unicode name |
| 5 | Dana Okoro | dana+trial@example.com | Plus | Newsletter | verbatim (`+` alias email intact) | plus-alias email |
| 6 | Evan Reyes | evan@example.com | Basic | *(long 90-char sentence)* | verbatim, not truncated | long text |
| 7 | Farah Qureshi | farah@example.com | Pro | `Line one` ⏎ `Line two` | verbatim (newline preserved, no column shift) | embedded newline |
| 8 | Gita Rao | gita@example.com | Basic | YouTube review | verbatim | normal |
| 9 | Hiro Tanaka | hiro@example.com | Plus | 友達の紹介 | verbatim (non-Latin script intact) | multilingual field |
| 10 | Ivy O'Brien | ivy@example.com | Pro | O'Brien family discount | verbatim (apostrophe intact) | apostrophe |
| 11 | Kofi Mensah | kofi@example.com | Basic | Reddit r/hiking | verbatim | slash in text |
| 12 | Lena Vogel | lena@example.com | Plus | `Comma, separated, values, test` | verbatim (all commas in one cell) | comma-heavy |
| 13 | *(blank)* | anon@example.com | Basic | No name given | verbatim; blank name still logs; email still personalises gracefully | blank name |

## Node Tracing (provided — required for grading)

See **Setup Guide → Step 5**. You paste a Code node and a Google Sheets node; they append one
row per run to a `NodeTraces` tab so graders can see each node's output.

## What to Submit

1. Your workflow's **Webhook** URL (the provided grading entry point).
2. View access to your `Signups` Google Sheet.
3. View access to your `NodeTraces` Google Sheet.

## How This Gets Evaluated

The 13-row dataset is POSTed to your Webhook URL. Your `Signups` and `NodeTraces` sheets are
read back and checked against the success criteria — **data-mapping** (every field lands
correctly, no shifted columns), **HTTP enrichment** (the FX rate is fetched and stored),
**notification** (the Gmail node fired with a personalised body), and **trace completeness**.

---

## Setup Guide (click-by-click, non-coder)

### Step 0 — Import the provided trigger + trace (scaffolding)
Your instructor gives you a small starter with the **Webhook** trigger and the **trace** nodes
pre-built. Import it, then build Steps 2–4 in between. (If building the Webhook yourself:
add a **Webhook** node, method **POST**, and note its **Production URL** — that is what you submit.)

### Step 1 — Add the Form Trigger (the real-world entry you learned)
Add an **n8n Form** trigger. Title it `TerraTrek Free Trial`. Add fields: `Full Name` (Short
Text), `Email` (Short Text), `Plan` (Short Text or Dropdown: Basic/Plus/Pro), `Referral
Source` (Long Text). Wire it into the **same** HTTP Request node as the Webhook so either entry
works. *(All grading uses the Webhook; the Form is your real-world equivalent.)*

### Step 2 — HTTP Request (fetch the FX rate)
Add an **HTTP Request** node after the trigger.
- **Method:** GET
- **URL:** `https://api.frankfurter.app/latest?from=USD&to=INR`
- Run it once; confirm the output has `rates → INR` (a number).

### Step 3 — Google Sheets → Append Row
Add a **Google Sheets** node, operation **Append Row**. Choose your spreadsheet, a tab named
`Signups`, with this header row:
`Full Name | Email | Plan | Referral Source | USD_INR_Rate`
Map each column with the data-pill picker (point-and-click). For the rate, use the pill from
the HTTP Request node, i.e. the value at `rates → INR`. Paste-ready if you prefer typing:

| Column | Value |
| :-- | :-- |
| Full Name | `={{ $('Webhook').item.json.body['Full Name'] }}` |
| Email | `={{ $('Webhook').item.json.body['Email'] }}` |
| Plan | `={{ $('Webhook').item.json.body['Plan'] }}` |
| Referral Source | `={{ $('Webhook').item.json.body['Referral Source'] }}` |
| USD_INR_Rate | `={{ $('HTTP Request').item.json.rates.INR }}` |

*(If you started from the Form Trigger instead of the Webhook, use `$('TerraTrek Free Trial').item.json['Full Name']` etc. — same idea, the field names are the form labels.)*

### Step 4 — Gmail → Send a message
Add a **Gmail** node, operation **Send a message**.
- **To:** `={{ $('Webhook').item.json.body['Email'] }}`
- **Subject:** `Welcome to TerraTrek, {{ $('Webhook').item.json.body['Full Name'] }}!`
- **Body:** `Hi {{ $('Webhook').item.json.body['Full Name'] }}, your {{ $('Webhook').item.json.body['Plan'] }} plan trial is active. For reference, today's USD→INR rate is {{ $('HTTP Request').item.json.rates.INR }}.`

### Step 5 — Trace (provided, copy-paste)
Add a **Code** node named `Collect Node Traces`, Mode **Run Once for Each Item**, Language
**JavaScript**, and paste:
```javascript
function safeGet(n){ try { return $(n).item.json; } catch(e){ return { __not_executed:true }; } }
function trunc(o,n){ const s=JSON.stringify(o); return s.length>n ? s.slice(0,n)+'...(truncated)' : s; }
return [{ json: {
  run_id: new Date().toISOString(),
  trigger_input: trunc(safeGet('Webhook'), 1500),
  http_output:   trunc(safeGet('HTTP Request'), 1500),
  sheet_output:  trunc(safeGet('Google Sheets'), 1500),
  email_output:  trunc(safeGet('Gmail'), 1500)
}}];
```
Then add a **Google Sheets → Append Row** node named `Log Node Traces`, tab `NodeTraces`,
columns = the keys above (`run_id, trigger_input, http_output, sheet_output, email_output`),
each mapped to the matching field from the Code node. **Publish** the workflow.

---

## Grading-Sheet Spec (grader-facing)

One row per dataset row. Columns:
```
Row, Input_FullName, Input_Email, Input_Plan, Input_Referral,
Expected_Row (verbatim echo), Actual_Row (from Signups),
Mapping_Match (MATCH/MISMATCH: all 4 fields land verbatim, no column shift),
Rate_Populated (Yes/No: USD_INR_Rate numeric & non-blank),
Email_Fired (Yes/No: from NodeTraces.email_output — real result vs __not_executed),
Email_Personalised (Yes/No: body contains Name + Plan), Notes
```
**Dimensions:** data-mapping (Mapping_Match) · HTTP enrichment (Rate_Populated + same value
all rows) · notification (Email_Fired + Email_Personalised) · trace completeness.
**Pass bar:** all 13 rows `Mapping_Match = MATCH`; `Rate_Populated = Yes` on all rows with one
distinct rate value; `Email_Fired = Yes` on all rows.

---

## Reference Solution (instructor-only) — VALIDATED END-TO-END

- Built in n8n as **`[REF] q1-terratrek-signups-noai`** (live), exported to
  `reference-workflows/q1-no-ai.reference.json`.
- The full 13-row dataset was POSTed to the reference Webhook and read back via the n8n
  executions API. **Result: 13/13 rows mapped verbatim** (including quotes/commas, the newline
  row, `José`, `友達の紹介`, `O'Brien`, the `+`-alias email, and the blank-name row) with **no
  shifted columns**. The FX enrichment returned a single non-null rate (`96.23` at run time),
  identical across all 13 rows — confirming the `rates.INR` field is pulled correctly.
