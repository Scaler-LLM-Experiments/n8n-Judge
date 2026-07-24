# Judge Prototype — Codebase Inventory (research report)

> Produced 2026-07-24 by a research subagent as groundwork for the production platform build
> (problem-ingestion pipeline + Next.js full-stack rewrite). Findings verified against the
> prototype source at that date.

Read: `CLAUDE.md`, `docs/adding-a-problem.md`, both problem data files, `app/src/n8n/catalog.js`, `app/src/engine/{simulate,validateGraph,grading,connections,checkDrop,evalScore}.js`, `app/src/App.jsx`, `app/src/screens/{DissectionScreen,EvalScreen,BuildStage,ReportScreen}.jsx`, `app/src/n8n/{N8nEditor,Ndv}.jsx`, `app/src/components/AskAiDrawer.jsx`, all `*.test.js`, and every file under `docs/`.

Note: the folder is `app/src/data/problems/emailTriage/` (camelCase), not `email-triage` as the docs say — the problem `id` string is `'email-triage'` but the directory differs from `lead-triage`'s kebab-case.

---

## 1. Problem data schema

Both `app/src/data/problems/emailTriage/index.js` and `app/src/data/problems/lead-triage/index.js` (497-498 lines each) export an object with **identical field shapes** — only copy/labels/ids differ (email "category" vs lead "intent", 3 branch names swapped, sample emails swapped). This is strong evidence the two are true structural clones — good for validating a schema.

```ts
type Problem = {
  id: string;                    // 'email-triage' | 'lead-triage' — used as ?problem= key
  title: string;
  tagline: string;               // shown on HomeScreen card
  statement: string;             // long problem-statement prose

  dissection: Array<{
    id: string;                  // 'trigger' | 'classify' | 'parse' | 'switch' | 'action' in both problems
    prompt: string;
    options: Array<{ label: string; type: string }>;   // type = a catalog.js node type
    correctType: string;
    wrongHint: string;
    explanation: string;
    unlocks: string[];           // node types added to the Build palette after this Q
  }>;

  testCaseSummary: string[];     // plain-English bullets (display copy only, effectively dead)

  nodePalette: Array<{
    type: string;                 // catalog.js key
    label: string;
    category: 'trigger'|'ai'|'model'|'core'|'action';
    isDistractor: boolean;
  }>;

  referenceGraph: {               // canonical solved flow; seeds #run-story preview
    nodes: Array<{ id, type, position: {x,y}, requiredLabel }>;
    edges: Array<{ source, target, targetHandle?: 'ai_model', branch?: string }>;
  };

  testCases: Array<{              // structural checks validateGraph.js runs
    id: string;
    description: string;
    kind: 'structural';           // only value ever used
    checks: {
      requiredNodeTypes?: string[];
      requiredEdges?: Array<{
        sourceType?: string; sourceCategory?: string;
        targetType?: string; targetHandle?: string; branch?: string;
      }>;
    };
  }>;

  buildSteps: Array<{ id, label, categories: string[] }>;   // LEGACY — DashboardScreen-only

  connectionGuide: Array<{        // LEGACY — DashboardScreen-only
    id, label, hint?: string;
    match: { sourceType?, sourceCategory?, targetType?, targetHandle?, branch? };
  }>;

  branches: Array<{ id: string; label: string }>;   // Switch's labelled outputs — LIVE

  flowSummary: {                  // read-only strip atop Stress Testing
    steps: Array<{ type: string; label: string }>;
    caption: string;
  };

  flow: {                         // canonical sequence rules — LIVE, read by N8nEditor's expectedNext()
    start: string[];                       // valid first node types
    next: Record<string, string[]>;        // per-source-type -> valid next types
    branchNext: string[];                  // valid types after a Switch branch port
    modelNext: string[];                   // valid types after a Chat-Model slot
  };

  buildPhases: Array<{            // guided Build sub-stages — LIVE
    id: string; label: string; coach: string;
    nodeTypes: string[];          // types that must be placed+configured to clear the phase
    pickable: string[];           // types offered in the picker during this phase (incl. distractors)
  }>;

  nodeSetup: Record<string, {     // per-node NDV config — LIVE
    credential?: string;
    locked?: Array<{ label: string; value: string; kind?: 'textarea' }>;
    fields?: Array<{
      key: string; label: string; subtitle?: string;
      options: Array<{ value: string; label: string; correct: boolean; why: string }>;
    }>;
  }>;                             // a node with fields absent has no Verify step (e.g. chat-gemini)

  nodeProbes: Record<string, {    // misconception MCQs on a wrong node drop — LIVE
    prompt: string;
    options: Array<{ text: string; correct: boolean; misconception?: string; response: string }>;
    // exactly one option per probe has correct:true ("Added it by mistake")
  }>;                             // absent types fall back to a generated sequenceProbe() in BuildStage.jsx

  misconceptionLabels: Record<string, string>;   // code -> human label, for ReportScreen

  sampleCases: Array<{            // Run input stream — LIVE
    id: string; from: string; subject: string;
    category: string; urgency: 'LOW'|'MEDIUM'|'HIGH';
    branch: string | null;        // null = intentionally unmatched (fall-through)
    reply: string | null;
  }>;

  simulation?: Record<string, string>;   // OPTIONAL — overrides DEFAULT_NARRATION keys (unused by both problems)

  evalQuestions: Array<{          // Stress-Testing MCQs — LIVE
    id: string;
    caseId?: string;              // OPTIONAL — links to a sampleCases[].id for the live replay column
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
};
```

