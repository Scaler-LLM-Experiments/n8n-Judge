import React, { useState, useEffect, useRef } from 'react';
import { Check, Question, ArrowCounterClockwise, ArrowClockwise, Play, FileText, SpeakerHigh, SpeakerSlash, CaretDown } from '@phosphor-icons/react';
const scalerLogo = '/brand/scaler-logo.svg';
import { GlossaryDrawer } from './GlossaryDrawer.jsx';
import { AskAiDrawer } from './AskAiDrawer.jsx';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';
import { useVoice } from '../lib/VoiceContext.jsx';

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

const SCREEN_BY_STAGE = { statement: 'STATEMENT', dashboard: 'DASHBOARD', eval: 'EVAL', report: 'REPORT' };

// Signed-in identity + sign-out, at the right end of the nav. There is no
// <SessionProvider> mounted (the app is a dynamically-imported client-only
// SPA under a single #root — adding one means restructuring that boundary),
// so this fetches /api/auth/session itself instead of using next-auth/react's
// useSession hook.
function UserMenu() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setUser(data?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Outside-click and Escape close the menu; only attached while it's open.
  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!user) return null; // no session yet (still loading, or genuinely signed out)

  const email = user.email || '';
  const initial = email.charAt(0).toUpperCase() || '?';

  async function handleSignOut() {
    setSigningOut(true);
    try {
      // Auth.js's POST /api/auth/signout requires a CSRF token minted by the
      // GET csrf endpoint — a bare POST is rejected.
      const { csrfToken } = await (await fetch('/api/auth/csrf')).json();
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ csrfToken }),
      });
    } finally {
      // Hard navigation, not client-side routing: the session cookie just
      // cleared and every screen in this SPA assumes a signed-in user, so a
      // full reload is the simplest way to guarantee no stale state lingers.
      window.location.href = '/login';
    }
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={email}
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%', // deliberate exception to zero-radius chrome: an avatar reads as a circle
          border: '1px solid var(--border-subtle)',
          background: 'var(--brand-primary)',
          color: 'var(--fg-on-brand)',
          fontWeight: 700,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        {initial}
      </button>

      {open ? (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 40,
            right: 0,
            minWidth: 210,
            background: 'var(--surface-0)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-md, 0 4px 16px rgba(0,0,0,0.12))',
            zIndex: 50,
          }}
        >
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', wordBreak: 'break-all' }}>{email}</div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--fg-3)', marginTop: 2 }}>
              {user.role}
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 12px',
              border: 'none',
              background: 'transparent',
              color: 'var(--status-danger)',
              fontSize: 13,
              fontWeight: 600,
              cursor: signingOut ? 'default' : 'pointer',
              opacity: signingOut ? 0.6 : 1,
            }}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

const RATES = [1, 1.25, 1.5, 2];

/**
 * Voice control: one small trigger, one menu.
 *
 * Speed and mute belong together because from the learner's side they are one
 * decision ("how much of this do I want?"), and because six lookalike icon
 * buttons in a row is how a toolbar stops being readable.
 *
 * A native <select> was the first attempt and it was wrong for two reasons: it
 * reserves width for its widest option plus the platform's arrow, so the control
 * could not be as small as it should be, and mute had to live outside it as a
 * seventh button. A menu holds both and is exactly as wide as its content.
 *
 * Speed matters more than it looks. Someone who has heard the verify line twenty
 * times wants it faster; someone following in a second language wants it slower.
 * Both persist, so the choice is made once.
 */
