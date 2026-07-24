# n8n Core Architecture and Editor Experience — Research Report

> Produced 2026-07-24 by a research subagent, to give the Judge simulator a faithful mental
> model of how real n8n functions end to end. Primary source: the n8n-io/n8n-docs GitHub
> source (the Markdown that generates docs.n8n.io), read directly. Citations point to the
> canonical docs.n8n.io URLs.

---

## 1. Workflow anatomy

**What a workflow is.** A workflow is a collection of nodes connected together that automates a process. Workflows begin execution when a trigger condition occurs and execute (mostly) sequentially. You build workflows on the **canvas**, the main interface of the editor UI.

**Nodes.** A node is an entry point for retrieving data, a function that processes data, or an exit that sends data. Every node has:
- `id` — a UUID, stable identity used internally (connections reference nodes by **name**, not id)
- `name` — the human-readable/display label (must be unique in the workflow; this is what `connections` and expressions like `$("NodeName")` reference)
- `type` — the node type identifier, e.g. `n8n-nodes-base.if`, `n8n-nodes-base.scheduleTrigger`, `n8n-nodes-base.httpRequest`, `n8n-nodes-base.code`
- `typeVersion` — the version of that node type's parameter schema
- `position` — `[x, y]` canvas coordinates
- `parameters` — node-specific configured settings (may contain expressions as strings prefixed with `=`)
- `credentials` (optional) — maps a credential-type key to `{ id, name }`
- `webhookId` (optional, on trigger nodes like Webhook/Form Trigger)

**Connections.** The `connections` object is keyed by **source node name**. Each key maps to an object whose keys are connection types (almost always `"main"`, but AI/cluster nodes use others like `ai_languageModel`, `ai_tool`, `ai_memory`). The value of `"main"` is an **array of arrays** — one inner array per *output* of the source node (a normal node has one output; an IF node has two: `[trueBranch[], falseBranch[]]`; a Switch node has as many as configured). Each inner array holds connection objects: `{ "node": "<Target Node Name>", "type": "main", "index": 0 }`, where `index` is which *input* of the target node receives the data.

**Other top-level workflow fields:** `name`, `nodes`, `connections`, `active` (legacy boolean; the editor has moved to a "Publish" model, see §4), `settings` (e.g. `executionOrder: "v1"`), `pinData`, `versionId`, `meta`, `id`, `tags`.

**Real example** (a tutorial workflow: Schedule Trigger → NASA API node → IF → one of two PostBin nodes, plus a Sticky Note):

```json
{
  "name": "Tutorial-workflow",
  "nodes": [
    {
      "parameters": {
        "rule": { "interval": [{ "field": "weeks", "triggerAtDay": [1], "triggerAtHour": 9 }] }
      },
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [-680, 100],
      "id": "ef14445c-2f5f-4c78-96c8-66732feb7a8f",
      "name": "Schedule Trigger"
    },
    {
      "parameters": {
        "resource": "donkiSolarFlare",
        "additionalFields": { "startDate": "={{ $today.minus(7, 'days') }}" }
      },
      "type": "n8n-nodes-base.nasa",
      "typeVersion": 1,
      "position": [-460, 100],
      "id": "52c58b93-c780-4aff-a216-d67b28195a45",
      "name": "NASA",
      "credentials": { "nasaApi": { "id": "sSVnxV9AcBmBOYn8", "name": "NASA account" } }
    },
    {
      "parameters": {
        "conditions": {
          "options": { "caseSensitive": true, "leftValue": "", "typeValidation": "strict", "version": 2 },
          "conditions": [{
            "id": "2f469c8e-12b3-4ee5-95fc-ff81508d0b43",
            "leftValue": "={{ $json.classType }}",
            "rightValue": "C",
            "operator": { "type": "string", "operation": "contains" }
          }],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [-240, 100],
      "id": "b54e3289-9ebb-451f-8bac-87edeeeced13",
      "name": "If"
    },
    {
      "parameters": { "content": "## Setup required...", "height": 120, "width": 600 },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [-720, -60],
      "id": "08e0b8f9-c90e-4c9c-a663-01aca805b9be",
      "name": "Sticky Note"
    }
  ],
  "connections": {
    "Schedule Trigger": { "main": [[{ "node": "NASA", "type": "main", "index": 0 }]] },
    "NASA": { "main": [[{ "node": "If", "type": "main", "index": 0 }]] },
    "If": {
      "main": [
        [{ "node": "PostBin(true)", "type": "main", "index": 0 }],
        [{ "node": "PostBin(false)", "type": "main", "index": 0 }]
      ]
    }
  },
  "active": false,
  "settings": { "executionOrder": "v1" },
  "versionId": "37de4877-e4f6-4b9a-b6f0-9b7e7aea0163",
  "id": "DPzMzTIyDrYohiw4"
}
```

