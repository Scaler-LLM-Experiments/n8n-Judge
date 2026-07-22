# Build stage — storyline (to wire once the n8n kit is ready)

This captures the guided "Build your flow" experience so we can build the core
n8n components first and choreograph this on top later. Nothing here is built
yet; it's the target script.

## Where it sits
Overall stages (top nav): **Understand → Build → Stress Testing → Result.**
This doc is the **Build** stage. It has **three guided sub-phases**, shown as a
sub-stage indicator below the nav.

## The n8n interaction we mimic (built as the reusable kit first)
- A blank **canvas** (no left palette).
- **+ add-node**: an "Add first step" + on an empty canvas; after that, a **+ on
  a node's output** opens the picker and **auto-connects** the new node (adding
  *is* connecting — no separate wiring step).
- A **right-side node-picker drawer** (searchable, grouped, with 2–3 options
  incl. a confuser) to choose the node.
- A **bottom NDV** on node click: **Input JSON | Parameters/Settings | Output
  JSON**, drag a field from Input into a parameter (`{{ $json.field }}`),
  credentials shown **locked** ("Scaler API — connected").
- A **"Set me up"** tag on a freshly added, unconfigured node.

## The three build sub-phases (mascot-narrated)
Iris hand-holds. Between phases: an ~80% overlay dims the canvas, Iris slides to
centre and narrates, then the overlay lifts to the next phase (no "move to step"
button clicking).

1. **Set your trigger.** Iris (from bottom-left) → centre: "Let's build. First,
   what starts the flow?" Add-first-step → picker shows *New Email* vs *Chat
   Trigger* (confuser). Pick → trigger node fills, "Set me up" tag → open NDV →
   configure. Phase complete → overlay: "Trigger's set."
2. **Give it a brain.** Overlay: "Now let's make it understand each email." Add
   *Classify with AI* off the trigger's +, attach a *Chat Model* sub-node, then
   *Parse Result*. Configure via NDV (see the AI output become structured
   fields). Phase complete → overlay: "It can read and label emails now."
3. **Route & reply.** Overlay: "Last part — send the right reply." Add *Switch*,
   define the three category branches, add a *Send Reply* on each. Phase
   complete.

## End of Build
Instead of "Run", the primary action reads **"Move to Stress Testing"**. Before
advancing, a **Run** plays the case-by-case data-flow simulation (sample emails
streaming through the flow) as the payoff, then → Stress Testing.

## Principles
- Same interaction language as real n8n, so the skill transfers 1:1.
- Mascot narrates transitions; learner never hunts for a "next" button.
- Distractors live inside the picker (right node), not as greyed palette items.
- Everything read-only that would need real credentials is shown pre-connected
  as "Scaler API".