function VoiceControl() {
  const { muted, setMuted, setRate, rate, speaking } = useVoice();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const Icon = muted ? SpeakerSlash : SpeakerHigh;

  // Close on an outside click or Escape. Both, because a menu that only closes on
  // one of them feels stuck the other way.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const label = muted ? 'Muted' : `${rate.toFixed(2).replace(/0$/, '')}x`;

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 'none' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Narration"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Narration: ${label}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          height: 34,
          padding: '0 8px',
          border: `1px solid ${open || (speaking && !muted) ? 'var(--brand-primary)' : 'var(--border-strong)'}`,
          background: 'var(--surface-0)',
          color: muted ? 'var(--fg-3)' : speaking ? 'var(--brand-primary)' : 'var(--fg-2)',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        <Icon size={15} weight={muted ? 'regular' : 'fill'} />
        <span style={{ fontSize: 11.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{label}</span>
        <CaretDown size={9} color="var(--fg-3)" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Narration speed"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 60,
            minWidth: 170,
            background: 'var(--surface-0)',
            border: '1px solid var(--border-strong)',
            boxShadow: '0 10px 28px rgba(1,24,69,0.16)',
            padding: 6,
          }}
        >
          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', padding: '6px 8px 8px' }}>
            Narration speed
          </div>

          {RATES.map((r) => {
            const active = !muted && r === rate;
            return (
              <button
                key={r}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  // Choosing a speed also unmutes: picking "1.5x" while muted and
                  // hearing nothing would read as a broken control.
                  setRate(r);
                  if (muted) setMuted(false);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  gap: 10,
                  padding: '7px 8px',
                  border: 'none',
                  background: active ? 'var(--brand-blue-50, rgba(0,85,255,0.07))' : 'none',
                  color: active ? 'var(--fg-1)' : 'var(--fg-2)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 12.5,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{r}x</span>
                {active ? <Check size={13} weight="bold" color="var(--brand-primary)" /> : null}
              </button>
            );
          })}

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 2px' }} />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMuted(!muted);
              setOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '7px 8px',
              border: 'none',
              background: muted ? 'var(--brand-blue-50, rgba(0,85,255,0.07))' : 'none',
              color: 'var(--fg-1)',
              fontFamily: 'var(--font-body)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {muted ? <SpeakerHigh size={14} weight="fill" color="var(--brand-primary)" /> : <SpeakerSlash size={14} />}
            {muted ? 'Unmute' : 'Mute'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function TopBar({ activeStage, problem, currentPhase, nodeContext, learnerName, onShowProblemStatement, onReset, onRun, onProblemDoc, onAskAI, onRedo }) {
  const activeIndex = STAGES.findIndex((s) => s.id === activeStage);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  // Context handed to the Ask-AI drawer so Iris's answers are scoped to the
  // current problem, screen, phase, and open node.
  const askContext = {
    problemTitle: problem?.title ?? 'n8n Judge challenge',
    problemStatement: problem?.statement ?? '',
    currentScreen: SCREEN_BY_STAGE[activeStage] ?? 'DASHBOARD',
    currentPhase,
    nodeContext,
  };

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
        {/* No activeStage (e.g. the home page, which is outside any problem journey) means no pills to draw — an
            unmatched index would otherwise render every stage in its "not started" state, which reads as broken. */}
        {activeStage ? STAGES.map((stage, index) => {
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
        }) : null}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifySelf: 'end' }}>
        <button type="button" onClick={() => setAskOpen(true)} title="Ask Iris" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 34, padding: '0 12px 0 8px', border: '1px solid var(--brand-primary)', background: 'var(--brand-blue-50, rgba(0,85,255,0.06))', color: 'var(--brand-primary)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', flex: 'none' }}>
          <span style={{ width: 22, height: 22, flex: 'none' }}><MascotPlayer clip="idle" once={false} onceDone={() => {}} /></span>
          Ask AI
        </button>
        <VoiceControl />
        {onProblemDoc ? <IconButton icon={FileText} title="Problem statement" onClick={onProblemDoc} /> : null}
        {onShowProblemStatement ? <IconButton icon={FileText} title="Problem statement" onClick={onShowProblemStatement} dataTour="problem" /> : null}
        <IconButton icon={Question} title="Node glossary" onClick={() => setGlossaryOpen(true)} />
        {onReset ? <IconButton icon={ArrowCounterClockwise} title="Reset" onClick={onReset} /> : null}
        {onRun ? <IconButton icon={Play} title="Run" onClick={onRun} primary dataTour="run" /> : null}
        {onRedo ? <IconButton icon={ArrowClockwise} title="Start over" onClick={onRedo} /> : null}
        <UserMenu />
      </div>

      {glossaryOpen ? <GlossaryDrawer onClose={() => setGlossaryOpen(false)} /> : null}
      {askOpen ? <AskAiDrawer onClose={() => setAskOpen(false)} context={askContext} learnerName={learnerName} /> : null}
    </div>
  );
}
