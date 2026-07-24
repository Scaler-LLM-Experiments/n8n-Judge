# Judge — Dashboard Redesign (Phase 1)

Status: Approved for planning
Date: 2026-07-20
Branch: judge-sudhanva

## 1. Context

The original prototype (spec: `2026-07-20-judge-prototype-design.md`) was built and demoed. Feedback from that demo drives this round:

- The interaction felt too bare — "just a working prototype of react flow and nothing else."
- Node property inspection, execution/error animation, and a clearer stage-based structure were requested.
- The palette's categories were invented rather than grounded in real n8n vocabulary, undermining the "teach n8n" goal.

This redesign was scoped into two phases (see prior brainstorm). **This spec covers Phase 1 only**: structural/IA changes (stage nav, palette taxonomy, problem-statement panel, node property panel, mascot-guided building, reset). **Phase 2** (execution/data-flow line animation, error-highlighting during a run) is explicitly deferred — not covered here.

## 2. What Changes From the Original Prototype

- **X-ray/blueprint feature is removed entirely** — no ghost nodes, no pending-count badge, no toggle. Superseded by the mascot-guided building flow (§5), which gives real-time feedback instead.
- **The "Complete" node is removed.** Real n8n has no formal end-node concept — a workflow simply ends when a branch has no further connection. A branch is "done" once it reaches its own action node (e.g. Send Reply). The `complete` node type, its 3 incoming edges, and the `all-paths-complete` test case are all removed from the reference graph and problem spec.
- **The "Route" node is renamed "Switch"**, matching n8n's actual node for multi-way conditional routing (n8n's binary-only equivalent is "If"). The `route` type key becomes `switch` throughout (data, engine, node component, nodeTypes registry). Branch handle ids (`bug_report`/`feature_request`/`urgent_complaint`) are unchanged.
- **The node palette is reorganized into real n8n categories**, researched from n8n's own docs: **Triggers** (bolt-icon, starts a workflow), **AI** (n8n's dedicated AI/LangChain node category), **Core Nodes** (generic, credential-free — flow control like Switch, data transformation like Parse Result), **Actions** (app-specific operations like Send Reply). A search bar filters the palette by label.
- **Node icons use the Phosphor icon library** throughout (palette items, node cards, top-bar icon buttons) — no emoji.

## 3. Top Bar & Stage Navigation

A single persistent top bar spans every screen, replacing the old per-screen headers:

- **Left:** Scaler logo/mark.
- **Center:** a 4-stage stepper — **Understand → Build Node → Stress Testing → Result** — showing completed (checkmark), active (highlighted), and upcoming (muted) stages. These stages are the existing 4 screens (Problem Statement, Dashboard, Eval, Report) relabeled and given a persistent, always-visible sense of progress; the underlying screen state machine is unchanged.
- **Right:** a small cluster of icon buttons, contextual per stage:
  - *Understand:* no extra icons (a "Start" action moves to Build Node, as today).
  - *Build Node:* Problem-Statement icon (reopens the panel in §4), Reset icon (clears the current canvas back to empty), Run icon (primary action).
  - *Stress Testing:* Problem-Statement icon (for reference while answering), a Submit primary action in place of Run.
  - *Result:* Problem-Statement icon only.

This is a default resolved during design — not separately re-confirmed with the user — on the reasoning that a persistent, consistent top bar best serves the "always know where you are" goal implied by the stage-nav request. Worth a quick sanity check during implementation review.

## 4. Problem Statement Panel

Opens from the top bar's Problem-Statement icon (any stage where it's shown). Replaces the old separate "Problem Statement screen"'s role as the *only* place to read the brief — now it's revisitable at any time. Shows:
- The problem title and full-sentence statement (unchanged content from the original spec).
- A plain-language list of what Run actually checks — now 4 items (down from 5, since the Complete-node check is gone): a trigger starts the flow; the email is classified then parsed; a Switch node routes by category; each of the 3 categories sends its own reply.

## 5. Node Property Panel (cosmetic, Phase 1)

Clicking any node already placed on the canvas opens a right-side panel (echoing the reference form-builder's "Attribute Properties" layout): node type/category badge, display name, and type-specific read-only fields (e.g. a Switch node's 3 branch labels). **These values do not affect Run in Phase 1** — this is explicitly deferred to a future "data-execution" phase already flagged as out-of-scope in the original spec. The panel's job right now is to make nodes feel inspectable and real, matching the reference screenshots.

