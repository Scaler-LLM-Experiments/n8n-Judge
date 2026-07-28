import React, { useCallback, useEffect, useState } from 'react';
import { AsyncGate } from '../components/AsyncGate.jsx';

// The admin dashboard: Overview, Cases, Completion, Learners, and a read-only
// timeline of any single attempt.
//
// Layout follows the reference dashboard; the skin follows Judge's design system
// (light surfaces, 1px hairlines, zero radius on chrome, brand blue) rather than
// the reference's dark theme — one product should not have two visual languages.
//
// Every number here is server-computed. Nothing is derived in the browser, so a
// panel can never quietly disagree with the database.

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'cases', label: 'Cases' },
  { key: 'completion', label: 'Completion' },
  { key: 'learners', label: 'Learners' },
];

const scoreColor = (n) =>
  n == null ? 'var(--fg-3)' : n >= 85 ? 'var(--status-success)' : n >= 70 ? 'var(--brand-primary)' : n >= 50 ? 'var(--status-warning)' : 'var(--status-danger)';

const BAND_COLOR = {
  strong: 'var(--status-success)',
  solid: 'var(--brand-primary)',
  developing: 'var(--status-warning)',
  'needs-another-pass': 'var(--status-danger)',
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '—';
const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

export function AdminDashboard() {
  const load = useCallback(async () => {
    const res = await fetch('/api/admin/analytics', { cache: 'no-store' });
    if (res.status === 403) throw new Error('This page is for admins. Ask for your account to be promoted.');
    if (!res.ok) throw new Error(`Could not load analytics (${res.status})`);
    return res.json();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-0)' }}>
      <AsyncGate load={load} label="Loading analytics…">
        {(data) => <Dashboard data={data} />}
      </AsyncGate>
    </div>
  );
}

function Dashboard({ data }) {
  const [tab, setTab] = useState('overview');
  const [openSession, setOpenSession] = useState(null);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* sidebar */}
      <aside style={{ width: 208, flex: 'none', borderRight: '1px solid var(--border-subtle)', padding: '24px 0', background: 'var(--surface-1)' }}>
        <div style={{ padding: '0 20px 20px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
          Judge · Admin
        </div>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '9px 20px', border: 'none',
                borderLeft: `2px solid ${active ? 'var(--brand-primary)' : 'transparent'}`,
                background: active ? 'var(--brand-blue-50, rgba(0,85,255,0.05))' : 'transparent',
                color: active ? 'var(--brand-primary)' : 'var(--fg-2)',
                fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: active ? 700 : 500, cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          );
        })}
        <div style={{ padding: '20px', marginTop: 8, fontSize: 11, color: 'var(--fg-3)', lineHeight: 1.6 }}>
          Updated {fmtTime(data.generatedAt)}
        </div>
      </aside>

      <main style={{ flex: 1, padding: 28, minWidth: 0 }}>
        {tab === 'overview' ? <Overview data={data} /> : null}
        {tab === 'cases' ? <Cases rows={data.cases} /> : null}
        {tab === 'completion' ? <Completion funnel={data.funnel} /> : null}
        {tab === 'learners' ? <Learners rows={data.learners} onOpen={setOpenSession} /> : null}
      </main>

      {openSession ? <SessionDrawer userId={openSession} onClose={() => setOpenSession(null)} /> : null}
    </div>
  );
}

// ---------------------------------------------------------------- primitives

function Panel({ title, subtitle, children, style }) {
  return (
    <section style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface-1)', ...style }}>
      {title ? (
        <header style={{ padding: '13px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>{title}</div>
          {subtitle ? <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>{subtitle}</div> : null}
        </header>
      ) : null}
      <div style={{ padding: 16 }}>{children}</div>
    </section>
  );
}

function Tile({ label, value, hint, color }) {
  return (
    <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface-1)', padding: '16px 18px' }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display, inherit)', fontSize: 30, fontWeight: 700, lineHeight: 1.15, marginTop: 6, color: color ?? 'var(--fg-1)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {hint ? <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 2 }}>{hint}</div> : null}
    </div>
  );
}

function Bar({ value, max, color, height = 6 }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ height, background: 'var(--surface-2)', flex: 1, minWidth: 40 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color }} />
    </div>
  );
}

