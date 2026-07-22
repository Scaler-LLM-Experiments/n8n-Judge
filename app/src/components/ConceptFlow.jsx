import React from 'react';
import { EnvelopeSimple, Brain, ArrowRight, PaperPlaneTilt } from '@phosphor-icons/react';

// Plain-language "story" of the problem — deliberately NOT the n8n node names, so
// it primes understanding without giving away the dissection answers.
const STEPS = [
  { icon: EnvelopeSimple, label: 'A new email arrives', color: '#0055FF' },
  { icon: Brain, label: 'Figure out what it is', color: '#6B4EFF' },
  { icon: null, label: 'Bug · Feature · Complaint', color: '#ED7700', branch: true },
  { icon: PaperPlaneTilt, label: 'Send the right reply', color: '#127A54' },
];

export function ConceptFlow({ compact }) {
  const box = compact ? 92 : 130;
  const pad = compact ? '8px 8px' : '12px 12px';
  const fs = compact ? 10.5 : 12.5;
  const iconSize = compact ? 15 : 20;

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: compact ? 4 : 10, flexWrap: 'nowrap' }}>
      {STEPS.map((s, i) => (
        <React.Fragment key={i}>
          <div
            style={{
              width: box,
              flex: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              textAlign: 'center',
              padding: pad,
              border: `1px solid var(--border-subtle)`,
              background: 'var(--surface-1)',
              borderLeft: `3px solid ${s.color}`,
            }}
          >
            {s.branch ? (
              <div style={{ display: 'flex', gap: 3 }}>
                {['#ED7700', '#6B4EFF', '#D4380D'].map((c) => (
                  <span key={c} style={{ width: 7, height: 7, background: c, borderRadius: '50%' }} />
                ))}
              </div>
            ) : s.icon ? (
              <s.icon size={iconSize} color={s.color} weight="duotone" />
            ) : null}
            <span style={{ fontSize: fs, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.3 }}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--fg-3)' }}>
              <ArrowRight size={compact ? 12 : 16} weight="bold" />
            </div>
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}
