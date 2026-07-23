import React, { useState } from 'react';
import { Check, Question, ArrowCounterClockwise, ArrowClockwise, Play, FileText } from '@phosphor-icons/react';
import scalerLogo from '../assets/brand/scaler-logo.svg';
import { GlossaryDrawer } from './GlossaryDrawer.jsx';
import { AskAiDrawer } from './AskAiDrawer.jsx';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';

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

export function TopBar({ activeStage, onShowProblemStatement, onReset, onRun, onProblemDoc, onAskAI, onRedo }) {
  const activeIndex = STAGES.findIndex((s) => s.id === activeStage);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

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
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src={scalerLogo} alt="Scaler" style={{ height: 22, width: 'auto', display: 'block' }} />
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifySelf: 'end' }}>
        <button type="button" onClick={() => setAskOpen(true)} title="Ask Iris" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 34, padding: '0 12px 0 8px', border: '1px solid var(--brand-primary)', background: 'var(--brand-blue-50, rgba(0,85,255,0.06))', color: 'var(--brand-primary)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          <span style={{ width: 22, height: 22, flex: 'none' }}><MascotPlayer clip="idle" once={false} onceDone={() => {}} /></span>
          Ask AI
        </button>
        {onProblemDoc ? <IconButton icon={FileText} title="Problem statement" onClick={onProblemDoc} /> : null}
        {onShowProblemStatement ? <IconButton icon={FileText} title="Problem statement" onClick={onShowProblemStatement} dataTour="problem" /> : null}
        <IconButton icon={Question} title="Node glossary" onClick={() => setGlossaryOpen(true)} />
        {onReset ? <IconButton icon={ArrowCounterClockwise} title="Reset" onClick={onReset} /> : null}
        {onRun ? <IconButton icon={Play} title="Run" onClick={onRun} primary dataTour="run" /> : null}
        {onRedo ? <IconButton icon={ArrowClockwise} title="Start over" onClick={onRedo} /> : null}
      </div>

      {glossaryOpen ? <GlossaryDrawer onClose={() => setGlossaryOpen(false)} /> : null}
      {askOpen ? <AskAiDrawer onClose={() => setAskOpen(false)} /> : null}
    </div>
  );
}