## 6. Mascot-Guided Building

Uses the existing `iris-mascot-kit/` (already vendored in this repo) — a portable React + dotLottie mascot with a pre-built priority-based state machine, 80 animation clips, and a speech-bubble widget, explicitly designed to be integrated into another product.

**No node is ever visually disabled or greyed out.** Every category and every node in it always looks pickable. Instead, correctness is enforced entirely through a real-time correction moment:

- Building proceeds in **3 build steps**: Trigger → (AI + Core Nodes, any order within the step) → Actions. A small text cue near the palette shows the current step (e.g. "Step 1 of 3 — Start the flow"); this is copy only, not a lock. (Careful not to confuse "build step" with the redesign's own Phase 1/Phase 2 scoping in §7 — different concepts, same word avoided below.)
- **Any wrong drop is a hard block** — wrong category, wrong specific node within the right category (e.g. Chat Trigger instead of New Email), or the right node dropped too early for the current build step. The node never lands on the canvas.
- On a wrong drop: the mascot animates from its idle home (bottom-left) to beside the attempted node, a speech bubble appears with a corrective nudge (not the answer — e.g. "Is Chat Trigger really the right start for a 'new email' flow? Think again."), using a `shake-no`/`confused`-family clip, then the mascot returns home.
- On a correct drop: a brief affirmation (`nod-yes`/`correct`-family clip) plays beside the newly-placed node, then the mascot returns home.
- **Division of animation responsibility:** the kit's own dotLottie player drives the character's body performance (pre-authored Lottie clips — arms, eye, etc.). **GSAP** drives everything the kit doesn't: the mascot's on-screen position tweening between its idle home and a target node, and the speech bubble's enter/exit transition.

### New pure-logic engine: drop-time correctness check

A new function, conceptually `checkDrop(studentGraph, paletteNode, problem) -> {allowed, mascotClip, message}`, decides in real time whether an attempted drop is allowed, given the current build step and graph state. This sits alongside the existing `validateGraph` (still the source of truth for Run/Stress-Testing) but serves a different moment: instant, per-drop feedback during Build Node, rather than a final graph-wide check. Exact signature and phase-detection logic are a planning-level concern, not fixed here.

## 7. Scope

**In scope for this phase:**
- Top bar + stage stepper (persistent across screens).
- Palette reorganization into n8n-accurate categories, search bar, Phosphor icons throughout, no disabled states.
- Switch rename, Complete-node removal (data model + engine simplification: `validateGraph`'s path-reachability logic is no longer needed once "done" just means "reached an action," which the existing `each-branch-sends-reply` check already covers).
- Problem Statement panel (richer content, reachable from any relevant stage).
- Node property panel (read-only).
- Mascot integration: idle-home behavior, wrong/correct drop reactions, 3-phase sequencing, hard-block-on-drop.

**Out of scope (Phase 2, not covered by this spec):**
- Execution/data-flow line animation and node error-highlighting during Run/Stress Testing.
- Property panel values affecting correctness (still cosmetic).
- Everything already out of scope from the original spec (backend, auth, persistence, authoring UI, multiple problems).

## 8. Data Model Impact

- `emailTriage.nodePalette`: `route` → `switch`; `category` values updated to drive the new grouping (`trigger`, `ai`, `core`, `action` — `finish`/`process`/`branch` retired); the `complete` entry removed.
- `emailTriage.referenceGraph`: `complete-1` node and its 3 incoming edges removed; `route-1` → `switch-1` (type `switch`).
- `emailTriage.testCases`: `all-paths-complete` removed (4 test cases remain); the remaining 4 keep their current ids/checks (`trigger-present`, `classify-parse-chain`, `switch-present-with-branches` — renamed from `route-present-with-branches` — `each-branch-sends-reply`).
- `validateGraph.js`: `hasPathToComplete`/`buildAdjacency`/`canReachComplete` and the `requiresPath` check kind are removed — no longer needed once there's no Complete node to path-find toward.
- `xray.js` and its test file are deleted; all X-ray wiring in `DashboardScreen` is removed.
