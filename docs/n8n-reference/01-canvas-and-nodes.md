# n8n Reference: Canvas & Node Visuals

Synthesised from docs.n8n.io (Editor UI, Nodes, Workflow Components, Cluster Nodes, Executions/Evaluations) for the purpose of cloning look/behaviour in a React + React Flow prototype. Written in our own words — not copied from n8n's docs.

---

## 1. The Editor Canvas

**Layout.** The editor screen is a three-region layout: a left panel (workflows, credentials, instance settings), a top bar (workflow name, active/inactive toggle, share, top-level tabs), and the canvas itself, which fills the remaining space.

**Background.** The canvas is a large pannable/zoomable surface rendered with a light dotted grid (dots at regular intervals, not lines) on a neutral background. This dotted texture is the main visual cue that you're "on the canvas" vs. in a panel/modal.

**Empty state.** A brand-new, node-less workflow shows a centered dashed-border tile in the middle of the canvas reading **"Add first step"**. Clicking it (or pressing `N`) opens the node picker filtered to trigger nodes, since every workflow must start with one. Newer n8n versions show a second tile/option, **"Build with AI"**, next to or below the first, which hands the workflow scaffolding to an AI assistant instead of manual node-by-node building. Both are literally just call-to-action affordances sitting on the empty dotted canvas — there is no node yet.

**Pan/zoom controls.** A small floating control cluster (bottom-left in current versions) provides: zoom in, zoom out, zoom-to-fit (frames all nodes), reset zoom to 100%, and a "tidy up" action that auto-arranges/cleans node positions. Panning is click-drag on empty canvas; zooming is scroll-wheel/trackpad-pinch. A minimap is not a standard feature — fit/tidy buttons substitute for it.

**Other floating canvas affordances:** a button to open the node picker (search/browse all nodes), a button to drop a sticky note onto the canvas, and (once ≥1 node exists) an "Execute workflow" button that runs the whole graph in sequence. An "Ask Assistant" entry point typically floats on the right edge.

**Top-level tabs.** Above the canvas, a workflow exposes tabs:
- **Editor** — the canvas itself, where you build.
- **Executions** — a list of past runs of this workflow (status, start time, filterable), separate from the live canvas; you can open an execution to see per-node data or copy it back into the editor for debugging.
- **Evaluations** — a dedicated suite for running test cases against the workflow (e.g. an AI workflow) and viewing per-test-case and aggregate scores after clicking "Run Test." Evaluation *setup* still happens partly in the Editor tab; the Evaluations tab is for running/reviewing.

**How we clone it:**
- Use React Flow's `Background` component with `variant="dots"`, tuned gap/size, on a full-bleed pane.
- Build the empty-state tile as an absolutely-centered overlay `<div>` (dashed border, muted text) shown only when `nodes.length === 0`; clicking it opens the same "add node" picker/modal used elsewhere. A second "Build with AI" tile is just a sibling button — safe to stub as a no-op or route to a canned response for the teaching prototype.
- Implement zoom/pan via React Flow's built-in viewport (`fitView`, `zoomIn`/`zoomOut`/`zoomTo`) and render your own small `Panel` (React Flow has a `<Panel>` primitive) in a bottom corner with those buttons plus a "tidy" button that runs a simple auto-layout (e.g. dagre) over current nodes.
- Model Editor / Executions / Evaluations as ordinary route or state-driven tabs above the `<ReactFlow>` canvas; only the Editor tab actually renders the flow — the others can be simple placeholder panels for the prototype.

---

## 2. Node Visual Anatomy

n8n draws two structurally different node silhouettes on the canvas, plus consistent icon/label/port conventions layered on top of both.

