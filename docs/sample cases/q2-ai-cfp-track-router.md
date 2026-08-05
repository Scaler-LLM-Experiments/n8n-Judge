# Question 2 (AI): DevConf — Call-for-Proposals Track Router

**Type:** n8n workflow build · **AI:** one LLM step · **Level:** beginner (non-coder)
**Nodes used (all taught in Class 6/8):** Form Trigger, **AI Agent / Basic LLM Chain** with a
**Chat Model** (OpenAI or Gemini), Google Sheets (Append Row), Gmail (Send a message).
**Provided for you (scaffolding, copy-paste):** a Webhook trigger and a trace Code node.

> The AI step is a **single classification call** — one prompt in, one label out (Class-6
> style). No JSON parsing, no branching. You steer the model with the prompt so it returns
> exactly one allowed track word, then map that word straight into your Sheet and email.

---

## Scenario

**DevConf** collects talk proposals through a form. Each proposal must be routed to exactly one
conference **track** so the right committee reviews it. Build a workflow that reads the talk
title + abstract, uses AI to pick the track, logs the proposal, and emails the speaker a
confirmation naming their track.

## Required Workflow Structure

| Stage | Node | Purpose |
| :-- | :-- | :-- |
| 1. Trigger (build) | **Form Trigger** | Captures `Speaker Name`, `Email`, `Talk Title`, `Abstract`. |
| 1b. Trigger (provided) | **Webhook** | Grading entry point (same four fields). |
| 2. Classify | **AI Agent** (or **Basic LLM Chain**) + **Chat Model** | Reads title + abstract, returns EXACTLY one track word. |
| 3. Log | **Google Sheets → Append Row** | One row per proposal to a `Proposals` tab. |
| 4. Notify | **Gmail → Send a message** | Confirmation email naming the assigned track. |
| 5. Trace (provided) | **Code + Google Sheets → Append Row** | Records each node's output to `NodeTraces`. |

## Classification Rubric (this MUST go in your AI prompt — paraphrasing fine, omitting is not)

The AI must assign **exactly one** track, spelled and cased **exactly** as listed:

| Track | Covers |
| :-- | :-- |
| **AI/ML** | Machine learning, LLMs, model training/fine-tuning, data-science modelling. |
| **Web** | Frontend, browsers, HTTP, web frameworks, rendering, UX. |
| **Data** | Data engineering, pipelines, streaming, databases, analytics infrastructure. |
| **Security** | Application security, authentication, cryptography, threats, attacks, privacy. |
| **Career** | Soft skills, hiring, mentoring, team/leadership, non-technical growth. |

Your prompt **must** instruct the model to reply with **ONLY the track name** (no punctuation,
no explanation) so the output can be written straight into a cell.

## Success Criteria

| Node | Success criteria |
| :-- | :-- |
| Trigger | Every proposal produces `Speaker Name`, `Email`, `Talk Title`, `Abstract`. |
| Classify (AI) | Output is **exactly one of** `AI/ML`, `Web`, `Data`, `Security`, `Career` — same casing every time — and never any extra words. Non-English abstracts still return a valid English track. |
| Log | One row per proposal in `Proposals`: `Speaker Name`, `Email`, `Talk Title`, `Track`. No shifted columns even when the abstract has commas/quotes. |
| Notify | Gmail fires per proposal; the body names the assigned track. |
| Trace | One row per run in `NodeTraces`, one column per node; a skipped node shows a marker, never blank. |

## Required Test Dataset

POST body per row: `{"Speaker Name": ..., "Email": ..., "Talk Title": ..., "Abstract": ...}`.
Each row has an unambiguous `Expected_Track`.

| # | Talk Title | Abstract (input) | Expected `Track` | What it tests |
| :-- | :-- | :-- | :-- | :-- |
| 1 | RAG in Production | Retrieval-augmented generation with vector databases and LLM prompt orchestration. | AI/ML | clear AI/ML |
| 2 | Modern CSS Layouts | Grid, flexbox and container queries for responsive frontend interfaces in the browser. | Web | clear Web |
| 3 | Petabyte Data Lakes | Ingestion pipelines, partitioning and a warehouse layer for analytics at scale. | Data | clear Data |
| 4 | Zero Trust Auth | Modern authentication, token rotation and defending against credential-stuffing threats. | Security | clear Security |
| 5 | Negotiating Your First Offer | Soft-skills for interviews, hiring conversations and early-career growth. | Career | clear Career |
| 6 | Server Components Deep Dive | How React server components change rendering, hydration and HTTP data fetching on the web. | Web | Web (framework) |
| 7 | Stream Processing with Kafka | Real-time data pipelines, topics and stateful stream processing for event data. | Data | Data (streaming) |
| 8 | Fine-tuning Small Models | Fine-tune and quantize compact language models for on-device machine learning. | AI/ML | AI/ML (models) |
| 9 | Mentoring Junior Engineers | Leading without authority, building teams and non-technical growth for new managers. | Career | Career (leadership) |
| 10 | Modelos de lenguaje | Cómo entrenar y evaluar modelos de lenguaje grandes con aprendizaje automático en producción. | AI/ML | non-English → AI/ML |
| 11 | Web Perf, Fast "Core" Vitals | Improving LCP, CLS, and TTFB; commas, quotes "like this", and caching for browser performance. | Web | quotes/commas → no column shift |
| 12 | Locking Down OAuth | Secure token storage, rotating secrets, and stopping credential-stuffing and session-hijacking attacks on user logins. | Security | clear Security (auth) |
| 13 | SQL Query Optimization | Indexing, query plans and warehouse tuning to speed up analytics on large datasets. | Data | Data (databases) |

