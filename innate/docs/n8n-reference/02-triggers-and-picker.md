# n8n Trigger Picker & Trigger Types (Reference)

Synthesised from docs.n8n.io (Workflows > Nodes, Build > Work with nodes, and the individual trigger-node reference pages). Written in our own words for building a teaching-prototype clone — not a copy of n8n's text.

## 1. How the trigger panel appears

Every production workflow needs at least one trigger node — the node that decides *when* the workflow runs. In the n8n editor, when a **new, empty workflow** has no nodes yet, the canvas shows an **"Add first step"** affordance. Clicking it opens a right-side drawer titled **"What triggers this workflow?"** instead of the normal, full node picker. This is a deliberate narrowing: on a blank canvas n8n only wants you choosing *how the workflow starts*, so it filters the picker down to trigger-shaped options.

Once any node already exists on the canvas, clicking a `+` (on the canvas or on a node's output connector, or pressing `N`) opens the **general node picker** instead (see §3) — that one is not restricted to triggers, though a trigger-only workflow can still add a second trigger later via the same general picker.

The trigger drawer has:
- A **search box** at the top for typing a keyword (e.g. "gmail", "schedule").
- Below it, a short vertical **list of trigger categories**, each row showing an icon + a short bold label + a one-line grey description. Selecting a row either drops in a trigger node directly (for the generic ones) or opens a secondary panel (for "On app event", which then lists specific apps/services).

## 2. The known entries in "What triggers this workflow?"

Verified against n8n's individual trigger-node docs pages:

| Entry | Underlying node | One-line description (paraphrased) | Notes |
|---|---|---|---|
| **Trigger manually** | Manual Trigger (`n8n-nodes-base.manualTrigger`) | Runs only when you click "Execute workflow" in the editor. | No automatic firing at all; good for testing before wiring a real trigger. A workflow can have only one Manual Trigger. |
| **On app event** | (opens a sub-picker) | Starts the workflow when something happens in a connected app (Slack, Shopify, Gmail, Trello, etc.). | Not a single node — choosing this row opens a **second list of app-specific trigger nodes**; you then pick the app and the specific event. This is where Gmail Trigger lives. |
| **On a schedule** | Schedule Trigger (`n8n-nodes-base.scheduleTrigger`) | Runs the workflow repeatedly at a fixed interval or cron expression. | Configurable by minutes/hours/days/weeks/cron; timezone-aware. |
| **On webhook call** | Webhook (`n8n-nodes-base.webhook`) | Runs when n8n receives an HTTP request at a generated URL. | Core building block for real-time, event-driven integrations from any external system that can call a URL. |
| **On form submission** | Form Trigger (`n8n-nodes-base.formTrigger`) | Runs when someone submits an n8n-hosted web form; the form's field values become the input data. | n8n auto-generates the form page; supports multi-step forms via the companion Form node. |
| **When executed by another workflow** | Execute Sub-workflow Trigger (`n8n-nodes-base.executeWorkflowTrigger`) | Marks this workflow as a sub-workflow's entry point, fired when a parent workflow calls it via "Execute Sub-workflow" or "Call n8n Workflow Tool". | Enables modular, reusable sub-workflows. |
| **On chat message** | Chat Trigger (`@n8n/n8n-nodes-langchain.chatTrigger`) | Runs when a user sends a message through n8n's built-in chat widget (embeddable or used in the test environment). | Aimed at conversational/AI-agent workflows; message text becomes the trigger's input. |
| **When running evaluation** | Evaluation Trigger | Runs the workflow against a test dataset to score/evaluate its performance rather than in response to real traffic. | Part of n8n's evaluation/testing framework for workflows that call LLMs; row label was renamed from "Evaluation Trigger" to "When running evaluation" for clarity. |
| **Other ways…** | (catch-all) | Expands to remaining/less-common trigger nodes not covered above (e.g. Error Trigger, local file trigger, n8n Trigger, Workflow Trigger). | Keeps the primary list short; avoids overwhelming a first-time user with every trigger node n8n ships. |

Categorically, the first eight rows are the "common path" triggers; "Other ways…" is the overflow bucket, consistent with n8n's general design principle of surfacing a short curated list before "show me everything."

## 3. App-specific email triggers ("On app event" → email)

Two different nodes cover "a new email arrived," and n8n treats them as distinct app triggers because they connect differently:

- **Gmail Trigger** (`n8n-nodes-base.gmailTrigger`)
  - Starts a workflow based on events in a Gmail account, connected via Google OAuth/service credentials (Gmail API, not raw IMAP).
  - Polls on a configurable interval ("Poll Mode" — e.g. every minute/hour).
  - Filters: sender email/name, Gmail label, read/unread status, Gmail search-operator query; caps how many messages are pulled per poll (default 10, max 50); can include spam/trash; output can be "simplified" (default) or raw Gmail API payload.
  - **Use when**: the mailbox is a Gmail / Google Workspace account and you want native Gmail features (labels, Gmail search syntax) without managing IMAP credentials.

- **Email Trigger (IMAP)** (`n8n-nodes-base.emailReadImap`)
  - A generic core-node trigger that watches any IMAP-compatible mailbox (Outlook, corporate mail servers, Zoho, self-hosted mail, etc.) — not Gmail-specific.
  - Configured with IMAP host/credentials, target mailbox/folder, and a reconnection interval; can mark messages read or leave them unread, optionally download attachments, and choose output format (RAW base64, "Resolved" with binary attachments, or "Simple").
  - Uses IMAP search-criteria syntax for filtering rather than Gmail's search operators.
  - **Use when**: the mailbox is not Gmail, or you specifically need raw IMAP-level control (e.g. no OAuth app registration desired, or a non-Google provider).

Net: same conceptual event ("new email"), two nodes gated by *which mail system* you're connecting to. For a Gmail-based teaching scenario, Gmail Trigger is the "correct" node; Email Trigger (IMAP) is a plausible near-miss a learner might pick if they don't realize the mailbox in the scenario is Gmail.

## 4. The general node picker (non-trigger steps)

Once a trigger exists, adding subsequent nodes opens the broader node picker (via canvas `+`, a node's output `+`, or the `N` key). This one is not restricted to triggers. Per n8n's docs, it organizes nodes into groups such as:

- **Advanced AI** — LLM/agent/vector-store building blocks.
- **Actions in an app** — the huge catalogue of per-app nodes (Slack, Google Sheets, HubSpot, …), each exposing that app's specific operations.
- **Data transformation** — Set, Filter, Merge, Code/AI Transform, etc.
- **Flow** — logic nodes: IF, Switch, Loop, Wait, Merge branches.
- **Core** — generic, non-app nodes providing HTTP requests, scheduling, webhooks as *actions*, and similar low-level utilities.
- **Human in the loop** — nodes that pause a workflow for approval/input.

The same search box pattern applies: type to filter by name/keyword across all categories at once, or scroll/browse category by category. Selecting an app node commonly drills into a second-level list of that app's specific operations (mirroring the drill-down behavior of "On app event" in the trigger drawer).

## 5. What matters for our simulator

For an **email-triage** teaching problem ("a new support/customer email should kick off the workflow"), the picker should feel authentic but not require modelling n8n's entire node catalogue.

- **Correct answer**: **Gmail Trigger** (surfaced under an "On app event" → Gmail path, or shown directly if we flatten the drill-down for simplicity). This is the only entry that actually matches "a new email arrives in Gmail."
- **Sensible confusers to include**:
  - **On a schedule** — tempting if a learner thinks "poll the inbox periodically" is the trigger itself, rather than realizing Gmail Trigger already handles polling internally.
  - **On webhook call** — tempting for learners who conflate "event-driven" with "webhook," even though Gmail doesn't push webhooks to n8n this way.
  - **On chat message** — a plausible distractor for anyone pattern-matching "message-based" without noticing it's chat-widget input, not email.
  - **Trigger manually** — the "give up and just click run" option; useful as a distractor that reveals whether a learner understands automation is the point.
  - Optionally **Email Trigger (IMAP)** as a close-but-wrong sibling to Gmail Trigger, since the scenario should specify Gmail to make that distinction meaningful (if we want a sharper test) or omit it to reduce noise (if we want a gentler one).
- **How much of the real list to show**: Show the panel's **first 5–6 rows** (Trigger manually, On app event, On a schedule, On webhook call, On form submission, On chat message) plus a collapsed **"Other ways…"** row for authenticity — skip "When executed by another workflow" and "When running evaluation" as full rows since they're not relevant to a single-workflow email-triage scenario and would only add noise. Keep the search box functional so learners can type "gmail" or "email" and have it filter live, matching real n8n behavior.

## Sources
- https://docs.n8n.io/workflows/components/nodes/
- https://docs.n8n.io/build/understand-workflows/workflow-components/work-with-nodes
- https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.gmailtrigger
- https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.emailimap
- https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.manualworkflowtrigger
- https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.formtrigger
- https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflowtrigger
- https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chattrigger
- https://docs.n8n.io/integrations/builtin/node-types