The IF node's `connections["If"].main` has **two** inner arrays (true output index 0, false output index 1) — the exact mechanic to model for branching in a simulator.

Sources: [Understand n8n's data structure](https://docs.n8n.io/build/work-with-data/understand-n8ns-data-structure), [Work with nodes](https://docs.n8n.io/build/understand-workflows/workflow-components/work-with-nodes), [Connect nodes together](https://docs.n8n.io/build/understand-workflows/workflow-components/connect-nodes-together), [Create and run workflows](https://docs.n8n.io/build/understand-workflows/create-and-run-workflows)

---

## 2. Editor UX and interactions

**Adding nodes.**
- On an **empty workflow**, **Add first step** opens the nodes panel scoped to **trigger nodes**. Selecting **On App Event** shows all app integrations that support triggers.
- On an **existing workflow**, the **Add node** connector (`+`/grey dot on a node's output) opens the panel scoped to all nodes, and the new node auto-connects.
- You can also drag a node from the panel directly onto the canvas.
- Keyboard: **N** opens the node panel; **Enter** inserts; **Escape** closes; arrows navigate.

**Connections.** Drag from the output grey dot to another node's input rectangle. Hover a connection → **Delete**. Dragging from an output into empty canvas opens the node panel and auto-wires the pick.

**Node controls (on hover).** Execute step, Deactivate, Delete, and a context menu: Open, Execute step, Rename, Deactivate, Pin, Copy, Duplicate, Tidy up workflow, Convert to sub-workflow, Select all, Clear selection, Delete.

**Node settings tab** (in NDV): **Always Output Data**, **Execute Once**, **Retry On Fail**, **On Error** — Stop Workflow / Continue (use last valid data) / Continue (using error output), plus **Notes** / Display note in flow.

**Sticky notes.** A core node type (`n8n-nodes-base.stickyNote`); double-click to edit; CommonMark Markdown; resizable, recolorable (7 presets), draggable behind nodes to group them.

**Canvas Groups** (v2.28.0+): `Ctrl/Cmd+G` groups selected connected non-trigger nodes into a named collapsible box; `Ctrl/Cmd+Shift+G` ungroups.

**Command Bar** (`Ctrl/Cmd+K`): searchable palette for workflow actions, resource navigation, execution actions.

**Key keyboard shortcuts:** New workflow `Ctrl/Cmd+Alt+N`; Save `Ctrl/Cmd+S`; Execute `Ctrl/Cmd+Enter`; Undo/Redo `Ctrl/Cmd+Z`/`+Shift+Z`; pan `Space`+drag; zoom `+`/`-`/`0`/`1`; open node = double-click; sticky `Shift+S`; pin `P`; deactivate `D`; rename `F2`; `=` switches an empty param to expression mode; `N` node panel; Publish `Shift+P`, Unpublish `Ctrl/Cmd+U`.

**Node Detail View (NDV).** Double-click opens a modal with three columns: **INPUT** (items flowing in, table/JSON view, search, drag-to-map), central **Parameters** (rendered per the node's parameter schema — string/number/boolean/collection/options/resourceLocator/filter/json fields, each toggleable to Expression mode), and **OUTPUT** (result after running). **Execute step** runs just this node (plus needed upstream). Expression editor is CodeMirror-based with live-evaluated previews. Docs link + Settings tab.

Sources: [Work with nodes](https://docs.n8n.io/build/understand-workflows/workflow-components/work-with-nodes), [Connect nodes together](https://docs.n8n.io/build/understand-workflows/workflow-components/connect-nodes-together), [Add notes](https://docs.n8n.io/build/understand-workflows/workflow-components/add-notes-and-documentation), [Canvas Groups](https://docs.n8n.io/build/understand-workflows/workflow-components/canvas-groups), [Keyboard shortcuts](https://docs.n8n.io/build/keyboard-shortcuts)

---

## 3. Data flow between nodes

**The items model.** All data passed between nodes is **an array of "item" objects**, each wrapping its payload under a `json` key (and optionally `binary`):

```json
[
  { "json": { "apple": "beets", "carrot": { "dill": 1 } } },
  { "json": { "apple": "spinach" }, "binary": { "apple-picture": { "data": "<base64>", "mimeType": "image/png", "fileName": "example.png" } } }
]
```

**Implicit looping.** A node usually runs once **for each item** it receives — no explicit loop needed (a Slack node fed 5 items sends 5 messages). **Execute Once** processes only the first item. A short list of nodes always process all items in one call (several DB insert/update ops, RSS Feed Read, HTTP Request — pagination loops are manual).

**Expressions.** JS-like snippets in `{{ ... }}` in any string parameter (raw value prefixed with `=`). Key variables:
- `$json` — current item's JSON (`$json.fieldName`)
- `$binary`, `$input.all()/.first()/.last()/.item`
- `$("NodeName").all()/.first()/.item` — items from a specific upstream node (works across branches); legacy `$node["NodeName"].json["field"]`
- `$now` / `$today` — Luxon DateTime; `$if(cond,a,b)`, ternaries, `$ifEmpty(v,default)`
- `$workflow`, `$execution` (`.id`, `.mode` = test/production), `$itemIndex`, `$runIndex`, `$vars`
- Built-in method libraries per type (String `extractEmail`/`toSnakeCase`…, Array `pluck`/`unique`…, DateTime Luxon methods). Multi-statement JS needs an IIFE.

**Data mapping via drag-and-drop.** Dragging a field from the INPUT panel into a parameter auto-generates the expression (e.g. `{{ $json.fruit }}`) — the core "aha" interaction of n8n's UX.

**Item linking.** When input/output item counts differ (e.g. Code node), n8n tracks which output item pairs with which input item so `$("NodeName").item` resolves; mismatches produce specific errors ("Referenced node is unexecuted", item-linking errors).

Sources: [Data structure](https://docs.n8n.io/build/work-with-data/understand-n8ns-data-structure), [Expression reference](https://docs.n8n.io/build/work-with-data/transform-data/expression-reference), [UI mapper](https://docs.n8n.io/build/work-with-data/reference-data/use-the-ui-mapper), [Looping](https://docs.n8n.io/build/flow-logic/loop)

---

## 4. Triggers vs. regular nodes

- **Manual Trigger** — fires on **Execute Workflow**; one per workflow; testing/dev.
- **Schedule Trigger** — Trigger Rules with intervals (Seconds…Months) or raw 6-field cron; multiple rules per node; must be published to run.
- **Webhook** — listens on a unique URL (all HTTP methods, 16MB default), path params (`/:variable`), auth (Basic/Header/JWT/None), response modes (Immediately / When Last Node Finishes / Using 'Respond to Webhook' Node / Streaming).
- **App-event triggers** — 100+ per-service trigger nodes; polling triggers for services without webhooks (only count an execution when new data is found).

**Test vs. production Webhook URLs.** Every Webhook node shows both, toggled via buttons:
- **Test URL**: active while **Listen for Test Event** runs (120 seconds); incoming calls show live in the editor.
- **Production URL**: only active once the workflow is **published**; data inspected via the Executions tab, not live.

**Active/inactive vs. Publish model.** The JSON keeps `active: boolean`, but the current editor uses **Publish/Unpublish with version history**: edits auto-save as a draft; **Publish** (`Shift+P`) makes that saved version live (webhooks flip to production URL, schedules start firing). Versions can be named/protected/restored. One editor at a time (others read-only). This is one of the most commonly misunderstood real-world behaviors — worth simulating explicitly.

Sources: [Webhook node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook), [Schedule Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger), [Manual Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.manualworkflowtrigger), [Save and publish](https://docs.n8n.io/build/understand-workflows/save-and-publish-workflows)

---

## 5. Executions model

- **Manual** executions (canvas, live per-node data display; don't count toward paid quotas) vs **production** executions (auto-run once published; count toward quota; visible in the **Executions** tab, not live).
- **Pin data** on any single-main-output node to freeze its output for repeatable testing (dev-only; ignored in production).
- **Partial executions**: NDV **Execute step** runs the node plus needed upstream nodes.
- **Dirty nodes**: a previously-successful node whose output is now stale (yellow triangle instead of green check) after inserting/deleting nodes, editing parameters, adding connectors, unpinning data. Re-running clears it. A concrete little state machine worth simulating — it teaches why re-running matters after edits.
- **Debug in editor**: from a failed execution, copy that execution's data onto the canvas pinned on the first node, to iterate on a fix with the exact failing data.
- **Error handling**: per-workflow **Error workflow** (starts with an Error Trigger); **Stop And Error** node; per-node **On Error** (Stop / Continue / Continue using error output); **Retry On Fail** (Max Tries, Wait Between Tries); retry a failed execution with original or current workflow version.

Sources: [Types of executions](https://docs.n8n.io/build/understand-workflows/understand-executions/types-of-executions), [Dirty nodes](https://docs.n8n.io/build/understand-workflows/understand-executions/understand-dirty-nodes), [Debug executions](https://docs.n8n.io/build/understand-workflows/understand-executions/debug-executions), [Handle errors](https://docs.n8n.io/build/flow-logic/handle-errors-gracefully), [Pin and mock data](https://docs.n8n.io/build/work-with-data/pin-and-mock-data)

---

## 6. Credentials

- Created via the **Create** button or inline from a node's credential dropdown; **tested on save**; default name "*node name* account".
- **Predefined credential types** (service-specific, recommended) vs generic auth for HTTP Request: Basic, Header, Bearer, Digest, Custom, Query, OAuth1, OAuth2.
- **OAuth2** grants: Authorization Code (n8n handles redirect; "Connect my account" button), Client Credentials, PKCE.
- **Fixed vs End-user credentials** (Enterprise): same stored credential for everyone vs each triggering user's own connected account.
- **Allowed HTTP Request Domains**: credential-level allowlist guarding misuse inside the generic HTTP Request node.
- Credential fields can be expressions (evaluated per run). Sharing (paid): with users or a whole project — recipients can *use*, never see raw values.

Sources: [Create and edit credentials](https://docs.n8n.io/build/understand-workflows/create-and-edit-credentials), [Share credentials](https://docs.n8n.io/administer/manage-credentials/share-credentials-securely), [HTTP Request credentials](https://docs.n8n.io/integrations/builtin/credentials/httprequest)

---

## 7. Flow-control nodes

- **IF** — 2-way branch; data-type-aware condition builder; AND/OR (not mixed); outputs true (0) / false (1).
- **Switch** — multi-way. **Rules** mode: routing rule per output, **Rename Output**, **Fallback Output** (None [drop, default] / Extra Output / Output 0), Ignore Case, Less Strict Type Validation, Send data to all matching outputs. **Expression** mode: Number of Outputs + an expression evaluating to the output index.
- **Merge** — **Append**; **Combine** by Matching Fields (Keep Matches / Non-Matches / Everything / Enrich Input 1 / Enrich Input 2 — join semantics), by Position, All Possible Combinations; **SQL Query** (AlaSQL over input1/input2); **Choose Branch**. Uneven inputs: Input 1's count wins.
- **Loop Over Items (Split in Batches)** — type `n8n-nodes-base.splitInBatches`; Batch Size; **loop** + **done** outputs; only needed for artificial batching (rate limits) or non-auto-iterating exceptions; Reset option; context via `$("Loop Over Items").context["noItemsLeft"]`.
- **Filter** — drops non-matching items silently; single output.
- **Wait** — pauses (state offloaded to DB >65s): After Time Interval / At Specified Time / On Webhook Call (`$execution.resumeUrl`) / On Form Submitted; Limit Wait Time cap.
- **Code** — JS (Node.js) or Python; Run Once for All Items vs Run Once for Each Item; must return `[{json: {...}}]`; no fs/HTTP access; Cloud exposes only `crypto`/`moment`; Python uses bracket notation via task runners.

Sources: [If](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.if), [Switch](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.switch), [Merge](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.merge), [Loop Over Items](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.splitinbatches), [Filter](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.filter), [Wait](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait), [Code](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code)

---

## Notes for simulator design

- The **JSON schema in §1** (nodes array + connections keyed by output index) is the single most load-bearing structure to get right — IF/Switch branching, Merge multi-input, and Loop's dual loop/done outputs all hinge on modeling connection arrays-of-arrays.
- The **dirty-node** concept (§5) is cheap, high-value realism.
- The **test vs. production webhook URL** and **Publish vs. autosave-draft** distinction (§4) is commonly misunderstood and pedagogically worth simulating.
- Expression `{{ }}` syntax with **drag-and-drop mapping from the INPUT panel** (§2/§3) is the single highest-leverage interaction to nail.
