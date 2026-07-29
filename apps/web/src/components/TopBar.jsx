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
 * Voice control: mute on the icon, speed on the number.
 *
 * Both in one control because they are the same decision from the learner's side
 * ("how much of this do I want?"), and because two separate buttons in a row of
 * six all start to look alike.
 *
 * Always shown, even with narration unconfigured: the control is how a learner
 * discovers there IS a voice, and hiding it when the key is missing would mean
 * the feature silently does not exist in some environments.
 *
 * Speed matters more than it looks. A learner who has heard the verify line
 * twenty times wants it faster, and one following in a second language wants it
 * slower. Both are persisted, so the choice is made once.
 */
function VoiceControl() {
  const { muted, setMuted, setRate, rate, speaking } = useVoice();
  const Icon = muted ? SpeakerSlash : SpeakerHigh;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 34,
        flex: 'none',
        border: `1px solid ${speaking && !muted ? 'var(--brand-primary)' : 'var(--border-strong)'}`,
        background: 'var(--surface-0)',
      }}
    >
      <button
        type="button"
        onClick={() => setMuted(!muted)}
        title={muted ? 'Turn Iris’s voice on' : 'Mute Iris’s voice'}
        aria-label={muted ? 'Turn voice on' : 'Mute voice'}
        aria-pressed={muted}
        style={{
          width: 26,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          background: 'none',
          color: muted ? 'var(--fg-3)' : speaking ? 'var(--brand-primary)' : 'var(--fg-2)',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <Icon size={15} weight={muted ? 'regular' : 'fill'} />
      </button>

      {/* The select is transparent and sits ON TOP of the rendered label, so the
          control is exactly as wide as "1.0x" plus the caret. A styled <select>
          otherwise reserves room for its widest option and for the platform's own
          arrow, which is where the dead space was coming from. */}
      <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 3, paddingRight: 6, opacity: muted ? 0.45 : 1 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, fontFamily: 'var(--font-body)', color: 'var(--fg-2)', fontVariantNumeric: 'tabular-nums' }}>
          {rate.toFixed(2).replace(/0$/, '')}x
        </span>
        <CaretDown size={9} color="var(--fg-3)" />
        <select
          value={rate}
          disabled={muted}
          aria-label="How fast Iris talks"
          onChange={(e) => setRate(Number(e.target.value))}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: muted ? 'not-allowed' : 'pointer' }}
        >
          {RATES.map((r) => (
            <option key={r} value={r}>{r}x</option>
          ))}
        </select>
      </span>
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
