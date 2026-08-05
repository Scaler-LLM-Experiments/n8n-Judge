// Editor-only descriptor for n8n's Evaluation v4.8 node. Evaluation runs,
// metric calculation, data writes, model calls, and credential use stay inert.

const CORRECTNESS_PROMPT = `You are an expert factual evaluator assessing the accuracy of answers compared to established ground truths.

Evaluate the factual correctness of a given output compared to the provided ground truth on a scale from 1 to 5. Use detailed reasoning to thoroughly analyze all claims before determining the final score.

# Scoring Criteria

- 5: Highly similar - The output and ground truth are nearly identical, with only minor, insignificant differences.
- 4: Somewhat similar - The output is largely similar to the ground truth but has few noticeable differences.
- 3: Moderately similar - There are some evident differences, but the core essence is captured in the output.
- 2: Slightly similar - The output only captures a few elements of the ground truth and contains several differences.
- 1: Not similar - The output is significantly different from the ground truth, with few or no matching elements.

# Evaluation Steps

1. Identify and list the key elements present in both the output and the ground truth.
2. Compare these key elements to evaluate their similarities and differences, considering both content and structure.
3. Analyze the semantic meaning conveyed by both the output and the ground truth, noting any significant deviations.
4. Consider factual accuracy of specific details, including names, dates, numbers, and relationships.
5. Assess whether the output maintains the factual integrity of the ground truth, even if phrased differently.
6. Determine the overall level of similarity and accuracy according to the defined criteria.

# Output Format

Provide:
- A detailed analysis of the comparison (extended reasoning)
- A one-sentence summary highlighting key differences (not similarities)
- The final similarity score as an integer (1, 2, 3, 4, or 5)

Always follow the JSON format below and return nothing else:
{
  "extended_reasoning": "<detailed step-by-step analysis of factual accuracy and similarity>",
  "reasoning_summary": "<one sentence summary focusing on key differences>",
  "score": <number: integer from 1 to 5>
}

# Examples

**Example 1:**

Input:
- Output: "The cat sat on the mat."
- Ground Truth: "The feline is sitting on the rug."

Expected Output:
{
  "extended_reasoning": "I need to compare 'The cat sat on the mat' with 'The feline is sitting on the rug.' First, let me identify the key elements: both describe an animal ('cat' vs 'feline') in a position ('sat' vs 'sitting') on a surface ('mat' vs 'rug'). The subject is semantically identical - 'cat' and 'feline' refer to the same animal. The action is also semantically equivalent - 'sat' and 'sitting' both describe the same position, though one is past tense and one is present continuous. The location differs in specific wording ('mat' vs 'rug') but both refer to floor coverings that serve the same function. The basic structure and meaning of both sentences are preserved, though they use different vocabulary and slightly different tense. The core information being conveyed is the same, but there are noticeable wording differences.",
  "reasoning_summary": "The sentences differ in vocabulary choice ('cat' vs 'feline', 'mat' vs 'rug') and verb tense ('sat' vs 'is sitting').",
  "score": 3
}

**Example 2:**

Input:
- Output: "The quick brown fox jumps over the lazy dog."
- Ground Truth: "A fast brown animal leaps over a sleeping canine."

Expected Output:
{
  "extended_reasoning": "I need to compare 'The quick brown fox jumps over the lazy dog' with 'A fast brown animal leaps over a sleeping canine.' Starting with the subjects: 'quick brown fox' vs 'fast brown animal'. Both describe the same entity (a fox is a type of animal) with the same attributes (quick/fast and brown). The action is described as 'jumps' vs 'leaps', which are synonymous verbs describing the same motion. The object in both sentences is a dog, described as 'lazy' in one and 'sleeping' in the other, which are related concepts (a sleeping dog could be perceived as lazy). The structure follows the same pattern: subject + action + over + object. The sentences convey the same scene with slightly different word choices that maintain the core meaning. The level of specificity differs slightly ('fox' vs 'animal', 'dog' vs 'canine'), but the underlying information and imagery remain very similar.",
  "reasoning_summary": "The sentences use different but synonymous terminology ('quick' vs 'fast', 'jumps' vs 'leaps', 'lazy' vs 'sleeping') and varying levels of specificity ('fox' vs 'animal', 'dog' vs 'canine').",
  "score": 4
}

# Notes

- Focus primarily on factual accuracy and semantic similarity, not writing style or phrasing differences.
- Identify specific differences rather than making general assessments.
- Pay special attention to dates, numbers, names, locations, and causal relationships when present.
- Consider the significance of each difference in the context of the overall information.
- Be consistent in your scoring approach across different evaluations.`;

