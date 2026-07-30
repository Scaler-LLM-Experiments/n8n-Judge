import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUUpLeft, CircleNotch, House, Info } from '@phosphor-icons/react';
import { useHideVoiceGlow, useVoiceActions } from '../lib/VoiceContext.jsx';
import { useSignedInUser, firstNameOf } from '../lib/useSignedInUser.js';
import { Button } from '../design-system/Button.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ProblemStatementPanel } from '../components/ProblemStatementPanel.jsx';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';
import { understandingScore, countsByKind } from '@judge/engine/grading.js';

// This screen reads as a REPORT, not as another screen in the journey: one
// centred sheet, wider than the journey's content column, lifted off the page
// with a soft shadow, opening on a navy hero and continuing on white. Everything
// that used to sit below the marks — the full decision list, the misconception
// cards, the per-test-case alerts — is deliberately gone. A learner reading their
// result does not audit thirty rows; they want to know how they did, where the
// marks went, and what to do next.

const KIND_ORDER = ['dissection', 'field', 'nodePick', 'stress'];

const NEXT_STEP_BY_KIND = {
  dissection: 'Re-read the problem statement and the dissection questions. The overall shape of the flow is worth another look.',
  field: 'Revisit node configuration while building, and check what each field should point at.',
  nodePick: 'Look again at which node fits each step. A few picks suggest some node types are still fuzzy.',
  stress: 'Replay the Stress Testing scenarios to pin down how the flow behaves at the edges.',
};

// The greeting carries the verdict, so it has to change with the band. The score
// is already on screen in 64px type: repeating it in words teaches nothing, while
// naming what happened does. `band` comes from the rubric (`scoreBand`), which is
// the same source as the definition printed underneath.
const GREETING_BY_BAND = {
  strong: 'you nailed this',
  solid: 'that was a solid run',
  developing: 'you almost got there',
  'needs-another-pass': 'this one needs another pass',
};

function greetingFor(band, name) {
  const tail = GREETING_BY_BAND[band] || 'here is how it went';
  return name ? `Hey ${name}, ${tail}.` : `${tail.charAt(0).toUpperCase()}${tail.slice(1)}.`;
}

function bandClip(band) {
  if (band === 'strong') return 'celebrate';
  if (band === 'solid') return 'idle';
  return 'nervous';
}

// Band from the score, for the sessions that have no server report: the dev hash
// routes run without one. Thresholds mirror `scoreBand` in the rubric.
function bandFromScore(score) {
  if (score == null) return null;
  if (score >= 85) return 'strong';
  if (score >= 70) return 'solid';
  if (score >= 50) return 'developing';
  return 'needs-another-pass';
}

// Canned pointers for when Claude wrote nothing, so "what to do next" is never
// empty just because no API key is configured.
//
// EVERY area that was not first-try perfect gets a line, weakest first — not just
// the single worst one. One lonely bullet under a heading that promises what to do
// next reads like the screen is broken, and a learner who fumbled three areas is
// owed three pointers.
function cannedNextSteps(counts) {
  return KIND_ORDER.map((kind) => {
    const c = counts[kind];
    if (!c || c.total === 0) return null;
    const ratio = c.firstTryCorrect / c.total;
    return ratio >= 1 ? null : { kind, ratio };
  })
    .filter(Boolean)
    .sort((a, b) => a.ratio - b.ratio)
    .map((x) => NEXT_STEP_BY_KIND[x.kind])
    .filter(Boolean);
}

