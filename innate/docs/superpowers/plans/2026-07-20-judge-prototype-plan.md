# Judge Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone React + React Flow prototype of "Judge" — a node-based workflow assessment tool — implementing the full Problem Statement → Dashboard (build + X-ray + Run) → Eval → Report loop for one hardcoded example problem ("Email Triage"), styled with the Syntax by Scaler design system.

**Architecture:** A single Vite + React app under `app/`, with problem content as a plain data object, a small set of pure validation/scoring functions (unit-tested with Vitest), a React Flow canvas with custom node types, and four screen components wired together by a top-level state machine in `App.jsx`. No backend, no auth, no persistence — mirrors the approved spec exactly.

**Tech Stack:** Vite, React 18, React Flow (`reactflow` v11), Vitest (pure-logic unit tests only), Syntax by Scaler design-system primitives copied in from `syntax-design-system/`.

## Global Constraints

- No backend, authentication, persistence, or multi-user state — everything lives in frontend React state for a single session (per spec §2).
- Test cases are structural-only (node/edge presence, branch correctness, path-to-Complete) — no data-execution simulation (per spec §3, §6).
- Distractor nodes in the palette must never cause a test-case failure by their mere presence (per spec §6).
- Styling follows `syntax-design-system/SKILL.md` non-negotiables: zero `border-radius` anywhere, Plus Jakarta Sans for all UI text (Clash Grotesk reserved for headline-scale type only, unused in this prototype's small UI), primary blue `#0055FF` via `var(--brand-primary)`, hairline 1px card borders, no decorative gradients.
- One problem only ("Email Triage," grounded in `class_08_building_agents_n8n_zapier.py`'s Zapier exercise) — no problem catalog, no authoring UI (per spec §2).
- Eval step only reachable after all test cases pass (per spec §4).

---

## Task 1: Scaffold the Vite app with Syntax by Scaler styling

**Files:**
- Create: `app/package.json`
- Create: `app/vite.config.js`
- Create: `app/index.html`
- Create: `app/.gitignore`
- Create: `app/src/main.jsx`
- Create: `app/src/App.jsx`
- Create: `app/src/index.css`
- Create: `app/src/design-system/colors_and_type.css` (copied)
- Create: `app/src/design-system/fonts/ClashGrotesk-Variable.ttf` (copied)
- Create: `app/src/design-system/Button.jsx` (copied)
- Create: `app/src/design-system/Card.jsx` (copied)
- Create: `app/src/design-system/Badge.jsx` (copied)
- Create: `app/src/design-system/Alert.jsx` (copied)
- Create: `app/src/design-system/RadioGroup.jsx` (copied)
- Create: `app/src/design-system/Switch.jsx` (copied)

**Interfaces:**
- Produces: `Button`, `Card`, `Badge`, `Alert`, `RadioGroup`, `Switch` React components importable from `../design-system/<Name>.jsx` (paths relative to `src/screens/` or `src/components/` etc., one level up to `src/design-system/`). Same props as documented in `syntax-design-system/components/**/*.d.ts` — unmodified copies.
- Produces: `app/src/index.css` providing global fonts/colors/element defaults (`--brand-primary`, `--fg-1`, `--fg-2`, `--border-subtle`, `--surface-0`, etc. as CSS custom properties on `:root`).

The design-system's own `SKILL.md` instructs copying primitives into consumer projects rather than importing across repo boundaries, which also avoids Vite's dev-server file-system access restrictions for paths outside the app root.

- [ ] **Step 1: Create the app directory and package.json**

```bash
mkdir -p "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge/app/src"
```

Create `app/package.json`:

```json
{
  "name": "judge-prototype",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "reactflow": "^11.11.4"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^5.4.11",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```js
// app/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 3: Create index.html**

```html
<!-- app/index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Judge — Email Triage</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create .gitignore**

```
node_modules
dist
```

Save as `app/.gitignore`.

- [ ] **Step 5: Copy design-system CSS, fonts, and primitives**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge"
mkdir -p app/src/design-system/fonts
cp syntax-design-system/colors_and_type.css app/src/design-system/colors_and_type.css
cp syntax-design-system/fonts/ClashGrotesk-Variable.ttf app/src/design-system/fonts/ClashGrotesk-Variable.ttf
cp syntax-design-system/components/core/Button.jsx app/src/design-system/Button.jsx
cp syntax-design-system/components/core/Card.jsx app/src/design-system/Card.jsx
cp syntax-design-system/components/core/Badge.jsx app/src/design-system/Badge.jsx
cp syntax-design-system/components/feedback/Alert.jsx app/src/design-system/Alert.jsx
cp syntax-design-system/components/forms/RadioGroup.jsx app/src/design-system/RadioGroup.jsx
cp syntax-design-system/components/forms/Switch.jsx app/src/design-system/Switch.jsx
```

- [ ] **Step 6: Create the global stylesheet**

```css
/* app/src/index.css */
@import './design-system/colors_and_type.css';

html, body, #root {
  height: 100%;
  margin: 0;
}

* {
  box-sizing: border-box;
}
```

- [ ] **Step 7: Create a placeholder App.jsx and main.jsx**

```jsx
// app/src/App.jsx
import React from 'react';
import { Card } from './design-system/Card.jsx';

export default function App() {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ maxWidth: 420 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 8 }}>
          Judge
        </div>
        <h1 style={{ margin: 0 }}>Scaffold ready</h1>
      </Card>
    </div>
  );
}
```

```jsx
// app/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 8: Install dependencies and verify in the browser**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge/app"
npm install
npm run dev
```

Open the printed local URL in a browser. Expected: a centered white card reading "Scaffold ready" in Plus Jakarta Sans, sharp rectangular corners, hairline border. Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 9: Commit**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge"
git add app/
git commit -m "Scaffold Vite app with Syntax by Scaler design-system primitives"
```

---

## Task 2: Problem-spec data model — "Email Triage"

**Files:**
- Create: `app/src/data/problems/emailTriage.js`
- Test: `app/src/data/problems/emailTriage.test.js`

**Interfaces:**
- Produces: `emailTriage` — a plain object with shape `{ id, title, statement, nodePalette: [{type, label, category, isDistractor}], referenceGraph: {nodes: [{id, type, position:{x,y}, requiredLabel}], edges: [{source, target, branch?}]}, testCases: [{id, description, kind, checks}], evalQuestions: [{id, prompt, options, correctIndex}] }`. This is the single source of truth every later task (validateGraph, xray, scoreEval, all screens) imports from `../data/problems/emailTriage.js`.

- [ ] **Step 1: Write the failing sanity tests**

```js
// app/src/data/problems/emailTriage.test.js
import { describe, it, expect } from 'vitest';
import { emailTriage } from './emailTriage.js';

describe('emailTriage problem spec', () => {
  it('has 5 test cases and 2 eval questions', () => {
    expect(emailTriage.testCases).toHaveLength(5);
    expect(emailTriage.evalQuestions).toHaveLength(2);
  });

  it('every eval question has a valid correctIndex within its options', () => {
    for (const q of emailTriage.evalQuestions) {
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
    }
  });

  it('the palette includes every required node type', () => {
    const requiredTypes = new Set(
      emailTriage.nodePalette.filter((n) => !n.isDistractor).map((n) => n.type)
    );
    for (const type of ['trigger', 'classify', 'parse', 'route', 'action', 'complete']) {
      expect(requiredTypes.has(type)).toBe(true);
    }
  });

  it('the palette includes at least one distractor node', () => {
    expect(emailTriage.nodePalette.some((n) => n.isDistractor)).toBe(true);
  });

  it('every reference graph node has a numeric canvas position', () => {
    for (const node of emailTriage.referenceGraph.nodes) {
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge/app"
npx vitest run src/data/problems/emailTriage.test.js
```

Expected: FAIL — `emailTriage.js` does not exist / has no exports.

- [ ] **Step 3: Write the problem spec**

```js
// app/src/data/problems/emailTriage.js

export const emailTriage = {
  id: 'email-triage',
  title: 'Email Triage Automation',
  statement:
    "Your inbox is full of mixed feedback. Build a flow that watches for new emails, uses AI to classify each one (Bug Report / Feature Request / Complaint), and routes urgent complaints differently from everything else — each path sends the right reply.",

  nodePalette: [
    { type: 'trigger', label: 'New Email', category: 'trigger', isDistractor: false },
    { type: 'classify', label: 'Classify with AI', category: 'process', isDistractor: false },
    { type: 'parse', label: 'Parse Result', category: 'process', isDistractor: false },
    { type: 'route', label: 'Route', category: 'branch', isDistractor: false },
    { type: 'action', label: 'Send Reply', category: 'action', isDistractor: false },
    { type: 'complete', label: 'Complete', category: 'finish', isDistractor: false },
    { type: 'slack-message', label: 'Slack — Send Message', category: 'action', isDistractor: true },
    { type: 'calendar-event', label: 'Google Calendar — Create Event', category: 'action', isDistractor: true },
    { type: 'notion-page', label: 'Notion — Create Page', category: 'action', isDistractor: true },
    { type: 'web-search', label: 'Web Search', category: 'process', isDistractor: true },
    { type: 'google-docs', label: 'Google Docs — Create Document', category: 'action', isDistractor: true },
    { type: 'chat-trigger', label: 'Chat Trigger', category: 'trigger', isDistractor: true },
  ],

  referenceGraph: {
    nodes: [
      { id: 'trigger-1', type: 'trigger', position: { x: 0, y: 200 }, requiredLabel: 'New Email' },
      { id: 'classify-1', type: 'classify', position: { x: 260, y: 200 }, requiredLabel: 'Classify with AI' },
      { id: 'parse-1', type: 'parse', position: { x: 520, y: 200 }, requiredLabel: 'Parse Result' },
      { id: 'route-1', type: 'route', position: { x: 780, y: 200 }, requiredLabel: 'Route' },
      { id: 'action-bug', type: 'action', position: { x: 1040, y: 40 }, requiredLabel: 'Send Reply — Bug Report' },
      { id: 'action-feature', type: 'action', position: { x: 1040, y: 200 }, requiredLabel: 'Send Reply — Feature Request' },
      { id: 'action-urgent', type: 'action', position: { x: 1040, y: 360 }, requiredLabel: 'Send Reply — Urgent Complaint' },
      { id: 'complete-1', type: 'complete', position: { x: 1300, y: 200 }, requiredLabel: 'Complete' },
    ],
    edges: [
      { source: 'trigger-1', target: 'classify-1' },
      { source: 'classify-1', target: 'parse-1' },
      { source: 'parse-1', target: 'route-1' },
      { source: 'route-1', target: 'action-bug', branch: 'bug_report' },
      { source: 'route-1', target: 'action-feature', branch: 'feature_request' },
      { source: 'route-1', target: 'action-urgent', branch: 'urgent_complaint' },
      { source: 'action-bug', target: 'complete-1' },
      { source: 'action-feature', target: 'complete-1' },
      { source: 'action-urgent', target: 'complete-1' },
    ],
  },

  testCases: [
    {
      id: 'trigger-present',
      description: 'New Email trigger present and is the sole entry point.',
      kind: 'structural',
      checks: { requiredNodeTypes: ['trigger'] },
    },
    {
      id: 'classify-parse-chain',
      description: 'Classify with AI → Parse Result chain present before the branch.',
      kind: 'structural',
      checks: {
        requiredNodeTypes: ['classify', 'parse'],
        requiredEdges: [{ sourceType: 'classify', targetType: 'parse' }],
      },
    },
    {
      id: 'route-present-with-branches',
      description: 'Route node present and receives input from Parse Result.',
      kind: 'structural',
      checks: {
        requiredNodeTypes: ['route'],
        requiredEdges: [{ sourceType: 'parse', targetType: 'route' }],
      },
    },
    {
      id: 'each-branch-sends-reply',
      description: 'Each branch reaches its own Send Reply node (Bug Report, Feature Request, Urgent Complaint).',
      kind: 'structural',
      checks: {
        requiredEdges: [
          { sourceType: 'route', targetType: 'action', branch: 'bug_report' },
          { sourceType: 'route', targetType: 'action', branch: 'feature_request' },
          { sourceType: 'route', targetType: 'action', branch: 'urgent_complaint' },
        ],
      },
    },
    {
      id: 'all-paths-complete',
      description: 'Every path terminates at a Complete node (no dangling nodes).',
      kind: 'structural',
      checks: { requiresPath: true },
    },
  ],

  evalQuestions: [
    {
      id: 'general-question-gap',
      prompt:
        "A customer email arrives that's just a general question, with no bug/feature/complaint keywords. What happens in this flow?",
      options: [
        'It gets logged as a Feature Request by default',
        "It doesn't match any of the 3 defined paths, so nothing sends",
        'The flow throws an error and stops',
        'It is automatically escalated as Urgent Complaint',
      ],
      correctIndex: 1,
    },
    {
      id: 'why-fixed-path',
      prompt:
        'Why is this modeled as a fixed-path classifier rather than a full autonomous agent choosing tools?',
      options: [
        'Because Gemini cannot be used in an autonomous agent',
        'Because n8n does not support branching logic',
        "Because the structure is fixed and predictable — the AI only does one classification step, it doesn't choose which tools to call",
        'Because fixed-path classifiers are always more accurate than agents',
      ],
      correctIndex: 2,
    },
  ],
};
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/data/problems/emailTriage.test.js
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge"
git add app/src/data/
git commit -m "Add Email Triage problem spec grounded in Class 8 curriculum"
```

---

## Task 3: Structural validation engine

**Files:**
- Create: `app/src/engine/validateGraph.js`
- Test: `app/src/engine/validateGraph.test.js`

**Interfaces:**
- Consumes: `emailTriage` from `../data/problems/emailTriage.js` (Task 2) — specifically `problem.testCases`.
- Produces: `validateGraph(studentGraph, problem) -> { allPassed: boolean, results: [{id, description, passed, reason: string|null}] }`, where `studentGraph = { nodes: [{id, type}], edges: [{id, source, target, sourceHandle?}] }`. Consumed by Task 7 (DashboardScreen's Run button) and Task 10 (App.jsx, to pass into ReportScreen).

- [ ] **Step 1: Write the failing tests**

```js
// app/src/engine/validateGraph.test.js
import { describe, it, expect } from 'vitest';
import { validateGraph } from './validateGraph.js';
import { emailTriage } from '../data/problems/emailTriage.js';

function buildCorrectGraph() {
  return {
    nodes: [
      { id: 'n1', type: 'trigger' },
      { id: 'n2', type: 'classify' },
      { id: 'n3', type: 'parse' },
      { id: 'n4', type: 'route' },
      { id: 'n5', type: 'action' },
      { id: 'n6', type: 'action' },
      { id: 'n7', type: 'action' },
      { id: 'n8', type: 'complete' },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5', sourceHandle: 'bug_report' },
      { id: 'e5', source: 'n4', target: 'n6', sourceHandle: 'feature_request' },
      { id: 'e6', source: 'n4', target: 'n7', sourceHandle: 'urgent_complaint' },
      { id: 'e7', source: 'n5', target: 'n8' },
      { id: 'e8', source: 'n6', target: 'n8' },
      { id: 'e9', source: 'n7', target: 'n8' },
    ],
  };
}

describe('validateGraph', () => {
  it('passes every test case for a fully correct graph', () => {
    const result = validateGraph(buildCorrectGraph(), emailTriage);
    expect(result.allPassed).toBe(true);
    expect(result.results.every((r) => r.passed)).toBe(true);
  });

  it('fails the trigger check when no trigger node exists', () => {
    const graph = buildCorrectGraph();
    graph.nodes = graph.nodes.filter((n) => n.type !== 'trigger');
    const result = validateGraph(graph, emailTriage);
    expect(result.allPassed).toBe(false);
    expect(result.results.find((r) => r.id === 'trigger-present').passed).toBe(false);
  });

  it('fails the route-connection check when parse does not feed into route', () => {
    const graph = buildCorrectGraph();
    graph.edges = graph.edges.filter((e) => e.id !== 'e3');
    const result = validateGraph(graph, emailTriage);
    expect(result.results.find((r) => r.id === 'route-present-with-branches').passed).toBe(false);
  });

  it('fails the branch check when the urgent complaint branch is missing', () => {
    const graph = buildCorrectGraph();
    graph.edges = graph.edges.filter((e) => e.sourceHandle !== 'urgent_complaint');
    const result = validateGraph(graph, emailTriage);
    const failed = result.results.find((r) => r.id === 'each-branch-sends-reply');
    expect(failed.passed).toBe(false);
    expect(failed.reason).toContain('urgent_complaint');
  });

  it('fails the path check when a branch action does not reach Complete', () => {
    const graph = buildCorrectGraph();
    graph.edges = graph.edges.filter((e) => e.id !== 'e8');
    const result = validateGraph(graph, emailTriage);
    expect(result.results.find((r) => r.id === 'all-paths-complete').passed).toBe(false);
  });

  it('ignores distractor nodes present in the student graph', () => {
    const graph = buildCorrectGraph();
    graph.nodes.push({ id: 'n9', type: 'slack-message' });
    const result = validateGraph(graph, emailTriage);
    expect(result.allPassed).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge/app"
npx vitest run src/engine/validateGraph.test.js
```

Expected: FAIL — `validateGraph.js` does not exist.

- [ ] **Step 3: Implement validateGraph**

```js
// app/src/engine/validateGraph.js

export function validateGraph(studentGraph, problem) {
  const results = problem.testCases.map((testCase) => runCheck(testCase, studentGraph));
  const allPassed = results.every((r) => r.passed);
  return { allPassed, results };
}

function runCheck(testCase, studentGraph) {
  const { checks } = testCase;

  if (checks.requiredNodeTypes) {
    const missing = checks.requiredNodeTypes.filter(
      (type) => !studentGraph.nodes.some((n) => n.type === type)
    );
    if (missing.length > 0) {
      return fail(testCase, `Missing node type(s): ${missing.join(', ')}`);
    }
  }

  if (checks.requiredEdges) {
    for (const req of checks.requiredEdges) {
      const found = studentGraph.edges.some((edge) => edgeMatches(edge, req, studentGraph.nodes));
      if (!found) {
        const branchLabel = req.branch ? ` (branch: ${req.branch})` : '';
        return fail(testCase, `Missing connection: ${req.sourceType} → ${req.targetType}${branchLabel}`);
      }
    }
  }

  if (checks.requiresPath && !hasPathToComplete(studentGraph)) {
    return fail(testCase, 'No connected path reaches a Complete node');
  }

  return { id: testCase.id, description: testCase.description, passed: true, reason: null };
}

function fail(testCase, reason) {
  return { id: testCase.id, description: testCase.description, passed: false, reason };
}

function edgeMatches(edge, req, nodes) {
  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);
  if (!sourceNode || !targetNode) return false;
  if (sourceNode.type !== req.sourceType || targetNode.type !== req.targetType) return false;
  if (req.branch && edge.sourceHandle !== req.branch) return false;
  return true;
}

function hasPathToComplete(studentGraph) {
  const triggerNodes = studentGraph.nodes.filter((n) => n.type === 'trigger');
  if (triggerNodes.length === 0) return false;

  const adjacency = buildAdjacency(studentGraph.edges);

  const routeNodes = studentGraph.nodes.filter((n) => n.type === 'route');
  for (const route of routeNodes) {
    const branchEdges = studentGraph.edges.filter((e) => e.source === route.id);
    const branches = new Set(branchEdges.map((e) => e.sourceHandle).filter(Boolean));
    for (const branch of branches) {
      const targets = branchEdges.filter((e) => e.sourceHandle === branch).map((e) => e.target);
      const reaches = targets.some((start) => canReachComplete(start, adjacency, studentGraph.nodes));
      if (!reaches) return false;
    }
  }

  return triggerNodes.some((t) => canReachComplete(t.id, adjacency, studentGraph.nodes));
}

function buildAdjacency(edges) {
  const adjacency = new Map();
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    adjacency.get(edge.source).push(edge.target);
  }
  return adjacency;
}

function canReachComplete(startId, adjacency, nodes) {
  const visited = new Set();
  const stack = [startId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (visited.has(current)) continue;
    visited.add(current);
    const node = nodes.find((n) => n.id === current);
    if (node && node.type === 'complete') return true;
    for (const next of adjacency.get(current) || []) stack.push(next);
  }
  return false;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/engine/validateGraph.test.js
```

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge"
git add app/src/engine/validateGraph.js app/src/engine/validateGraph.test.js
git commit -m "Add structural graph validation engine"
```

---

## Task 4: X-ray (blueprint ghost-node) engine

**Files:**
- Create: `app/src/engine/xray.js`
- Test: `app/src/engine/xray.test.js`

**Interfaces:**
- Consumes: `emailTriage.referenceGraph` from Task 2.
- Produces: `computeMissingReferenceNodes(studentGraph, referenceGraph) -> RefNode[]` (subset of `referenceGraph.nodes`) and `countPendingNodes(studentGraph, referenceGraph) -> number`. Consumed by Task 7 (DashboardScreen's X-ray toggle).

- [ ] **Step 1: Write the failing tests**

```js
// app/src/engine/xray.test.js
import { describe, it, expect } from 'vitest';
import { computeMissingReferenceNodes, countPendingNodes } from './xray.js';
import { emailTriage } from '../data/problems/emailTriage.js';

describe('xray engine', () => {
  it('reports every reference node missing on an empty canvas', () => {
    const empty = { nodes: [], edges: [] };
    const missing = computeMissingReferenceNodes(empty, emailTriage.referenceGraph);
    expect(missing).toHaveLength(emailTriage.referenceGraph.nodes.length);
    expect(countPendingNodes(empty, emailTriage.referenceGraph)).toBe(
      emailTriage.referenceGraph.nodes.length
    );
  });

  it('reports zero missing once every required type is placed the right number of times', () => {
    const studentGraph = {
      nodes: [
        { id: 's1', type: 'trigger' },
        { id: 's2', type: 'classify' },
        { id: 's3', type: 'parse' },
        { id: 's4', type: 'route' },
        { id: 's5', type: 'action' },
        { id: 's6', type: 'action' },
        { id: 's7', type: 'action' },
        { id: 's8', type: 'complete' },
      ],
      edges: [],
    };
    expect(countPendingNodes(studentGraph, emailTriage.referenceGraph)).toBe(0);
  });

  it('reports 2 missing action ghosts when only 1 of 3 action nodes is placed', () => {
    const studentGraph = {
      nodes: [
        { id: 's1', type: 'trigger' },
        { id: 's2', type: 'classify' },
        { id: 's3', type: 'parse' },
        { id: 's4', type: 'route' },
        { id: 's5', type: 'action' },
        { id: 's8', type: 'complete' },
      ],
      edges: [],
    };
    const missing = computeMissingReferenceNodes(studentGraph, emailTriage.referenceGraph);
    expect(missing.filter((n) => n.type === 'action')).toHaveLength(2);
  });

  it('ignores distractor nodes the student has placed', () => {
    const studentGraph = { nodes: [{ id: 'x', type: 'slack-message' }], edges: [] };
    expect(countPendingNodes(studentGraph, emailTriage.referenceGraph)).toBe(
      emailTriage.referenceGraph.nodes.length
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge/app"
npx vitest run src/engine/xray.test.js
```

Expected: FAIL — `xray.js` does not exist.

- [ ] **Step 3: Implement the X-ray engine**

```js
// app/src/engine/xray.js

/**
 * Which reference-graph nodes should render as ghost placeholders because
 * the student hasn't placed a matching node type yet. Matching is by type +
 * count only (not identity): if the reference graph needs 3 nodes of type
 * 'action' and the student has placed 1, the first reference 'action' node
 * (in authored order) is treated as covered and the remaining 2 are
 * returned as ghosts.
 */
export function computeMissingReferenceNodes(studentGraph, referenceGraph) {
  const studentCounts = countByType(studentGraph.nodes);
  const coveredSoFar = new Map();
  const missing = [];

  for (const refNode of referenceGraph.nodes) {
    const covered = coveredSoFar.get(refNode.type) || 0;
    const available = studentCounts.get(refNode.type) || 0;
    if (covered < available) {
      coveredSoFar.set(refNode.type, covered + 1);
    } else {
      missing.push(refNode);
    }
  }

  return missing;
}

export function countPendingNodes(studentGraph, referenceGraph) {
  return computeMissingReferenceNodes(studentGraph, referenceGraph).length;
}

function countByType(nodes) {
  const counts = new Map();
  for (const node of nodes) {
    counts.set(node.type, (counts.get(node.type) || 0) + 1);
  }
  return counts;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/engine/xray.test.js
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge"
git add app/src/engine/xray.js app/src/engine/xray.test.js
git commit -m "Add X-ray ghost-node engine"
```

---

## Task 5: Eval scoring engine

**Files:**
- Create: `app/src/engine/evalScore.js`
- Test: `app/src/engine/evalScore.test.js`

**Interfaces:**
- Consumes: `emailTriage.evalQuestions` from Task 2.
- Produces: `scoreEval(answers, evalQuestions) -> { results: [{id, prompt, selectedIndex, correct}], correctCount: number, total: number }`, where `answers` is `{ [questionId]: numericSelectedIndex }`. Consumed by Task 8 (EvalScreen) and Task 10 (App.jsx → ReportScreen).

- [ ] **Step 1: Write the failing tests**

```js
// app/src/engine/evalScore.test.js
import { describe, it, expect } from 'vitest';
import { scoreEval } from './evalScore.js';
import { emailTriage } from '../data/problems/emailTriage.js';

describe('scoreEval', () => {
  it('scores all correct answers as fully correct', () => {
    const answers = {};
    for (const q of emailTriage.evalQuestions) answers[q.id] = q.correctIndex;
    const result = scoreEval(answers, emailTriage.evalQuestions);
    expect(result.correctCount).toBe(emailTriage.evalQuestions.length);
    expect(result.total).toBe(emailTriage.evalQuestions.length);
    expect(result.results.every((r) => r.correct)).toBe(true);
  });

  it('marks a wrong answer as incorrect without affecting other questions', () => {
    const answers = {};
    emailTriage.evalQuestions.forEach((q, i) => {
      answers[q.id] = i === 0 ? (q.correctIndex + 1) % q.options.length : q.correctIndex;
    });
    const result = scoreEval(answers, emailTriage.evalQuestions);
    expect(result.results[0].correct).toBe(false);
    expect(result.results.slice(1).every((r) => r.correct)).toBe(true);
  });

  it('treats an unanswered question as incorrect', () => {
    const result = scoreEval({}, emailTriage.evalQuestions);
    expect(result.correctCount).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge/app"
npx vitest run src/engine/evalScore.test.js
```

Expected: FAIL — `evalScore.js` does not exist.

- [ ] **Step 3: Implement scoreEval**

```js
// app/src/engine/evalScore.js

export function scoreEval(answers, evalQuestions) {
  const results = evalQuestions.map((q) => {
    const selectedIndex = answers[q.id];
    const correct = selectedIndex === q.correctIndex;
    return { id: q.id, prompt: q.prompt, selectedIndex, correct };
  });
  const correctCount = results.filter((r) => r.correct).length;
  return { results, correctCount, total: evalQuestions.length };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/engine/evalScore.test.js
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge"
git add app/src/engine/evalScore.js app/src/engine/evalScore.test.js
git commit -m "Add eval question scoring engine"
```

---

## Task 6: Problem Statement screen

**Files:**
- Create: `app/src/screens/ProblemStatementScreen.jsx`
- Modify: `app/src/App.jsx` (temporarily render this screen to verify; Task 10 replaces this file's contents)

**Interfaces:**
- Consumes: `Card`, `Button` from `../design-system/` (Task 1); a `problem` prop shaped like `emailTriage` (Task 2) — uses only `problem.title` and `problem.statement`.
- Produces: `ProblemStatementScreen({ problem, onStart })` — calls `onStart()` when the learner clicks Start. Consumed by Task 10 (App.jsx).

- [ ] **Step 1: Create the screen**

```jsx
// app/src/screens/ProblemStatementScreen.jsx
import React from 'react';
import { Card } from '../design-system/Card.jsx';
import { Button } from '../design-system/Button.jsx';

export function ProblemStatementScreen({ problem, onStart }) {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Card style={{ maxWidth: 560 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 8 }}>
          Problem
        </div>
        <h1 style={{ margin: '0 0 16px' }}>{problem.title}</h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--fg-1)' }}>{problem.statement}</p>
        <div style={{ marginTop: 24 }}>
          <Button variant="primary" size="lg" onClick={onStart}>Start</Button>
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Temporarily wire it into App.jsx to verify**

```jsx
// app/src/App.jsx
import React from 'react';
import { emailTriage } from './data/problems/emailTriage.js';
import { ProblemStatementScreen } from './screens/ProblemStatementScreen.jsx';

export default function App() {
  return (
    <div style={{ height: '100vh' }}>
      <ProblemStatementScreen problem={emailTriage} onStart={() => alert('Start clicked')} />
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge/app"
npm run dev
```

Open the browser. Expected: a centered card showing "Email Triage Automation" and the full statement text, with a blue "Start" button. Clicking Start shows the `alert`. Stop the dev server once confirmed.

- [ ] **Step 4: Commit**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge"
git add app/src/screens/ProblemStatementScreen.jsx app/src/App.jsx
git commit -m "Add Problem Statement screen"
```

---

## Task 7: Dashboard screen — node types, palette, canvas, X-ray, Run

This is the largest task: custom React Flow node types, the draggable node palette, the canvas with drag/drop and connection wiring, the X-ray ghost overlay, and the Run button with per-test-case results.

**Files:**
- Create: `app/src/nodes/TriggerNode.jsx`
- Create: `app/src/nodes/ProcessNode.jsx`
- Create: `app/src/nodes/RouteNode.jsx`
- Create: `app/src/nodes/ActionNode.jsx`
- Create: `app/src/nodes/CompleteNode.jsx`
- Create: `app/src/nodes/GhostNode.jsx`
- Create: `app/src/nodes/nodeTypes.js`
- Create: `app/src/components/NodePalette.jsx`
- Create: `app/src/screens/DashboardScreen.jsx`
- Modify: `app/src/App.jsx` (temporarily render this screen to verify; Task 10 replaces this file's contents)

**Interfaces:**
- Consumes: `Card` (Task 1); `Button`, `Badge`, `Alert`, `Switch` (Task 1); `validateGraph` (Task 3); `computeMissingReferenceNodes`, `countPendingNodes` (Task 4); `problem` prop shaped like `emailTriage` — uses `problem.nodePalette`, `problem.referenceGraph`, `problem.testCases` (via `validateGraph(studentGraph, problem)`).
- Produces: `nodeTypes` — an object mapping every palette `type` string (including distractors) to a React Flow node component, importable from `../nodes/nodeTypes.js`. Also produces `DashboardScreen({ problem, onAllTestsPassed })` — calls `onAllTestsPassed(result)` (the full `validateGraph` return value) once a Run passes every test case. Consumed by Task 10 (App.jsx).

- [ ] **Step 1: Create the custom node components**

```jsx
// app/src/nodes/TriggerNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card } from '../design-system/Card.jsx';

export function TriggerNode({ data }) {
  return (
    <Card tone="blue" padding={12} style={{ minWidth: 160 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--brand-primary)' }}>Trigger</div>
      <div style={{ fontWeight: 600 }}>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </Card>
  );
}
```

```jsx
// app/src/nodes/ProcessNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card } from '../design-system/Card.jsx';

export function ProcessNode({ data }) {
  return (
    <Card tone="default" padding={12} style={{ minWidth: 160 }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--fg-2)' }}>Process</div>
      <div style={{ fontWeight: 600 }}>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </Card>
  );
}
```

```jsx
// app/src/nodes/RouteNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card } from '../design-system/Card.jsx';

const BRANCHES = [
  { id: 'bug_report', label: 'Bug Report', top: '25%' },
  { id: 'feature_request', label: 'Feature Request', top: '50%' },
  { id: 'urgent_complaint', label: 'Urgent Complaint', top: '75%' },
];

export function RouteNode({ data }) {
  return (
    <Card tone="soft" padding={12} style={{ minWidth: 180, minHeight: 100, position: 'relative' }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--fg-2)' }}>Branch</div>
      <div style={{ fontWeight: 600 }}>{data.label}</div>
      {BRANCHES.map((branch) => (
        <React.Fragment key={branch.id}>
          <Handle type="source" position={Position.Right} id={branch.id} style={{ top: branch.top }} />
          <div
            style={{
              position: 'absolute',
              right: 8,
              top: branch.top,
              fontSize: 10,
              transform: 'translateY(-50%)',
              color: 'var(--fg-2)',
            }}
          >
            {branch.label}
          </div>
        </React.Fragment>
      ))}
    </Card>
  );
}
```

```jsx
// app/src/nodes/ActionNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card } from '../design-system/Card.jsx';

export function ActionNode({ data }) {
  return (
    <Card tone="default" padding={12} style={{ minWidth: 160 }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--fg-2)' }}>Action</div>
      <div style={{ fontWeight: 600 }}>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </Card>
  );
}
```

```jsx
// app/src/nodes/CompleteNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card } from '../design-system/Card.jsx';

export function CompleteNode({ data }) {
  return (
    <Card tone="deep" padding={12} style={{ minWidth: 140 }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ fontWeight: 600 }}>{data.label || 'Complete'}</div>
    </Card>
  );
}
```

```jsx
// app/src/nodes/GhostNode.jsx
import React from 'react';

export function GhostNode({ data }) {
  return (
    <div
      style={{
        minWidth: 160,
        padding: 12,
        border: '1px dashed var(--border-strong)',
        color: 'var(--fg-2)',
        background: 'transparent',
        fontSize: 12,
        textAlign: 'center',
      }}
    >
      {data.label}
    </div>
  );
}
```

```js
// app/src/nodes/nodeTypes.js
import { TriggerNode } from './TriggerNode.jsx';
import { ProcessNode } from './ProcessNode.jsx';
import { RouteNode } from './RouteNode.jsx';
import { ActionNode } from './ActionNode.jsx';
import { CompleteNode } from './CompleteNode.jsx';
import { GhostNode } from './GhostNode.jsx';

export const nodeTypes = {
  trigger: TriggerNode,
  'chat-trigger': TriggerNode,
  classify: ProcessNode,
  parse: ProcessNode,
  'web-search': ProcessNode,
  route: RouteNode,
  action: ActionNode,
  'slack-message': ActionNode,
  'calendar-event': ActionNode,
  'notion-page': ActionNode,
  'google-docs': ActionNode,
  complete: CompleteNode,
  ghost: GhostNode,
};
```

- [ ] **Step 2: Create the node palette**

```jsx
// app/src/components/NodePalette.jsx
import React from 'react';
import { Card } from '../design-system/Card.jsx';
import { Badge } from '../design-system/Badge.jsx';

export function NodePalette({ problem }) {
  const onDragStart = (event, paletteNode) => {
    event.dataTransfer.setData('application/judge-node', JSON.stringify(paletteNode));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{ width: 220, overflowY: 'auto', borderRight: '1px solid var(--border-subtle)', padding: 12 }}>
      <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 8 }}>
        Nodes
      </div>
      {problem.nodePalette.map((paletteNode) => (
        <Card
          key={paletteNode.type}
          padding={10}
          interactive
          draggable
          onDragStart={(event) => onDragStart(event, paletteNode)}
          style={{ marginBottom: 8, cursor: 'grab' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{paletteNode.label}</span>
            {paletteNode.isDistractor ? <Badge tone="neutral">extra</Badge> : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create the Dashboard screen**

```jsx
// app/src/screens/DashboardScreen.jsx
import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from '../nodes/nodeTypes.js';
import { NodePalette } from '../components/NodePalette.jsx';
import { Button } from '../design-system/Button.jsx';
import { Badge } from '../design-system/Badge.jsx';
import { Switch } from '../design-system/Switch.jsx';
import { Alert } from '../design-system/Alert.jsx';
import { validateGraph } from '../engine/validateGraph.js';
import { computeMissingReferenceNodes, countPendingNodes } from '../engine/xray.js';

let nodeIdCounter = 0;
function nextNodeId() {
  nodeIdCounter += 1;
  return `node-${nodeIdCounter}`;
}

function DashboardCanvas({ problem, onAllTestsPassed }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [xrayOn, setXrayOn] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const { screenToFlowPosition } = useReactFlow();

  const studentGraph = useMemo(
    () => ({
      nodes: nodes.map((n) => ({ id: n.id, type: n.type })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle })),
    }),
    [nodes, edges]
  );

  const pendingCount = useMemo(
    () => countPendingNodes(studentGraph, problem.referenceGraph),
    [studentGraph, problem.referenceGraph]
  );

  const ghostNodes = useMemo(() => {
    if (!xrayOn) return [];
    return computeMissingReferenceNodes(studentGraph, problem.referenceGraph).map((refNode) => ({
      id: `ghost-${refNode.id}`,
      type: 'ghost',
      position: refNode.position,
      data: { label: refNode.requiredLabel },
      draggable: false,
      selectable: false,
      connectable: false,
    }));
  }, [xrayOn, studentGraph, problem.referenceGraph]);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((connection) => setEdges((eds) => addEdge(connection, eds)), []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData('application/judge-node');
      if (!raw) return;
      const paletteNode = JSON.parse(raw);
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNode = {
        id: nextNodeId(),
        type: paletteNode.type,
        position,
        data: { label: paletteNode.label },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition]
  );

  const handleRun = () => {
    const result = validateGraph(studentGraph, problem);
    setRunResult(result);
    if (result.allPassed) onAllTestsPassed(result);
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <NodePalette problem={problem} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 12,
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <Switch checked={xrayOn} onChange={setXrayOn} label="X-ray" />
          <Badge tone={pendingCount === 0 ? 'success' : 'neutral'}>{pendingCount} nodes pending</Badge>
          <div style={{ flex: 1 }} />
          <Button variant="primary" onClick={handleRun}>Run</Button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ReactFlow
            nodes={nodes.concat(ghostNodes)}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
        {runResult ? (
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
            {runResult.results.map((r) => (
              <Alert key={r.id} tone={r.passed ? 'success' : 'danger'} title={r.description}>
                {r.passed ? 'Passed' : r.reason}
              </Alert>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function DashboardScreen({ problem, onAllTestsPassed }) {
  return (
    <ReactFlowProvider>
      <DashboardCanvas problem={problem} onAllTestsPassed={onAllTestsPassed} />
    </ReactFlowProvider>
  );
}
```

- [ ] **Step 4: Temporarily wire it into App.jsx to verify**

```jsx
// app/src/App.jsx
import React from 'react';
import { emailTriage } from './data/problems/emailTriage.js';
import { DashboardScreen } from './screens/DashboardScreen.jsx';

export default function App() {
  return (
    <div style={{ height: '100vh' }}>
      <DashboardScreen problem={emailTriage} onAllTestsPassed={() => alert('All tests passed!')} />
    </div>
  );
}
```

- [ ] **Step 5: Manual verification**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge/app"
npm run dev
```

In the browser:
1. Confirm the left panel lists all 12 palette entries (6 required + 6 marked "extra"), scrollable.
2. Drag "New Email" onto the canvas — confirm a blue trigger card appears with a right-side handle.
3. Toggle X-ray on an empty canvas — confirm 8 dashed ghost boxes appear (matching the 8 reference nodes) and the badge reads "8 nodes pending".
4. Drag out and connect: New Email → Classify with AI → Parse Result → Route → three Send Reply nodes (one per branch handle: Bug Report, Feature Request, Urgent Complaint) → a shared Complete node. Confirm the pending badge counts down to 0 as matching types are placed.
5. Drag in a distractor node (e.g. Slack — Send Message) unconnected — confirm the pending count is unaffected.
6. Click Run — confirm all 5 test-case Alerts show green "Passed", and the `alert('All tests passed!')` fires.
7. Remove one branch connection and click Run again — confirm that specific test case shows red with a reason, and the "all tests passed" alert does not fire.

Stop the dev server once confirmed.

- [ ] **Step 6: Commit**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge"
git add app/src/nodes/ app/src/components/NodePalette.jsx app/src/screens/DashboardScreen.jsx app/src/App.jsx app/package.json app/package-lock.json
git commit -m "Add Dashboard screen: node types, palette, canvas, X-ray, Run"
```

---

## Task 8: Eval screen

**Files:**
- Create: `app/src/screens/EvalScreen.jsx`
- Modify: `app/src/App.jsx` (temporarily render this screen to verify; Task 10 replaces this file's contents)

**Interfaces:**
- Consumes: `Card`, `Button`, `RadioGroup` (Task 1); `scoreEval` (Task 5); `problem` prop — uses `problem.evalQuestions`.
- Produces: `EvalScreen({ problem, onSubmit })` — calls `onSubmit(scoreEvalResult)` (the full `scoreEval` return value) once every question is answered and Submit is clicked. Consumed by Task 10 (App.jsx).

- [ ] **Step 1: Create the screen**

```jsx
// app/src/screens/EvalScreen.jsx
import React, { useState } from 'react';
import { Card } from '../design-system/Card.jsx';
import { Button } from '../design-system/Button.jsx';
import { RadioGroup } from '../design-system/RadioGroup.jsx';
import { scoreEval } from '../engine/evalScore.js';

export function EvalScreen({ problem, onSubmit }) {
  const [answers, setAnswers] = useState({});

  const allAnswered = problem.evalQuestions.every((q) => answers[q.id] !== undefined);

  const handleSubmit = () => {
    const numericAnswers = {};
    for (const q of problem.evalQuestions) {
      numericAnswers[q.id] = Number(answers[q.id]);
    }
    onSubmit(scoreEval(numericAnswers, problem.evalQuestions));
  };

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Card style={{ maxWidth: 640, width: '100%' }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 16 }}>
          Eval
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {problem.evalQuestions.map((q) => (
            <div key={q.id}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{q.prompt}</div>
              <RadioGroup
                name={q.id}
                value={answers[q.id]}
                onChange={(value) => setAnswers((a) => ({ ...a, [q.id]: value }))}
                options={q.options.map((option, index) => ({ value: String(index), label: option }))}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          <Button variant="primary" disabled={!allAnswered} onClick={handleSubmit}>Submit</Button>
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Temporarily wire it into App.jsx to verify**

```jsx
// app/src/App.jsx
import React from 'react';
import { emailTriage } from './data/problems/emailTriage.js';
import { EvalScreen } from './screens/EvalScreen.jsx';

export default function App() {
  return (
    <div style={{ height: '100vh' }}>
      <EvalScreen problem={emailTriage} onSubmit={(result) => console.log('eval result', result)} />
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge/app"
npm run dev
```

Open the browser console. Confirm: both questions render with 4 radio options each; Submit is disabled until both are answered; selecting an answer for each enables Submit; clicking Submit logs a `{ results, correctCount, total }` object to the console with `total: 2`. Stop the dev server once confirmed.

- [ ] **Step 4: Commit**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge"
git add app/src/screens/EvalScreen.jsx app/src/App.jsx
git commit -m "Add Eval screen"
```

---

## Task 9: Report screen

**Files:**
- Create: `app/src/screens/ReportScreen.jsx`
- Modify: `app/src/App.jsx` (temporarily render this screen with fixture data to verify; Task 10 replaces this file's contents)

**Interfaces:**
- Consumes: `Card`, `Badge`, `Alert` (Task 1); a `runResult` prop shaped like `validateGraph`'s return value (Task 3); an `evalOutcome` prop shaped like `scoreEval`'s return value (Task 5).
- Produces: `ReportScreen({ problem, runResult, evalOutcome })` — a read-only summary screen, no callbacks. Consumed by Task 10 (App.jsx) as the final screen.

- [ ] **Step 1: Create the screen**

```jsx
// app/src/screens/ReportScreen.jsx
import React from 'react';
import { Card } from '../design-system/Card.jsx';
import { Alert } from '../design-system/Alert.jsx';
import { Badge } from '../design-system/Badge.jsx';

export function ReportScreen({ runResult, evalOutcome }) {
  const overallPassed = Boolean(runResult?.allPassed) && evalOutcome?.correctCount === evalOutcome?.total;

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Card style={{ maxWidth: 640, width: '100%' }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 8 }}>
          Report
        </div>
        <div style={{ marginBottom: 16 }}>
          <Badge tone={overallPassed ? 'success' : 'warning'} solid={overallPassed}>
            {overallPassed ? 'Solved' : 'Needs another look'}
          </Badge>
        </div>

        <h3 style={{ margin: '0 0 8px' }}>Test cases</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {runResult?.results.map((r) => (
            <Alert key={r.id} tone={r.passed ? 'success' : 'danger'} title={r.description}>
              {r.passed ? 'Passed' : r.reason}
            </Alert>
          ))}
        </div>

        <h3 style={{ margin: '0 0 8px' }}>Eval questions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {evalOutcome?.results.map((r) => (
            <Alert key={r.id} tone={r.correct ? 'success' : 'danger'} title={r.prompt}>
              {r.correct ? 'Correct' : 'Incorrect'}
            </Alert>
          ))}
        </div>

        <p style={{ marginTop: 24, fontSize: 14, color: 'var(--fg-2)' }}>
          {evalOutcome?.correctCount} / {evalOutcome?.total} eval questions correct.
        </p>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Temporarily wire it into App.jsx with fixture data to verify**

```jsx
// app/src/App.jsx
import React from 'react';
import { emailTriage } from './data/problems/emailTriage.js';
import { validateGraph } from './engine/validateGraph.js';
import { scoreEval } from './engine/evalScore.js';
import { ReportScreen } from './screens/ReportScreen.jsx';

const fixtureGraph = {
  nodes: [
    { id: 'n1', type: 'trigger' },
    { id: 'n2', type: 'classify' },
    { id: 'n3', type: 'parse' },
    { id: 'n4', type: 'route' },
    { id: 'n5', type: 'action' },
    { id: 'n6', type: 'action' },
    { id: 'n7', type: 'action' },
    { id: 'n8', type: 'complete' },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2' },
    { id: 'e2', source: 'n2', target: 'n3' },
    { id: 'e3', source: 'n3', target: 'n4' },
    { id: 'e4', source: 'n4', target: 'n5', sourceHandle: 'bug_report' },
    { id: 'e5', source: 'n4', target: 'n6', sourceHandle: 'feature_request' },
    { id: 'e6', source: 'n4', target: 'n7', sourceHandle: 'urgent_complaint' },
    { id: 'e7', source: 'n5', target: 'n8' },
    { id: 'e8', source: 'n6', target: 'n8' },
    { id: 'e9', source: 'n7', target: 'n8' },
  ],
};

const fixtureAnswers = {};
emailTriage.evalQuestions.forEach((q) => { fixtureAnswers[q.id] = q.correctIndex; });

export default function App() {
  const runResult = validateGraph(fixtureGraph, emailTriage);
  const evalOutcome = scoreEval(fixtureAnswers, emailTriage.evalQuestions);
  return (
    <div style={{ height: '100vh' }}>
      <ReportScreen runResult={runResult} evalOutcome={evalOutcome} />
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge/app"
npm run dev
```

Confirm: a green "Solved" badge, 5 green "Passed" test-case alerts, 2 green "Correct" eval-question alerts, and "2 / 2 eval questions correct." Stop the dev server once confirmed.

- [ ] **Step 4: Commit**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge"
git add app/src/screens/ReportScreen.jsx app/src/App.jsx
git commit -m "Add Report screen"
```

---

## Task 10: Wire the full state machine in App.jsx

**Files:**
- Modify: `app/src/App.jsx` (final version — replaces every temporary wiring from Tasks 6–9)

**Interfaces:**
- Consumes: `emailTriage` (Task 2); `ProblemStatementScreen` (Task 6); `DashboardScreen` (Task 7); `EvalScreen` (Task 8); `ReportScreen` (Task 9).
- Produces: the complete app entry point — no further consumers within this plan.

- [ ] **Step 1: Replace App.jsx with the full state machine**

```jsx
// app/src/App.jsx
import React, { useState } from 'react';
import { emailTriage } from './data/problems/emailTriage.js';
import { ProblemStatementScreen } from './screens/ProblemStatementScreen.jsx';
import { DashboardScreen } from './screens/DashboardScreen.jsx';
import { EvalScreen } from './screens/EvalScreen.jsx';
import { ReportScreen } from './screens/ReportScreen.jsx';

const SCREEN = {
  STATEMENT: 'statement',
  DASHBOARD: 'dashboard',
  EVAL: 'eval',
  REPORT: 'report',
};

export default function App() {
  const [screen, setScreen] = useState(SCREEN.STATEMENT);
  const [runResult, setRunResult] = useState(null);
  const [evalOutcome, setEvalOutcome] = useState(null);

  return (
    <div style={{ height: '100vh' }}>
      {screen === SCREEN.STATEMENT ? (
        <ProblemStatementScreen problem={emailTriage} onStart={() => setScreen(SCREEN.DASHBOARD)} />
      ) : null}

      {screen === SCREEN.DASHBOARD ? (
        <DashboardScreen
          problem={emailTriage}
          onAllTestsPassed={(result) => {
            setRunResult(result);
            setScreen(SCREEN.EVAL);
          }}
        />
      ) : null}

      {screen === SCREEN.EVAL ? (
        <EvalScreen
          problem={emailTriage}
          onSubmit={(outcome) => {
            setEvalOutcome(outcome);
            setScreen(SCREEN.REPORT);
          }}
        />
      ) : null}

      {screen === SCREEN.REPORT ? (
        <ReportScreen problem={emailTriage} runResult={runResult} evalOutcome={evalOutcome} />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Run the full unit test suite**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge/app"
npx vitest run
```

Expected: PASS — all tests from Tasks 2–5 (18 tests total: 5 + 6 + 4 + 3).

- [ ] **Step 3: Full end-to-end manual verification**

```bash
npm run dev
```

Walk through the complete flow in the browser:
1. **Problem Statement** — confirm the Email Triage statement and Start button render.
2. Click Start → **Dashboard** — build the correct graph (New Email → Classify with AI → Parse Result → Route → 3 Send Reply nodes on the 3 branch handles → shared Complete), including at least one distractor node left unconnected. Toggle X-ray at least once mid-build to confirm ghosts update. Click Run — confirm all 5 test cases pass.
3. Confirm the screen automatically advances to **Eval** — answer both questions correctly, click Submit.
4. Confirm the **Report** screen shows "Solved", all 5 test cases green, both eval questions green, "2 / 2 eval questions correct."
5. Reload and repeat, this time leaving one branch disconnected on the first Run — confirm Eval remains inaccessible (the screen stays on Dashboard) until the graph is fixed and Run passes.

Stop the dev server once confirmed.

- [ ] **Step 4: Commit**

```bash
cd "/Users/sudhanvaacharya/Desktop/Code-Projects/Scaler<>LMS/n8n-Judge"
git add app/src/App.jsx
git commit -m "Wire full Judge prototype state machine end to end"
```

---

## Self-Review Notes

- **Spec coverage:** §4 screen flow → Tasks 6–10. §5 data model → Task 2. §6 validation/X-ray → Tasks 3–4. §7 example problem/palette/distractors → Task 2. §8 report → Task 9. Design-system styling constraint → Task 1 (copied primitives) used throughout Tasks 6–9.
- **Placeholder scan:** no TBD/TODO; every step contains complete, runnable code.
- **Type consistency:** `studentGraph = {nodes:[{id,type}], edges:[{id,source,target,sourceHandle?}]}` is identical across Tasks 3, 4, and 7. `validateGraph`'s return shape `{allPassed, results:[{id,description,passed,reason}]}` is identical across Tasks 3, 7, 9, 10. `scoreEval`'s return shape `{results:[{id,prompt,selectedIndex,correct}], correctCount, total}` is identical across Tasks 5, 8, 9, 10.
- Task 7's original design-doc test cases 3 and 4 overlapped (both described "route branches connected"); split cleanly here into route-connects-from-parse (test 3) and each-branch-reaches-its-own-action (test 4) so all 5 test cases are non-redundant — a minor implementation-level tightening of the approved spec, not a scope change.
- The design doc's §7 palette list omitted a "Complete" entry despite the reference graph requiring one; Task 2's `nodePalette` includes it as a required, non-distractor entry to keep the data internally consistent.