const HELPFULNESS_PROMPT = `You are an expert evaluator assessing the helpfulness of responses to user queries.

Evaluate how helpful and useful a given response is to the user's question or request on a scale from 1 to 5. Consider whether the response addresses the user's needs, provides actionable information, and is relevant to their query.

# Scoring Criteria

- 5: Extremely helpful - The response fully addresses the user's needs, provides comprehensive and actionable information, and goes above and beyond to be useful.
- 4: Very helpful - The response addresses most of the user's needs, provides useful information, and is highly relevant.
- 3: Moderately helpful - The response addresses some of the user's needs, provides some useful information, but may lack completeness or depth.
- 2: Slightly helpful - The response provides minimal useful information and only partially addresses the user's needs.
- 1: Not helpful - The response fails to address the user's needs, provides no useful information, or is irrelevant.

# Evaluation Steps

1. Analyze the user's question or request to understand what they're looking for.
2. Evaluate how well the response addresses the specific needs expressed in the query.
3. Assess the completeness and quality of the information provided.
4. Consider the relevance and applicability of the response to the user's situation.
5. Evaluate whether the response provides actionable insights or next steps.
6. Determine the overall helpfulness according to the defined criteria.

# Output Format

Provide:
- A detailed analysis of the response's helpfulness (extended reasoning)
- A one-sentence summary highlighting the key strengths or weaknesses
- The final helpfulness score as an integer (1, 2, 3, 4, or 5)

Always follow the JSON format below and return nothing else:
{
  "extended_reasoning": "<detailed step-by-step analysis of the response's helpfulness>",
  "reasoning_summary": "<one sentence summary of the response's helpfulness>",
  "score": <number: integer from 1 to 5>
}

# Examples

**Example 1:**

Input:
- Query: "How do I fix a leaky faucet?"
- Response: "A leaky faucet is usually caused by a worn washer or O-ring. Turn off the water supply, remove the handle, replace the washer or O-ring, and reassemble. If the leak persists, you may need to replace the entire cartridge."

Expected Output:
{
  "extended_reasoning": "The user asked for help fixing a leaky faucet, which is a practical home maintenance question. The response directly addresses the query by identifying the most common cause (worn washer or O-ring) and provides a clear step-by-step solution. It includes important safety information (turning off water supply) and offers a backup solution if the initial fix doesn't work. The response is concise, actionable, and comprehensive for this common problem.",
  "reasoning_summary": "The response provides a complete, actionable solution with clear steps and troubleshooting advice.",
  "score": 5
}

**Example 2:**

Input:
- Query: "What's the weather like?"
- Response: "Weather can be sunny, rainy, cloudy, or snowy depending on various atmospheric conditions."

Expected Output:
{
  "extended_reasoning": "The user asked about the weather, which typically implies they want current weather conditions for their location or a specific place. However, the response provides only generic information about weather types without addressing the specific query. It doesn't provide current conditions, forecasts, or ask for location clarification. The response is factually correct but completely unhelpful for the user's actual need.",
  "reasoning_summary": "The response provides generic weather information instead of addressing the user's likely need for current conditions.",
  "score": 1
}

# Notes

- Focus on practical utility and how well the response serves the user's actual needs
- Consider completeness, accuracy, and actionability of the information
- Pay attention to whether the response asks for clarification when needed
- Evaluate whether the response is appropriately detailed for the query complexity`;

