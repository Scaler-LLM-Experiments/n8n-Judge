import React, { useCallback, useState } from 'react';
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
//
// Cover band height is 65% of a full 21:9 frame (same width, shorter strip).
// Art is still generated 21:9 and centre-cropped with object-fit: cover.
// See scripts/generate-covers.mjs for the shared style.
// aspect-ratio width/height = 21 / (9 * 0.65) = 21 / 5.85
const COVER_ASPECT = '21 / 5.85';

function Cover({ problem, Icon }) {
  const art = problem.coverImage;
  return (
    <div
      style={{
        aspectRatio: COVER_ASPECT,
        background: 'var(--surface-soft-blue)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderBottom: '1px solid var(--border-subtle)',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {art?.src ? (
        <img
          src={art.src}
          alt={art.alt || ''}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />
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

function ContinueCard({ resume, onResume, onRestart }) {
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
        <div style={{ display: 'flex', gap: 10, flex: 'none' }}>
          <Button variant="outline" size="lg" onClick={() => onRestart(resume)}>
            Start over
          </Button>
          <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} weight="bold" />} onClick={() => onResume(resume)}>
            Resume
          </Button>
        </div>
      </div>
    </div>
  );
}

// Landing page: pick a challenge, each launches its own build journey.
export function HomeScreen({ problems, onSelect, resume, onResume, onRestart }) {
  // Wave three times, then rest on idle — a permanent hello loop on the catalogue
  // reads as a broken GIF rather than a greeting.
  const [heroClip, setHeroClip] = useState('hello');
  const onHeroDone = useCallback(() => setHeroClip('idle'), []);

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--surface-0)' }}>
      {/* Home is outside any problem journey — no activeStage/problem to pass, and
          TopBar itself hides the stage pills and problem-scoped buttons when absent. */}
      <TopBar />

      {/* Wider than the old 940, so three cards fit a row while each still holds a
          two-line description. Narrowing the margin alone would not do it: the
          constraint is the per-card column width, and at 940/3 the copy wrapped to
          four lines — the same failure that pushed this to two-up in the first place. */}
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '12px 56px 64px' }}>
        {/* hero */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{ width: 96, height: 96 }}>
            <MascotPlayer
              clip={heroClip}
              once={false}
              times={heroClip === 'hello' ? 3 : undefined}
              onceDone={onHeroDone}
              pulse={false}
            />
          </div>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brand-primary)', fontWeight: 700 }}>Agent Builder · Judge</div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 38, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.15, margin: 0 }}>n8n Node Simulator</h1>
          <p style={{ fontSize: 15, color: 'var(--fg-2)', lineHeight: 1.6, maxWidth: 540, margin: 0 }}>
          Pick a challenge, wire it up on an n8n-style canvas, and test it against real cases - with Iris guiding you the whole way.
          </p>
        </div>

        {/* An attempt already in progress comes first: it is the one thing on this
            screen the learner has already invested in. */}
        {resume && onResume && onRestart ? <ContinueCard resume={resume} onResume={onResume} onRestart={onRestart} /> : null}

        {/* problem cards */}
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-2)', fontWeight: 700, marginBottom: 12 }}>Choose a challenge</div>
        {/* Three up. The 360px floor is what picks the count: at this container's
            ~1248px of content, four columns would need 1520 and two would waste half
            the row, so it lands on three at ~403px each — enough for the two-line
            description — and still collapses to 2-up / 1-up as the viewport narrows,
            rather than overflowing.

            `auto-fill`, NOT `auto-fit`. They differ only when the row is
            underfull, which is exactly the catalogue's current state: auto-fit
            COLLAPSES the empty tracks, so a single problem stretched to the full
            1248px and its 2:1 cover art became a billboard. auto-fill keeps the
            three tracks, so one card sits in the first one at a third of the
            width and the row stays left-aligned. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {/* Card order, top to bottom: cover, DIFFICULTY · TIME, title,
              description, CTA. The description is the authored two-line `brief`,
              so it cannot push the button out of line with the card beside it. */}
          {problems.map((p) => {
            const Icon = ICONS[p.id] || Robot;
            const hasSavedAttempt = resume?.slug === (p.slug ?? p.id);
            return (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}>
                <Cover problem={p} Icon={Icon} />
                {/* Vertical padding only for the extra height. The horizontal 20 is
                    load-bearing: at 22 the column lost 4px and the two-line clamp cut
                    the authored `brief` mid-sentence ("send the right…"). A taller card
                    must not come out of the description's width. */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '22px 20px 24px', flex: 1 }}>
                  <MetaLine level={p.difficulty} minutes={p.estimatedMinutes} />
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg-1)', marginBottom: 6 }}>{p.title}</div>
                    {/* Clamped to two lines as a floor under the authoring rule, not
                        instead of it: `brief` is capped at 125 characters by the schema,
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
                  {/* `marginTop: auto` alone is only a MAXIMUM gap: it eats the card's
                      slack, so with cards of equal height (or a single card, which is
                      the catalogue today) there is no slack to eat and the CTA sits at
                      the container's 10px gap, right under the description. The wrapper
                      keeps the bottom alignment across a row of uneven cards AND
                      guarantees the breathing room when the row is even.

                      data-problem is how smoke enters a SPECIFIC challenge. Without it
                      the test could only click the first card, so `?problem=<id>`
                      silently re-tested the first problem's Understand screen. */}
                  <div style={{ marginTop: 'auto', paddingTop: 18 }}>
                    {hasSavedAttempt ? (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <Button variant="outline" size="md" data-problem={p.id} onClick={() => onRestart(p)} style={{ flex: 1 }}>
                          Start over
                        </Button>
                        <Button variant="primary" size="md" iconRight={<ArrowRight size={16} weight="bold" />} onClick={() => onResume(resume)} style={{ flex: 1 }}>
                          Resume
                        </Button>
                      </div>
                    ) : (
                      <Button variant="primary" size="md" data-problem={p.id} iconRight={<ArrowRight size={16} weight="bold" />} onClick={() => onSelect(p)} style={{ width: '100%', justifyContent: 'center' }}>
                        Start
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
