import React, { useEffect, useRef, useState } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import { useVoiceActions } from '../lib/VoiceContext.jsx';
import { Card } from '../design-system/Card.jsx';
import { Alert } from '../design-system/Alert.jsx';
import { Badge } from '../design-system/Badge.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ProblemStatementPanel } from '../components/ProblemStatementPanel.jsx';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';
import { NodeReplay } from '../components/NodeReplay.jsx';
import { understandingScore, countsByKind, misconceptionsHit } from '@judge/engine/grading.js';
import { simulateCase } from '@judge/engine/simulate.js';

const KIND_LABEL = { dissection: 'Problem dissection', field: 'Node configuration', nodePick: 'Node choices', stress: 'Stress testing' };
const KIND_ORDER = ['dissection', 'field', 'nodePick', 'stress'];

const NEXT_STEP_BY_KIND = {
  dissection: 'Re-read the problem statement and dissection questions — the core shape of the flow is worth another look.',
  field: 'Revisit node field configuration when building — double-check what each field should point at.',
  nodePick: 'Look again at which nodes fit each step — a few picks suggest some node types are still fuzzy.',
  stress: 'Replay the Stress Testing scenarios again to nail down how the flow behaves at the edges.',
};

function verdictFor(score) {
  if (score == null) return null;
  if (score >= 80) return { clip: 'celebrate', message: 'Nice work — you really get this.' };
  if (score >= 50) return { clip: 'idle', message: 'Good foundation — a couple of gaps to close.' };
  return { clip: 'nervous', message: "Let's go back over a few things." };
}

// Finds the kind with the lowest first-try-correct ratio; returns its canned
// suggestion, or null if every kind is at 100% (or there's nothing to grade).
function nextStepFor(counts) {
  let worstKind = null;
  let worstRatio = Infinity;
  KIND_ORDER.forEach((kind) => {
    const c = counts[kind];
    if (!c || c.total === 0) return;
    const ratio = c.firstTryCorrect / c.total;
    if (ratio < worstRatio) {
      worstRatio = ratio;
      worstKind = kind;
    }
  });
  if (worstKind === null || worstRatio >= 1) return null;
  return NEXT_STEP_BY_KIND[worstKind];
}

// decision.id for stress decisions is `stress:${evalQuestionId}` (set by
// EvalScreen.jsx's pick()). Resolve that back to the question's caseId, then
// to the sampleCases entry simulateCase needs.
function findSampleCase(problem, decisionId) {
  const qId = decisionId.replace(/^stress:/, '');
  const q = problem.evalQuestions?.find((eq) => eq.id === qId);
  if (!q?.caseId) return null;
  return problem.sampleCases?.find((c) => c.id === q.caseId) || null;
}