## What to Submit / How Evaluated

Submit the Webhook URL + view access to `Proposals` and `NodeTraces`. The dataset is POSTed to
your Webhook; the two sheets are read back and graded on: **AI-output validity** (track ∈
allowed set, exact casing, no extra words), **classification correctness** (matches
`Expected_Track`), **data-mapping** (fields land correctly, no column shift), **notification**
(email names the track), and **trace completeness**.

---

## Setup Guide (non-coder)

**Steps 0/1 (triggers) and Step 5 (trace):** identical to Question 1 — import the provided
Webhook + trace nodes; add a Form Trigger with fields `Speaker Name`, `Email`, `Talk Title`,
`Abstract`.

### Step 2 — Classify with AI
Add an **AI Agent** node (or **Basic LLM Chain** for the simplest version). Attach a **Chat
Model** sub-node (OpenAI or Gemini) — pick a model and connect your API key credential; set
**Temperature = 0** for consistency. Set **Source for Prompt = Define Below** and paste:

```
You are a conference program classifier. Read the talk title and abstract and assign EXACTLY ONE track.
Respond with ONLY the track name — exact spelling, no punctuation, no explanation.
Allowed tracks: AI/ML, Web, Data, Security, Career.
Definitions:
- AI/ML: machine learning, LLMs, model training/fine-tuning, data-science modelling.
- Web: frontend, browsers, HTTP, web frameworks, rendering, UX.
- Data: data engineering, pipelines, streaming, databases, analytics infrastructure.
- Security: application security, authentication, cryptography, threats, attacks, privacy.
- Career: soft skills, hiring, mentoring, team/leadership, non-technical growth.
Always answer in English even if the abstract is in another language.

Title: {{ $('Webhook').item.json.body['Talk Title'] }}
Abstract: {{ $('Webhook').item.json.body['Abstract'] }}
Track:
```

The model's answer is a single word. Read it downstream via the AI node's output field (for
Basic LLM Chain that's `text`; for the AI Agent it's `output`).

### Step 3 — Google Sheets → Append Row (`Proposals` tab)
Header: `Speaker Name | Email | Talk Title | Track`.

| Column | Value |
| :-- | :-- |
| Speaker Name | `={{ $('Webhook').item.json.body['Speaker Name'] }}` |
| Email | `={{ $('Webhook').item.json.body['Email'] }}` |
| Talk Title | `={{ $('Webhook').item.json.body['Talk Title'] }}` |
| Track | `={{ $json.text }}`  *(Basic LLM Chain)* — or `={{ $json.output }}` *(AI Agent)* |

### Step 4 — Gmail → Send a message
- **To:** `={{ $('Webhook').item.json.body['Email'] }}`
- **Subject:** `Your DevConf proposal — routed to the {{ $json.text }} track`
- **Body:** `Hi {{ $('Webhook').item.json.body['Speaker Name'] }}, thanks for submitting "{{ $('Webhook').item.json.body['Talk Title'] }}". It has been routed to the {{ $json.text }} track for review.`

*(Use `$json.output` instead of `$json.text` if you used the AI Agent node.)*

---

## Grading-Sheet Spec (grader-facing)

```
Row, Input_Title, Input_Abstract, Expected_Track, Actual_Track (from Proposals),
Track_In_AllowedSet (Yes/No), Track_Match (MATCH/MISMATCH vs Expected),
Mapping_Match (fields land, no column shift), Email_Fired (from NodeTraces),
Email_NamesTrack (Yes/No), Notes
```
**Pass bar:** all 13 rows `Track_In_AllowedSet = Yes` (exact casing) and `Track_Match = MATCH`;
`Mapping_Match = MATCH`; `Email_Fired = Yes`.

---

## Reference Solution (instructor-only) — VALIDATED END-TO-END

- Built as **`[REF] q2-cfp-track-ai`** (live), exported to `reference-workflows/q2-ai.reference.json`.
  Uses **Basic LLM Chain + OpenAI Chat Model** (temperature 0); output field is `text`.
- The full 13-row dataset was POSTed and read back via the executions API. **Result: 13/13 in
  the allowed set with exact casing, and 13/13 matched the expected track** — including the
  Spanish abstract (row 10 → `AI/ML`) and the commas/quotes row (row 11 → `Web`, no column
  shift).
- **Ambiguity fix applied during validation:** an earlier row 12 ("defending ML pipelines
  against data poisoning") graded to `AI/ML`, not the intended `Security` — genuinely arguable.
  It was replaced with an unambiguous auth/security abstract ("Locking Down OAuth"), after
  which the set graded 13/13. This is the zero-ambiguity gate working as intended.