function Th({ children, align = 'left' }) {
  return (
    <th style={{ textAlign: align, padding: '8px 10px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  );
}
function Td({ children, align = 'left', mono }) {
  return (
    <td style={{ textAlign: align, padding: '10px', fontSize: 13, color: 'var(--fg-1)', borderBottom: '1px solid var(--border-subtle)', fontVariantNumeric: mono ? 'tabular-nums' : undefined }}>
      {children}
    </td>
  );
}

// ---------------------------------------------------------------- overview

function Overview({ data }) {
  const { overview, cases, funnel } = data;
  const maxBand = Math.max(1, ...overview.scoreBands.map((b) => b.count));
  const scored = overview.scoreBands.reduce((n, b) => n + b.count, 0);

  return (
    <>
      <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>Overview</h1>
      <p style={{ margin: '0 0 22px', fontSize: 13.5, color: 'var(--fg-2)' }}>
        Activity across all challenges, learners and attempts.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 14 }}>
        <Tile label="Learners" value={overview.totalLearners} />
        <Tile label="Attempts" value={overview.totalAttempts} />
        <Tile label="Completed" value={overview.completedAttempts} hint={`${overview.totalAttempts ? Math.round((overview.completedAttempts / overview.totalAttempts) * 100) : 0}% of attempts`} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 22 }}>
        <Tile label="Unfinished" value={overview.inFlight} hint="Started, not completed" />
        <Tile label="Active last 7 days" value={overview.activeLast7Days} hint="Learners" />
        <Tile label="Average score" value={overview.avgScore ?? '—'} color={scoreColor(overview.avgScore)} hint={scored ? `${scored} scored attempts` : 'no scores yet'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, marginBottom: 22 }}>
        <Panel title="Score bands" subtitle="Completed attempts, by how the score reads">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {overview.scoreBands.map((b) => (
              <div key={b.band} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 132, flex: 'none', fontSize: 13, color: 'var(--fg-1)' }}>{b.label}</span>
                <Bar value={b.count} max={maxBand} color={BAND_COLOR[b.band]} />
                <span style={{ width: 34, textAlign: 'right', fontSize: 13, color: 'var(--fg-2)', fontVariantNumeric: 'tabular-nums' }}>{b.count}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="How far attempts get" subtitle="Share of all attempts reaching each stage">
          <FunnelBars funnel={funnel} compact />
        </Panel>
      </div>

      <Panel title="Challenges" subtitle="Ordered by attempts">
        <CaseTable rows={cases} />
      </Panel>
    </>
  );
}

// ---------------------------------------------------------------- cases

function CaseTable({ rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <Th>Challenge</Th>
            <Th>Tracks</Th>
            <Th>Level</Th>
            <Th align="right">Decisions</Th>
            <Th align="right">Attempts</Th>
            <Th align="right">Learners</Th>
            <Th align="right">Unfinished</Th>
            <Th align="right">Avg score</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.slug}>
              <Td>
                <span style={{ fontWeight: 600 }}>{c.title}</span>
              </Td>
              <Td>
                <span style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>{c.tracks.join(' · ') || '—'}</span>
              </Td>
              <Td>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--fg-2)', border: '1px solid var(--border-subtle)', padding: '1px 6px' }}>
                  {c.level}
                </span>
              </Td>
              <Td align="right" mono>{c.decisions}</Td>
              <Td align="right" mono>{c.attempts}</Td>
              <Td align="right" mono>{c.learners}</Td>
              <Td align="right" mono>{c.inFlight}</Td>
              <Td align="right" mono>
                <span style={{ color: scoreColor(c.avgScore), fontWeight: 700 }}>{c.avgScore ?? '—'}</span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cases({ rows }) {
  return (
    <>
      <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>Challenges</h1>
      <p style={{ margin: '0 0 22px', fontSize: 13.5, color: 'var(--fg-2)' }}>
        Level is derived from how many decisions a challenge asks for, so it stays true as content changes.
      </p>
      <Panel><CaseTable rows={rows} /></Panel>
    </>
  );
}

// ---------------------------------------------------------------- completion