Differences found between the two problems: none structural — same field set, same counts (5 testCases, 2 evalQuestions, 3 buildPhases, 6 nodeProbes entries), same dissection question ids/order, same `flow`/`branches` shape. Only strings differ.

Optional fields confirmed: `simulation` (absent in both problems), `evalQuestions[].caseId` (present on question 1, absent on question 2 in both problems), `nodeSetup[type].credential`/`.locked`/`.fields` (chat-gemini has no `.fields`), `nodeProbes[type].options[].misconception` (absent on the "Added it by mistake" correct option).

---

## 2. Generic vs. hardcoded

**`app/src/n8n/catalog.js`** (108 lines) — `NODE_CATALOG`, a fixed dictionary of **14 node types**: `trigger, chat-trigger, classify, chat-gemini, parse, switch, action, slack-message, google-docs, webhook, schedule, manual, code, if`. Each entry: `{ type, label, subtitle, description?, category, needsModel?, branches?, params: [{key,label,value,kind,locked?,mappable?,placeholder?}], output }`. **This is the entire node vocabulary the whole app can render** — a new node type not in this dict cannot be dropped/rendered anywhere (picker, NDV, editor).

**`engine/simulate.js`** — the walk is a hardcoded state machine over exactly 5 role-types in sequence: `trigger → classify(needs ai_model edge) → parse → switch(needs branch edge to an action) → action`. The `while(current)` loop has an `if/else if` chain literally checking `current.type === 'classify'|'parse'|'switch'|'action'`; anything else falls through to a generic "advance to `mainOut` edge or dead-end". `simulateAll`'s success criterion is hardcoded too: every sample case with a non-null `branch` must be `delivered`.

**`validateGraph.js`** (59 lines) is fully generic/data-driven — it just runs `problem.testCases[].checks` against the student graph via `edgeMatches`. No hardcoded topology; all coupling is upstream in what shapes of `testCases` an author writes. **Caveat**: `validateGraph.js` and `engine/connections.js` each define their own near-identical private `edgeMatches` helper — no shared module, must be kept in sync manually (refactor target).

**Where the trigger→AI→parse→switch→action coupling actually lives** (3 places, not 1):
1. `n8n/N8nEditor.jsx`'s `expectedNext(ctx, nodes, flow)` — reads `problem.flow` but the four context branches (`modelSlot`, `branch`, `triggerSlot`, generic `next[type]`) are structurally hardwired to the AI-model-port / Switch-branch-port / trigger-start / linear-next shape.
2. `n8n/N8nEditor.jsx`'s `variantOf(type) === 'ai'` check (via `N8nNodeView.jsx`) drives which node gets the dashed Chat-Model input port at all.
3. `engine/simulate.js`'s `if/else if` walk, described above.

Everything else (`branches`, `nodeSetup`, `nodeProbes`, `dissection`, `buildPhases`, `sampleCases`, `evalQuestions`) is genuinely data-only.

**Legacy/dead code not on the live path** (confirmed unused by App.jsx/BuildStage.jsx): `app/src/screens/DashboardScreen.jsx`, `app/src/screens/ProblemStatementScreen.jsx`, `app/src/nodes/*.jsx` (except `nodeIcons.js`, which is live and shared into the NDV/editor), and by extension `engine/checkDrop.js` + `engine/connections.js` + the `buildSteps`/`connectionGuide`/`testCaseSummary` problem fields.

---

## 3. Grading store — `app/src/engine/grading.js` (42 lines)

```ts
type Decision = {
  id: string;            // dedup key
  kind: 'dissection' | 'nodePick' | 'field' | 'stress';
  label: string;         // human-readable prompt/field label, shown in report
  correct: boolean;
  firstTry: boolean;     // THE graded signal — not eventual correctness
  misconception?: string;   // code, only on nodePick decisions in practice
  chosenLabel?: string;      // stress only
  correctLabel?: string;     // stress only
};

type Store = { decisions: Decision[] };
```

Store API: `createStore()`, `recordDecision(store, decision)` (immutable append; **duplicate ids are silently dropped** — "keep the earliest" so re-answering never inflates the first-try signal), `understandingScore(store)` (`round(firstTryCorrect/total*100)`, `null` if empty), `countsByKind(store)`, `misconceptionsHit(store)` (deduped, first-occurrence order).

