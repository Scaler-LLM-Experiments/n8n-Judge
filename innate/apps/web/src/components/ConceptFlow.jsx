import React from 'react';
import { EnvelopeSimple, Brain, PaperPlaneTilt } from '@phosphor-icons/react';
import { typeCategory } from '../nodes/nodeIcons.js';

// A loose, excalidraw-ish sketch of the problem — icons + handwritten labels +
// hand-drawn arrows, no rigid boxes. Plain-language (not the n8n node names).

// Plain-language sketch per node category, so the diagram describes whatever
// problem is loaded rather than hardcoding one challenge's story.
const CATEGORY_SKETCH = {
  trigger: { icon: EnvelopeSimple, color: '#0055FF' },
  ai: { icon: Brain, color: '#6B4EFF' },
  model: { icon: Brain, color: '#0E9488' },
  core: { icon: null, color: '#ED7700' },
  action: { icon: PaperPlaneTilt, color: '#127A54' },
};

const BRANCH_DOTS = ['#ED7700', '#6B4EFF', '#D4380D', '#0055FF'];

// Two words per line keeps the handwritten labels readable in a narrow column.
function wrapLabel(text) {
  const words = String(text).split(/\s+/);
  const out = [];
  for (let i = 0; i < words.length; i += 2) out.push(words.slice(i, i + 2).join(' '));
  return out.join('\n');
}

// Derive the sketch from the problem's own flowSummary (+ branches for the
// routing fan-out). Falls back to the original email-triage sketch when no
// problem is supplied (dev routes / legacy callers).
function stepsFor(problem) {
  const summary = problem?.flowSummary?.steps;
  if (!summary?.length) {
    return [
      { icon: EnvelopeSimple, label: 'a new email\narrives', color: '#0055FF' },
      { icon: Brain, label: 'figure out\nwhat it is', color: '#6B4EFF' },
      { icon: null, label: 'bug · feature\n· complaint', color: '#ED7700', dots: ['#ED7700', '#6B4EFF', '#D4380D'] },
      { icon: PaperPlaneTilt, label: 'send the\nright reply', color: '#127A54' },
    ];
  }

  const branches = problem?.branches ?? [];
  return summary.map((step) => {
    const category = typeCategory[step.type] || 'core';
    const sketch = CATEGORY_SKETCH[category] || CATEGORY_SKETCH.core;
    // A routing node is drawn as its branch labels + a dot per branch.
    const isRouter = branches.length > 0 && category === 'core' && /switch|route/i.test(step.type);
    if (isRouter) {
      return {
        icon: null,
        color: sketch.color,
        label: branches.map((b) => b.label).join(' · '),
        dots: branches.slice(0, BRANCH_DOTS.length).map((_, i) => BRANCH_DOTS[i]),
      };
    }
    return { icon: sketch.icon, color: sketch.color, label: wrapLabel(step.label) };
  });
}

const sketchFont = "'Caveat', 'Comic Sans MS', cursive";

// a slightly wobbly hand-drawn arrow
function SketchArrow({ vertical }) {
  if (vertical) {
    return (
      <svg width="30" height="34" viewBox="0 0 30 34" fill="none" style={{ display: 'block' }}>
        <path d="M15 3 C 12 12, 18 18, 15 27" stroke="#B0B5BD" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 22 L15 29 L20 22" stroke="#B0B5BD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }
  return (
    <svg width="46" height="26" viewBox="0 0 46 26" fill="none" style={{ display: 'block' }}>
      <path d="M4 14 C 16 9, 30 18, 40 12" stroke="#B0B5BD" strokeWidth="2" strokeLinecap="round" />
      <path d="M33 8 L41 12 L35 19" stroke="#B0B5BD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function ConceptFlow({ direction = 'row', size = 'md', problem }) {
  const vertical = direction === 'column';
  const iconSize = size === 'sm' ? 22 : 30;
  const font = size === 'sm' ? 15 : 19;
  const STEPS = stepsFor(problem);

  return (
    <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', alignItems: 'center', gap: vertical ? 2 : 4, flexWrap: 'nowrap' }}>
      {STEPS.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: vertical ? 150 : 96, textAlign: 'center' }}>
            <div style={{ height: iconSize + 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {s.dots ? (
                <div style={{ display: 'flex', gap: 5 }}>
                  {s.dots.map((c) => (
                    <span key={c} style={{ width: 10, height: 10, background: c, borderRadius: '50%' }} />
                  ))}
                </div>
              ) : s.icon ? (
                <s.icon size={iconSize} color={s.color} weight="duotone" />
              ) : null}
            </div>
            <span style={{ fontFamily: sketchFont, fontSize: font, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.15, whiteSpace: 'pre-line' }}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 ? <SketchArrow vertical={vertical} /> : null}
        </React.Fragment>
      ))}
    </div>
  );
}
