# Build stage — implementation plan

Ties together: the **n8n component kit** (built), the **guided storyline**
(`build-stage-storyline.md`), the **section-gated node setup + grading**
(`node-setup-spec.md`), and a final **Run** over the test cases.

Overall stages stay: **Understand → Build → Stress Testing → Result.** This plan
rebuilds the **Build** stage on the n8n kit and threads grading through
everything. Each phase below is independently shippable and verified with the
Playwright screenshot script (`app/scripts/shoot.mjs`) + `vitest`.

---

## Phase 0 — Data model (the spine everything reads from)
Make the whole experience data-driven so future problems are "author JSON, not code."

- Extend `emailTriage` (and the shared catalog) with:
  - `buildPhases`: the 3 sub-phases — `{ id, label, coach, nodeTypes[] }` (Trigger / Give-it-a-brain / Route-&-reply), each with the mascot's transition line.
  - Per node, a **`setup`** block from `node-setup-spec.md`: `sections[]`, each with `prompt`, `candidates[] {fieldOrOption, correct, why}`, and the `confirm` condition (which candidate/mapping passes).
  - Per confuser node, a **`probe`** block: the misconception MCQ (`prompt`, `options[] {text, correct, response}`).
  - Keep `sampleCases` (Run), `testCases` (validation), `stressTest`, `dissection` as-is.
- New pure module `engine/grading.js`: a session store shape
  `{ decisions: [{ id, kind:'dissection'|'nodePick'|'field'|'probe'|'stress', correct, firstTry, misconception? }] }`
  + `understandingScore(store)` and `misconceptionsHit(store)`. Unit-tested.

**Verify:** vitest on grading; data shape sanity test.

---

## Phase 1 — Build stage on the n8n editor + storyline
Replace the old drag-palette `DashboardScreen` build with the `N8nEditor` kit, driven by the 3 phases.

- New `screens/BuildStage.jsx` wrapping `N8nEditor`, with:
  - **Sub-stage indicator** under the top nav (Trigger · Brain · Route).
  - **Phase gating**: the node picker only offers the current phase's correct node(s) + its confusers. Adding the required node(s) completes the phase.
  - **Mascot-narrated overlay transitions**: on phase complete, ~80% overlay + Iris centre with the phase's `coach` line → lifts into next phase (no "next" button). Reuse `MascotPlayer` + GSAP.
- Keep the `+`→picker→auto-connect flow from the kit. Empty canvas → "Add first step" (trigger picker).

**Verify:** Playwright — walk trigger→brain→route, screenshot each phase + each overlay transition.

---

## Phase 2 — Section-gated NDV + grading
Turn the bottom sheet into the graded, click-to-learn experience.

- `Ndv.jsx` reads the node's `setup.sections`. For each section: render candidate fields as **clickable right/wrong**; clicking shows the `why` (Iris voice); selecting/mapping the correct one **confirms the section**.
- Gate: **"Complete setup" disabled until all sections pass**; node ⚠ clears on completion.
- On each field decision, record to the grading store (`kind:'field'`, firstTry, misconception if a wrong option was clicked first).
- Keep drag-to-map for the mapping candidates; keep Settings tab (On Error/Retry/Notes) ungated.

**Verify:** Playwright — open each node, click a wrong field (see why), then correct → section confirms → Complete setup enables. Screenshot the states.

---

## Phase 3 — Wrong-node-drop probes
- On drop, `checkDrop` decides: correct → place; **plausible wrong** → fire the node's `probe` MCQ (Iris), record answer, animate node back to palette; **obvious wrong** → light "not for this step" nudge + return.
- Record probe outcomes to the grading store.

**Verify:** Playwright — drop Chat Trigger on the trigger step → probe appears → answer → node returns. Screenshot.

---

## Phase 4 — Run over the test cases
After the 3 phases + wiring are done, the primary action is **Run** (then "Move to Stress Testing").

- Run first checks structure with `validateGraph` (incl. the new "Chat Model connected" edge). If gaps, Iris names the first gap (no leetcode list).
- If structurally sound, play the **case-by-case data-flow simulation** (`simulate.js`) — sample emails stream through, each node lights up, narration shows routing, and dead-ends are surfaced (the general-question email intentionally falls through).
- Success (all categorised emails delivered) → **"Move to Stress Testing."**

**Verify:** Playwright — build the correct flow, Run, screenshot the animated simulation + the pass summary.

---

## Phase 5 — Report aggregation
- Report pulls one **Understanding score** from the grading store across dissection + node picks + field decisions + stress test.
- Surface **specific misconceptions hit** ("treated Chat Trigger as an email trigger", "routed on urgency not category"), plus the Run result and stress-test result.

**Verify:** full Playwright run-through end to end; screenshot the report.

---

## Sequencing & principles
- Build **Phase 0 first** (everything reads from it), then 1→5 in order; each is demoable.
- Keep it **client-side**; grading store is React state/context, shaped to be backend-ready (a submission object).
- **Verify visually every phase** with `shoot.mjs` — no more building blind.
- Reuse what exists: `N8nEditor`, `Ndv`, `NodePickerDrawer`, `simulate.js`, `validateGraph.js`, `MascotPlayer`, `ConceptFlow`.
- The old `DashboardScreen` (drag-palette builder) is retired once `BuildStage` reaches parity.
