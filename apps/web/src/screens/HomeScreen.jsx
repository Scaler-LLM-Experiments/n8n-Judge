import React from 'react';
import { ArrowRight, EnvelopeSimpleOpen, UsersThree, NotePencil, Package, Robot } from '@phosphor-icons/react';
import { MascotPlayer } from '../mascot/MascotPlayer.jsx';
import { Button } from '../design-system/Button.jsx';
import { TopBar } from '../components/TopBar.jsx';

// A Phosphor icon per problem (falls back to a generic agent icon).
const ICONS = {
  'email-triage': EnvelopeSimpleOpen,
  'lead-triage': UsersThree,
  'meeting-notes': NotePencil,
  'order-desk': Package,
};

// The cover slot's background. A literal rather than a design token on purpose: this
// is not a UI surface, it is the ARTWORK's own canvas colour. It exists so the padding
// around a `contain`-fitted illustration reads as part of the picture instead of as a
// frame around it. `scripts/generate-covers.mjs` names the same value in its style
// prompt, so the two halves cannot drift apart.
const COVER_BG = '#F9F6F2';

// Difficulty, as the author declared it. Deliberately NOT derived from
// `problemComplexity()`: that counts graded decisions to order the catalogue, which
// is the right input for "practise this next" and the wrong one for a badge, since
// it moves whenever the rubric moves and cannot say "long" as opposed to "subtle".
//
// Status colours, not brand blue — this is a property of the work, and blue is the
// colour of things you click.
const DIFFICULTY = {
  easy: { label: 'Easy', fg: 'var(--status-success-fg, #1a7f37)', bg: 'var(--status-success-bg, rgba(26,127,55,0.10))' },
  moderate: { label: 'Moderate', fg: 'var(--status-warning-fg, #9a6700)', bg: 'var(--status-warning-bg, rgba(154,103,0,0.10))' },
  difficult: { label: 'Difficult', fg: 'var(--status-danger-fg, #b3261e)', bg: 'var(--status-danger-bg, rgba(179,38,30,0.10))' },
};

// The card's meta line: DIFFICULTY · TIME, above the title. Either half can be
// missing — a problem authored before these fields simply shows the other, and a
// problem with neither shows no line at all rather than an empty rule.
function MetaLine({ level, minutes }) {
  const spec = DIFFICULTY[level];
  if (!spec && !minutes) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
      {spec ? <span style={{ color: spec.fg }}>{spec.label}</span> : null}
      {spec && minutes ? <span style={{ color: 'var(--border-strong)' }}>·</span> : null}
      {minutes ? <span style={{ color: 'var(--fg-3)' }}>{minutes} min</span> : null}
    </div>
  );
}

// The cover. `coverImage.src` is null until the art is generated from
// `coverImage.prompt`, so the placeholder is the normal case for now, not an
// error state: a tinted block carrying the problem's own icon. Fixed aspect ratio
// either way, so cards keep their rhythm when half the art exists.
function Cover({ problem, Icon }) {
  const art = problem.coverImage;
  return (
    // `contain` inside a padded box, not `cover`. The art is composed as a whole
    // scene with its own margins, so filling the slot cropped it and pushed the
    // illustration hard into the card's edges — the parcels and cubes were being
    // sliced by the border. Padding plus contain keeps the whole scene visible and
    // gives it room to breathe. The slot's background matches the art's own
    // off-white, so the inset reads as part of the picture rather than as a frame.
    // 2:1 rather than 16:9. A node setup is a wide, shallow left-to-right thing, so
    // the art is too — a squarer slot forced the illustration to shrink to fit.
    <div style={{ aspectRatio: '2 / 1', background: art?.src ? COVER_BG : 'var(--surface-soft-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderBottom: '1px solid var(--border-subtle)', padding: art?.src ? 16 : 0, boxSizing: 'border-box' }}>
      {art?.src ? (
        <img src={art.src} alt={art.alt || ''} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
      ) : (
        <Icon size={40} weight="duotone" color="var(--brand-primary)" />
      )}
    </div>
  );
}

// Where a half-finished attempt actually got to, in the learner's words. The
// server sends the raw screen id from the trace; nobody calls it "dashboard".
const RESUME_STAGE = {
  statement: 'partway through Understand',
  dashboard: 'partway through the build',
  eval: 'partway through Stress Testing',
  report: 'at your result',
};

function ContinueCard({ resume, onResume }) {
  const where = RESUME_STAGE[resume.screen] ?? 'partway through';
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-2)', fontWeight: 700, marginBottom: 12 }}>
        Continue where you left off
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '18px 22px', background: 'var(--surface-soft-blue)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg-1)', marginBottom: 4 }}>{resume.title}</div>
          <div style={{ fontSize: 13.5, color: 'var(--fg-2)' }}>
            You’re {where}. Your marks so far are safe.
          </div>
        </div>
        <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} weight="bold" />} onClick={() => onResume(resume)} style={{ flex: 'none' }}>
          Continue
        </Button>
      </div>
    </div>
  );
}

