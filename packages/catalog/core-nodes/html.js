// Editor-only descriptor for n8n's HTML v1.2 core node.
// HTML, CSS selectors, expressions, and attributes remain inert authoring text.

const htmlTemplateDefault = `<!DOCTYPE html>

<html>
<head>
  <meta charset="UTF-8" />
  <title>My HTML document</title>
</head>
<body>
  <div class="container">
    <h1>This is an H1 heading</h1>
    <h2>This is an H2 heading</h2>
    <p>This is a paragraph</p>
  </div>
</body>
</html>

<style>
.container {
  background-color: #ffffff;
  text-align: center;
  padding: 16px;
  border-radius: 8px;
}

h1 {
  color: #ff6d5a;
  font-size: 24px;
  font-weight: bold;
  padding: 8px;
}

h2 {
  color: #909399;
  font-size: 18px;
  font-weight: bold;
  padding: 8px;
}
</style>

<script>
console.log("Hello World!");
</script>`;

const extractionSourceDefault = {
  values: [
    {
      key: '',
      cssSelector: '',
      returnValue: 'text',
      returnArray: false,
    },
  ],
};

const html = {
  type: 'html',
  n8nType: 'n8n-nodes-base.html',
  n8nVersion: 1.2,
  versionHistory: [1, 1.1, 1.2],
  label: 'HTML',
  defaultName: 'HTML',
  subtitle: '={{ $parameter["operation"] }}',
  description: 'Work with HTML',
  category: 'core',
  categories: ['Core Nodes'],
  subcategory: 'Data Transformation',
  subcategories: ['Data Transformation'],
  group: ['transform'],
  inputs: ['main'],
  outputs: ['main'],
  parameterPane: 'wide',
  icon: '/node-icons/html.svg',
  n8nIcon: 'node:html',
  iconMode: 'currentColor',
  iconColor: 'rust',
  iconHex: '#E44D26',
  aliases: ['extract', 'template', 'table'],
  docs: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.html/',
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/Html/Html.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Html/Html.node.json',
    placeholderPath: 'packages/nodes-base/nodes/Html/placeholder.ts',
    iconPath:
      'packages/frontend/@n8n/design-system/src/components/N8nIcon/nodes/html.svg',
  },
  defaults: {
    name: 'HTML',
  },
  credentials: [],
  params: [
    {
      key: 'operation',
      label: 'Operation',
      kind: 'select',
      value: 'generateHtmlTemplate',
      required: false,
      noDataExpression: true,
      options: [
        {
          label: 'Generate HTML Template',
          value: 'generateHtmlTemplate',
          action: 'Generate HTML template',
        },
        {
          label: 'Extract HTML Content',
          value: 'extractHtmlContent',
          action: 'Extract HTML Content',
        },
        {
          label: 'Convert to HTML Table',
          value: 'convertToHtmlTable',
          action: 'Convert to HTML Table',
        },
      ],
    },
    {
      key: 'html',
      label: 'HTML Template',
      kind: 'textarea',
      sourceKind: 'string',
      editor: 'htmlEditor',
      rows: 18,
      value: htmlTemplateDefault,
      required: false,
      noDataExpression: true,
      showWhen: { operation: ['generateHtmlTemplate'] },
      description: 'HTML template to render',
      builderHint: {
        propertyHint:
          'Use expressions to generate loops, reference data, etc. Does not support handlebars.',
      },
      simulationNote:
        'HTML, CSS, scripts, and expressions are stored as text only. Nothing is rendered, resolved, or executed.',
    },
    {
      key: 'notice',
      label:
        '<b>Tips</b>: Type ctrl+space for completions. Use <code>{{ }}</code> for expressions and <code>&lt;style&gt;</code> tags for CSS. JS in <code>&lt;script&gt;</code> tags is included but not executed in n8n.',
      kind: 'notice',
      value: '',
      required: false,
      showWhen: { operation: ['generateHtmlTemplate'] },
    },
    {
      key: 'sourceData',
      label: 'Source Data',
      kind: 'select',
      value: 'json',
      required: false,
      showWhen: { operation: ['extractHtmlContent'] },
      options: [
        { label: 'Binary', value: 'binary' },
        { label: 'JSON', value: 'json' },
      ],
      description: 'If HTML should be read from binary or JSON data',
    },
    {
      key: 'binaryDataPropertyName',
      n8nKey: 'dataPropertyName',
      label: 'Input Binary Field',
      kind: 'text',
      value: 'data',
      required: true,
      requiresDataPath: 'single',
      showWhen: { operation: ['extractHtmlContent'], sourceData: ['binary'] },
      hint: 'The name of the input binary field containing the file to be extracted',
    },
    {
      key: 'jsonDataPropertyName',
      n8nKey: 'dataPropertyName',
      label: 'JSON Property',
      kind: 'text',
      value: 'data',
      required: true,
      requiresDataPath: 'single',
      showWhen: { operation: ['extractHtmlContent'], sourceData: ['json'] },
      description:
        'Name of the JSON property in which the HTML to extract the data from can be found. The property can either contain a string or an array of strings.',
    },
    {
      key: 'extractionValues',
      label: 'Extraction Values',
      kind: 'fixedCollection',
      sourceKind: 'fixedCollection',
      value: {
        values: [
          {
            extractionKey: '',
            extractionCssSelector: '',
            extractionReturnValue: 'text',
            extractionSkipSelectors: '',
            extractionReturnArray: false,
          },
        ],
      },
      sourceDefault: extractionSourceDefault,
      required: false,
      showWhen: { operation: ['extractHtmlContent'] },
      collectionKey: 'values',
      collectionLabel: 'Value',
      multiple: true,
      addLabel: 'Add Value',
      fields: [
        {
          key: 'extractionKey',
          n8nKey: 'key',
          label: 'Key',
          kind: 'text',
          value: '',
          required: false,
          description: 'The key under which the extracted value should be saved',
        },
        {
          key: 'extractionCssSelector',
          n8nKey: 'cssSelector',
          label: 'CSS Selector',
          kind: 'text',
          value: '',
          required: false,
          placeholder: '.price',
          description: 'The CSS selector to use',
        },
        {
          key: 'extractionReturnValue',
          n8nKey: 'returnValue',
          label: 'Return Value',
          kind: 'select',
          value: 'text',
          required: false,
          options: [
            {
              label: 'Attribute',
              value: 'attribute',
              description: 'Get an attribute value like "class" from an element',
            },
            {
              label: 'HTML',
              value: 'html',
              description: 'Get the HTML the element contains',
            },
            {
              label: 'Text',
              value: 'text',
              description: 'Get only the text content of the element',
            },
            {
              label: 'Value',
              value: 'value',
              description: 'Get value of an input, select or textarea',
            },
          ],
          description: 'What kind of data should be returned',
        },
        {
          key: 'extractionAttribute',
          n8nKey: 'attribute',
          label: 'Attribute',
          kind: 'text',
          value: '',
          required: false,
          showWhen: { extractionReturnValue: ['attribute'] },
          n8nShowWhen: { returnValue: ['attribute'] },
          placeholder: 'class',
          description: 'The name of the attribute to return the value off',
        },
        {
          key: 'extractionSkipSelectors',
          n8nKey: 'skipSelectors',
          label: 'Skip Selectors',
          kind: 'text',
          value: '',
          required: false,
          showWhen: { extractionReturnValue: ['text'] },
          n8nShowWhen: { returnValue: ['text'] },
          placeholder: 'e.g. img, .className, #ItemId',
          description: 'Comma-separated list of selectors to skip in the text extraction',
        },
        {
          key: 'extractionReturnArray',
          n8nKey: 'returnArray',
          label: 'Return Array',
          kind: 'boolean',
          value: false,
          required: false,
          description:
            'Whether to return the values as an array so if multiple ones get found they also get returned separately. If not set all will be returned as a single string.',
        },
      ],
      simulationNote:
        'Extraction rules are editable only. CSS selectors are never queried and HTML is never parsed.',
    },
    {
      key: 'extractOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      showWhen: { operation: ['extractHtmlContent'] },
      addLabel: 'Add option',
      fields: [
        {
          key: 'trimValues',
          label: 'Trim Values',
          kind: 'boolean',
          value: true,
          required: false,
          description:
            'Whether to remove automatically all spaces and newlines from the beginning and end of the values',
        },
        {
          key: 'cleanUpText',
          label: 'Clean Up Text',
          kind: 'boolean',
          value: true,
          required: false,
          description:
            'Whether to remove leading and trailing whitespaces, line breaks (newlines) and condense multiple consecutive whitespaces into a single space',
        },
      ],
    },
    {
      key: 'tableOptions',
      n8nKey: 'options',
      label: 'Options',
      kind: 'collection',
      value: {},
      required: false,
      showWhen: { operation: ['convertToHtmlTable'] },
      addLabel: 'Add option',
      fields: [
        {
          key: 'capitalize',
          label: 'Capitalize Headers',
          kind: 'boolean',
          value: false,
          required: false,
          description: 'Whether to capitalize the headers',
        },
        {
          key: 'customStyling',
          label: 'Custom Styling',
          kind: 'boolean',
          value: false,
          required: false,
          description: 'Whether to use custom styling',
        },
        {
          key: 'caption',
          label: 'Caption',
          kind: 'text',
          value: '',
          required: false,
          description: 'Caption to add to the table',
        },
        {
          key: 'tableAttributes',
          label: 'Table Attributes',
          kind: 'text',
          value: '',
          required: false,
          placeholder: 'e.g. style="padding:10px"',
          description: 'Attributes to attach to the table',
        },
        {
          key: 'headerAttributes',
          label: 'Header Attributes',
          kind: 'text',
          value: '',
          required: false,
          placeholder: 'e.g. style="padding:10px"',
          description: 'Attributes to attach to the table header',
        },
        {
          key: 'rowAttributes',
          label: 'Row Attributes',
          kind: 'text',
          value: '',
          required: false,
          placeholder: 'e.g. style="padding:10px"',
          description: 'Attributes to attach to the table row',
        },
        {
          key: 'cellAttributes',
          label: 'Cell Attributes',
          kind: 'text',
          value: '',
          required: false,
          placeholder: 'e.g. style="padding:10px"',
          description: 'Attributes to attach to the table cell',
        },
      ],
    },
  ],
  unsupportedVisibleTypes: [
    {
      key: 'html',
      sourceType: 'string:htmlEditor',
      normalizedKind: 'textarea',
      reason:
        'The catalog has no native HTML editor, so the current HTML template control is represented by an inert multiline editor.',
    },
  ],
  simulation: {
    configurationOnly: true,
    resolvesExpressions: false,
    parsesHtml: false,
    queriesSelectors: false,
    rendersHtml: false,
    executesScripts: false,
    convertsTables: false,
    network: false,
    executes: false,
    voice: false,
  },
  output: {},
};

export default html;
