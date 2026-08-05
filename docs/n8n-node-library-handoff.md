# n8n node-library hand-off

Scope: reproduce n8n's **authoring UI**, not its execution runtime. Nodes must look and configure like current n8n nodes, but never call APIs, read credentials, execute expressions, create webhooks, or generate voice.

## Source and workspace

- Worktree: `/Users/kshnvagale/Documents/Ai/Scaler/n8n-Judge-core-nodes`
- Branch: `codex/n8n-core-nodes-batch-1`
- Official read-only clone: `/Users/kshnvagale/Documents/TempTemp/n8n`
- Pinned source commit: `3d68c29b9281f14097aa9f15e01ac0777e538b11`
- Available node/function list: `docs/node-library-catalog.md`
- n8n action nodes usually live under `packages/nodes-base/nodes/`; AI nodes live under `packages/@n8n/nodes-langchain/nodes/`.

```bash
cd /Users/kshnvagale/Documents/TempTemp/n8n
git rev-parse HEAD
rg --files packages/nodes-base/nodes | rg '/NodeName/'
rg -n "defaultVersion|version:|usableAsTool|displayName: 'Resource'|displayName: 'Operation'" <node-folder>
```

Use the pinned source as truth. Official docs help explain behavior, but may lag the code. Model only the current/default live version; exclude triggers, deprecated versions, commented resources, and dormant descriptions unless they are the assigned node.

## Where files go

- App action or trigger descriptor: `packages/catalog/app-nodes/<slug>.js`
- Core descriptor: `packages/catalog/core-nodes/<slug>.js`
- Exact upstream icon: `apps/web/public/node-icons/<slug>.<ext>`
- App progress/registration: `packages/catalog/app-nodes/index.js` (`APP_NODE_INVENTORY` or `APP_TRIGGER_NODE_INVENTORY`)
- Core progress/registration: `packages/catalog/core-nodes/index.js`
- Shared catalog tests: `packages/catalog/catalog.test.js`

Read the relevant index before assigning work. A `complete` row must not be rebuilt.

Good references: `google-translate.js` (small), `google-calendar.js` (medium), `slack.js` or `notion.js` (large/versioned).

## Descriptor contract

Capture `type`, exact `n8nType`, current `n8nVersion`, label/category/icon, inputs/outputs, `usableAsTool`, credentials, every live resource/operation/default, and every visible field recursively: options, defaults, bounds, nested collections, conditions, notices, placeholders, hints, and dynamic lookup metadata.

Dynamic credentials/lookups/schemas stay empty and `locked: true`. Preserve their method names/dependencies as metadata. Record source paths/commit, operation parity, known renderer normalizations, and `simulation` flags. Export plain data only: no functions, `execute`, `trigger`, `webhook`, imports with side effects, network calls, or voice generation.

## Three-node agent workflow

1. Assign one node per agent. Agent owns only its descriptor and icon; it must not edit indexes, tests, or commit.
2. Agent inspects the pinned source plus credentials/helpers/descriptions, builds the inert descriptor, then reports version, resource/operation counts, field count, exclusions, and limitations.
3. Orchestrator reviews all three, fixes shared renderer issues once, registers the batch, marks inventory rows complete, updates `docs/node-library-catalog.md`, adds parity tests, validates, and commits one batch.

Every agent prompt must say: other agents share the worktree; do not revert their edits; this is a simulation, not a working n8n integration.

### Copy-paste agent brief

> Implement only **`<Node>`** in the shared worktree. Own only `packages/catalog/<category>-nodes/<slug>.js` and its exact icon; do not edit indexes/tests, commit, or revert others. Use the pinned n8n clone and model the current live authoring surface completely. Keep credentials, lookups, APIs, execution, webhooks, expressions, and voice inert. Validate syntax, operation parity, recursive keys/kinds/conditions, locked dynamic fields, no functions, and icon parity. Return counts, exclusions, and limitations.

## Validation gate

```bash
git diff --check
node --check packages/catalog/<category>-nodes/<slug>.js
npm test -- --run packages/catalog/catalog.test.js \
  packages/problem-schema/fieldVisibility.test.ts \
  apps/web/src/n8n/catalogFields.test.js \
  apps/web/src/n8n/FieldControl.test.js \
  apps/web/src/n8n/resourceLocator.test.js
npm run typecheck
npm run build
```

Before hand-off: inventory count equals catalog count, no pending/missing nodes, every icon resolves, scalar selects have scalar defaults, inert dynamic fields are locked, `simulation.voice === false`, and the exported descriptor graph contains no functions. Do not regenerate `graphify-out` or author voice for node-library work.

Current baseline note: the focused node suite and build pass. The full `npm test` has 15 unrelated pre-existing engine/problem-authoring failures that reproduce at pre-app commit `f9510f5`; do not fix them as part of a node batch.