export function ReportScreen({ problem, grading, dissection, runResult, evalOutcome, graph, serverReport }) {
  const voice = useVoiceActions();
  const said = useRef(false);
  useEffect(() => {
    if (said.current) return;
    said.current = true;
    voice.play('report_ready');
  }, [voice]);
  const [showStatement, setShowStatement] = useState(false);

  // The server's replayed score wins whenever there is one. The local store is
  // the fallback for the dev hash routes, which run without a session — it is
  // NOT a second opinion, and the two are never blended.
  const localScore = grading ? understandingScore(grading) : null;
  const score = serverReport ? serverReport.total : localScore;
  const counts = grading ? countsByKind(grading) : {};
  const misconceptions = grading ? misconceptionsHit(grading) : [];
  const verdict = verdictFor(score);
  // Claude writes the next steps when it is available; the canned per-area line
  // is what a session without a narrative falls back to.
  const nextStep = grading ? nextStepFor(counts) : null;
  const decisions = grading?.decisions || [];
  const kindsPresent = KIND_ORDER.filter((k) => decisions.some((d) => d.kind === k));

  const written = serverReport?.report || null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <TopBar activeStage="report" problem={problem} onShowProblemStatement={() => setShowStatement(true)} />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 24 }}>
        <Card style={{ maxWidth: 640, width: '100%' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 8 }}>
            Result
          </div>

          {/* 1 — total marks gained */}
          {verdict ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, flex: 'none' }}>
                <MascotPlayer clip={verdict.clip} once={false} onceDone={() => {}} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontFamily: 'var(--font-display, inherit)', fontSize: 34, fontWeight: 700, lineHeight: 1, color: 'var(--fg-1)' }}>{score}</span>
                  <span style={{ fontSize: 15, color: 'var(--fg-3)' }}>/ 100</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>
                  {serverReport?.definition || verdict.message}
                </div>
              </div>
            </div>
          ) : null}

          {/* 2 — breakdown across the three phases the learner walked */}
          {serverReport?.phases?.length ? (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 10px' }}>Where the marks came from</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {serverReport.phases.map((p) => (
                  <PhaseRow key={p.key} phase={p} />
                ))}
              </div>
            </div>
          ) : null}

          {/* 3 — positives and negatives, written by Claude from the trace */}
          {written?.strengths?.length ? (
            <PointList
              title="What you did well"
              tone="success"
              items={written.strengths}
            />
          ) : null}

          {written?.focusAreas?.length ? (
            <PointList
              title="Where you lost marks"
              tone="warning"
              items={written.focusAreas}
            />
          ) : null}

          {/* 4 — next steps */}
          {written?.nextSteps?.length ? (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 8px' }}>What to do next</h3>
              <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {written.nextSteps.map((s, i) => (
                  <li key={i} style={{ fontSize: 13.5, color: 'var(--fg-1)', lineHeight: 1.5 }}>{s}</li>
                ))}
              </ol>
            </div>
          ) : null}

          {written?.narrative ? (
            <Alert tone="info" style={{ marginBottom: 24 }}>{written.narrative}</Alert>
          ) : null}

          {misconceptions.length ? (
            <>
              <h3 style={{ margin: '0 0 8px' }}>Worth revisiting</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {misconceptions.map((m) => (
                  <MisconceptionCard key={m} id={m} label={problem.misconceptionLabels?.[m] || m} decisions={decisions} />
                ))}
              </div>
            </>
          ) : null}

          {/* Canned fallback — only when Claude wrote nothing (no key, or the
              call failed). Never shown alongside the written next steps. */}
          {!written && nextStep ? (
            <>
              <h3 style={{ margin: '0 0 8px' }}>What to try next</h3>
              <Alert tone="info" style={{ marginBottom: 24 }}>{nextStep}</Alert>
            </>
          ) : null}

          {kindsPresent.length ? (
            <>
              <h3 style={{ margin: '0 0 8px' }}>Every decision</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                {kindsPresent.map((kind) => (
                  <div key={kind}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-2)', marginBottom: 8 }}>{KIND_LABEL[kind]}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {decisions.filter((d) => d.kind === kind).map((d) => (
                        <DecisionRow key={d.id} decision={d} problem={problem} graph={graph} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <h3 style={{ margin: '0 0 8px' }}>Test cases</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {runResult?.results?.map((r) => (
              <Alert key={r.id} tone={r.passed ? 'success' : 'danger'} title={r.description}>
                {r.passed ? 'Passed' : r.reason}
              </Alert>
            ))}
          </div>
        </Card>
      </div>
      {showStatement && problem ? <ProblemStatementPanel problem={problem} onClose={() => setShowStatement(false)} /> : null}
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
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)' }}>{phase.label}</span>
        <span style={{ fontSize: 13, color: 'var(--fg-1)', fontVariantNumeric: 'tabular-nums' }}>
          {phase.earned} <span style={{ color: 'var(--fg-3)' }}>/ {phase.weight}</span>
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--surface-2)', overflow: 'hidden' }}>
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
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 8px' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((text, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <span style={{ width: 5, height: 5, background: dot, flex: 'none', marginTop: 7 }} />
            <span style={{ fontSize: 13.5, color: 'var(--fg-1)', lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MisconceptionCard({ id, label, decisions }) {
  const [open, setOpen] = useState(false);
  const hits = decisions.filter((d) => d.misconception === id);
  return (
    <Card interactive padding={13} onClick={() => setOpen((o) => !o)} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)' }}>{label}</span>
        {open ? <CaretUp size={14} color="var(--fg-3)" /> : <CaretDown size={14} color="var(--fg-3)" />}
      </div>
      {open ? (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {hits.map((d) => (
            <div key={d.id} style={{ fontSize: 12.5, color: 'var(--fg-2)' }}>{d.label}</div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function DecisionRow({ decision, problem, graph }) {
  const [open, setOpen] = useState(false);
  const sampleCase = decision.kind === 'stress' ? findSampleCase(problem, decision.id) : null;
  const replaySteps = open && sampleCase && graph ? simulateCase(graph, sampleCase).steps : null;
  // Stress rows lead with the correct answer (what the review is actually
  // about) rather than repeating the full question prompt already seen in Eval.
  const rowLabel = decision.kind === 'stress' ? (decision.correctLabel || decision.label) : decision.label;

  return (
    <Card interactive padding={13} onClick={() => setOpen((o) => !o)} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: 1, fontSize: 13, color: 'var(--fg-1)' }}>{rowLabel}</span>
        <Badge tone={decision.correct ? 'success' : 'danger'}>{decision.correct ? 'Correct' : 'Incorrect'}</Badge>
        {open ? <CaretUp size={14} color="var(--fg-3)" /> : <CaretDown size={14} color="var(--fg-3)" />}
      </div>
      {open ? (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {decision.chosenLabel != null ? (
            <div style={{ fontSize: 12.5, color: 'var(--fg-2)' }}>
              <div>You picked: <strong style={{ color: 'var(--fg-1)' }}>{decision.chosenLabel}</strong></div>
              <div>Correct answer: <strong style={{ color: 'var(--fg-1)' }}>{decision.correctLabel}</strong></div>
            </div>
          ) : null}
          {replaySteps ? <NodeReplay steps={replaySteps} label="Replaying this scenario, on your graph" /> : null}
        </div>
      ) : null}
    </Card>
  );
}
