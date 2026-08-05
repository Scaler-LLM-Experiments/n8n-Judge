# Question 3 (Agentic): OpsBuddy — Autonomous Operations Assistant

**Type:** n8n agent build · **AI:** agentic (ReAct loop, dynamic tool selection) · **Level:** beginner (non-coder)
**Nodes used (all taught in Class 7/8):** **AI Agent** node, **Chat Model** (OpenAI or Gemini),
**Simple Memory** (window 10), two agent **Tools** — a Google Sheets tool and a Gmail tool.
**Provided for you (scaffolding, copy-paste):** a Webhook trigger and a trace Code node
(pre-configured to read the agent's tool calls).

> Unlike Question 2 (one fixed AI call), here the AI **decides for itself** which tool(s) to
> use for each request — the ReAct loop from Class 7/8. Your graded work is wiring the agent:
> its Chat Model, its two tools, its memory, and a System Message that makes it pick the
> right tool. This is autonomy: you architect the capabilities; the agent orchestrates.

---

## Scenario

**OpsBuddy** is a team operations assistant. People send it a plain-English request. It must
figure out, on its own, whether to **log** something to the team spreadsheet, **email**
someone, do **both**, or — for a plain question or greeting — **do neither** and just reply.
No hardcoded if/else: the *agent* chooses the tools.

## Required Workflow Structure (a hub-and-spoke agent, not a linear chain)

| Piece | Node | Purpose |
| :-- | :-- | :-- |
| Trigger (provided) | **Webhook** | Grading entry point; body carries `request` (the user's message) and `session`. |
| Brain | **AI Agent** node | Runs the ReAct loop; decides which tool(s) to call. |
| Model socket | **Chat Model** (OpenAI/Gemini) | The LLM that reasons. **Required.** |
| Memory socket | **Simple Memory** (window 10) | Keeps context per session. |
| Tool socket | **Google Sheets tool** (`log_to_sheet`) | Appends a contact/task row when the request asks to save/log/record. |
| Tool socket | **Gmail tool** (`send_email`) | Sends an email when the request asks to email/notify/send. |
| Trace (provided) | **Code + Google Sheets → Append Row** | Records, per run, which tools the agent used (read from the agent's intermediate steps). |

*(The lecture's interactive agent uses a **Chat Trigger**; for automated grading we swap in a
**Webhook** — the same pattern shown in Class 7's webhook→agent demo. Both feed the agent a
user message.)*

## System Message (this is the graded heart of the build — it must encode the tool policy)

Your System Message **must** tell the agent:
- It has two tools: `log_to_sheet` (save/log/record to the sheet) and `send_email` (send an email).
- Use `log_to_sheet` **only** when asked to save/log/record; use `send_email` **only** when
  asked to email/notify/send; do **both** if asked for both.
- For a plain question or greeting, use **no tools** and simply reply. (Least privilege — the
  Class-10 principle that an agent should only act when the task needs it.)
- Never invent data the user didn't provide.

## Success Criteria (behavioral — this is an autonomous agent, not a fixed pipeline)

| Aspect | Success criteria |
| :-- | :-- |
| Tool selection | For each request, the agent calls **exactly** the tools the request warrants — and no others. This is the primary grade. |
| Autonomy / least privilege | For a question or greeting, the agent calls **no** tool and still replies. |
| Loop completes | The agent finishes (produces a final reply) without erroring or looping forever. |
| Memory wired | A **Simple Memory** node is connected to the agent's memory socket. |
| Trace | One row per run in `NodeTraces` showing `tools_used` (the tool names the agent invoked) — never blank. |

Because an agent is non-deterministic, grading targets **which tools fire**, not an exact
output string. The test requests below are written to be unambiguous so tool selection is
stable.

## Required Test Dataset

POST body per row: `{"session": ..., "request": ...}` (a unique `session` per row keeps memory
isolated). `Expected` = which tools should fire.

| # | session | Request (input) | Expected: log? | Expected: email? | What it tests |
| :-- | :-- | :-- | :-- | :-- | :-- |
| 1 | s1 | Log a new lead named Riya Kapoor who is interested in the Pro plan. | ✅ | ❌ | log only |
| 2 | s2 | Email a reminder to alex@example.com to review the Q3 report by Friday. | ❌ | ✅ | email only |
| 3 | s3 | Save the contact Meera Nair (meera@example.com) to the sheet and send her a welcome email. | ✅ | ✅ | both tools |
| 4 | s4 | What kinds of things can you help me with? | ❌ | ❌ | question → no tools |
| 5 | s5 | Please record a task: order more printer paper for the office. | ✅ | ❌ | log only |
| 6 | s6 | Send an email to team@example.com announcing the team offsite this Friday. | ❌ | ✅ | email only |
| 7 | s7 | Hi there! | ❌ | ❌ | greeting → no tools |
| 8 | s8 | Log this feedback: the onboarding was smooth. Also email a thank-you note to dev@example.com. | ✅ | ✅ | both tools |
| 9 | s9 | Add a new subscriber sam@example.com to the spreadsheet. | ✅ | ❌ | log only |
| 10 | s10 | Email ops@example.com to let them know the staging server was restarted. | ❌ | ✅ | email only |

## What to Submit / How Evaluated

Submit the Webhook URL + view access to your `NodeTraces` sheet (and the sheet the agent logs
to). Each request is POSTed; graders read the `NodeTraces` row for each and check the
`tools_used` column against the expected tools. Grade = **tool-selection accuracy** across the
10 requests, plus **autonomy** (rows 4 & 7 must use no tool) and **loop completion**.

---

## Setup Guide (non-coder)

### Step 0 — Import the provided Webhook + trace (scaffolding)
The trace node is pre-written to read the agent's tool calls — you don't edit it.

### Step 1 — Add the AI Agent node
Add an **AI Agent** node after the Webhook. Set **Source for Prompt = Define Below**, and set
the text to the incoming request: `={{ $json.body.request }}`. Open the node's **Options** and
turn **ON "Return Intermediate Steps"** (this lets the trace show which tools were used). Paste
your **System Message** (the tool policy above).

### Step 2 — Attach the Chat Model (required)
On the agent's **Chat Model** socket, add an **OpenAI** (or **Gemini**) Chat Model sub-node.
Pick a model, connect your API-key credential, set **Temperature = 0**.

### Step 3 — Attach Simple Memory
On the **Memory** socket, add **Simple Memory**. Set **Session ID → Custom Key** =
`={{ $json.body.session }}` and **Context Window = 10**.

### Step 4 — Attach the two tools
On the **Tools** socket, add:
- **Google Sheets Tool**, named **`log_to_sheet`**, operation **Append Row**, pointed at your
  spreadsheet/tab, with a manual **tool description**: *"Append a row to the team spreadsheet
  to log/save a contact or task."* Let the agent fill the column values.
- **Gmail Tool**, named **`send_email`**, with tool description *"Send an email to a
  recipient,"* and the To/Subject/Body set to be filled by the agent.

### Step 5 — Trace (provided, copy-paste)
Add a **Code** node named `Collect Node Traces` after the agent (Mode **Run Once for Each
Item**), paste this, then append it to a `NodeTraces` tab (columns: `run_id, request,
tools_used, used_log_to_sheet, used_send_email, agent_output`):
```javascript
const a = $('AI Agent').item.json || {};
const steps = Array.isArray(a.intermediateSteps) ? a.intermediateSteps : [];
const tools = steps.map(s => (s && s.action && s.action.tool) ? s.action.tool : null).filter(Boolean);
return { json: {
  run_id: ($('Webhook').item.json.body.session) || new Date().toISOString(),
  request: $('Webhook').item.json.body.request,
  tools_used: tools.join(',') || '(none)',
  used_log_to_sheet: tools.includes('log_to_sheet'),
  used_send_email: tools.includes('send_email'),
  agent_output: (a.output || '').toString().slice(0,300)
}};
```
**Publish** the workflow.

---

## Grading-Sheet Spec (grader-facing)

```
Row, Session, Request, Expected_Log, Expected_Email,
Actual_Log (NodeTraces.used_log_to_sheet), Actual_Email (NodeTraces.used_send_email),
Selection_Match (MATCH iff both booleans equal expected),
Loop_Completed (Yes/No: agent produced a final output, no error), Notes
```
**Dimensions:** tool-selection accuracy (Selection_Match) · autonomy/least-privilege (rows 4 &
7 must be `(none)`) · loop completion. **Pass bar:** ≥ 9/10 `Selection_Match = MATCH`
(allowing one borderline call), with rows 4 & 7 using no tool.

---

## Reference Solution (instructor-only) — VALIDATED END-TO-END

- Built as **`[REF] q3-ops-assistant-agentic`** (live), exported to
  `reference-workflows/q3-agentic.reference.json`. Agent = **AI Agent** node + **OpenAI Chat
  Model** (temp 0) + **Simple Memory** (window 10, session-keyed) + two tools (`log_to_sheet`
  Google Sheets tool, `send_email` Gmail tool), **Return Intermediate Steps = ON**.
- The 10-request dataset was POSTed to the reference Webhook and graded from the **NodeTraces**
  tool list (exactly how a student submission is graded). **Result: 10/10 tool-selection
  matches** — the agent logged-only for save requests, emailed-only for send requests, did both
  when asked, and **used no tool for the question (s4) and greeting (s7)**, confirming genuine
  autonomy and least-privilege behavior.
- Tools are wired to the agent's **Tools** socket (not the model socket) and use only the
  credentials available in the instance (Gmail, Google Sheets).
- **Two caveats found during validation (both affect only *whether an action lands*, not the
  graded tool *selection*):**
  1. The `send_email` tool sends real mail **from the connected Gmail account**. The dataset's
     `example.com` recipients don't exist, so Gmail returns bounce notifications to that inbox.
     When running this question, point the dataset at a mailbox you control (or expect/ignore
     the bounces). Do **not** treat `example.com` as "no-op" — it bounces to the sender.
  2. The `log_to_sheet` (Google Sheets tool) append reported *"Column names were updated after
     the node's setup — refresh the columns list"* — an n8n quirk where the tool's mapped
     columns must be re-synced against the live sheet header before rows physically write. The
     agent still **selected** the tool correctly (captured in the trace); refresh the column
     mapping if you want the rows to actually land. The reference is deactivated, so re-sync +
     reactivate before any live re-run.
- The `[REF]` workflow is left in the instance **deactivated**.
