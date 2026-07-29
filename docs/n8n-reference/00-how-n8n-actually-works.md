# How n8n Actually Works — a source-grounded reference

**Read this before changing anything in `@judge/workflow`, `@judge/catalog`, `packages/engine/simulate.js`, or the NDV.**

Everything below was read out of n8n's own source, not its documentation. Where the docs and
the code disagree, the code wins and this file records the code.

| | |
|---|---|
| Source | `github.com/n8n-io/n8n`, monorepo version **2.33.0**, commit `eb38e10` (2026-07-28) |
| Read from | `packages/workflow/src` (the model), `packages/core/src/execution-engine` (the runtime), `packages/nodes-base/nodes` (307 node directories, 547 `.node.ts` files), `packages/@n8n/nodes-langchain/nodes` (135 `.node.ts` files), `packages/frontend/editor-ui/src/features/ndv` (the NDV), `packages/frontend/@n8n/i18n` (the real copy) |
| Relationship to the other docs here | [01-canvas-and-nodes](01-canvas-and-nodes.md) … [04-ai-agent-and-key-nodes](04-ai-agent-and-key-nodes.md) and [docs/research/](../research/) describe n8n from its **documentation and UI**. This file describes its **implementation**. The two mostly agree; §14 lists where they don't. |

> File counts exceed registered-node-type counts, because each versioned implementation of a
> node gets its own file (`GmailV1.node.ts`, `GmailV2.node.ts`, …) and many nodes ship a
> `…Tool.node.ts` twin.

**Contents**

