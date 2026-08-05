// Editor-only descriptor for n8n's Stop and Error v1 node. Error creation,
// JSON parsing, workflow failure, and error-workflow dispatch remain inert.

const errorObjectPlaceholder = `{
	"code": "404",
	"description": "The resource could not be fetched"
}`;

const errorTypeOptions = [
  { label: 'Error Message', value: 'errorMessage' },
  { label: 'Error Object', value: 'errorObject' },
];

const stopAndError = {
  type: 'stop-and-error',
  n8nType: 'n8n-nodes-base.stopAndError',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  label: 'Stop and Error',
  defaultName: 'Stop and Error',
  subtitle: '',
  description: 'Throw an error in the workflow',
  details:
    'Configure a custom error message or JSON error object. This catalog entry only models those authoring controls.',
  category: 'core',
  categories: ['Core Nodes', 'Utility'],
  subcategory: 'Flow',
  subcategories: ['Flow'],
  group: ['input'],
  inputs: ['main'],
  outputs: [],
  portMode: 'static',
  dynamicPorts: false,
  icon: '/node-icons/stop-and-error.svg',
  n8nIcon: 'node:stop-and-error',
  iconMode: 'currentColor',
  iconColor: 'red',
  aliases: ['Throw error', 'Error', 'Exception'],
  docs:
    'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.stopanderror/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/StopAndError/StopAndError.node.ts',
    utilityPath: 'packages/nodes-base/nodes/StopAndError/utils.ts',
    metadataPath: 'packages/nodes-base/nodes/StopAndError/StopAndError.node.json',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/stop-and-error.svg',
  },
  defaults: { name: 'Stop and Error' },
  credentials: [],
  params: [
    {
      key: 'errorType',
      label: 'Error Type',
      kind: 'select',
      value: 'errorMessage',
      required: false,
      options: errorTypeOptions,
      description: 'Type of error to throw',
      simulationNote:
        'The selected mode only controls which authoring field is shown. It cannot stop or fail a workflow.',
    },
    {
      key: 'errorMessage',
      label: 'Error Message',
      kind: 'text',
      value: '',
      required: true,
      placeholder: 'An error occurred!',
      showWhen: { errorType: ['errorMessage'] },
      simulationNote:
        'The message is stored as inert text and is never converted into an error.',
    },
    {
      key: 'errorObject',
      label: 'Error Object',
      kind: 'textarea',
      sourceKind: 'json',
      editor: 'json',
      value: '',
      required: true,
      placeholder: errorObjectPlaceholder,
      alwaysOpenEditWindow: true,
      showWhen: { errorType: ['errorObject'] },
      description: 'Object containing error properties',
      simulationNote:
        'The JSON-shaped value remains inert text. It is never parsed, validated, converted into metadata, or raised.',
    },
  ],
  modeParity: {
    sourceParameter: 'errorType',
    expected: ['errorMessage', 'errorObject'],
    represented: errorTypeOptions.map(({ value }) => value),
    default: 'errorMessage',
    docsTerminology: 'operations',
  },
  parameterParity: {
    expected: ['errorType', 'errorMessage', 'errorObject'],
    represented: ['errorType', 'errorMessage', 'errorObject'],
    defaults: {
      errorType: 'errorMessage',
      errorMessage: '',
      errorObject: '',
    },
    requiredByMode: {
      errorMessage: ['errorMessage'],
      errorObject: ['errorObject'],
    },
  },
  portParity: {
    inputs: [{ index: 0, type: 'main' }],
    outputs: [],
    dynamic: false,
  },
  sourceObjectSemantics: {
    inert: true,
    messagePriority: ['message', 'description', 'error', 'serialized object fallback'],
    optionalDisplayFields: ['description', 'type'],
    level: 'error',
    metadata: 'The full object would normally be attached as error metadata.',
  },
  docsSummary: {
    purpose:
      'The live node can fail an execution with custom information and pass that information to an error workflow.',
    errorMessage: 'The Error Message mode normally raises the authored string.',
    errorObject: 'The Error Object mode normally accepts a JSON object of error properties.',
    relatedNode: 'Error Trigger can start a configured error workflow after an execution fails.',
  },
  platformGaps: [
    'The official docs call Error Message and Error Object operations, while the pinned source exposes them as values of the Error Type parameter.',
    'The source JSON control opens its edit window automatically. The catalog preserves that hint but normalizes the value to an inert textarea.',
    'Object message selection, description/type extraction, metadata attachment, workflow failure, and error-workflow dispatch are documented only and never performed.',
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'errorObject',
      sourceType: 'json with alwaysOpenEditWindow',
      normalizedKind: 'textarea',
      reason:
        'The catalog has no dedicated JSON object editor; it retains the source placeholder and editor hint as inert multiline text.',
    },
  ],
  simulation: {
    configurationOnly: true,
    parsesJson: false,
    validatesJson: false,
    createsErrors: false,
    raisesErrors: false,
    stopsWorkflows: false,
    failsExecutions: false,
    dispatchesErrorWorkflows: false,
    routesOutputData: false,
    workflowExecution: false,
    networkAccess: false,
    voice: false,
  },
  output: {},
};

export default stopAndError;