### Trigger nodes
- Rendered with a distinct **left-rounded "flag"/pennant outline** — the left edge is a full rounded cap (like a rounded-rect that's been pinched into a flag/shield shape) rather than a plain rectangle, visually marking "this is where the workflow starts."
- Carries a small **orange lightning-bolt badge** anchored on the node, reinforcing the "trigger" semantic (the same bolt icon n8n uses in the node picker's search results to flag trigger-type operations).
- Has **no input port** — a trigger has nothing upstream of it by definition — only an output port on the right.

### Regular / action nodes
- Rendered as a plain **rounded rectangle**.
- Has **both** an input port (left edge) and one or more output ports (right edge); nodes with conditional branching (e.g. `If`, `Switch`) expose multiple labeled output ports (e.g. "true"/"false").

### Shared conventions (both shapes)
- The **integration/app icon** (e.g. Slack, HTTP, Postgres logo) sits centered inside the node body — it's the dominant visual content of the node itself; there's no visible text inside the shape.
- The **node's name is rendered as a label below the node**, not inside it. This label is user-editable (rename in place) and wraps/truncates for long names.
- **Ports are small circles** sitting on the node's edge at the vertical center (input on the left edge of regular nodes, output(s) on the right edge of all nodes). They are the drag targets for drawing new connections and the snap targets when dropping a connection.
- A short connector line trails from a node's output port to a **small "+" affordance** floating just past it — this is the "add next node" shortcut. Clicking it opens the node picker; whichever node you choose is automatically inserted and wired into that output, so you never have to manually drag a wire for the common "add the next step" case. Manual click-drag from a port is still how you connect two already-existing nodes or fan out multiple branches.

**How we clone it:**
- Two React Flow custom node components sharing most logic: `TriggerNode` (CSS clip-path or SVG path for the rounded-flag outline; no `Handle` of type `target`) and `ActionNode` (plain rounded-rect `div`; one `target` Handle left, one-or-more `source` Handles right, positioned/labeled for branchy nodes).
- Render the integration icon as a centered `<img>`/SVG inside the node box; render the name as a sibling absolutely-positioned `<div>` below the node bounding box (outside React Flow's node box so it doesn't affect the node's own hit-testing/handle math) — matches n8n's "label lives below, not inside."
- Ports: React Flow `Handle` components styled as small filled circles (`border-radius: 50%`), one per side as needed; keep them small (~8–10px) and centered vertically.
- The "+" add-connection button: an absolutely-positioned button rendered a fixed offset to the right of each node's output handle, connected to it visually by a short static line (an SVG line/edge stub, not a real React Flow edge). Its `onClick` opens the node picker and, on selection, programmatically creates both the new node (positioned to the right) and a real edge from the source handle to the new node's input — i.e. do the "auto-wire" as an explicit `addEdge` call in the selection handler, not something React Flow does for you.

---

## 3. Node States

- **Unconfigured** — a freshly added node that still needs required parameters filled in typically shows a subdued/placeholder look and won't execute successfully until configured (surfaces as an error once run).
- **Error** — a **red warning triangle (⚠)** overlays the node when it has a problem: missing/invalid credentials, missing required parameters, or a runtime failure on last execution. Hovering the triangle shows a tooltip explaining the specific issue.
- **Dirty / stale** — a related but distinct indicator: after upstream changes make a previously-successful node's cached output stale, its border color changes and its status icon swaps from a green check to a **yellow triangle**, with a tooltip explaining the data is stale and should be re-run.
- **Selected** — clicking a node gives it a visible selection outline/highlight (used for multi-select, copy/paste, delete, and drag-to-move-group).
- **Disabled/deactivated** — nodes can be toggled off via hover controls; disabled nodes render visually muted (e.g. dashed/greyed) and are skipped during execution but stay in the graph.
- Hovering any node reveals a small floating control row (execute-this-node, deactivate, delete, "..." context menu) — these controls are not part of the node's resting-state visuals.

**How we clone it:**
- Drive all state visuals off node `data` flags (`data.hasError`, `data.isStale`, `data.disabled`) rather than separate node types — keep one component per shape, branch styling internally.
- Error/dirty badges: a small absolutely-positioned icon (triangle) in a corner of the node box, red for error / yellow for stale, each with a native `title` or a tooltip lib for the explanation text.
- Selection: rely on React Flow's built-in `selected` prop on node data to toggle an outline class — no custom selection logic needed.
- Hover controls: an absolutely-positioned button row that fades in on the node's `onMouseEnter`, positioned above the node.

---

## 4. Sub-node Ports (AI / Cluster Nodes) — high level

n8n's AI-oriented nodes (e.g. AI Agent) are **cluster nodes**: one "root" node plus one or more **sub-nodes** (chat model, memory, tools) that extend it. Visually, sub-node connection points hang **underneath** the root node rather than to its side — each is a small **diamond-shaped port with a text label** (e.g. "Chat Model", "Memory", "Tool"), and an additional **"+" sits beneath** the row to attach more sub-nodes/tools. A root node and all of its sub-nodes must live together inside the same **Canvas Group** (n8n's node-grouping/collapse feature); a sub-node connection cannot cross a group boundary, and outside nodes may only connect into a group via its first/last node, never into the middle.

This is intentionally a light-touch note here — a dedicated pass on the AI Agent node will cover the full sub-node interaction model (adding a tool, swapping a model, etc.) in depth.

**How we clone it (high level):**
- Model as a distinct node type (e.g. `ClusterRootNode`) with extra `Handle`s positioned along the *bottom* edge instead of the sides, styled with a CSS diamond (rotated square) instead of a circle, each with a text label beneath it and its own small "+" for attaching a sub-node type.
- Treat "Canvas Group" as a lightweight parent/frame concept (React Flow supports parent/child node nesting via `parentNode` + `extent: 'parent'`) if/when we get to grouping — not required for the base canvas-and-nodes pass.

---

## Sources
- https://docs.n8n.io/build-your-first-workflow
- https://docs.n8n.io/courses/level-one/chapter-1/
- https://docs.n8n.io/build/understand-workflows/workflow-components/work-with-nodes
- https://docs.n8n.io/build/understand-workflows/workflow-components/canvas-groups
- https://docs.n8n.io/integrations/builtin/cluster-nodes/
- https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes
- https://docs.n8n.io/workflows/executions/manual-partial-and-production-executions/
- https://docs.n8n.io/build/understand-workflows/understand-executions/view-executions-for-a-single-workflow
- https://github.com/n8n-io/n8n-docs/blob/main/docs/build/integrate-ai/test-and-improve-ai-workflows/run-quick-evaluations.md
- n8n Community: "yellow triangle warning icon" / "red-orange warning triangles" threads (node error & dirty-node states)
- DeepWiki n8n-io/n8n-docs summaries of Editor UI and Canvas (secondary, cross-checked against docs.n8n.io pages above)