1. [Getting the schemas yourself](#1-getting-the-schemas-yourself)
2. [The workflow document](#2-the-workflow-document)
3. [The node contract](#3-the-node-contract)
4. [Parameters](#4-parameters)
5. [Setting up a node — the NDV](#5-setting-up-a-node--the-ndv)
6. [`typeVersion` — the thing a screenshot pass cannot see](#6-typeversion--the-thing-a-screenshot-pass-cannot-see)
7. [The execution model](#7-the-execution-model)
8. [Error behaviour and the node settings that change it](#8-error-behaviour-and-the-node-settings-that-change-it)
9. [Expressions](#9-expressions)
10. [Cluster nodes — the AI layer](#10-cluster-nodes--the-ai-layer)
11. [Node behaviour catalogue](#11-node-behaviour-catalogue)
12. [Triggers](#12-triggers)
13. [Credentials](#13-credentials)
14. [What this means for Judge](#14-what-this-means-for-judge)
15. [Appendix — where to look for what](#15-appendix--where-to-look-for-what)

---

## 1. Getting the schemas yourself

Two ways in, and they are not equivalent.

### The repository (recommended)

A sparse, blobless clone is ~74 MB and takes under a minute:

```bash
git clone --depth 1 --single-branch --filter=blob:none --sparse \
  https://github.com/n8n-io/n8n.git n8n
cd n8n
git sparse-checkout set \
  packages/workflow/src \
  packages/core/src \
  packages/nodes-base/nodes \
  packages/nodes-base/credentials \
  packages/@n8n/nodes-langchain/nodes \
  packages/frontend/editor-ui/src \
  packages/frontend/@n8n/i18n
```

You now have every node's full parameter schema, **every `typeVersion`**, the execution engine,
the NDV implementation, and the exact user-facing copy — as structured TypeScript, with the
comments that explain why each rule exists. No running instance, no auth, no automation.

### A running instance

```bash
npx n8n            # → http://localhost:5678, then create the owner account
# with the session cookie:
curl -b cookies.txt http://localhost:5678/types/nodes.json > nodes.json
```

This returns the loaded node descriptions as JSON — convenient, already
`INodeTypeDescription`-shaped, keyed by type. Two limits:

- **It serves one version per type**, resolved through `VersionedNodeType.getNodeType()` with
  no argument, which returns `defaultVersion ?? max(versions)`. Older `typeVersion`s — whose
  parameter schemas are genuinely different — are not in the payload.
- Dynamic `inputs`/`outputs` arrive as **unevaluated expression strings** (see §10), because
  they depend on the node's own parameters and cannot be resolved without an instance of the
  node on a canvas.

Do both if you can: the repo for truth, the endpoint to confirm what a given instance actually
loaded. **Never** reverse-engineer this from screenshots. The UI shows one version of one node
at a time, and the thing you most need — which schema belongs to which version — is exactly
what it hides.

---

## 2. The workflow document

A workflow is `{ nodes: INode[], connections: IConnections, settings, pinData, … }`.

### `INode` — `packages/workflow/src/interfaces.ts:1568`

```ts
interface INode {
  id: string;                    // uuid; NOT what connections reference
  name: string;                  // unique per workflow; THIS is what connections reference
  type: string;                  // 'n8n-nodes-base.switch', '@n8n/n8n-nodes-langchain.agent'
  typeVersion: number;           // which parameter schema applies — see §6
  position: [number, number];    // and it affects execution order, see §7
  disabled?: boolean;
  notes?: string; notesInFlow?: boolean;
  parameters: INodeParameters;   // the configured values
  credentials?: INodeCredentials;// { [credentialType]: { id, name } }
  // the Settings tab, §5:
  retryOnFail?: boolean; maxTries?: number; waitBetweenTries?: number;
  alwaysOutputData?: boolean; executeOnce?: boolean;
  onError?: 'continueErrorOutput' | 'continueRegularOutput' | 'stopWorkflow';
  continueOnFail?: boolean;      // legacy predecessor of onError
  webhookId?: string;
}
```

Note that the Settings-tab values live **on the node**, as siblings of `parameters`, not inside
it. Judge stores graded settings under `nodeSetup[type].settings`, which is the right separation.

### `IConnections` — `interfaces.ts:460`

This is the structure most re-implementations get wrong. Three nested levels:

```ts
type IConnections      = { [sourceNodeName: string]: INodeConnections };
type INodeConnections  = { [connectionType: string]: NodeInputConnections };
type NodeInputConnections = Array<IConnection[] | null>;   // one entry per OUTPUT index
interface IConnection  { node: string; type: NodeConnectionType; index: number };
```

Read that as: **source node name → connection type → output index → list of targets**, where
each target names the destination node and which of *its* inputs receives the data.

```json
{
  "Route by priority": {
    "main": [
      [ { "node": "Send urgent reply", "type": "main", "index": 0 } ],
      [ { "node": "Send normal reply", "type": "main", "index": 0 } ],
      [ ]
    ]
  },
  "OpenAI Chat Model": {
    "ai_languageModel": [
      [ { "node": "Classify with AI", "type": "ai_languageModel", "index": 0 } ]
    ]
  }
}
```

Four consequences worth memorising:

1. **A branch is an output index, not a name.** "urgent" is output `0` of the Switch because
   it is the first rule. The label lives in the *node's parameters* (`rules.values[0].outputKey`),
   never in the connection.
2. **Renaming a node rewrites the connections object**, since the key is the name.
3. **An entry can be `null` or `[]`** — a declared output with nothing wired to it. Not an error.
4. **Sub-node wires point the "wrong" way.** The Chat Model is the *source*; the node that uses
   it is the *target*. The arrow on the canvas is drawn from model up into the root node, but
   in the JSON the model owns the connection.

### `settings`

`executionOrder: 'v0' | 'v1'` is the one that changes behaviour (§7). Everything else —
`timezone`, `errorWorkflow`, `executionTimeout`, `saveDataSuccessExecution` — is operational.
New workflows are `v1`; `v0` exists only for workflows created before it changed.

### `pinData`

`{ [nodeName]: INodeExecutionData[] }`. When present for a node, the engine substitutes it and
**does not execute the node at all** — `workflow-execute.ts:1828`. Always run index 0. Ignored
for disabled nodes, and node parameter *issues* are suppressed for pinned nodes
(`node-helpers.ts:1261`).

---

## 3. The node contract

A node is one class with a `description` and one or more optional lifecycle methods
(`interfaces.ts:2369`). Which methods it implements is what makes it a trigger, a regular
node, or a sub-node.

| Method | Meaning |
|---|---|
| `execute()` | A regular node. Called **once per node run**, receives all items. |
| `poll()` | A polling trigger. Called on a schedule; returns items or `null` for "nothing new". |
| `trigger()` | A push trigger holding an open connection/listener. |
| `webhook()` | An HTTP-triggered node; paired with `description.webhooks[]`. |
| `supplyData()` | **A sub-node.** Returns an object for a root node to use, not items. |
| `customOperations` | Declarative alternative to `execute()`, keyed by `resource`/`operation`. |
| `methods.loadOptions` / `listSearch` / `resourceMapping` / `credentialTest` | Dropdowns and pickers that need a live API call. |
| `webhookMethods` | Register/unregister a webhook with the third-party service. |

### `INodeTypeDescription` — `interfaces.ts:2909`

The fields that matter for modelling:

```ts
version: number | number[];        // which typeVersions this class serves
inputs:  Array<NodeConnectionType | INodeInputConfiguration>  | ExpressionString;
outputs: Array<NodeConnectionType | INodeOutputConfiguration> | ExpressionString;
inputNames?: string[];  outputNames?: string[];
properties: INodeProperties[];     // the Parameters tab
credentials?: INodeCredentialDescription[];
defaults: { name, color };
group: Array<'input'|'output'|'organization'|'schedule'|'transform'|'trigger'>;
polling?: true;  webhooks?: IWebhookDescription[];
requiredInputs?: string | number[] | number;   // v1 execution order only
maxNodes?: number;                 // e.g. one Manual Trigger per workflow
usableAsTool?: true | {...};       // can be attached to an Agent over ai_tool
hints?: NodeHint[];                // contextual warnings in the NDV / output pane
subtitle?: string;                 // an expression, e.g. '=mode: {{$parameter["mode"]}}'
```

`INodeInputConfiguration` / `INodeOutputConfiguration` (`interfaces.ts:2810`) carry
`{ type, displayName, required, maxConnections, filter }` — this is where "the Chat Model input
is required and accepts exactly one connection" is expressed, and where `filter.excludedNodes`
restricts which node types may be attached.

**`group` is presentation, not semantics.** The AI Agent is `group: ['transform']`. The engine
never reads `group` to decide how to run a node; it reads which methods exist and what
`inputs`/`outputs` say. `isSubNodeType()` (`node-helpers.ts:256`) simply asks whether any
declared output is not `main`.

---

## 4. Parameters

### `INodeProperties` — `interfaces.ts:1998`

```ts
{
  displayName, name, type, default,
  description?, hint?, placeholder?, required?,
  typeOptions?,          // per-type config — see the catalogue in §5
  displayOptions?,       // WHEN this field is visible — see below
  disabledOptions?,      // when it renders but is locked
  options?,              // for options/multiOptions/collection/fixedCollection
  noDataExpression?,     // this field may not be an expression
  isNodeSetting?,        // this field belongs on the Settings tab, not Parameters
  validateType?,         // FieldType for coercion/validation
  modes?,                // resourceLocator modes: list | id | url
}
```

The 22 property `type`s (`interfaces.ts:1764`):

`string` · `number` · `boolean` · `options` · `multiOptions` · `dateTime` · `json` · `color` ·
`hidden` · `notice` · `callout` · `button` · `icon` · `collection` · `fixedCollection` ·
`resourceLocator` · `resourceMapper` · `credentials` · `credentialsSelect` · `curlImport` ·
`filter` · `assignmentCollection` · `workflowSelector` · `agentSelector`

Judge's `FieldControl` implements `select | text | number | boolean | expression`. That is a
deliberate subset, but note that four of the real types are structurally different rather than
just prettier — `resourceLocator` (a value **plus** the mode it was chosen in),
`fixedCollection` (repeatable named groups, which is how Switch rules are stored),
`filter`/`assignmentCollection` (the condition and field-mapping builders). Any problem that
wants to grade "configure a Switch rule" is grading a `fixedCollection` of `filter`s.

### `displayOptions` — conditional visibility

```ts
{ show?: { [param]: Array<value | DisplayCondition>, '@version'?: […], '@tool'?: boolean[] },
  hide?: { … } }
```

Values are matched literally, or with a condition object `{ _cnd: { gte: 3.1 } }` supporting
`eq/not/gt/gte/lt/lte/between/startsWith/endsWith/includes/regex`. `'@version'` matches the
node's own `typeVersion`; a leading `/` on a parameter name (`'/includeOtherFields': [true]`)
references the **root** of the parameter object rather than the current nesting level.

Real example, the AI Agent choosing between two prompt-field definitions
(`AgentV3.node.ts:63`):

```ts
{ ...promptTypeOptionsDeprecated, displayOptions: { show: { '@version': [{ _cnd: { lt: 3.1 } }] } } },
{ ...promptTypeOptions,           displayOptions: { show: { '@version': [{ _cnd: { gte: 3.1 } }] } } },
```

One node type, one class, two different forms depending on `typeVersion`.

### Stored parameters are sparse

`getNodeParameters()` (`node-helpers.ts:676`) resolves a node's effective parameters from the
schema plus the stored values, with `returnDefaults` controlling whether defaults are filled
in. The workflow JSON keeps only what differs from the default and only what is currently
*displayed*, and dependency order is computed (`getParameterResolveOrder`) because
`displayOptions` create a dependency graph between fields.

Practical effect: **a parameter's absence is meaningful.** Judge's grader must not treat
"missing" as "wrong" without knowing the default — and a real n8n workflow JSON for a
correctly-configured node is often much smaller than the form suggests.

---

## 5. Setting up a node — the NDV

Judge's NDV is the most-used surface in the product, so this section is the one to hold against
`apps/web/src/n8n/Ndv.jsx`, `SettingsForm`, `nodeSettings.js` and `FieldControl`.

Everything here comes from `packages/frontend/editor-ui/src/features/ndv/` and the real English
strings in `packages/frontend/@n8n/i18n/src/locales/en.json`. **Where Judge invents copy for a
state n8n already has copy for, use n8n's** — it is free fidelity.

### The layout

Three panes: **INPUT** | the node | **OUTPUT**. The middle pane is tabbed
(`app/types/nodeSettings.ts`):

```ts
type NodeSettingsTab = 'params' | 'settings' | 'docs' | 'action' | 'credential' | 'communityNode';
```

Labels, from i18n: **Parameters** (short form "Params"), **Settings**, **Docs**, **Action**, and
— note this — the credential tab is labelled **"Auth"**, not "Credentials". `Action` and `Auth`
only appear for nodes that have them; `Auth` shows a red triangle when the credential is missing.

### The Parameters tab

Rendered from `description.properties`, minus anything with `isNodeSetting: true`, filtered by
`displayOptions`. Per-field affordances:

- **Fixed / Expression toggle** on every field (`parameterInput.fixed` = "Fixed",
  `parameterInput.expression` = "Expression"), *unless* the property sets
  `noDataExpression: true`. Switching to Expression rewrites the stored value to a string
  starting with `=`; switching back strips the leading `=` (`parseFromExpression`,
  `ndv.utils.ts:400`). For a `multiOptions` field, an expression's string result is
  comma-split and then filtered against the declared options — values not in the list are
  silently dropped.
- **Required fields** show "This field is required".
- **Issue states** are surfaced per field with tooltips of the form
  `Parameter: "{path}" has issues` / `…has an expression` / `…has issues and an expression`.
- **Dropdowns that need the network** (`loadOptionsMethod`, `listSearch`) have their own
  states: "Loading options…", "Error fetching options from {service}", "Refresh List", and
  crucially **"Set up credential to see options"** — the ordering constraint that a real
  learner meets first is *credential before parameters*, not parameters before settings.
- **Drag-to-map from INPUT** is the signature interaction: "Drag an **input field** from the
  left to use it here.", "Drag onto a field to map column to that field", a first-run nudge
  ("Map data from previous nodes to **{node}** by first clicking this button"), and a success
  toast, "You just mapped some data!". Hovering items in table view does the same thing.

### The Settings tab — exactly

`createCommonNodeSettings()` (`features/ndv/shared/ndv.utils.ts:456`) builds it. This is the
list, in order, with the real labels, descriptions, defaults and limits:

| # | Label | Type | Default | Limits / visibility | Description (verbatim) |
|---|---|---|---|---|---|
| 1 | Always Output Data | boolean | `false` | | "If active, will output a single, empty item when the output would have been empty. Use to prevent the workflow finishing on this node." |
| 2 | Execute Once | boolean | `false` | | "If active, the node executes only once, with data from the first item it receives" |
| 3 | Retry On Fail | boolean | `false` | | "If active, the node tries to execute again when it fails" |
| 4 | Max. Tries | number | `3` | **min 2, max 5**; shown only when Retry On Fail | "Number of times to attempt to execute the node before failing the execution" |
| 5 | Wait Between Tries (ms) | number | `1000` | **min 0, max 5000**; shown only when Retry On Fail | "How long to wait between each attempt (in milliseconds)" |
| 6 | On Error | options | `stopWorkflow` | three options, below | "Action to take when the node execution fails" |
| 7 | Notes | string | `''` | `rows: 5` | "Optional note to save with the node" |
| 8 | Display Note in Flow? | boolean | `false` | | "If active, the note above will display in the flow as a subtitle" |

On Error's three options, with their real labels and one-line descriptions:

| Value | Label | Description |
|---|---|---|
| `stopWorkflow` | **Stop Workflow** | "Halt execution and fail workflow" |
| `continueRegularOutput` | **Continue** | "Pass error message as item in regular output" |
| `continueErrorOutput` | **Continue (using error output)** | "Pass item to an extra `error` output" |

Three structural facts about this tab:

1. **Every field is `noDataExpression: true`.** No setting can be an expression. A settings
   value is a constant, decided at design time.
2. **Tool and model sub-nodes get a reduced tab.** `createCommonNodeSettings` takes an
   `isToolOrModelNode` flag, and when set it emits **only Notes and Display Note in Flow** —
   the entire Always Output Data / Execute Once / Retry / On Error block is absent. It makes
   sense (a sub-node isn't in the data flow, so there is no output to always emit and no
   downstream to continue to), and it is a real fidelity rule: a Chat Model's Settings tab is
   nearly empty.
3. **Every field carries `isNodeSetting: true`**, which is how the same `INodeProperties`
   machinery renders two different tabs. The Settings tab is not special-cased UI; it is the
   ordinary parameter renderer over a different list.

The defaults the NDV seeds a fresh node with (`getNodeSettingsInitialValues`,
`ndv.utils.ts:41`):

```ts
{ color: '#ff0000', alwaysOutputData: false, executeOnce: false, notesInFlow: false,
  onError: 'stopWorkflow', retryOnFail: false, maxTries: 3, waitBetweenTries: 1000,
  notes: '', customTelemetryTags: {}, parameters: {} }
```

### What counts as "not set up"

`getParameterIssues()` (`node-helpers.ts:1517`) is the authority, and it has one rule that is
easy to get wrong:

> **A required parameter only produces an issue if it is currently displayed.**

A required field hidden by `displayOptions` is never "missing". That is the only way a form with
dozens of conditionally-shown required fields can ever be complete. Beyond that:

- `resourceLocator` / `workflowSelector` / `agentSelector` values are validated **against the
  selected mode** — a mode can declare regex validation with its own error message, so an ID
  typed into "By ID" mode can be individually wrong.
- Validation is skipped for values containing the custom-API-call marker, and for
  `options`/`multiOptions` properties that set `allowArbitraryValues`.
- **Disabled and pinned nodes report no issues at all** (`node-helpers.ts:1261`) — n8n does not
  nag you about a node it isn't going to run.
- Missing required *credentials* and missing required *inputs* land in the same `INodeIssues`
  object as parameters (`{ parameters, credentials, input, execution, typeUnknown }`). One red
  triangle, three possible causes.

### `typeOptions` — the knobs that shape a field

`INodePropertyTypeOptions` (`interfaces.ts:1833`) is where a field's behaviour is tuned. The
ones that change what a learner sees:

| Option | Applies to | Effect |
|---|---|---|
| `minValue` / `maxValue` / `numberPrecision` | number | bounds and step |
| `rows` | string | textarea instead of input |
| `password` | string | masked |
| `editor` | string | a code editor: `codeNodeEditor`, `jsEditor`, `htmlEditor`, `sqlEditor`, `cssEditor` |
| `multipleValues` (+ `multipleValueButtonText`, `sortable`) | any | repeatable field with an "Add …" button |
| `loadOptionsMethod`, `loadOptionsDependsOn` | options | fetch the list live; refetch when a named field changes |
| `fixedCollection.itemTitle` / `.layout: 'inline'` | fixedCollection | how each repeated group is titled and laid out |
| `minRequiredFields` / `maxAllowedFields` / `hideOptionalFields` | fixedCollection | how much of the group is mandatory or hidden behind "Add optional field" |
| `filter`, `assignment`, `resourceMapper` | those types | configure the condition / mapping builders |
| `dateOnly`, `showAlpha`, `alwaysOpenEditWindow`, `copyButton`, `sectionHeader`, `buttonConfig` | various | smaller affordances |

`loadOptionsDependsOn` is worth calling out: it is how a real NDV cascades — pick a resource,
and the operation list reloads. Judge's fields are independent, which removes a whole class of
"why is this dropdown empty?" confusion that real n8n creates.

### The INPUT pane

Its states are the teaching material, and n8n's copy for them is good:

| State | Copy |
|---|---|
| Nothing wired | **"No input connected"** / "Wire me up" — "This node can only receive input data if you connect it to another node." |
| Wired but upstream hasn't run | **"No input data"** — "Execute previous nodes to view input data", with a hint "(From the earliest node that needs it)" and tooltip "From the earliest node which is unexecuted, or is executed but has since been changed" |
| Schema preview instead of data | "Usually outputs the following fields. **Execute the node** to see the actual ones." / "There may be more fields. Execute the node to be sure." |
| Upstream disabled | "This node is disabled and will just pass data through" |
| Sub-node | **"Parent node hasn't run yet"** — "Inputs that the parent node sends to this one will appear here." |
| Ran, but nothing on this path | "No fields - node executed, but no items were sent on this branch" |
| Items exist but are empty | "No fields - item(s) exist, but they're empty" |

There is also a node picker in the pane ("Parent nodes", "{count} nodes back") — you can inspect
*any* upstream node's output from here, not just the immediate parent.

### The OUTPUT pane

- **Branch and run selectors.** "Branch", "Run", "{current} of {total}", "{count} items". A node
  that ran several times in a loop keeps every run, and a router's outputs are browsable per
  branch. Judge's Run animation shows one pass; real n8n shows a history.
- **This is where n8n teaches Always Output Data**, at the exact moment it matters:

  > **No output data returned**
  > "n8n stops executing the workflow when a node has no output data. You can change this
  > default behaviour via **Settings > "Always Output Data"**."

  A grading product should steal this move: the failure explains the setting that fixes it.
- **Stale output** is called out explicitly — "Node parameters have changed. Test node again to
  refresh output." and, for pinned data, "Node parameter changes will not affect pinned output
  data." This is the "dirty node" concept, and it is copy, not just an icon.
- Editable output: "Edit Output" / "set mock data" is how pinning is offered.

### "Execute step"

The button is labelled **"Execute step"**, described as "Runs the current node. Will also run
previous nodes if they have not been run yet" — i.e. it is the partial execution of §7, not a
single-node call. Its disabled reasons are all distinct strings, which is a good checklist of
what "ready to run" means:

- "Complete required fields first"
- "Fix previous node first" / "A previous node has missing required fields"
- "Enable node to execute" / "This node is deactivated and can't be run"
- "Workflow is already running"

and its tooltip counts the work for you: "Will execute {n} times, once for each input item".

For triggers the same button becomes **"Listen for test event"** / "Fetch Test Event" /
"Stop Listening", with polling-specific hints ("This node is looking for an event in {service}
that is similar to the one you defined") and the activation nudge: "Once you've finished building
your workflow, publish it to have it also check for events regularly."

> One string in the locale describes a behaviour worth knowing but whose call site is not in
> this checkout: **"Parameters changed" / "Order of parameters changed, outgoing connections
> were cleared."** Reordering the parameters that define a node's outputs (Switch rules,
> classifier categories) can drop the wires attached to them — because a branch is an output
> *index* (§2), so reordering rules re-points every connection.

---

## 6. `typeVersion` — the thing a screenshot pass cannot see

`VersionedNodeType` (`versioned-node-type.ts`) is 30 lines and worth reading in full. A
versioned node registers a map of version number → implementation:

```ts
const nodeVersions = {
  1: new HttpRequestV1(base), 2: new HttpRequestV2(base),
  3: new HttpRequestV3(base), 4: new HttpRequestV3(base),
  4.1: new HttpRequestV3(base), /* … */ 4.5: new HttpRequestV3(base),
};
```

- `getNodeType(version)` returns that exact implementation; **`getNodeType()` with no argument
  returns `defaultVersion ?? max(keys)`**. That single line is why `/types/nodes.json` gives
  you one schema per type.
- **The class name is not the version.** `HttpRequestV3` serves typeVersions 3 → 4.5.
  `SetV2` (Edit Fields) serves `version: [3, 3.1, 3.2, 3.3, 3.4, 3.5]`. `MergeV3` serves 3–3.2.
- A workflow pins `typeVersion` per node. n8n **never migrates it silently** — an old workflow
  keeps running the old schema against the old code path forever. The NDV surfaces this:
  "{node} node version {version}", plus "Latest" / "Latest version: {version}" markers and a
  "Deprecated" badge.

### The schema really does change between versions

`LmChatOpenAi.node.ts:745` — the same node, two shapes for the same field:

```ts
const version = this.getNode().typeVersion;
const modelName = version >= 1.2
  ? (this.getNodeParameter('model.value', itemIndex) as string)   // resourceLocator
  : (this.getNodeParameter('model', itemIndex) as string);        // plain string
```

Before 1.2, `model` is a string. From 1.2, it is a `resourceLocator` and the value lives at
`model.value`. A grader that only knows the current shape marks a correct older workflow wrong.

### Versions in the nodes we care about

| Node | type | typeVersions | notes |
|---|---|---|---|
| AI Agent | `@n8n/n8n-nodes-langchain.agent` | 1 … 1.9, 2 … 2.3, **3, 3.1** | `defaultVersion: 3.1`; three implementation classes |
| Text Classifier | `@n8n/n8n-nodes-langchain.textClassifier` | 1, 1.1 | |
| OpenAI Chat Model | `@n8n/n8n-nodes-langchain.lmChatOpenAi` | 1, 1.1, 1.2, 1.3 | `model` becomes a resourceLocator at 1.2 |
| Switch | `n8n-nodes-base.switch` | 3, 3.1, 3.2, 3.3, 3.4 (+ V1, V2) | condition-builder version keyed off `$nodeVersion` |
| If | `n8n-nodes-base.if` | 2, 2.1, 2.2, 2.3 (+ V1) | |
| Filter | `n8n-nodes-base.filter` | 2, 2.1, 2.2, 2.3 (+ V1) | |
| Merge | `n8n-nodes-base.merge` | 3, 3.1, 3.2 (+ v1, v2) | dynamic input count |
| Edit Fields (Set) | `n8n-nodes-base.set` | 3, 3.1, 3.2, 3.3, 3.4, 3.5 | class is `SetV2` |
| HTTP Request | `n8n-nodes-base.httpRequest` | 1, 2, 3, 4, 4.1 … 4.5 | |
| Code | `n8n-nodes-base.code` | 1, 2 | |
| Webhook | `n8n-nodes-base.webhook` | 1, 1.1, 2, 2.1 | |
| Gmail Trigger | `n8n-nodes-base.gmailTrigger` | 1, 1.1, 1.2, 1.3, 1.4 | `polling: true` |
| Loop Over Items | `n8n-nodes-base.splitInBatches` | 3 (+ v1, v2) | |
| No Operation | `n8n-nodes-base.noOp` | 1 | |

Across `nodes-base`: **90** node files declare a version *array*, **50** classes extend
`VersionedNodeType`, and **381** declare a single numeric version. Roughly a fifth of the
catalogue is multi-version, and it is concentrated in exactly the nodes a curriculum teaches.

---

## 7. The execution model

### Items

Everything between nodes is `INodeExecutionData[]` (`interfaces.ts:1682`):

```ts
{ json: IDataObject, binary?: IBinaryKeyData, error?: …, pairedItem?: … }
```

A node's output is `INodeExecutionData[][]` — **an array per output index**. A one-output node
returns `[items]`. `NoOp.node.ts` is the whole contract in four lines:

```ts
async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  return [items];
}
```

### `execute()` is called once, not once per item

This is the most commonly mis-modelled thing in n8n, including in its own docs' phrasing.
The engine calls `execute()` **once per node run** and hands it every item. The
*node* loops (`GmailV2.node.ts:204`):

```ts
const items = this.getInputData();
for (let i = 0; i < items.length; i++) { /* one API call per item */ }
```

Consequences:

- "A Slack node fed 5 items sends 5 messages" is true because the Slack node's own loop does
  that, not because the engine re-ran it. (The NDV's tooltip — "Will execute 5 times, once for
  each input item" — is describing the node's internal loop.)
- Nodes that *don't* loop (aggregations, some bulk DB ops, Merge, Loop Over Items) are not
  exceptions to a rule — there is no rule.
- `this.getNodeParameter(name, itemIndex)` is resolved **per item**, so an expression in a
  parameter can produce a different value on every item of the same run. Parameters read
  outside the loop conventionally use index `0` (`getNodeParameter('resource', 0)`).
- `continueOnFail()` is checked *inside* the node's own loop, which is why the "continue on
  error" behaviour differs slightly between nodes.

### The stack, and execution order

The engine keeps a `nodeExecutionStack` and drains it (`workflow-execute.ts:1577`,
`processRunExecutionData`). After a node runs, each target of each output is enqueued.

**`executionOrder: 'v1'`** (all current workflows):

- New work is `unshift`ed onto the stack — **depth-first**. A branch is followed to its end
  before the next branch starts (`workflow-execute.ts:441`).
- When one node feeds several targets, they are sorted so that the node **further up, then
  further left** goes first (`workflow-execute.ts:2281`). Canvas position is load-bearing:
  moving a node changes execution order.
- A node with multiple main inputs does **not** force its upstream branches to run. If only
  one input has data, `prepareConnectionInputData` uses the first input that has any
  (`workflow-execute.ts:964`).
- `description.requiredInputs` is honoured only here: if every input is required and not all
  have data, the node stays waiting (`workflow-execute.ts:2346`).

**`executionOrder: 'v0'`** (legacy): `push` instead of `unshift` — breadth-first — and inputs
are force-executed, so a multi-input node waits for all of them.

**Waiting nodes.** A node with >1 input goes into `waitingExecution` until its inputs arrive
(`prepareWaitingToExecution`, `workflow-execute.ts:411`). When the stack empties and waiting
nodes remain, the engine runs those that don't require all inputs, skipping any whose parents
are themselves still waiting (`workflow-execute.ts:2320`).

### Disabled nodes are pass-throughs, not deletions

`handleDisabledNode` (`workflow-execute.ts:935`) returns the first main input's items
unchanged. Data flows *through* a disabled node to whatever it feeds. `getHighestNode()` skips
disabled nodes when resolving what actually feeds a connection; if *all* upstream nodes on an
input are disabled, the node runs with no data rather than waiting forever
(`ensureInputData`, `workflow-execute.ts:2562`).

### `executeOnce`

`handleExecuteOnce` (`workflow-execute.ts:1027`) slices every input to its first item before
the node runs. It is a truncation of the input, not a change to how the node loops.

### Partial execution

`runPartialWorkflow2` (`workflow-execute.ts:207`) builds a `DirectedGraph` from the workflow
and runs only what the destination node needs, reusing prior `runData` and honouring
`pinData` and a list of "dirty" nodes. This is the NDV's *Execute step*, and it is a real graph
algorithm, not a re-run with a filter.

---

## 8. Error behaviour and the node settings that change it

### `onError` — `interfaces.ts:1567`

```ts
type OnError = 'stopWorkflow' | 'continueRegularOutput' | 'continueErrorOutput';
```

- **`stopWorkflow`** (default) — the error propagates and the execution ends as `error`.
- **`continueRegularOutput`** — the failing item continues out of the *normal* output, carrying
  an `error` key in its JSON. Downstream nodes see it as data.
- **`continueErrorOutput`** — the node gains an extra output, appended after its main outputs,
  and failing items go there (`handleNodeErrorOutput`, `workflow-execute.ts:2710`). The count of
  existing main outputs is computed from the *resolved* outputs, so on a Switch the error output
  index depends on how many rules are configured.

`continueOnFail: boolean` is the legacy predecessor; `continuesOnError()`
(`workflow-execute.ts:988`) treats it as equivalent to the two `continue*` values.

### `retryOnFail`

```ts
maxTries        = min(5, max(2, node.maxTries        ?? 3))   //  2 … 5,  default 3
waitBetweenTries= min(5000, max(0, node.waitBetweenTries ?? 1000)) // 0 … 5000ms, default 1000
```

(`workflow-execute.ts:1797`.) The clamps match the NDV's `minValue`/`maxValue` exactly (§5), so
the engine and the form agree: 1 try is unreachable, and so is a 60-second wait. Retries are
also triggered by a *soft* failure — an output item whose `json.error` is set, not only a thrown
error (`checkFailure`, `workflow-execute.ts:1791`). A node resuming after a sub-workflow error is
exempt: there is nothing to re-run.

### `alwaysOutputData`

If the node produced nothing, `alwaysOutputData` synthesises **one empty item**
`{ json: {}, pairedItem: […all input items] }` on output 0 (`workflow-execute.ts:1934`).

This is the setting Judge's simulation already models, and the source confirms why it matters
pedagogically: without it a node that matched nothing outputs nothing and the branch simply
stops; with it, the branch continues carrying an *empty* item, so the next node runs and does
something visible — sends a blank reply, writes an empty row. It converts a silent stop into a
visible wrong outcome, which is a genuinely different failure to debug. n8n makes the same point
in the OUTPUT pane's empty state (§5).

---

## 9. Expressions

A parameter value is an expression when the **string starts with `=`**
(`expressions/expression-helpers.ts:5`) — the whole value, not the `{{ }}` inside it. Templates
are `{{ … }}` within that string; `={{ $json.subject }}` is one interpolation,
`=Hi {{ $json.name }}, ref {{ $json.id }}` is a literal with two.

### The variables that exist

Read from `workflow-data-proxy.ts:1442+` (the per-node data proxy):

| | |
|---|---|
| Current item | `$json`, `$binary`, `$itemIndex`, `$position`, `$thisItem`, `$thisItemIndex` |
| Input | `$input.all()` / `.first()` / `.last()` / `.item` / `.params` / `.context` |
| Other nodes | `$('Node Name')`, `$node`, `$items(node, output, run)`, `$item(index, run)`, `$prevNode`, `$self` |
| This node | `$parameter`, `$rawParameter`, `$nodeVersion`, `$nodeId`, `$webhookId` |
| Run | `$runIndex`, `$thisRunIndex`, `$mode`, `$workflow` |
| Time | `$now`, `$today` (both Luxon `DateTime`) |
| Utility | `$jmesPath` / `$jmespath`, `$evaluateExpression`, `$getPairedItem`, `$env` |
| AI | `$fromAI` (also accepted as `$fromai` / `$fromAi`), `$agentInfo`, `$tool` |

`$execution` (`.id`, `.mode` = `test`\|`production`, `.resumeUrl`, `.resumeFormUrl`,
`.customData`), `$vars`, `$secrets` and `$evaluation` are injected separately as *additional
keys* by the runtime (`core/src/execution-engine/node-execution-context/utils/get-additional-keys.ts:35`),
which is why they don't appear in the proxy above. `$mode` is `manual` where `$execution.mode`
is `test`. `$getPairedItem` is deprecated and the editor says so.

Expressions are evaluated in a sandbox with `Object`, `Error` and friends replaced by hardened
wrappers (`expression.ts:100`, `:174`) and property-access tokens filtered
(`expression-sandboxing.ts`) — worth knowing before assuming an expression can do anything JS can.

### Item linking (`pairedItem`)

```ts
interface IPairedItemData { item: number; input?: number; sourceOverwrite?: ISourceData }
```

`assignPairedItems` (`workflow-execute.ts:1928`) records, for each output item, which input item
it came from. `$('Node').item` walks that chain backwards. When a node transforms item counts
without maintaining the links, the chain breaks and you get n8n's characteristic
`pairedItemNoConnection` / "Referenced node is unexecuted" errors — which are *linking* errors,
not missing-data errors.

---

## 10. Cluster nodes — the AI layer

A **cluster node** is a root node plus sub-nodes attached over typed, non-`main` connectors.
This is the mechanism, not a metaphor: sub-nodes implement `supplyData()` instead of
`execute()`, and declare a non-`main` output.

### The twelve connection types — `interfaces.ts:2775`

```
main
ai_agent          ai_chain          ai_document      ai_embedding
ai_languageModel  ai_memory         ai_outputParser  ai_retriever
ai_reranker       ai_textSplitter   ai_tool          ai_vectorStore
```

Sub-node families in `nodes-langchain`, by the connector they emit:

| Connector | Node files |
|---|---|
| `ai_languageModel` | 24 |
| `ai_embedding` | 12 |
| `ai_tool` | 11 (plus **256** nodes-base nodes carrying `usableAsTool`) |
| `ai_memory` | 7 |
| `ai_vectorStore` | 4 |
| `ai_document` | 4 |
| `ai_outputParser` | 3 |
| `ai_textSplitter` | 3 |
| `ai_retriever`, `ai_reranker` | 1 each |

A sub-node's description is minimal — `LmChatOpenAi.node.ts:106`:

```ts
inputs: [],
outputs: [NodeConnectionTypes.AiLanguageModel],
outputNames: ['Model'],
```

No main input, no main output. It cannot be part of the data flow; it can only be supplied to
something else. Its NDV reflects that: the OUTPUT pane says "Output will appear here once the
parent node is run", and its Settings tab is the reduced one from §5.

### Root nodes declare their sub-node inputs — and often dynamically

The AI Agent's `inputs` is an **expression that builds the input list from the node's own
parameters** (`AgentV3.node.ts:33`):

```ts
inputs: `={{
  ((hasOutputParser, needsFallback) => {
    ${getInputs.toString()};
    return getInputs(true, hasOutputParser, needsFallback);
  })($parameter.hasOutputParser === undefined || $parameter.hasOutputParser === true,
     $parameter.needsFallback !== undefined && $parameter.needsFallback === true)
}}`,
```

The function is stringified into the expression so the front-end can evaluate it. Toggling
*Require Specific Output Format* adds an `ai_outputParser` input; enabling *Fallback Model*
adds a second `ai_languageModel` input. `getNodeInputs()` / `getNodeOutputs()`
(`node-helpers.ts:1167`, `:1190`) resolve these via `expression.getSimpleParameterValue` and
return `[]` on failure.

The resolved inputs (`Agent/utils.ts:44`):

| Input | Required | maxConnections |
|---|---|---|
| `main` | — | — |
| `ai_languageModel` ("Chat Model") | **yes** | 1 |
| `ai_languageModel` ("Fallback Model") | yes, when enabled | 1 |
| `ai_memory` | no | 1 |
| `ai_tool` | no | unlimited |
| `ai_outputParser` | no, unless `hasOutputParser` | 1 |

`maxConnections: 1` on model, memory and parser is why you cannot attach two Chat Models; the
absence of a cap on `ai_tool` is why you can attach many tools. `filter.excludedNodes` further
restricts which language models the Agent accepts.

### Text Classifier — the branching AI node

`chains/TextClassifier/TextClassifier.node.ts` is the closest real node to Judge's "Classify
with AI", and its shape is instructive:

```ts
inputs: [
  { displayName: '', type: NodeConnectionTypes.Main },
  { displayName: 'Model', type: NodeConnectionTypes.AiLanguageModel, required: true, maxConnections: 1 },
],
outputs: `={{(${configuredOutputs})($parameter)}}`,
```

where `configuredOutputs` (line 22) produces **one main output per configured category**, named
by the category, plus an `Other` output only when `options.fallback === 'other'`. The fallback
default is `discard` (line 209) — an item matching no category is **dropped silently**.

So a single node classifies *and* routes: category → output index. There is no separate Switch.
The `Model` sub-input is required, and the routing structure is a function of the parameters.

---

## 11. Node behaviour catalogue

Exact behaviour of the nodes a teaching product needs, from their implementations.

### Switch — `n8n-nodes-base.switch`, typeVersion 3 … 3.4

- `outputs: '={{(configuredOutputs)($parameter)}}'` — **outputs are derived from parameters**
  (`SwitchV3.node.ts:21`).
- **Rules mode**: one output per rule, in rule order, named by `rules.values[i].outputKey`
  (falling back to the index).
- **Expression mode**: `numberOutputs` outputs named `0…n-1`; an expression returns the index.
- `options.fallbackOutput`: `'none'` (default — unmatched items are **dropped**), a numeric
  output index, or `'extra'` (appends an extra output, named by `renameFallbackOutput`, default
  `Fallback`).
- `options.allMatchingOutputs` sends an item to *every* matching output, not just the first.
- `checkIndexRange` throws if an expression returns an out-of-range index.
- The condition builder's own version is chosen from the node version:
  `'={{ $nodeVersion >= 3.4 ? 3 : $nodeVersion >= 3.2 ? 2 : 1 }}'`.

### If — `n8n-nodes-base.if`, typeVersion 2 … 2.3

`outputs: [Main, Main]`, `outputNames: ['true', 'false']`. **Output 0 is true, output 1 is
false**, fixed. Conditions are a `filter` parameter with `combinator: 'and' | 'or'` (not mixed)
and per-condition `{ leftValue, operator: { type, operation }, rightValue }`.
`looseTypeValidation` relaxes type checking, and its default is version-dependent
(`getTypeValidationParameter(2.1)`).

### Filter — `n8n-nodes-base.filter`, typeVersion 2 … 2.3

One output. Non-matching items are dropped with no error and no second output. (The description
declares `outputNames: ['Kept', 'Discarded']` against a single `outputs: [Main]` — the second
name is vestigial; there is one output.)

### Merge — `n8n-nodes-base.merge`, typeVersion 3 … 3.2

`inputs: '={{(configuredInputs)($parameter)}}'` — **the number of inputs is a parameter**.
Modes, from the source's own guidance (`v3/actions/versionDescription.ts:18`): `append`
(concatenate), `combineByFields` (join on a key — the default and usually what "merge by ID"
means), `combineByPosition` (only valid when both branches emit the same count in the same
order), `combineAll`, `combineBySql` (AlaSQL; needed for >2 inputs), `chooseBranch` (discard all
but one). The source is explicit that the wrong mode **silently drops or duplicates items rather
than erroring** — good misconception material.

### Loop Over Items — `n8n-nodes-base.splitInBatches`, typeVersion 3

```ts
outputs: [Main, Main], outputNames: ['done', 'loop']
```

**`done` is output 0 and `loop` is output 1** — the reverse of the order people wire them, and a
real trap. State lives in the node's context: `items`, `done`, `noItemsLeft`; `options.reset`
starts over. The node no-ops on empty input, so an IF gate in front of it is redundant.

### Code — `n8n-nodes-base.code`, typeVersion 1, 2

`mode`: `runOnceForAllItems` (default) or `runOnceForEachItem`. `language` (v2+):
`javaScript` | `python` | `pythonNative`. Must return item-shaped data. Runs in a task runner,
not the main process, and `typeOptions.editor: 'codeNodeEditor'` is what gives it a real editor
rather than a textarea.

### Edit Fields (Set) — `n8n-nodes-base.set`, typeVersion 3 … 3.5

`mode`: `manual` (an `assignmentCollection` of field → value) or `raw` (a JSON blob).
`includeOtherFields` decides whether unlisted input fields survive — the classic "where did my
other fields go?" confusion, and it gates a large block of dependent parameters via
`'/includeOtherFields'` root-references.

### No Operation — `n8n-nodes-base.noOp`, typeVersion 1

One input, one output, zero parameters, returns its input. Its NDV shows "This node does not have
any parameters" — the simplest possible demonstration of the items contract.

### HTTP Request — `n8n-nodes-base.httpRequest`, typeVersion 1 … 4.5

One main output. Generic auth (`credentialsSelect`) or a predefined credential.
`curlImport` is a real property type: paste a cURL command and the node fills itself in.

### Webhook — `n8n-nodes-base.webhook`, typeVersion 1 … 2.1

`inputs: []`, dynamic `outputs`, `webhooks: [defaultWebhookDescription]`, and a `webhook()`
method. `responseMode`: `onReceived` | `lastNode` | `responseNode` | `streaming` — each reveals
a different set of options via `displayOptions`.

---

## 12. Triggers

Three mechanisms, distinguished by which method the node implements:

| | Method | `description` flag | Count in `nodes-base` |
|---|---|---|---|
| Polling | `poll()` | `polling: true` | 17 |
| Webhook | `webhook()` + `webhookMethods` | `webhooks: [...]` | 86 files |
| Push / long-lived | `trigger()` | — | — |

All triggers share `inputs: []` and `group: ['trigger']`.

**Gmail Trigger** (`GmailTrigger.node.ts`) is the canonical polling trigger: `polling: true`,
`inputs: []`, `outputs: [Main]`, typeVersions 1 → 1.4, and a `poll()` that returns
`INodeExecutionData[][] | null` — `null` meaning "nothing new, don't count an execution". Its
own description warns that a poll may return **multiple items**, so downstream logic must handle
more than one email per run. That is a genuine misconception worth teaching: the trigger is not
one-email-at-a-time.

In the NDV, a trigger's run button becomes "Listen for test event" / "Fetch Test Event", and n8n
is explicit that testing is not the same as running: "Once you've finished building your
workflow, publish it to have it also check for events regularly (you just won't see those
executions here)."

Polling triggers persist cursors in workflow **static data** (`workflow.staticData`), and the
engine writes it back only when `__dataChanged` is set (`workflow-execute.ts:processSuccessExecution`).

---

## 13. Credentials

`description.credentials` is an array of `INodeCredentialDescription`
(`interfaces.ts:2558`):

```ts
{ name: 'gmailOAuth2', required?: true, displayName?, displayOptions?, testedBy? }
```

- The node declares which credential **types** it needs; `displayOptions` makes the requirement
  conditional (e.g. only when `authentication: 'oAuth2'`).
- `INode.credentials` maps the type name to `{ id, name }` — the node stores a *reference*,
  never a secret.
- `testedBy` names a function in `methods.credentialTest`, which is how "the credential was
  tested on save" works.
- A missing required credential becomes `INodeIssues.credentials`, i.e. the same red triangle as
  a missing parameter, and lights up the **Auth** tab (§5).
- The credential comes **before** the parameters in practice, because option lists can't load
  without it: "Set up credential to see options".

---

## 14. What this means for Judge

### Already faithful

| Judge | Real n8n | Verdict |
|---|---|---|
| Connections keyed by source node **name** | `IConnections` | ✅ |
| `main` as an array-per-output; a branch is an **output index** | `NodeInputConnections` | ✅ |
| Sub-nodes over typed `ai_*` connectors | `NodeConnectionTypes` | ✅ correct set of names |
| `asWorkflow()` normalising React Flow at the boundary | n8n keeps one canonical shape | ✅ right instinct |
| Node role resolved from catalog metadata, not hard-coded | engine reads methods + `inputs`/`outputs`, never `group` | ✅ same principle |
| Settings living beside `parameters`, not inside | `INode` | ✅ |
| `SETTINGS_SPEC` shared across node types | `createCommonNodeSettings` is one shared list | ✅ exactly right |
| Only graded settings editable, rest locked at real defaults | n8n's defaults are in §5 — check them against ours | ✅ approach, ⚠️ verify values |
| `onError` and `alwaysOutputData` changing what a Run narrates | §8 | ✅ and the *reason* is right |
| Settings tab unlocking only after Parameters verify | not n8n's behaviour, but a pedagogical choice | ✅ deliberate |

### Confirmed differences worth knowing

1. **`alwaysOutputData` produces exactly one empty item with `pairedItem` covering all inputs.**
   Judge narrates the consequence correctly; if the Run ever shows item counts, that's the number.
2. **`retryOnFail` clamps to 2–5 tries and 0–5000 ms**, in *both* the form and the engine. If
   Judge ever grades Max Tries, `1` is not a reachable value.
3. **`continueErrorOutput` appends the error output *after* the resolved main outputs.** On a
   router the index therefore depends on the branch count — it is not a fixed slot.
4. **Canvas position determines execution order under `executionOrder: v1`** (up, then left).
   Judge's simulation walks the graph structurally, which is fine for single-path flows but
   would diverge on a fan-out where two branches both do something observable.
5. **Disabled nodes pass data through.** If Judge ever adds a disable affordance, it must not
   model it as a cut wire.
6. **`Filter` has one output; `Loop Over Items` has `done` at index 0 and `loop` at index 1.**
   Both are easy to get backwards.
7. **Judge's "Classify with AI" maps to Text Classifier, whose unmatched-item default is
   `discard`.** Judge's `branch: null` fall-through in `sampleCases` is exactly right, and the
   real node's default confirms it: silence is the default behaviour, not an authoring quirk.
8. **A required field that is hidden is not missing.** If Judge adds conditional fields, the
   "configured?" check must respect visibility or it will demand values for fields nobody can see.
9. **Sub-nodes have a nearly empty Settings tab** — no Always Output Data, Execute Once, Retry or
   On Error. Judge's Chat Model should not offer them.
10. **The credential gates the parameters, not the other way round.** Real dropdowns can't
    populate until auth exists. Judge's `credential` + fields ordering already matches this;
    worth keeping when the NDV changes.

### Progress on the gaps below (2026-07-29)

| Gap | State |
|---|---|
| Sub-node reduced Settings tab | ✅ done |
| Dependent settings hidden, not dimmed | ✅ done |
| Hidden required field not demanded / not scored | ✅ done — `showWhen`, and the rubric skips unanswered conditional fields |
| `typeVersion` recorded in the catalogue | ✅ done — `n8nType` / `n8nVersion` per entry, with tests |
| `maxConnections` | ✅ enforced (no drag-to-connect; the `+` hides at the cap) and now stated as catalogue data with n8n's real, non-uniform caps |
| Sub-node wire geometry | ✅ done — no main ports, top connector, diamond accepts from below |
| Copy adopted where the state matches | ✅ partial, deliberately — see the note below |
| `resourceLocator` | ✅ done — `{ __rl, mode, value }`, graded on the value |
| `fixedCollection` · `filter` · `assignmentCollection` | ⬜ **not started — one feature, and a large one.** See below |
| Dynamic outputs | ⬜ blocked on `fixedCollection` |
| Browsable runs/branches in OUTPUT | ⬜ deliberately not doing — see below |

**On copy:** adopting n8n's strings wholesale is wrong, because several of the
states are not the same states. Judge's "Verify setup" is a *graded* check, not
n8n's "Execute step"; its empty INPUT pane offers test data rather than asking you
to execute upstream nodes. Adopted where the state genuinely matches: the
sub-node's OUTPUT pane ("Output will appear here once the parent node is run") and
the disabled-run reason ("Complete required fields first").

**On `fixedCollection` and dynamic outputs:** these are one piece of work and it is
the biggest thing left in M1.5. A Switch rule is a `fixedCollection` of `filter`s,
so the three remaining structural types collapse into one editor — and once rules
are editable, outputs must derive from them, which is the "the node's shape is a
consequence of its configuration" idea. It also needs a **new grading shape**: the
rubric currently assumes one scored item per field, and a variable-length list of
rules is not that. Worth doing, not worth half-doing.

**On browsable runs/branches:** skipped on purpose. It is how real debugging feels,
but Judge's Run is a narrated single pass by design, and a run history would
compete with the narration rather than add to it.

### Fidelity gaps worth a decision

- **`typeVersion` is absent from Judge's model entirely.** Right call for now — one shipped
  schema per node type — but `NODE_CATALOG` entries should record the version they were authored
  against, or the catalogue will silently drift from the n8n a learner meets afterwards. This is
  cheap to add now and expensive to retrofit once problems are versioned in the DB.
- **Judge grades five `FieldControl` kinds; four real property types are structurally
  different** (`resourceLocator`, `fixedCollection`, `filter`, `assignmentCollection`).
  "Configure a Switch rule" or "map a field in Edit Fields" cannot be modelled as a select
  without changing what is being taught. This is the concrete shape of M1.5's remaining B6
  fan-out.
- **`displayOptions` conditional visibility does not exist in Judge's NDV.** Real nodes reveal
  and hide fields as you configure them, which is a large part of why the real NDV feels
  overwhelming. A `showWhen` on `nodeSetup.fields[]` would be a small data-only addition with a
  high fidelity return — and note that n8n's own Settings tab uses it (Max Tries appears only
  when Retry On Fail is on), so Judge's Settings tab is *already* a simplification of it.
- **Dynamic outputs.** In real n8n, adding a Switch rule *creates an output*; in Judge, branches
  come from `problem.branches` and are fixed. Fine for a fixed-answer exercise, but it means the
  learner never experiences "the node's shape is a consequence of its configuration", which is
  the single most n8n-ish idea in the product. The related trap — reordering rules re-points
  connections, because a branch is an index — is invisible to us for the same reason.
- **`maxConnections` is not enforced.** One Chat Model per Agent and per Text Classifier is a
  rule in the real description; a learner who wires two should be told why they can't.
- **Copy.** Judge writes its own strings for states n8n already names. §5 lists the real ones —
  "Execute step", "Complete required fields first", "No input connected / Wire me up",
  "No output data returned", "Node parameters have changed. Test node again to refresh output."
  Adopting them costs nothing and makes the transfer to real n8n shorter. The strongest one to
  steal is the empty-output message that **points at the setting which fixes it**; that is the
  same teaching move Judge makes with `alwaysOutputData`, and n8n makes it in-product.
- **Runs and branches are browsable in the real OUTPUT pane** ("Run 2 of 3", branch selector).
  Judge's Run shows a single pass. Not worth building now, but it is why real debugging feels
  different.

---

## 15. Appendix — where to look for what

Paths are relative to the n8n repo root.

| Question | File |
|---|---|
| What is a node? What is a workflow? | `packages/workflow/src/interfaces.ts` (4253 lines; the whole model) |
| Graph helpers, node lookup, parent/child traversal | `packages/workflow/src/workflow.ts` |
| Parameter resolution, visibility, validation, inputs/outputs evaluation | `packages/workflow/src/node-helpers.ts` |
| Version dispatch | `packages/workflow/src/versioned-node-type.ts` |
| Expression evaluation and sandboxing | `packages/workflow/src/expression.ts`, `expression-sandboxing.ts`, `expressions/` |
| Expression variables | `packages/workflow/src/workflow-data-proxy.ts` (+ `core/…/utils/get-additional-keys.ts`) |
| The execution loop, ordering, waiting, retries, error outputs | `packages/core/src/execution-engine/workflow-execute.ts` (2902 lines) |
| Per-node execution context (`this.getNodeParameter`, `this.getInputData`) | `packages/core/src/execution-engine/node-execution-context/` |
| Credential decryption and testing | `packages/core/src/credentials.ts` |
| **The Settings tab, NDV defaults, expression⇄fixed conversion** | `packages/frontend/editor-ui/src/features/ndv/shared/ndv.utils.ts` |
| **NDV tabs, panes, parameter list** | `packages/frontend/editor-ui/src/features/ndv/{settings,parameters,panel,runData}/` |
| **Every user-facing string** | `packages/frontend/@n8n/i18n/src/locales/en.json` (`nodeSettings.*`, `ndv.*`, `parameterInput*`, `dataMapping.*`) |
| Any specific node's real schema | `packages/nodes-base/nodes/<Name>/…` |
| A node's documented output shape, per version | `…/<Node>/__schema__/v<x.y.z>/output.json` |
| AI/cluster nodes | `packages/@n8n/nodes-langchain/nodes/{agents,chains,llms,memory,tools,output_parser,…}` |

Reproduce the clone with the commands in §1. Pin the commit when citing a line number — this
file cites `eb38e10`, and n8n moves fast.
