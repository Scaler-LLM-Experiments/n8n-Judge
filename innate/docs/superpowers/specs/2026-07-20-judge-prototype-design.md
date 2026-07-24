# Judge — Node-Based Workflow Assessment Prototype

Status: Approved for planning
Date: 2026-07-20
Branch: judge-sudhanva

## 1. Problem & Goal

Scaler's AIML/DSML coding-batch learners are mostly non-tech folks learning to build agentic workflows for their orgs. "Judge" is an assignment/assessment platform where learners are given a problem statement and must build the solution as a node-based workflow (à la n8n), rather than writing code.

This spec covers a **standalone alignment prototype**: a small, real (not throwaway-quality, but scoped-down) app that demonstrates the full interaction loop end-to-end with one fully worked example problem, using mock/hardcoded data. Its purpose is to validate the interaction design with stakeholders before committing to a production build (with real auth, persistence, an authoring UI, and a broader problem catalog).

Prior art considered: `Nodequest-Info.md` in this repo describes an earlier, more game-like exploration (levels, achievements, hints, sandbox). That was a separate direction — this design borrows nothing from it structurally and is purpose-built for assessment.

## 2. Scope

**In scope for this prototype:**
- Problem Statement screen → Dashboard (node canvas + palette) → Run (structural test cases) → Eval (gated MCQs) → Report, for one hardcoded example problem.
- X-ray/blueprint mode: ghost outlines of missing required nodes overlaid on canvas, plus a pending-count badge.
- Node palette with required nodes mixed with distractor nodes.
- Styling using the `syntax-design-system` already present in this repo (Scaler's brand system).

**Out of scope (explicitly deferred):**
- Backend, authentication, persistence, accounts, submission history, multi-user anything.
- Data-execution test cases (mock input/output simulation through node behavior) — the schema is shaped to allow this later; not built now.
- Authoring UI for instructors — problems are hand-written TypeScript/JSON objects.
- Hints, achievements, sandbox mode, level map/progression, import/export to real n8n — all Nodequest-era ideas, not requested here.
- Multiple problems — just the one example, wired fully end-to-end.

## 3. Tech Stack

- Vite + React
- React Flow (xyflow) for the node canvas — drag/drop, connections, custom node rendering
- `syntax-design-system` (already vendored in this repo under `syntax-design-system/`) for visual styling: sharp corners (no `border-radius`), Plus Jakarta Sans for UI text, Scaler Blue `#0055FF` primary, hairline card borders, Lucide icons. Reuse its React primitives (`Button`, `Card`, `Badge`, etc.) where they fit.
- No backend. All problem content and state lives in the frontend (React state + a static problem-spec module).

## 4. Screen Flow

```
Problem Statement Screen
        ↓ (Start)
Dashboard
 ├─ Left panel: scrollable node palette (drag or click to add;
 │  includes distractor nodes alongside the required ones)
 ├─ Center: canvas (React Flow) — build the workflow
 ├─ X-ray toggle: overlays dashed "ghost" outlines of missing
 │  required nodes at their authored reference positions,
 │  plus a small "N nodes pending" badge
 └─ Run button
        ↓ (Run → all structural test cases pass)
Eval Step (only reachable once all test cases pass; Run remains
available to retry/edit before that)
 ├─ 2 fixed multiple-choice questions about the workflow's behavior
 └─ Submit
        ↓
Report Screen
 ├─ Test case results (pass/fail per case, with which requirement failed)
 ├─ Eval question results (correct/incorrect)
 └─ Overall outcome — single-attempt view, nothing persisted
```

If Run fails some test cases, the learner stays on the Dashboard and can keep editing and re-running. The Eval step is gated behind a fully passing run.

## 5. Data Model

Each problem is one typed spec object, e.g. `problems/email-triage.ts`:

```ts
{
  id, title, statementMarkdown,
  nodePalette: [{ type, label, category, isDistractor }, ...],
  referenceGraph: {
    nodes: [{ id, type, position, requiredLabel }],   // position drives X-ray ghost placement
    edges: [{ source, target, branch?: string }],      // branch label for multi-way Route node
  },
  testCases: [
    { id, description, kind: 'structural',
      checks: { requiredNodeTypes: [...], requiredEdges: [...], requiresPath: true } }
  ],
  evalQuestions: [
    { id, prompt, options: [...], correctIndex }
  ],
}
```

## 6. Validation Logic

`validateGraph(studentGraph, referenceGraph)` — a plain function, not a generic rules interpreter:
1. Checks every required node type from the reference graph exists in the student's graph. Distractor nodes present in the student's graph are ignored — they don't cause failures, they're just noise the learner has to filter out.
2. Checks required edges exist (matching source/target node types, and the correct branch for the Route node).
3. Checks a connected path exists from the trigger to a Complete node along every required branch.
4. Returns per-test-case pass/fail plus which specific requirement failed, surfaced in the Report.

This is **structural-only** for the prototype. The spec's shape leaves room for a `kind: 'execution'` test case later (mock input flowing through simulated node behavior to an expected output) without changing the schema — deferred, not built now.

**X-ray ghost outlines**: computed as the set of `referenceGraph.nodes` whose required type has no match yet in the student's graph, rendered as dashed placeholder boxes at their authored `position`.

## 7. Example Problem: "Email Triage Automation"

Grounded in `class_08_building_agents_n8n_zapier.py`'s Zapier "AI Email Triage" exercise (Steps 1–5, Paths A/B/C), so it reflects what learners actually built in Class 8 rather than an invented scenario.

**Statement:** "Your inbox is full of mixed feedback. Build a flow that watches for new emails, uses AI to classify each one (Bug Report / Feature Request / Complaint), and routes urgent complaints differently from everything else — each path sends the right reply."

**Reference graph:** `New Email (trigger)` → `Classify with AI (process)` → `Parse Result (process)` → `Route (branch, 3-way: Bug Report / Feature Request / Urgent Complaint)` → each branch → its own `Send Reply (action)` → `Complete`.

**Node palette (scrollable), required vs. distractor:**
- Required: New Email (trigger), Classify with AI, Parse Result, Route (3-way branch), Send Reply ×3
- Distractors (pulled from the script's own "alternative tools" list in Exercise 4.2 and elsewhere): Slack — Send Message, Google Calendar — Create Event, Notion — Create Page, Web Search tool, Google Docs — Create Document, Chat Trigger (wrong trigger type)

**Test cases (structural):**
1. `New Email` trigger present and is the sole entry point.
2. `Classify with AI` → `Parse Result` chain present before the branch.
3. `Route` node present with all 3 branches connected (Bug Report, Feature Request, Urgent Complaint).
4. Each branch reaches its own `Send Reply` node.
5. Every path terminates at a `Complete` node (no dangling nodes).

**Eval questions (styled after the script's Quiz 3 — testing judgment, not recall):**
1. "A customer email arrives that's just a general question, with no bug/feature/complaint keywords. What happens in this flow?" → correct: it doesn't match any of the 3 defined paths, so nothing sends — a real gap worth noticing.
2. "Why is this modeled as a fixed-path classifier rather than a full autonomous agent choosing tools?" → correct: the structure is fixed and predictable; the AI only does one classification step, it doesn't dynamically choose which tools to call.

## 8. Report

Single-attempt view (nothing persisted): per-test-case pass/fail with the failing requirement named, per-eval-question correct/incorrect, and an overall outcome line.
