import { NODE_CATALOG } from '../../packages/catalog/catalog.js';

const collator = new Intl.Collator('en', { sensitivity: 'base' });
const catalog = Object.entries(NODE_CATALOG)
  .map(([type, node]) => ({ type, ...node }))
  .sort((left, right) => collator.compare(left.label || left.type, right.label || right.type));
const nodeElements = new Map();

const familyDefinitions = [
  { id: 'all', label: 'All nodes' },
  { id: 'core', label: 'Core' },
  { id: 'app', label: 'Apps' },
  { id: 'trigger', label: 'Triggers' },
  { id: 'ai', label: 'AI & models' },
];

const aliasIcons = {
  trigger: { path: '/node-icons/gmail.svg', mode: 'image' },
  classify: { path: '/node-icons/text-classifier.svg', mode: 'currentColor', color: '#7e57c2' },
  summarize: { path: '/node-icons/summarization-chain.svg', mode: 'currentColor', color: '#7e57c2' },
  'chat-gemini': { path: '/node-icons/google-gemini-chat-model.svg', mode: 'image' },
  parse: { path: '/node-icons/code.svg', mode: 'currentColor', color: '#4a4a4a' },
  action: { path: '/node-icons/gmail.svg', mode: 'image' },
  'slack-message': { path: '/node-icons/slack.svg', mode: 'image' },
  'calendar-event': { path: '/node-icons/google-calendar.svg', mode: 'image' },
  'notion-page': { path: '/node-icons/notion.svg', mode: 'image' },
  'web-search': { path: '/node-icons/http-request.svg', mode: 'currentColor', color: '#387ec7' },
};

const semanticIconColors = {
  black: '#3f3b39',
  blue: '#4387e8',
  emerald: '#2fb67c',
  green: '#408000',
  grey: '#6f6a68',
  'light-blue': '#5fabf7',
  lime: '#4ebd28',
  orange: '#ff8a3d',
  'orange-red': '#ff6d5a',
  purple: '#9b6dd5',
  red: '#e55353',
  violet: '#9b6dd5',
};

const connectionColors = {
  ai_languageModel: '#7e57c2',
  ai_memory: '#2aa589',
  ai_tool: '#ef8f32',
  ai_document: '#4f86d9',
  ai_embedding: '#bc5aa2',
  ai_outputParser: '#6578c8',
  ai_retriever: '#1598a6',
  ai_reranker: '#b36a44',
  ai_textSplitter: '#6a8e3a',
  ai_vectorStore: '#c05f8f',
};

const state = {
  family: 'all',
  hideDeprecated: false,
  query: '',
  selectedType: null,
};

const elements = {
  clearSearch: document.querySelector('#clear-search'),
  empty: document.querySelector('#empty-state'),
  familyFilters: document.querySelector('#family-filters'),
  grid: document.querySelector('#node-grid'),
  hideDeprecated: document.querySelector('#hide-deprecated'),
  loadError: document.querySelector('#load-error'),
  reset: document.querySelector('#reset-filters'),
  resultSummary: document.querySelector('#result-summary'),
  search: document.querySelector('#node-search'),
  template: document.querySelector('#node-template'),
  totalCount: document.querySelector('#total-count'),
  visibleCount: document.querySelector('#visible-count'),
};

const connectionType = (connection) => {
  if (typeof connection === 'string') return connection;
  return connection?.type || connection?.connector || 'main';
};

const familyOf = (node) => {
  if (node.category === 'trigger') return 'trigger';
  if (node.category === 'action') return 'app';
  if (node.category === 'ai' || node.category === 'model' || node.n8nType?.startsWith('@n8n/')) return 'ai';
  return 'core';
};

const shapeOf = (node) => {
  if (node.clusterRole === 'sub') return 'subnode';
  if (node.category === 'trigger') return 'trigger';
  return 'default';
};

const searchableText = (node) =>
  [node.type, node.label, node.subtitle, node.description, node.n8nType, ...(node.group || [])]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase();

const iconAssetUrl = (path) => new URL(`../../apps/web/public${path}`, import.meta.url).href;

const iconSpec = (node) => {
  if (node.icon) {
    return {
      path: node.icon,
      mode: node.iconMode || 'image',
      color: node.iconHex || semanticIconColors[node.iconColor] || semanticIconColors[node.iconColorLight],
    };
  }
  return aliasIcons[node.type] || { path: '/node-icons/n8n.svg', mode: 'image' };
};

const renderIcon = (container, node) => {
  const icon = iconSpec(node);
  const source = iconAssetUrl(icon.path);

  if (icon.mode === 'currentColor' && icon.path.endsWith('.svg')) {
    const mask = document.createElement('span');
    mask.className = 'node-icon-mask';
    mask.style.setProperty('--icon-source', `url("${source}")`);
    mask.style.setProperty('--icon-color', icon.color || '#494442');
    container.append(mask);
    return;
  }

  const image = document.createElement('img');
  image.src = source;
  image.alt = '';
  image.draggable = false;
  container.append(image);
};

const addPort = (layer, className, connection, position) => {
  const type = connectionType(connection);
  const port = document.createElement('span');
  port.className = `port ${className}`;
  port.title = type === 'main' ? 'Main connection' : type.replace(/^ai_/, '').replaceAll('_', ' ');
  port.style.setProperty('--port-color', connectionColors[type] || '#a9a4a1');
  if (className === 'port--input' || className === 'port--output') port.style.top = position;
  if (className === 'port--cluster-input') port.style.left = position;
  layer.append(port);
};

const positions = (count) => Array.from({ length: count }, (_, index) => `${((index + 1) / (count + 1)) * 100}%`);