function FunnelBars({ funnel, compact }) {
  const first = funnel[0]?.reached || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 11 : 16 }}>
      {funnel.map((s, i) => {
        const prev = i > 0 ? funnel[i - 1].reached : null;
        const dropped = prev != null ? prev - s.reached : 0;
        return (
          <div key={s.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: compact ? 108 : 140, flex: 'none', fontSize: 13, color: 'var(--fg-1)' }}>{s.label}</span>
              <Bar value={s.reached} max={first} color="var(--brand-primary)" height={compact ? 6 : 10} />
              <span style={{ width: 84, flex: 'none', textAlign: 'right', fontSize: 13, color: 'var(--fg-2)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                {s.reached} · {s.pct}%
              </span>
            </div>
            {!compact && dropped > 0 ? (
              <div style={{ marginLeft: 152, marginTop: 4, fontSize: 11.5, color: 'var(--status-danger)' }}>
                −{dropped} left here
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function Completion({ funnel }) {
  const total = funnel[0]?.reached ?? 0;
  const finished = funnel[funnel.length - 1]?.reached ?? 0;
  const biggestDrop = funnel.reduce((worst, s, i) => {
    if (i === 0) return worst;
    const dropped = funnel[i - 1].reached - s.reached;
    return !worst || dropped > worst.dropped ? { label: s.label, dropped } : worst;
  }, null);

  return (
    <>
      <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>Completion</h1>
      <p style={{ margin: '0 0 22px', fontSize: 13.5, color: 'var(--fg-2)' }}>
        Where attempts stop. Built from the stages learners actually reached, not from where a session was last saved.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 22 }}>
        <Tile label="Attempts started" value={total} />
        <Tile label="Reached the result" value={finished} hint={`${total ? Math.round((finished / total) * 100) : 0}% finished`} />
        <Tile
          label="Biggest drop-off"
          value={biggestDrop ? `−${biggestDrop.dropped}` : '—'}
          color="var(--status-danger)"
          hint={biggestDrop ? `entering ${biggestDrop.label}` : undefined}
        />
      </div>

      <Panel title="Stage by stage">
        <FunnelBars funnel={funnel} />
      </Panel>
    </>
  );
}

// ---------------------------------------------------------------- learners

function Learners({ rows, onOpen }) {
  const [q, setQ] = useState('');
  const filtered = q.trim()
    ? rows.filter((r) => r.email.toLowerCase().includes(q.trim().toLowerCase()))
    : rows;

  return (
    <>
      <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>Learners</h1>
      <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--fg-2)' }}>
        Select a learner to see each attempt, step by step.
      </p>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by email…"
        style={{ width: 300, maxWidth: '100%', boxSizing: 'border-box', border: '1px solid var(--border-strong)', background: 'var(--surface-1)', padding: '8px 11px', fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--fg-1)', marginBottom: 14 }}
      />

      <Panel subtitle={`${filtered.length} of ${rows.length}`}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th>Learner</Th>
                <Th>Track</Th>
                <Th align="right">Attempts</Th>
                <Th align="right">Completed</Th>
                <Th align="right">Avg score</Th>
                <Th align="right">Last active</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <Td>{l.email}</Td>
                  <Td><span style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>{l.program ?? '—'}</span></Td>
                  <Td align="right" mono>{l.attempts}</Td>
                  <Td align="right" mono>{l.completed}</Td>
                  <Td align="right" mono>
                    <span style={{ color: scoreColor(l.avgScore), fontWeight: 700 }}>{l.avgScore ?? '—'}</span>
                  </Td>
                  <Td align="right" mono>{fmtDate(l.lastActive)}</Td>
                  <Td align="right">
                    {l.attempts > 0 ? (
                      <button
                        type="button"
                        onClick={() => onOpen(l.id)}
                        style={{ border: '1px solid var(--border-strong)', background: 'var(--surface-1)', padding: '3px 9px', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--fg-1)', cursor: 'pointer' }}
                      >
                        Attempts
                      </button>
                    ) : null}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

// ---------------------------------------------------------------- timeline

const EVENT_LABEL = {
  decision: 'Answered',
  screen_transition: 'Moved to',
  phase_transition: 'Build stage',
  ndv_open: 'Opened node',
  graph_mutation: 'Canvas',
  probe_shown: 'Asked about',
  run_result: 'Ran the flow',
  ask_ai_turn: 'Ask AI',
  session_complete: 'Finished',
};

function describe(e) {
  const p = e.payload ?? {};
  switch (e.type) {
    case 'decision':
      return `${p.kind} · ${p.id} — ${p.correct ? 'correct' : 'wrong'} (try ${p.attempt ?? 1})`;
    case 'screen_transition':
      return `${p.from} → ${p.to}`;
    case 'phase_transition':
      return p.label ?? p.phaseId ?? '';
    case 'ndv_open':
    case 'probe_shown':
      return p.nodeType ?? '';
    case 'graph_mutation':
      return `${p.op}${p.nodeType ? ` · ${p.nodeType}` : ''}`;
    case 'run_result':
      return p.validation?.allPassed ? 'all checks passed' : 'checks failed';
    case 'ask_ai_turn':
      return `${p.role}: ${String(p.content ?? '').slice(0, 90)}`;
    default:
      return '';
  }
}

function SessionDrawer({ userId, onClose }) {
  const [sessions, setSessions] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [timeline, setTimeline] = useState(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/admin/learners/${userId}/sessions`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (live) setSessions(d); })
      .catch(() => { if (live) setSessions([]); });
    return () => { live = false; };
  }, [userId]);

  useEffect(() => {
    if (!openId) return setTimeline(null);
    let live = true;
    setTimeline('loading');
    fetch(`/api/admin/sessions/${openId}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (live) setTimeline(d); })
      .catch(() => { if (live) setTimeline(null); });
    return () => { live = false; };
  }, [openId]);

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', display: 'flex', justifyContent: 'flex-end', zIndex: 60 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 620, maxWidth: '100%', background: 'var(--surface-0)', borderLeft: '1px solid var(--border-strong)', overflowY: 'auto' }}
      >
        <header style={{ position: 'sticky', top: 0, background: 'var(--surface-1)', borderBottom: '1px solid var(--border-subtle)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>
            {openId ? 'Attempt timeline' : 'Attempts'}
          </div>
          {openId ? (
            <button type="button" onClick={() => setOpenId(null)} style={{ border: '1px solid var(--border-strong)', background: 'var(--surface-1)', padding: '3px 9px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              Back
            </button>
          ) : null}
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 18, lineHeight: 1, cursor: 'pointer', color: 'var(--fg-3)' }}>
            ×
          </button>
        </header>

        <div style={{ padding: 18 }}>
          {!openId ? (
            sessions === null ? (
              <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>Loading…</div>
            ) : sessions.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>No attempts.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setOpenId(s.id)}
                    style={{ textAlign: 'left', border: '1px solid var(--border-subtle)', background: 'var(--surface-1)', padding: '11px 13px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)' }}>{s.problem}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(s.score) }}>{s.score ?? '—'}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 3 }}>
                      {s.status === 'COMPLETED' ? 'Completed' : 'Unfinished'} · {fmtDate(s.startedAt)} · {s.events} events
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : timeline === 'loading' || timeline === null ? (
            <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>Loading…</div>
          ) : (
            <>
              <div style={{ fontSize: 12.5, color: 'var(--fg-2)', marginBottom: 14, lineHeight: 1.6 }}>
                <div><strong>{timeline.problem}</strong> · {timeline.learner}</div>
                <div>
                  {timeline.status === 'COMPLETED' ? 'Completed' : 'Unfinished'} · started {fmtDate(timeline.startedAt)} {fmtTime(timeline.startedAt)}
                  {timeline.score != null ? ` · score ${timeline.score}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {timeline.events.map((e) => (
                  <div key={e.seq} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ width: 62, flex: 'none', fontSize: 11, color: 'var(--fg-3)', fontVariantNumeric: 'tabular-nums' }}>{fmtTime(e.at)}</span>
                    <span
                      title={e.source === 'server' ? 'Recorded by the server (a graded answer)' : 'Reported by the browser'}
                      style={{ width: 8, height: 8, flex: 'none', marginTop: 5, background: e.source === 'server' ? 'var(--brand-primary)' : 'var(--border-strong)' }}
                    />
                    <span style={{ width: 96, flex: 'none', fontSize: 11.5, fontWeight: 700, color: 'var(--fg-2)' }}>
                      {EVENT_LABEL[e.type] ?? e.type}
                    </span>
                    <span style={{ flex: 1, fontSize: 12.5, color: 'var(--fg-1)', wordBreak: 'break-word' }}>{describe(e)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