const evaluation = {
  type: 'evaluation',
  n8nType: 'n8n-nodes-base.evaluation',
  n8nVersion: 4.8,
  versionHistory: [4.6, 4.7, 4.8],
  label: 'Evaluation',
  subtitle: '={{$parameter["operation"]}}',
  description: 'Runs an evaluation',
  eventTriggerDescription: '',
  category: 'core',
  categories: ['Utility'],
  subcategory: 'Utility',
  subcategories: [],
  group: ['transform'],
  defaults: { name: 'Evaluation', color: '#c3c9d5' },
  inputs: [{ type: 'main' }],
  outputs: [{ type: 'main' }],
  portVariants: [
    {
      showWhen: { operation: ['setMetrics'], metric: ['correctness', 'helpfulness'] },
      inputs: [
        { type: 'main' },
        { type: 'ai_languageModel', label: 'Model', maxConnections: 1 },
      ],
      outputs: [{ type: 'main' }],
    },
    {
      showWhen: { operation: ['checkIfEvaluating'] },
      inputs: [{ type: 'main' }],
      outputs: [
        { type: 'main', label: 'Evaluation' },
        { type: 'main', label: 'Normal' },
      ],
    },
  ],
  icon: '/node-icons/evaluation.svg',
  n8nIcon: 'fa:check-double',
  iconColor: 'neutral',
  iconHex: '#C3C9D5',
  aliases: ['Test', 'Metrics', 'Evals', 'Set Output', 'Set Metrics'],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.evaluation/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/Evaluation/Evaluation/Evaluation.node.ee.ts',
    descriptionPath: 'packages/nodes-base/nodes/Evaluation/Evaluation/Description.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Evaluation/Evaluation/Evaluation.node.ee.json',
    promptPath: 'packages/nodes-base/nodes/Evaluation/Evaluation/CannedMetricPrompts.ee.ts',
    googleSheetsResourcePath:
      'packages/nodes-base/nodes/Google/Sheet/GoogleSheetsTrigger.node.ts',
    googleSheetsAuthenticationPath:
      'packages/nodes-base/nodes/Google/Sheet/v2/actions/versionDescription.ts',
    iconMappingPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/icons.ts',
  },
  credentialRequirements: [
    {
      type: 'googleApi',
      name: 'Google Service Account API',
      required: true,
      testedBy: 'googleApiCredentialTest',
      showWhen: {
        operation: ['setOutputs'],
        source: ['googleSheets'],
        authentication: ['serviceAccount'],
      },
    },
    {
      type: 'googleSheetsOAuth2Api',
      name: 'Google Sheets OAuth2 API',
      required: true,
      showWhen: {
        operation: ['setOutputs'],
        source: ['googleSheets'],
        authentication: ['oAuth2'],
      },
    },
  ],
  params: [
    {
      key: 'operation',
      label: 'Operation',
      kind: 'select',
      value: 'setOutputs',
      required: false,
      noDataExpression: true,
      options: [
        { label: 'Set Inputs', value: 'setInputs' },
        { label: 'Set Outputs', value: 'setOutputs' },
        { label: 'Set Metrics', value: 'setMetrics' },
        { label: 'Check If Evaluating', value: 'checkIfEvaluating' },
      ],
    },
    {
      key: 'source',
      label: 'Source',
      kind: 'select',
      value: 'dataTable',
      required: false,
      showWhen: { operation: ['setOutputs'] },
      options: [
        {
          label: 'Data table',
          value: 'dataTable',
          description: 'Load the test dataset from a local Data table',
        },
        {
          label: 'Google Sheets',
          value: 'googleSheets',
          description: 'Load the test dataset from a Google Sheets document',
        },
      ],
      description: 'Where to get the test dataset from',
    },
    {
      key: 'authentication',
      label: 'Authentication',
      kind: 'select',
      value: 'oAuth2',
      required: false,
      showWhen: { operation: ['setOutputs'], source: ['googleSheets'] },
      options: [
        { label: 'Service Account', value: 'serviceAccount' },
        { label: 'OAuth2 (recommended)', value: 'oAuth2' },
      ],
    },
    {
      key: 'serviceAccountCredential',
      n8nKey: 'credentials.googleApi',
      label: 'Credential to connect with',
      kind: 'select',
      value: 'googleApi',
      required: true,
      locked: true,
      showWhen: {
        operation: ['setOutputs'],
        source: ['googleSheets'],
        authentication: ['serviceAccount'],
      },
      options: [{ label: 'Google Service Account API', value: 'googleApi' }],
      simulationNote: 'This selector is inert; the simulation never authenticates with Google.',
    },
    {
      key: 'oAuthCredential',
      n8nKey: 'credentials.googleSheetsOAuth2Api',
      label: 'Credential to connect with',
      kind: 'select',
      value: 'googleSheetsOAuth2Api',
      required: true,
      locked: true,
      showWhen: {
        operation: ['setOutputs'],
        source: ['googleSheets'],
        authentication: ['oAuth2'],
      },
      options: [{ label: 'Google Sheets OAuth2 API', value: 'googleSheetsOAuth2Api' }],
      simulationNote: 'This selector is inert; the simulation never authenticates with Google.',
    },
    {
      key: 'documentId',
      label: 'Document Containing Dataset',
      kind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: '' },
      sourceDefault: { mode: 'list', value: '' },
      required: true,
      locked: true,
      showWhen: { operation: ['setOutputs'], source: ['googleSheets'] },
      modes: ['list', 'url', 'id'],
      modeOptions: [
        {
          label: 'From List',
          value: 'list',
          kind: 'list',
          searchable: true,
          searchListMethod: 'spreadSheetsSearch',
        },
        {
          label: 'By URL',
          value: 'url',
          kind: 'text',
          placeholder: 'https://docs.google.com/spreadsheets/d/…',
          validation: {
            regex:
              'https:\\/\\/(?:drive|docs)\\.google\\.com(?:\\/.*|)\\/d\\/([0-9a-zA-Z\\-_]+)(?:\\/.*|)',
            errorMessage: 'Not a valid Google Drive File URL',
          },
        },
        {
          label: 'By ID',
          value: 'id',
          kind: 'text',
          placeholder: 'Paste the spreadsheet ID',
          validation: {
            regex: '[a-zA-Z0-9\\-_]{2,}',
            errorMessage: 'Not a valid Google Drive File ID',
          },
          url: '=https://docs.google.com/spreadsheets/d/{{$value}}/edit',
        },
      ],
      options: [],
      simulationNote: 'The document list is intentionally inert and never calls Google APIs.',
    },
    {
      key: 'sheetName',
      label: 'Sheet Containing Dataset',
      kind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: '' },
      sourceDefault: { mode: 'list', value: '' },
      required: true,
      locked: true,
      showWhen: { operation: ['setOutputs'], source: ['googleSheets'] },
      modes: ['list', 'url', 'id'],
      loadOptionsDependsOn: ['documentId.value'],
      modeOptions: [
        {
          label: 'From List',
          value: 'list',
          kind: 'list',
          searchable: false,
          searchListMethod: 'sheetsSearch',
        },
        {
          label: 'By URL',
          value: 'url',
          kind: 'text',
          placeholder: 'https://docs.google.com/spreadsheets/d/…#gid=…',
          validation: {
            regex:
              'https:\\/\\/docs\\.google\\.com\\/spreadsheets\\/d\\/[0-9a-zA-Z\\-_]+.*\\#gid=([0-9]+)',
            errorMessage: 'Not a valid Sheet URL',
          },
        },
        {
          label: 'By ID',
          value: 'id',
          kind: 'text',
          placeholder: 'Paste the sheet ID',
          validation: {
            regex: '((gid=)?[0-9]{1,})',
            errorMessage: 'Not a valid Sheet ID',
          },
        },
      ],
      options: [],
      simulationNote: 'The sheet list is intentionally inert and never calls Google APIs.',
    },
    {
      key: 'dataTableId',
      label: 'Data table',
      kind: 'resourceLocator',
      value: { __rl: true, mode: 'list', value: '' },
      sourceDefault: { mode: 'list', value: '' },
      required: true,
      locked: true,
      showWhen: { operation: ['setOutputs'], source: ['dataTable'] },
      modes: ['list', 'id'],
      modeOptions: [
        {
          label: 'From List',
          value: 'list',
          kind: 'list',
          searchable: true,
          searchListMethod: 'dataTableSearch',
          skipCredentialsCheckInRLC: true,
        },
        { label: 'ID', value: 'id', kind: 'text' },
      ],
      options: [],
      simulationNote: 'The table list is intentionally inert and never queries n8n storage.',
    },
    {
      key: 'setInputsNotice',
      label:
        'For adding columns from your dataset to the evaluation results. Anything you add here will be displayed in the ‘evaluations’ tab, not on the Google Sheet or Data table.',
      kind: 'notice',
      value: '',
      required: false,
      showWhen: { operation: ['setInputs'] },
    },
    {
      key: 'inputs',
      label: 'Inputs',
      kind: 'fixedCollection',
      value: {},
      required: false,
      multiple: true,
      addLabel: 'Add Input',
      collectionKey: 'values',
      collectionLabel: 'Filter',
      showWhen: { operation: ['setInputs'] },
      fields: [
        {
          key: 'inputName',
          label: 'Name',
          kind: 'text',
          value: '',
          required: false,
          requiresDataPath: 'single',
        },
        { key: 'inputValue', label: 'Value', kind: 'text', value: '', required: false },
      ],
    },
    {
      key: 'outputs',
      label: 'Outputs',
      kind: 'fixedCollection',
      value: {},
      required: false,
      multiple: true,
      addLabel: 'Add Output',
      collectionKey: 'values',
      collectionLabel: 'Filter',
      showWhen: { operation: ['setOutputs'] },
      fields: [
        {
          key: 'outputName',
          label: 'Name',
          kind: 'text',
          value: '',
          required: false,
          requiresDataPath: 'single',
        },
        { key: 'outputValue', label: 'Value', kind: 'text', value: '', required: false },
      ],
    },
    {
      key: 'setMetricsNotice',
      n8nKey: 'notice',
      label:
        'Metrics measure the quality of an execution. They will be displayed in the ‘evaluations’ tab, not on the Google Sheet or Data table.',
      kind: 'notice',
      value: '',
      required: false,
      showWhen: { operation: ['setMetrics'] },
    },
    {
      key: 'metric',
      label: 'Metric',
      kind: 'select',
      value: 'correctness',
      required: false,
      noDataExpression: true,
      showWhen: { operation: ['setMetrics'] },
      options: [
        {
          label: 'Correctness (AI-based)',
          value: 'correctness',
          description:
            'Whether the answer’s meaning is consistent with a reference answer. Uses a scale of 1 (worst) to 5 (best).',
        },
        {
          label: 'Helpfulness (AI-based)',
          value: 'helpfulness',
          description:
            'Whether the response addresses the query. Uses a scale of 1 (worst) to 5 (best).',
        },
        {
          label: 'String Similarity',
          value: 'stringSimilarity',
          description:
            'How close the answer is to a reference answer, measured character-by-character (edit distance). Returns a score between 0 and 1.',
        },
        {
          label: 'Categorization',
          value: 'categorization',
          description:
            'Whether the answer exactly matches the reference answer. Returns 1 if so and 0 otherwise.',
        },
        {
          label: 'Tools Used',
          value: 'toolsUsed',
          description: 'Whether tool(s) were used or not. Returns a score between 0 and 1.',
        },
        {
          label: 'Custom Metrics',
          value: 'customMetrics',
          description: 'Define your own metric(s)',
        },
      ],
    },
    {
      key: 'expectedAnswer',
      label: 'Expected Answer',
      kind: 'text',
      value: '',
      required: false,
      showWhen: {
        operation: ['setMetrics'],
        metric: ['correctness', 'stringSimilarity', 'categorization'],
      },
      description: 'The expected output defined in your evaluation dataset, used as ground truth',
    },
    {
      key: 'correctnessActualAnswer',
      n8nKey: 'actualAnswer',
      label: 'Actual Answer',
      kind: 'text',
      value: '',
      required: false,
      showWhen: {
        operation: ['setMetrics'],
        metric: ['correctness', 'stringSimilarity', 'categorization'],
      },
      description: 'The real response generated by AI (e.g. an agent or LLM in the workflow)',
    },
    {
      key: 'userQuery',
      label: 'User Query',
      kind: 'text',
      value: '',
      required: false,
      showWhen: { operation: ['setMetrics'], metric: ['helpfulness'] },
      description: 'The original input or question submitted by the user',
    },
    {
      key: 'helpfulnessActualAnswer',
      n8nKey: 'actualAnswer',
      label: 'Response',
      kind: 'text',
      value: '',
      required: false,
      showWhen: { operation: ['setMetrics'], metric: ['helpfulness'] },
      description: 'The response generated by AI (e.g. an agent or LLM in the workflow)',
    },
    {
      key: 'expectedTools',
      label: 'Expected Tools',
      kind: 'text',
      value: '',
      required: false,
      placeholder: 'Get Events, Send Email, Search Database',
      showWhen: { operation: ['setMetrics'], metric: ['toolsUsed'] },
      description: 'Enter the name(s) of the tool(s) you expect the AI to call (separated by commas)',
    },
    {
      key: 'intermediateSteps',
      label: 'Intermediate Steps (of Agent)',
      kind: 'text',
      value: '',
      required: false,
      showWhen: { operation: ['setMetrics'], metric: ['toolsUsed'] },
      hint: 'Map the <code>intermediateSteps</code> field here. To see it, enable returning intermediate steps in the agent’s options',
    },
    {
      key: 'correctnessPrompt',
      n8nKey: 'prompt',
      label: 'Prompt',
      kind: 'textarea',
      value: CORRECTNESS_PROMPT,
      required: false,
      rows: 4,
      showWhen: { operation: ['setMetrics'], metric: ['correctness'] },
      description:
        'Instruction used to guide the model in scoring the actual answer’s correctness against the expected answer',
    },
    {
      key: 'helpfulnessPrompt',
      n8nKey: 'prompt',
      label: 'Prompt',
      kind: 'textarea',
      value: HELPFULNESS_PROMPT,
      required: false,
      rows: 4,
      showWhen: { operation: ['setMetrics'], metric: ['helpfulness'] },
      description:
        'Instruction used to guide the model in scoring the actual answer’s helpfulness against the expected answer',
    },
    {
      key: 'customMetricsNotice',
      n8nKey: 'notice',
      label:
        "Calculate the custom metrics before this node, then map them below. <a href='https://docs.n8n.io/advanced-ai/evaluations/metric-based-evaluations/#2-calculate-metrics' target='_blank'>View metric examples</a>",
      kind: 'notice',
      value: '',
      required: false,
      showWhen: { operation: ['setMetrics'], metric: ['customMetrics'] },
    },
    {
      key: 'metrics',
      label: 'Metrics to Return',
      kind: 'assignmentList',
      value: { assignments: [{ name: '', value: '', type: 'number' }] },
      required: false,
      disableType: true,
      defaultType: 'number',
      showWhen: { operation: ['setMetrics'], metric: ['customMetrics'] },
    },
    {
      key: 'correctnessOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add Option',
      showWhen: { operation: ['setMetrics'], metric: ['correctness'] },
      fields: [
        {
          key: 'correctnessMetricName',
          n8nKey: 'metricName',
          label: 'Metric Name',
          kind: 'text',
          value: 'Correctness',
          required: false,
          description: 'Set this parameter if you want to set a custom name to the metric',
        },
        {
          key: 'correctnessInputPrompt',
          n8nKey: 'inputPrompt',
          label: 'Input Prompt',
          kind: 'textarea',
          value: 'Output: {actual_answer}\n\nGround truth: {expected_answer}',
          required: false,
          rows: 4,
          hint: 'Requires the placeholders <code>{actual_answer}</code> and <code>{expected_answer}</code>',
        },
      ],
    },
    {
      key: 'helpfulnessOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add Option',
      showWhen: { operation: ['setMetrics'], metric: ['helpfulness'] },
      fields: [
        {
          key: 'helpfulnessMetricName',
          n8nKey: 'metricName',
          label: 'Metric Name',
          kind: 'text',
          value: 'Helpfulness',
          required: false,
          description: 'Set this parameter if you want to set a custom name to the metric',
        },
        {
          key: 'helpfulnessInputPrompt',
          n8nKey: 'inputPrompt',
          label: 'Input Prompt',
          kind: 'textarea',
          value: 'Query: {user_query}\n\nResponse: {actual_answer}',
          required: false,
          rows: 4,
          hint: 'Requires the placeholders <code>{user_query}</code> and <code>{actual_answer}</code>',
        },
      ],
    },
    {
      key: 'categorizationOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add Option',
      showWhen: { operation: ['setMetrics'], metric: ['categorization'] },
      fields: [
        {
          key: 'categorizationMetricName',
          n8nKey: 'metricName',
          label: 'Metric Name',
          kind: 'text',
          value: 'Categorization',
          required: false,
        },
      ],
    },
    {
      key: 'stringSimilarityOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add Option',
      showWhen: { operation: ['setMetrics'], metric: ['stringSimilarity'] },
      fields: [
        {
          key: 'stringSimilarityMetricName',
          n8nKey: 'metricName',
          label: 'Metric Name',
          kind: 'text',
          value: 'String similarity',
          required: false,
        },
      ],
    },
    {
      key: 'toolsUsedOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      addLabel: 'Add Option',
      showWhen: { operation: ['setMetrics'], metric: ['toolsUsed'] },
      fields: [
        {
          key: 'toolsUsedMetricName',
          n8nKey: 'metricName',
          label: 'Metric Name',
          kind: 'text',
          value: 'Tools Used',
          required: false,
        },
      ],
    },
    {
      key: 'checkIfEvaluatingNotice',
      n8nKey: 'notice',
      label:
        'Routes to the ‘evaluation’ branch if the execution started from an evaluation trigger. Otherwise routes to the ‘normal’ branch.',
      kind: 'notice',
      value: '',
      required: false,
      showWhen: { operation: ['checkIfEvaluating'] },
    },
  ],
  output: {},
};

export default evaluation;
