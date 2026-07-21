import React from 'react';
import { Check, Question, ArrowCounterClockwise, Play } from '@phosphor-icons/react';

const STAGES = [
  { id: 'statement', label: 'Understand' },
  { id: 'dashboard', label: 'Build Node' },
  { id: 'eval', label: 'Stress Testing' },
  { id: 'report', label: 'Result' },
];

function IconButton({ icon: Icon, title, onClick, primary, dataTour }) {
  return (
    <button
      type="button"
      title={title}
      data-tour={dataTour}
      onClick={onClick}
      style={{
        width: 34,
        height: 34,
        border: '1px solid var(--border-subtle)',
        background: primary ? 'var(--brand-primary)' : 'var(--surface-0)',
        color: primary ? 'var(--fg-on-brand)' : 'var(--fg-1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <Icon size={16} />
    </button>
  );
}

export function TopBar({ activeStage, onShowProblemStatement, onReset, onRun }) {
  const activeIndex = STAGES.findIndex((s) => s.id === activeStage);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '10px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--surface-0)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 15, color: 'var(--brand-primary)' }}>
        <span style={{ width: 18, height: 18, background: 'var(--brand-primary)', display: 'inline-block' }} />
        Scaler
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'center' }}>
        {STAGES.map((stage, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <React.Fragment key={stage.id}>
              {index > 0 ? <div style={{ width: 28, height: 1, background: 'var(--border-subtle)', margin: '0 8px' }} /> : null}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: active || done ? 'var(--fg-1)' : 'var(--fg-3)',
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    background: done || active ? 'var(--brand-primary)' : 'var(--n-100)',
                    color: done || active ? 'var(--fg-on-brand)' : 'var(--fg-3)',
                    boxShadow: active ? '0 0 0 3px var(--brand-blue-50)' : 'none',
                  }}
                >
                  {done ? <Check size={12} weight="bold" /> : index + 1}
                </span>
                {stage.label}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, justifySelf: 'end' }}>
        {onShowProblemStatement ? <IconButton icon={Question} title="Problem statement" onClick={onShowProblemStatement} dataTour="problem" /> : null}
        {onReset ? <IconButton icon={ArrowCounterClockwise} title="Reset" onClick={onReset} /> : null}
        {onRun ? <IconButton icon={Play} title="Run" onClick={onRun} primary dataTour="run" /> : null}
      </div>
    </div>
  );
}
