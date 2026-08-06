import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NodeDetailView } from '../components/NodeDetailView.jsx';
import { NodeCard } from './NodeCard.jsx';
import { NodeIcon } from './nodeIcons.js';

describe('shared node icons', () => {
  it('renders catalog brand marks on both legacy node surfaces', () => {
    const card = renderToStaticMarkup(React.createElement(NodeCard, { type: 'google-docs', label: 'Google Docs' }));
    const detail = renderToStaticMarkup(
      React.createElement(NodeDetailView, {
        node: { id: 'docs', type: 'google-docs', data: { label: 'Google Docs', params: {} } },
        studentGraph: { nodes: [], edges: [] },
        onChange: () => {},
        onClose: () => {},
      })
    );

    expect(card).toContain('src="/node-icons/google-docs.svg"');
    expect(detail).toContain('src="/node-icons/google-docs.svg"');
  });

  it.each(['evaluation', 'evaluation-trigger', 'noop'])('keeps the %s glyph visible on its chip', (type) => {
    expect(NodeIcon({ type }).props.style.backgroundColor).toBe('#5B6675');
  });
});
