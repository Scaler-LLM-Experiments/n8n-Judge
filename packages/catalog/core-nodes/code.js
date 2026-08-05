// Editor-only descriptor for n8n's Code v2 node. It reproduces the authoring
// surface without importing or implementing either language runtime.
const code = {
  type: 'code',
  n8nType: 'n8n-nodes-base.code',
  n8nVersion: 2,
  label: 'Code',
  subtitle: '',
  description: 'Run custom JavaScript or Python code',
  details: 'The Code node allows you to execute JavaScript in your workflow.',
  category: 'core',
  subcategory: 'Helpers',
  categories: ['Development', 'Core Nodes'],
  subcategories: ['Helpers', 'Data Transformation'],
  group: ['transform'],
  inputs: ['main'],
  outputs: ['main'],
  icon: '/node-icons/code.svg',
  iconColor: 'amber',
  iconHex: '#ff9922',
  parameterPane: 'wide',
  aliases: ['cpde', 'Javascript', 'JS', 'Python', 'Script', 'Custom Code', 'Function'],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/Code/Code.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Code/Code.node.json',
    parameterPaths: [
      'packages/nodes-base/nodes/Code/descriptions/JavascriptCodeDescription.ts',
      'packages/nodes-base/nodes/Code/descriptions/PythonCodeDescription.ts',
    ],
    iconPath: 'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/code.svg',
  },
  builderHint: {
    searchHint:
      'Use Code node as a LAST RESORT — it runs in a sandboxed environment and is slower than native nodes. Code node is ONLY appropriate for complex multi-step algorithms that cannot be expressed in single expressions, or operations requiring complex data structures. The sandbox has NO network access: fetch(), axios, XMLHttpRequest and require of http modules are unavailable and FAIL at runtime. NEVER make HTTP requests in a Code node — use the HTTP Request node and process its output instead.',
    relatedNodes: [
      {
        nodeType: 'n8n-nodes-base.httpRequest',
        relationHint:
          'Use this instead for ANY HTTP/API call — the Code node sandbox cannot make network requests',
      },
      {
        nodeType: 'n8n-nodes-base.set',
        relationHint:
          'Use this instead for data manipulation: add/modify/rename fields, set values, map data',
      },
      {
        nodeType: 'n8n-nodes-base.filter',
        relationHint: 'Use this instead for filtering items by condition',
      },
      {
        nodeType: 'n8n-nodes-base.if',
        relationHint: 'Use this instead for routing by condition',
      },
      {
        nodeType: 'n8n-nodes-base.switch',
        relationHint: 'Use this instead for multi-way routing by condition',
      },
      {
        nodeType: 'n8n-nodes-base.splitOut',
        relationHint: 'Use this instead for splitting arrays into separate items',
      },
      {
        nodeType: 'n8n-nodes-base.aggregate',
        relationHint: 'Use this instead for combining multiple items into one',
      },
      {
        nodeType: 'n8n-nodes-base.summarize',
        relationHint: 'Use this instead for summarizing or pivoting data',
      },
      {
        nodeType: 'n8n-nodes-base.removeDuplicates',
        relationHint: 'Use this instead for removing duplicates',
      },
      {
        nodeType: 'n8n-nodes-base.limit',
        relationHint: 'Use this instead to reduce the number of items returned',
      },
      {
        nodeType: 'n8n-nodes-base.merge',
        relationHint: 'Use this instead for merging data from multiple branches',
      },
      {
        nodeType: 'n8n-nodes-base.dateTime',
        relationHint: 'Use this instead for date time operations',
      },
      {
        nodeType: 'n8n-nodes-base.html',
        relationHint: 'Use this instead for creating html pages',
      },
    ],
  },
  params: [
    {
      key: 'mode',
      label: 'Mode',
      kind: 'select',
      value: 'runOnceForAllItems',
      required: false,
      noDataExpression: true,
      options: [
        {
          label: 'Run Once for All Items',
          value: 'runOnceForAllItems',
          description: 'Run this code only once, no matter how many input items there are',
        },
        {
          label: 'Run Once for Each Item',
          value: 'runOnceForEachItem',
          description: 'Run this code as many times as there are input items',
        },
      ],
    },
    {
      key: 'language',
      label: 'Language',
      kind: 'select',
      value: 'javaScript',
      required: false,
      noDataExpression: true,
      options: [
        { label: 'JavaScript', value: 'javaScript', action: 'Code in JavaScript' },
        { label: 'Python', value: 'pythonNative', action: 'Code in Python' },
      ],
    },
    {
      key: 'jsCode',
      label: 'JavaScript',
      kind: 'textarea',
      value: '',
      required: false,
      noDataExpression: true,
      editor: 'codeNodeEditor',
      editorLanguage: 'javaScript',
      showWhen: {
        language: ['javaScript'],
        mode: ['runOnceForAllItems', 'runOnceForEachItem'],
      },
      description:
        'JavaScript code to execute.<br><br>Tip: You can use luxon vars like <code>$today</code> for dates and <code>$jmespath</code> for querying JSON structures. <a href="https://docs.n8n.io/nodes/n8n-nodes-base.function">Learn more</a>.',
      builderHint:
        'The sandbox has NO network access: fetch(), axios, XMLHttpRequest and require of http modules are unavailable and fail at runtime. NEVER make HTTP requests here — use the HTTP Request node and process its output in this node instead.',
    },
    {
      key: 'javascriptNotice',
      n8nKey: 'notice',
      label:
        'Type <code>$</code> for a list of <a target="_blank" href="https://docs.n8n.io/code-examples/methods-variables-reference/">special vars/methods</a>. Debug by using <code>console.log()</code> statements and viewing their output in the browser console.',
      kind: 'notice',
      value: '',
      required: false,
      showWhen: { language: ['javaScript'] },
    },
    {
      key: 'pythonCode',
      label: 'Python',
      kind: 'textarea',
      value: '',
      required: false,
      noDataExpression: true,
      editor: 'codeNodeEditor',
      editorLanguage: 'python',
      showWhen: {
        language: ['python', 'pythonNative'],
        mode: ['runOnceForAllItems', 'runOnceForEachItem'],
      },
      description:
        'Python code to execute.<br><br>Tip: You can use built-in methods and variables like <code>_today</code> for dates and <code>_jmespath</code> for querying JSON structures. <a href="https://docs.n8n.io/code/builtin/">Learn more</a>.',
      builderHint:
        'The sandbox has NO network access: requests, urllib, httpx and other HTTP libraries are unavailable and fail at runtime. NEVER make HTTP requests here — use the HTTP Request node and process its output in this node instead.',
    },
    {
      key: 'pythonNotice',
      n8nKey: 'notice',
      label:
        'Debug by using <code>print()</code> statements and viewing their output in the browser console.<br><br>The Python option does not support <code>_</code> syntax and helpers, except for <code>_items</code> in all-items mode and <code>_item</code> in per-item mode.',
      kind: 'notice',
      value: '',
      required: false,
      showWhen: { language: ['python', 'pythonNative'] },
    },
  ],
  output: {},
};

export default code;