const renderPorts = (layer, node) => {
  const inputs = Array.isArray(node.inputs) ? node.inputs : [];
  const outputs = Array.isArray(node.outputs) ? node.outputs : [];
  const mainInputs = inputs.filter((input) => connectionType(input) === 'main');
  const mainOutputs = outputs.filter((output) => connectionType(output) === 'main');
  const clusterInputs = inputs.filter((input) => connectionType(input) !== 'main');
  const clusterOutputs = outputs.filter((output) => connectionType(output) !== 'main');

  positions(mainInputs.length).forEach((position, index) => addPort(layer, 'port--input', mainInputs[index], position));
  positions(mainOutputs.length).forEach((position, index) => addPort(layer, 'port--output', mainOutputs[index], position));
  positions(clusterInputs.length).forEach((position, index) => addPort(layer, 'port--cluster-input', clusterInputs[index], position));
  if (clusterOutputs.length) addPort(layer, 'port--cluster-output', clusterOutputs[0], '50%');
};

const subtitleFor = (node) => {
  const subtitle = String(node.subtitle || '').trim();
  if (subtitle && !subtitle.includes('{{') && !subtitle.startsWith('=')) return subtitle;
  return `${node.type} · v${node.n8nVersion ?? 1}`;
};

const renderNode = (node) => {
  const fragment = elements.template.content.cloneNode(true);
  const preview = fragment.querySelector('.node-preview');
  const button = fragment.querySelector('.canvas-node');

  preview.dataset.type = node.type;
  preview.dataset.shape = shapeOf(node);
  preview.dataset.deprecated = String(Boolean(node.deprecated));
  button.ariaLabel = `${node.label}. ${node.description || node.n8nType}`;
  button.ariaPressed = String(state.selectedType === node.type);
  button.title = node.description || node.n8nType;

  renderIcon(fragment.querySelector('.node-icon'), node);
  renderPorts(fragment.querySelector('.port-layer'), node);
  fragment.querySelector('.node-label').textContent = node.label || node.type;
  fragment.querySelector('.node-subtitle').textContent = subtitleFor(node);

  button.addEventListener('click', () => {
    state.selectedType = state.selectedType === node.type ? null : node.type;
    elements.grid.querySelectorAll('.canvas-node[aria-pressed="true"]').forEach((selected) => {
      selected.ariaPressed = 'false';
    });
    if (state.selectedType) button.ariaPressed = 'true';
  });

  return preview;
};

const visibleNodes = () => {
  const query = state.query.trim().toLocaleLowerCase();
  return catalog
    .filter((node) => state.family === 'all' || familyOf(node) === state.family)
    .filter((node) => !state.hideDeprecated || !node.deprecated)
    .filter((node) => !query || searchableText(node).includes(query));
};

const render = () => {
  const nodes = visibleNodes();
  const visibleTypes = new Set(nodes.map((node) => node.type));
  nodeElements.forEach((element, type) => {
    element.hidden = !visibleTypes.has(type);
  });
  elements.grid.ariaBusy = 'false';
  elements.grid.hidden = nodes.length === 0;
  elements.empty.hidden = nodes.length > 0;
  elements.clearSearch.hidden = state.query.length === 0;
  elements.visibleCount.textContent = String(nodes.length);
  elements.resultSummary.textContent = `${nodes.length} ${nodes.length === 1 ? 'node' : 'nodes'} shown`;

  elements.familyFilters.querySelectorAll('button').forEach((button) => {
    button.ariaPressed = String(button.dataset.family === state.family);
  });
};

const mountNodes = () => {
  const fragment = document.createDocumentFragment();
  catalog.forEach((node) => {
    const element = renderNode(node);
    nodeElements.set(node.type, element);
    fragment.append(element);
  });
  elements.grid.replaceChildren(fragment);
};

const renderFamilyFilters = () => {
  const counts = catalog.reduce((result, node) => {
    const family = familyOf(node);
    result[family] = (result[family] || 0) + 1;
    return result;
  }, { all: catalog.length });

  familyDefinitions.forEach((family) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-button';
    button.dataset.family = family.id;
    button.ariaPressed = String(family.id === state.family);
    button.innerHTML = `${family.label}<span>${counts[family.id] || 0}</span>`;
    button.addEventListener('click', () => {
      state.family = family.id;
      render();
    });
    elements.familyFilters.append(button);
  });
};

const resetFilters = () => {
  state.family = 'all';
  state.hideDeprecated = false;
  state.query = '';
  elements.search.value = '';
  elements.hideDeprecated.checked = false;
  render();
  elements.search.focus();
};

elements.search.addEventListener('input', (event) => {
  state.query = event.currentTarget.value;
  render();
});

elements.clearSearch.addEventListener('click', () => {
  state.query = '';
  elements.search.value = '';
  render();
  elements.search.focus();
});

elements.hideDeprecated.addEventListener('change', (event) => {
  state.hideDeprecated = event.currentTarget.checked;
  render();
});

elements.reset.addEventListener('click', resetFilters);

document.addEventListener('keydown', (event) => {
  const typing = /input|textarea|select/i.test(document.activeElement?.tagName);
  if (event.key === '/' && !typing) {
    event.preventDefault();
    elements.search.focus();
  }
  if (event.key === 'Escape' && document.activeElement === elements.search) {
    elements.clearSearch.click();
  }
});

try {
  elements.totalCount.textContent = String(catalog.length);
  renderFamilyFilters();
  mountNodes();
  render();
} catch (error) {
  console.error(error);
  elements.grid.hidden = true;
  elements.loadError.hidden = false;
}
