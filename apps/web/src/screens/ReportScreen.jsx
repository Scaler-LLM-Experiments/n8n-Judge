import React, { useState } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
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

export function ReportScreen({ problem, grading, dissection, runResult, evalOutcome, graph }) {
  const [showStatement, setShowStatement] = useState(false);

  const score = grading ? understandingScore(grading) : null;
  const counts = grading ? countsByKind(grading) : {};
  const misconceptions = grading ? misconceptionsHit(grading) : [];
  const verdict = verdictFor(score);
  const nextStep = grading ? nextStepFor(counts) : null;
  const decisions = grading?.decisions || [];
  const kindsPresent = KIND_ORDER.filter((k) => decisions.some((d) => d.kind === k));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <TopBar activeStage="report" onShowProblemStatement={() => setShowStatement(true)} />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 24 }}>
        <Card style={{ maxWidth: 640, width: '100%' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 8 }}>
            Result
          </div>

          {verdict ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, flex: 'none' }}>
                <MascotPlayer clip={verdict.clip} once={false} onceDone={() => {}} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg-1)', marginBottom: 2 }}>{verdict.message}</div>
                <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>{score}% understanding, first try</div>
              </div>
            </div>
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

          {nextStep ? (
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