**Every recorded interaction, by call site:**

| kind | id pattern | call site | correct | firstTry | notes |
|---|---|---|---|---|---|
| `dissection` | `dissection:${questionId}` | `DissectionScreen.jsx:73` | always `true` (fires on Finish, after the learner eventually answered correctly) | `attempts[i] === 0` | recorded in bulk when leaving the screen |
| `nodePick` | `nodePick:${type}` | `BuildStage.jsx:142` | `!!opt.correct` | always `false` | wrong-drop probe MCQ; carries `misconception` |
| `field` | `${node.nodeType}:${field.key}` | `Ndv.jsx:84` | `!!opt?.correct` | `attempts.current === 0` | re-recorded per verify click; store dedup keeps the first |
| `stress` | `stress:${evalQuestionId}` | `EvalScreen.jsx:66-74` | `i === q.correctIndex` | always `true` | includes chosen/correct labels |

**Not recorded in the grading store at all**: Run/test-case results. `validateGraph()` and `simulateAll()` outputs are threaded to `ReportScreen` as separate props (`runResult`, `graph`), never through `recordDecision`. Run pass/fail and the narrated run steps live outside the decisions ledger — the backend trace-event schema must add them.

---

## 4. `App.jsx` state threading (176 lines)

- `resolveProblem()` parses `?problem=<id>` from hash+search, defaults to `email-triage`.
- Dev-only hash routes handled before the real app: `#playground`, `#build`/`#run-story` (→ `BuildPreview`), `#eval-demo`, `#run-demo`, `#report-demo`.
- `Landing()` — picking a problem mounts `<MainApp key={selected.id} problem={selected} />` (remount-on-key resets all state — this is the entire "session start" boundary today).
- `MainApp({ problem })` is the real 4-screen state machine: `SCREEN = {STATEMENT, DASHBOARD, EVAL, REPORT}` in local `useState`; state pieces `dissection`, `runResult`, `builtGraph`, `evalOutcome`, `grading`; `record = (d) => setGrading((s) => recordDecision(s, d))` passed down as `onDecision`.
- `ReportScreen` is the only consumer of all of them.

**What backend persistence needs to change:**
- No session id, timestamps, or user identity anywhere; refresh loses everything.
- `record()` becomes append-to-outbound-queue as well; `Decision` objects are already a clean wire shape.
- `runResult`/`builtGraph`/`evalOutcome` need their own persisted events.
- Screen enum maps naturally to a persisted `currentScreen` for resumability.
- `zustand` is a declared but **entirely unused** dependency — natural home for the outbound event queue.

---

## 5. Ask AI / voice / Deepgram

- **Deepgram: absent.** No dependency, no reference anywhere.
- **"Ask AI"** (`app/src/components/AskAiDrawer.jsx`, opened from `TopBar.jsx`): chat-drawer UI with canned suggestions; any message gets a single hardcoded holding reply after 650ms. No LLM call, no network. UI shell reusable.
- **Voice**: two decorative "coming soon" mentions only. No MediaRecorder/getUserMedia/speech code.

---

## 6. `docs/` folder contents

`adding-a-problem.md` (authoring reference), `build-stage-storyline.md`, `build-stage-implementation-plan.md`, `node-setup-spec.md`, `n8n-reference/01..04` (hand-written notes on real n8n canvas/picker/NDV/AI-agent), `superpowers/specs/2026-07-20-judge-prototype-design.md` (original spec — explicitly anticipated a production build with real auth/persistence/authoring), `superpowers/specs/2026-07-20-judge-dashboard-redesign-design.md`, `superpowers/plans/2026-07-20-judge-prototype-plan.md` (1674-line original build plan). Repo root: `Nodequest-Info.md` (discarded prior concept), `class_08_building_agents_n8n_zapier.py` (course material).

---

## 7. Test setup & problem validation

- Vitest (`app/vite.config.js` inline `test` block, node environment). Only pure `engine/` logic and problem data specs are tested; zero component tests.
- **`data/problems/*/index.test.js` is effectively an authoring-time validator already**: exact counts, `correctIndex` in range, palette covers required canonical types + ≥1 distractor, buildPhases cover required types with string `coach`, every `nodeSetup` field has exactly one `correct` option and every option has `why`+`label`, every `nodeProbes` entry has exactly one `correct` option and every option a `response`, referenceGraph positions numeric. Generalize into `validateProblem(problem)`.
- `validateGraph.test.js` mutation-based structural checks (missing trigger, missing model edge, wrong-port model edge, missing switch chain, missing branch) — template for the authoring validator's graph checks.
- `simulate.test.js` asserts narrative/dead-end behavior — regression coverage if the walk is generalized.
- `grading.test.js` covers store invariants — reusable spec for the backend re-implementation.
- No CI config exists.