// Landing page: pick a challenge, each launches its own build journey.
export function HomeScreen({ problems, onSelect, resume, onResume }) {
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--surface-0)' }}>
      {/* Home is outside any problem journey — no activeStage/problem to pass, and
          TopBar itself hides the stage pills and problem-scoped buttons when absent. */}
      <TopBar />

      {/* Wider than the old 940, so three cards fit a row while each still holds a
          two-line description. Narrowing the margin alone would not do it: the
          constraint is the per-card column width, and at 940/3 the copy wrapped to
          four lines — the same failure that pushed this to two-up in the first place. */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '12px 32px 64px' }}>
        {/* hero */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{ width: 96, height: 96 }}>
            <MascotPlayer clip="hello" once={false} onceDone={() => {}} />
          </div>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brand-primary)', fontWeight: 700 }}>Agent Builder · Judge</div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 38, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.15, margin: 0 }}>n8n Node Simulator</h1>
          <p style={{ fontSize: 15, color: 'var(--fg-2)', lineHeight: 1.6, maxWidth: 540, margin: 0 }}>
          Pick a challenge, wire it up on an n8n-style canvas, and test it against real cases - with Iris guiding you the whole way.
          </p>
        </div>

        {/* An attempt already in progress comes first: it is the one thing on this
            screen the learner has already invested in. */}
        {resume && onResume ? <ContinueCard resume={resume} onResume={onResume} /> : null}

        {/* problem cards */}
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-2)', fontWeight: 700, marginBottom: 12 }}>Choose a challenge</div>
        {/* Three up. The 380px floor is what picks the count: at this container's
            ~1296px of content, four columns would need 1520 and two would waste half
            the row, so auto-fit lands on three at ~419px each — enough for the
            two-line description — and still collapses to 2-up / 1-up as the viewport
            narrows, rather than overflowing. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
          {/* Card order, top to bottom: cover, DIFFICULTY · TIME, title,
              description, CTA. The description is the authored two-line `brief`,
              so it cannot push the button out of line with the card beside it. */}
          {problems.map((p) => {
            const Icon = ICONS[p.id] || Robot;
            return (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}>
                <Cover problem={p} Icon={Icon} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 20, flex: 1 }}>
                  <MetaLine level={p.difficulty} minutes={p.estimatedMinutes} />
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg-1)', marginBottom: 6 }}>{p.title}</div>
                    {/* Clamped to two lines as a floor under the authoring rule, not
                        instead of it: `brief` is capped at 180 characters by the schema,
                        and this stops a long `tagline` fallback (or a narrow viewport)
                        from pushing the CTA out of line with the card beside it. */}
                    <div
                      style={{
                        fontSize: 13.5,
                        color: 'var(--fg-2)',
                        lineHeight: 1.55,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {p.brief || p.tagline || p.statement}
                    </div>
                  </div>
                  {/* data-problem is how smoke enters a SPECIFIC challenge. Without it the
                      test could only click the first card, so `?problem=lead-triage` and
                      `meeting-notes` silently re-tested email-triage's Understand screen. */}
                  <Button variant="primary" size="lg" data-problem={p.id} iconRight={<ArrowRight size={16} weight="bold" />} onClick={() => onSelect(p)} style={{ marginTop: 'auto', width: '100%', justifyContent: 'center' }}>
                    Start
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
