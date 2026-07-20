import React from 'react';
import { X, CheckCircle } from '@phosphor-icons/react';
import { Card } from '../design-system/Card.jsx';

export function ProblemStatementPanel({ problem, onClose }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(1, 24, 69, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
      }}
      onClick={onClose}
    >
      <Card
        padding={0}
        style={{ width: 480, maxHeight: '80%', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <h4 style={{ margin: 0, fontSize: 15 }}>{problem.title}</h4>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-2)' }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 18 }}>
          <div
            style={{
              fontSize: 13.5,
              lineHeight: 1.6,
              color: 'var(--fg-1)',
              background: 'var(--surface-soft-blue)',
              border: '1px solid var(--brand-blue-100)',
              padding: 14,
              marginBottom: 18,
            }}
          >
            {problem.statement}
          </div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--fg-2)', fontWeight: 700, marginBottom: 8 }}>
            What Run will check
          </div>
          {problem.testCaseSummary.map((line) => (
            <div
              key={line}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                padding: '8px 0',
                borderBottom: '1px solid var(--surface-1)',
                fontSize: 13,
                color: 'var(--fg-1)',
              }}
            >
              <CheckCircle size={16} color="var(--brand-primary)" style={{ marginTop: 2, flex: 'none' }} />
              {line}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