export function ReportScreen({
  problem,
  grading,
  serverReport,
  onRedo,
  onNext,
  onHome,
  nextProblem,
}) {
  const voice = useVoiceActions();
  // Iris is large in the hero here, so the corner glow would be a second light
  // saying the same thing.
  useHideVoiceGlow();
  const said = useRef(false);
  useEffect(() => {
    if (said.current) return;
    said.current = true;
    voice.play('report_ready');
  }, [voice]);
  const [showStatement, setShowStatement] = useState(false);
  const firstName = firstNameOf(useSignedInUser());

  // The server's replayed score wins whenever there is one. The local store is
  // the fallback for the dev hash routes, which run without a session — it is
  // NOT a second opinion, and the two are never blended.
  const localScore = grading ? understandingScore(grading) : null;
  const score = serverReport ? serverReport.total : localScore;
  const band = serverReport?.band || bandFromScore(score);
  const counts = grading ? countsByKind(grading) : {};

  const written = serverReport?.report || null;
  // Claude's next steps when there are any; otherwise the canned per-area lines.
  // Same section either way, so a session graded without a key still ends on
  // something to do.
  const nextSteps = written?.nextSteps?.length
    ? written.nextSteps
    : grading
    ? cannedNextSteps(counts)
    : [];

  // The written half is missing, and the screen used to say nothing about it: the
  // positives and negatives simply were not there, which reads as a bug rather
  // than as a missing key. `reason` comes from the server — 'llm_unconfigured'
  // (no ANTHROPIC_API_KEY) or 'llm_failed' (the call errored) — and is logged
  // with the actionable version, while the learner gets one plain sentence.
  // `narrative_pending` is not a failure — it is the score-only first pass, with the
  // words still in flight. Distinguished from a real absence so the screen says
  // "writing this up" instead of "not available", and so nothing is logged as wrong.
  const reason = serverReport && !written ? (serverReport.reason || 'unknown') : null;
  const narrativePending = reason === 'narrative_pending';
  const missingNarrative = reason && !narrativePending ? reason : null;
  const warned = useRef(false);
  useEffect(() => {
    if (!missingNarrative || warned.current) return;
    warned.current = true;
    console.warn(
      missingNarrative === 'llm_unconfigured'
        ? '[report] no written feedback: ANTHROPIC_API_KEY is not set. The score is unaffected.'
        : `[report] no written feedback: ${missingNarrative}. See the server log for the cause.`
    );
  }, [missingNarrative]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', background: 'var(--surface-2)' }}>
      <TopBar activeStage="report" problem={problem} onShowProblemStatement={() => setShowStatement(true)} />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '28px 24px 36px' }}>
        <div style={{ width: '100%', maxWidth: 880, background: 'var(--surface-0)', border: '1px solid var(--border-subtle)', boxShadow: '0 3px 14px rgba(1,24,69,0.07)' }}>

          {/* Hero: who they are and how it went on the left, the number on the
              right, on the darkest brand blue so the sheet opens on a header
              rather than on body text. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '30px 34px', background: 'var(--surface-deep)', color: 'var(--fg-inverse)' }}>
            <div style={{ width: 86, height: 86, flex: 'none' }}>
              <MascotPlayer clip={bandClip(band)} once={false} onceDone={() => {}} />
            </div>
            {/* Every text node in here sets its own colour. The container's
                `color` is NOT enough: the global stylesheet gives h2 and p their
                own `color: var(--fg-1)`, which beats inheritance, so the greeting
                and the definition rendered near-black on navy. */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700, color: 'var(--fg-inverse)', opacity: 0.62, marginBottom: 7 }}>
                Result · {problem?.title || 'This challenge'}
              </div>
              <h2 style={{ margin: '0 0 8px', fontFamily: 'var(--font-headline)', fontSize: 27, fontWeight: 600, lineHeight: 1.2, color: 'var(--fg-inverse)' }}>
                {greetingFor(band, firstName)}
              </h2>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--fg-inverse)', opacity: 0.86, maxWidth: 520 }}>
                {serverReport?.definition || 'Here is how this attempt went, decision by decision.'}
              </p>
            </div>
            <div style={{ flex: 'none', textAlign: 'right', color: 'var(--fg-inverse)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'flex-end' }}>
                <span style={{ fontFamily: 'var(--font-headline)', fontSize: 64, fontWeight: 700, lineHeight: 0.95 }}>{score ?? '—'}</span>
                <span style={{ fontSize: 17, opacity: 0.6 }}>/ 100</span>
              </div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700, opacity: 0.62, marginTop: 6 }}>
                Total marks
              </div>
            </div>
          </div>

          {/* Body, on white */}
          <div style={{ padding: '26px 34px 30px' }}>
            {serverReport?.phases?.length ? (
              <Section title="Where the marks came from">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {serverReport.phases.map((p) => (
                    <PhaseRow key={p.key} phase={p} />
                  ))}
                </div>
              </Section>
            ) : null}

            {narrativePending ? (
              <div style={{ display: 'flex', gap: 9, alignItems: 'center', padding: '12px 14px', marginBottom: 26, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}>
                <CircleNotch size={15} weight="bold" color="var(--brand-primary)" className="report-spin" />
                <div style={{ fontSize: 12.5, color: 'var(--fg-2)' }}>
                  Iris is writing up what went well and where the marks went. Your score is final.
                </div>
                <style>{`@keyframes report-spin { to { transform: rotate(360deg); } } .report-spin { animation: report-spin 0.9s linear infinite; }`}</style>
              </div>
            ) : null}

            {missingNarrative ? (
              <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '12px 14px', marginBottom: 26, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}>
                <Info size={16} color="var(--fg-3)" style={{ flex: 'none', marginTop: 1 }} />
                <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--fg-2)' }}>
                  The written feedback on this attempt is not available, so the sections naming
                  what went well and where marks went are missing. Your marks above are complete
                  and unaffected.
                </div>
              </div>
            ) : null}

            {/* Side by side, and responsive without a media query: two columns
                while there is room for both, one when there isn't. */}
            {written?.strengths?.length || written?.focusAreas?.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 26, marginBottom: 26 }}>
                {written?.strengths?.length ? (
                  <PointList title="What you did well" tone="success" items={written.strengths} />
                ) : null}
                {written?.focusAreas?.length ? (
                  <PointList title="Where you lost marks" tone="warning" items={written.focusAreas} />
                ) : null}
              </div>
            ) : null}

            {nextSteps.length ? (
              <Section title="What to do next" last>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {nextSteps.map((s, i) => (
                    <li key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                      <span style={{ width: 6, height: 6, background: 'var(--brand-primary)', flex: 'none', marginTop: 7 }} />
                      <span style={{ fontSize: 13.5, color: 'var(--fg-1)', lineHeight: 1.6 }}>{s}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}
          </div>
        </div>
      </div>

      {/* Sticky bottom bar. A flex sibling of the scroll area rather than a
          position:sticky child, so it cannot scroll away on a short report or
          overlap the last bullet on a long one. Only the actions that were given
          a handler render: the dev hash routes mount this screen with none. */}
      {onRedo || onNext || onHome ? (
        <div style={{ flex: 'none', display: 'flex', justifyContent: 'center', gap: 10, padding: '13px 24px', background: 'var(--surface-0)', borderTop: '1px solid var(--border-strong)' }}>
          {/* Redo and home are icon-only: they are the two actions whose meaning a
              single glyph carries, and three labelled buttons made the bar compete
              with the report. Both keep a title and an aria-label, because an
              unlabelled icon button is invisible to a screen reader. */}
          {onRedo ? (
            <Button
              variant="outline"
              icon={<ArrowUUpLeft size={16} />}
              onClick={onRedo}
              style={{ padding: '0 12px' }}
              title="Redo this challenge"
              aria-label="Redo this challenge"
            />
          ) : null}
          {onNext && nextProblem ? (
            <Button variant="primary" iconRight={<ArrowRight size={15} />} onClick={onNext}>
              Next: {nextProblem.title}
            </Button>
          ) : null}
          {onHome ? (
            <Button
              variant="outline"
              icon={<House size={16} />}
              onClick={onHome}
              style={{ padding: '0 12px' }}
              title="All challenges"
              aria-label="All challenges"
            />
          ) : null}
        </div>
      ) : null}

      {showStatement && problem ? <ProblemStatementPanel problem={problem} onClose={() => setShowStatement(false)} /> : null}
    </div>
  );
}

function Section({ title, children, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : 26 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-3)', fontWeight: 700 }}>{title}</h3>
      {children}
    </div>
  );
}

// One phase of the journey: marks earned out of what the phase is worth, with a
// bar so the shortfall is visible without reading the numbers.
function PhaseRow({ phase }) {
  const tone =
    phase.score >= 85 ? 'var(--status-success)' : phase.score >= 50 ? 'var(--status-warning)' : 'var(--status-danger)';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)' }}>{phase.label}</span>
        <span style={{ fontSize: 13, color: 'var(--fg-1)', fontVariantNumeric: 'tabular-nums' }}>
          {phase.earned} <span style={{ color: 'var(--fg-3)' }}>/ {phase.weight}</span>
        </span>
      </div>
      <div style={{ height: 5, background: 'var(--surface-2)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(0, Math.min(100, phase.score))}%`, height: '100%', background: tone }} />
      </div>
    </div>
  );
}

// Positives / negatives. Plain bulleted prose — these are Claude's sentences and
// they carry their own evidence, so no badge or score is added on top.
function PointList({ title, tone, items }) {
  const dot = tone === 'success' ? 'var(--status-success)' : 'var(--status-warning)';
  return (
    <div>
      <h3 style={{ margin: '0 0 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-3)', fontWeight: 700 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((text, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <span style={{ width: 5, height: 5, background: dot, flex: 'none', marginTop: 7 }} />
            <span style={{ fontSize: 13.5, color: 'var(--fg-1)', lineHeight: 1.55 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
