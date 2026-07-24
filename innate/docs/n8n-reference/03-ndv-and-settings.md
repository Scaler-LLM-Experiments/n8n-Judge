# n8n Reference: Node Detail View (NDV) & Node Settings

> Synthesised from docs.n8n.io (Build → Understand Workflows / Work with Nodes, Connect → Create Nodes reference, Data → Referencing Data) in July 2026. Paraphrased for internal reference — not a copy of n8n's docs.

## 1. What the NDV is

Double-clicking (or hitting Enter on) a node on the canvas opens the **Node Detail View (NDV)** — a modal that takes over most of the screen and is where all node configuration and single-node testing happens. It's split into three vertical regions:

```
┌───────────┬─────────────────────────┬───────────┐
│  INPUT    │   Parameters / Settings │  OUTPUT   │
│  (left)   │   (centre, tabbed)      │  (right)  │
└───────────┴─────────────────────────┴───────────┘
```

**Header**, shared across the whole modal:
- Node icon + editable node name (double-click / pencil icon to rename).
- A "Docs" link that jumps to that node type's integration page.
- A close **X** (top-right) that returns you to the canvas.

**Footer / top-right of the centre pane**: an orange **execute button**. Its label depends on node type:
- Regular/action nodes: **"Test step"** — runs just this node using whatever data is currently available on its input, and populates the OUTPUT pane.
- Trigger nodes: **"Test this trigger"**, **"Listen for Test Event"**, or **"Fetch Test Event"** (wording varies by trigger implementation) — puts n8n into a listening state or pulls a sample event/record so you have something to build downstream nodes against, since a trigger has no upstream node to pull input from.

## 2. Centre pane: Parameters tab

This is where the node's configurable fields render, generated from the node's parameter schema. Field types you'll see repeatedly:

| Type | Renders as |
|---|---|
| `string` | Text input (or password field, or a multi-row textarea for longer text) |
| `options` | A single-select dropdown (label shown, underlying value stored) |
| `boolean` | An on/off toggle switch |
| `collection` | A group of *optional* fields, revealed via an "Add option" (or similarly named) button — only fields the user explicitly adds are shown |
| `fixedCollection` | Same idea but for a group of semantically-related fields the user can add one or more sets of — this is the pattern behind things like **"Add Filter"** / **"Add Condition"** rows, where each click appends another filter block with its own field/operator/value inputs |
| `resourceLocator` | A hybrid field with mode switch — pick a resource **From list** (searchable dropdown), by **ID**, or by **URL** |
| `notice` | A static yellow callout box for hints/warnings — not user-editable |

**Credential field pattern** (appears at or near the top of the Parameters tab whenever the node needs auth):
- Empty state: **"No credentials yet"** message with a **"Set up credential"** / **"Create new credential"** button, which opens a credential-creation modal scoped to that node's service.
- OAuth-capable services often surface a one-click **"Sign in with Google"** (or equivalent provider) button alongside a **"Set up manually"** / **"setup manually"** fallback link for users who want to paste in their own client ID/secret instead of the hosted OAuth flow.
- Once created, the field becomes a dropdown of saved credentials for that type, with a small edit (pencil) icon to reopen the credential.

**Expressions**: any parameter that accepts dynamic data shows a small **fx** toggle next to the field. Clicking it switches the field from a plain input into expression-editing mode, where you type `{{ }}`-wrapped JavaScript, most commonly `{{ $json.fieldName }}` to reference a value from the node's input. Instead of typing it by hand, you can **drag a field row from the INPUT pane and drop it directly onto a parameter** — n8n writes the matching `{{ $json.fieldName }}` expression for you and turns fx on automatically. Hovering a resolved expression shows the live value it currently evaluates to.

## 3. Centre pane: Settings tab

A second tab next to Parameters, holding node-level behaviour toggles that are the same shape across every node type:

- **Always Output Data** — forces the node to emit one empty item instead of nothing when it would otherwise produce zero output items. Documented as risky on IF/Switch-style nodes because it can create infinite loops if used carelessly.
- **Execute Once** — instead of running once per input item, the node runs a single time using only the first item it receives, ignoring the rest.
- **Retry On Fail** — if the node's execution throws an error, n8n reruns it automatically. Turning this on reveals two sub-fields: **retry count** (max number of attempts) and **wait between tries** (delay in ms/seconds before each retry).
- **On Error** — what happens to the *workflow* when this node fails, with three options: **Stop Workflow** (default; halts everything), **Continue** (proceeds to the next node using whatever data was last available, swallowing the error), and **Continue Using Error Output** (routes execution to a second, dedicated error output connector so you can branch error-handling logic explicitly).
- **Notes** — a free-text field for the builder to leave a comment on the node (purpose, gotchas, TODO).
- **Display Note in Flow** — a toggle that, when on, renders the Notes text as a small caption directly under the node on the canvas so it's visible without opening the NDV.
- **Node version line** — small print at the bottom of Settings showing which version of the node type is in use (nodes can have multiple versions as n8n evolves their parameters), with an option to view/change it when more than one version exists.

## 4. INPUT pane (left)

- A **source node dropdown** at the top when the node has more than one incoming connection — lets you pick which upstream node's output you're currently viewing as "input," since multiple branches can feed one node.
- Data displays in **Schema**, **Table**, or **JSON** view (view-switcher tabs above the pane).
- Empty state: **"No input data"** with a prompt to **"Execute previous nodes"** — i.e., you have to run (or have already run) the upstream chain before this node has anything to show or map from.

## 5. OUTPUT pane (right)

- Mirrors the INPUT pane's Schema/Table/JSON toggle, showing what *this* node produced after you hit the execute button.
- Empty state: **"No output data"**, generally paired with an invitation to run the node, or to **pin/set mock data** manually so downstream nodes can be built and tested without re-running real (possibly slow, rate-limited, or destructive) calls upstream.

---

## What matters for our simulator (trim list)

Our teaching prototype never actually calls a real API — credentials are always a pre-wired "Scaler API," and there's no live execution engine underneath. So the panel's job is purely to *teach the shape* of an n8n node without dragging learners through real-tool plumbing. Be opinionated about what to keep:

**Keep (high pedagogical value, low implementation cost):**
- The three-region layout (INPUT / Parameters+Settings tabs / OUTPUT) — this *is* the mental model we're teaching. Don't collapse it.
- Parameters tab with a realistic mix of field types (text, dropdown, toggle, an "Add Filter"-style fixedCollection) — this is the core interaction learners practice.
- The **fx** / drag-to-map expression pattern — arguably the single most important n8n concept to land, since it's the thing that makes workflows feel like programming. Worth a dedicated moment even in a simplified sim.
- **On Error** (Stop / Continue / Continue using error output) and **Retry On Fail** — these map directly to lesson content about robust workflow design and are cheap to render as a dropdown + a toggle-with-two-fields.
- **Notes** + **Display Note in Flow** — trivial to implement (just a textarea and a checkbox) and it's a good "here's how real builders leave breadcrumbs" beat.
- Credential field, but collapsed to a single fixed state: **"Scaler API — Connected"** with no setup flow. Show the pattern exists; don't let learners configure OAuth.
- INPUT/OUTPUT empty states ("No input data" / "Execute previous nodes", "No output data") — cheap, and they teach the correct causal chain (you must run upstream before downstream has data).

**Cut or fake as noise (real n8n complexity that doesn't serve the lesson):**
- **Always Output Data** and **Execute Once** — genuinely useful in production n8n, but they're edge-case performance/looping knobs that will confuse a first-time learner more than they teach. Omit, or bury behind an "Advanced" disclosure if you want completeness for power users.
- **Node version line** — pure plumbing artifact of n8n's internal versioning system; irrelevant to someone learning workflow concepts. Hide entirely.
- Real credential creation flows ("Sign in with Google," "Set up manually," provider-specific OAuth) — out of scope; the whole point of "Scaler API pre-connected" is to skip this. Don't build a credential modal at all.
- Multiple source-node dropdown in INPUT — only matters when a node has multiple incoming branches, which is an advanced-workflow scenario. Fine to support the simple single-source case only and skip the switcher initially.
- resourceLocator's three-mode switch (list/ID/URL) — nice n8n polish, but for a teaching sim a single dropdown or text field communicates "pick a resource" just as well at a fraction of the build cost.
- Schema/Table/JSON view-switcher on INPUT/OUTPUT — one consistent, readable view (e.g., a simple key-value or JSON tree) is enough; three interchangeable renderers is UI investment learners won't notice or need.
- "Test step" / "Listen for Test Event" actually running anything — keep the button and its label for authenticity, but wire it to a canned/mock response rather than any real execution semantics.
