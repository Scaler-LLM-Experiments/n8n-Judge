// Editor-only descriptor for n8n's Loop Over Items (Split in Batches) v3 node.
// Batching, iteration, node context, reset evaluation, and aggregation remain inert.

const loopBuilderPattern = `<patterns>
	<pattern title="Per-item loop using splitInBatches with nextBatch">
	const sibNode = splitInBatches({
	  version: 3,
	  config: { name: 'Batch Process', parameters: { batchSize: 1 } }
	});

	export default workflow('id', 'name')
	  .add(startTrigger)
	  .to(fetchRecords)
	  .to(sibNode
	    .onDone(finalizeResults)
	    .onEachBatch(processRecord.to(nextBatch(sibNode)))
	  );
	</pattern>
	</patterns>`;

const loopOverItems = {
  type: 'loop-over-items',
  n8nType: 'n8n-nodes-base.splitInBatches',
  n8nVersion: 3,
  defaultVersion: 3,
  versionHistory: [1, 2, 3],
  label: 'Loop Over Items (Split in Batches)',
  defaultName: 'Loop Over Items',
  baseDisplayName: 'Split In Batches',
  subtitle: '',
  description: 'Split data into batches and iterate over each batch',
  details:
    'Configure the size of each batch and whether incoming data starts a fresh loop. This catalog entry only models the authoring surface.',
  category: 'core',
  categories: ['Core Nodes'],
  subcategory: 'Flow',
  subcategories: ['Flow'],
  group: ['organization'],
  inputs: ['main'],
  outputs: [
    { type: 'main', label: 'Done', name: 'done', index: 0, role: 'completion' },
    { type: 'main', label: 'Loop', name: 'loop', index: 1, role: 'batch' },
  ],
  outputNames: ['done', 'loop'],
  portLabels: ['Done', 'Loop'],
  portMode: 'static',
  dynamicPorts: false,
  icon: '/node-icons/loop-over-items.svg',
  n8nIcon: 'node:loop-over-items',
  iconMode: 'currentColor',
  iconColor: 'dark-green',
  aliases: ['Loop', 'Concatenate', 'Batch', 'Split', 'Split In Batches'],
  docs:
    'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.splitinbatches/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/SplitInBatches/SplitInBatches.node.ts',
    versionPath:
      'packages/nodes-base/nodes/SplitInBatches/v3/SplitInBatchesV3.node.ts',
    metadataPath:
      'packages/nodes-base/nodes/SplitInBatches/SplitInBatches.node.json',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/loop-over-items.svg',
  },
  defaults: { name: 'Loop Over Items' },
  builderHint: {
    searchHint:
      "Loop pattern: connect splitInBatches → per-item work → back to splitInBatches via `nextBatch(splitInBatches)`. The `done` output fires automatically after all items are processed. Already no-ops on empty input — do NOT add an IF gate before it to check 'has items?'.",
    extraTypeDefContent: [{ content: loopBuilderPattern }],
  },
  credentials: [],
  params: [
    {
      key: 'splitInBatchesNotice',
      label:
        'You may not need this node — n8n nodes automatically run once for each input item. <a href="https://docs.n8n.io/getting-started/key-concepts/looping.html#using-loops-in-n8n" target="_blank">More info</a>',
      kind: 'notice',
      value: '',
      required: false,
    },
    {
      key: 'batchSize',
      label: 'Batch Size',
      kind: 'number',
      value: 1,
      required: false,
      min: 1,
      description: 'The number of items to return with each call',
      simulationNote:
        'The number is retained as authoring metadata and never used to slice, copy, or emit input items.',
    },
    {
      key: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add option',
      fields: [
        {
          key: 'reset',
          label: 'Reset',
          kind: 'boolean',
          value: false,
          required: false,
          expressionSupported: true,
          description:
            'Whether the node starts again from the beginning of the input items. This will treat incoming data as a new set rather than continuing with the previous items.',
          simulationNote:
            'Fixed or expression-authored values are stored but never evaluated and cannot reset iteration state.',
        },
      ],
    },
  ],
  parameterParity: {
    expected: ['splitInBatchesNotice', 'batchSize', 'options'],
    represented: ['splitInBatchesNotice', 'batchSize', 'options'],
    defaults: {
      splitInBatchesNotice: '',
      batchSize: 1,
      options: {},
      'options.reset': false,
    },
  },
  portParity: {
    inputs: [{ index: 0, type: 'main' }],
    outputs: [
      { index: 0, type: 'main', name: 'done' },
      { index: 1, type: 'main', name: 'loop' },
    ],
    dynamic: false,
  },
  docsSummary: {
    normalNodeBehavior:
      'Most n8n nodes already process each input item, so a manual loop is often unnecessary.',
    loopBehavior:
      'At runtime n8n saves the original input and returns Batch Size items through loop on each iteration.',
    completionBehavior:
      'After processing, n8n combines processed data and returns it through done.',
    resetBehavior:
      'Reset treats incoming data as a new set instead of continuing the previous set; an expression can determine when reset applies.',
    terminationWarning:
      'A reset-driven loop needs a valid termination condition or the workflow can remain in an infinite loop.',
    contextHelp: {
      noItemsLeft: 'Runtime context boolean indicating whether all items have been processed.',
      currentRunIndex: 'Runtime context value for the current loop index.',
    },
  },
  platformGaps: [
    'The source has one static main input and two static main outputs; no parameter changes their count or order.',
    'Output 0 is done and output 1 is loop. This ordering is preserved explicitly because loop-back wiring depends on it.',
    'The Reset field accepts n8n expressions, but the simulation stores the expression text/value without evaluating it.',
    'The source builder example is retained as guidance only and does not create nodes, connections, or a loop.',
  ],
  unsupportedVisibleTypes: [],
  simulation: {
    configurationOnly: true,
    readsInputItems: false,
    copiesInputItems: false,
    slicesBatches: false,
    iterates: false,
    loops: false,
    evaluatesExpressions: false,
    resetsState: false,
    readsNodeContext: false,
    writesNodeContext: false,
    tracksRunIndex: false,
    aggregatesProcessedItems: false,
    routesOutputData: false,
    workflowExecution: false,
    networkAccess: false,
    voice: false,
  },
  output: {},
};

export default loopOverItems;
