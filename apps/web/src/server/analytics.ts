import { prisma } from '@judge/db';
import { problemComplexity, scoreBand } from '@judge/engine';

// Everything the admin dashboard reads.
//
// Aggregated in SQL rather than by pulling rows into Node: there are ~6k trace
// events for 60 demo learners, so a real cohort is in the millions and "fetch
// then count in JavaScript" would stop working quietly and early.
//
// The funnel is computed from `screen_transition` events, NOT from
// Session.currentScreen. currentScreen is only written when a session completes,
// so trusting it would report every unfinished learner as stuck on the first
// screen — which is precisely the number the funnel exists to get right.

const DAY = 86400000;

export interface Overview {
  totalLearners: number;
  totalAttempts: number;
  inFlight: number;
  activeLast7Days: number;
  completedAttempts: number;
  avgScore: number | null;
  scoreBands: Array<{ band: string; label: string; count: number }>;
}

const BAND_LABELS: Record<string, string> = {
  strong: 'Strong',
  solid: 'Solid',
  developing: 'Developing',
  'needs-another-pass': 'Needs another pass',
};
const BAND_ORDER = ['strong', 'solid', 'developing', 'needs-another-pass'];

export async function getOverview(): Promise<Overview> {
  const since = new Date(Date.now() - 7 * DAY);

  const [totalLearners, totalAttempts, inFlight, completedAttempts, activeRows, scores] = await Promise.all([
    prisma.user.count({ where: { role: 'LEARNER' } }),
    prisma.session.count(),
    prisma.session.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.session.count({ where: { status: 'COMPLETED' } }),
    // "Active" means they did something, not merely that a session row exists —
    // a learner who opened the page and left is not active.
    prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(DISTINCT s."userId") AS n
      FROM "Session" s
      WHERE s."startedAt" >= ${since}
         OR EXISTS (SELECT 1 FROM "TraceEvent" t WHERE t."sessionId" = s.id AND t."receivedAt" >= ${since})
    `,
    prisma.gradingReport.findMany({ select: { understandingScore: true } }),
  ]);

  const numeric = scores.map((s) => s.understandingScore).filter((n): n is number => n != null);
  const bandCounts = new Map<string, number>(BAND_ORDER.map((b) => [b, 0]));
  for (const n of numeric) {
    const { band } = scoreBand(n);
    bandCounts.set(band, (bandCounts.get(band) ?? 0) + 1);
  }

  return {
    totalLearners,
    totalAttempts,
    inFlight,
    completedAttempts,
    activeLast7Days: Number(activeRows[0]?.n ?? 0),
    avgScore: numeric.length ? Math.round(numeric.reduce((a, b) => a + b, 0) / numeric.length) : null,
    scoreBands: BAND_ORDER.map((band) => ({ band, label: BAND_LABELS[band], count: bandCounts.get(band) ?? 0 })),
  };
}

export interface CaseRow {
  slug: string;
  title: string;
  tracks: string[];
  level: string;
  decisions: number;
  attempts: number;
  learners: number;
  inFlight: number;
  avgScore: number | null;
}

export async function getCases(): Promise<CaseRow[]> {
  const problems = await prisma.problem.findMany({
    include: {
      versions: { where: { status: 'PUBLISHED' }, orderBy: { version: 'desc' }, take: 1 },
      assignments: { include: { program: true } },
    },
  });

  const stats = await prisma.$queryRaw<
    Array<{ problemId: string; attempts: bigint; learners: bigint; inflight: bigint; avgscore: number | null }>
  >`
    SELECT s."problemId",
           COUNT(*)                                        AS attempts,
           COUNT(DISTINCT s."userId")                      AS learners,
           COUNT(*) FILTER (WHERE s.status = 'IN_PROGRESS') AS inflight,
           AVG(g."understandingScore")                     AS avgscore
    FROM "Session" s
    LEFT JOIN "GradingReport" g ON g."sessionId" = s.id
    GROUP BY s."problemId"
  `;
  const byId = new Map(stats.map((r) => [r.problemId, r]));

  return problems
    .filter((p) => p.versions[0])
    .map((p) => {
      const s = byId.get(p.id);
      // Level is derived from how much the challenge asks for, so no authored
      // difficulty field has to be kept in sync with the content.
      const decisions = problemComplexity(p.versions[0]!.data as Record<string, unknown>);
      return {
        slug: p.slug,
        title: p.title,
        tracks: [...new Set(p.assignments.map((a) => a.program?.key).filter(Boolean))] as string[],
        level: decisions <= 16 ? 'Intro' : decisions <= 26 ? 'Mid' : 'Advanced',
        decisions,
        attempts: Number(s?.attempts ?? 0),
        learners: Number(s?.learners ?? 0),
        inFlight: Number(s?.inflight ?? 0),
        avgScore: s?.avgscore != null ? Math.round(Number(s.avgscore)) : null,
      };
    })
    .sort((a, b) => b.attempts - a.attempts);
}

export interface FunnelStep {
  key: string;
  label: string;
  reached: number;
  /** Percentage of all attempts that got this far. */
  pct: number;
}

/**
 * How far attempts get. Built from screen_transition events, so an attempt counts
 * as reaching a screen only if the learner actually arrived there.
 */
export async function getFunnel(): Promise<FunnelStep[]> {
  const [{ total }] = await prisma.$queryRaw<Array<{ total: bigint }>>`SELECT COUNT(*) AS total FROM "Session"`;
  const attempts = Number(total);

  const rows = await prisma.$queryRaw<Array<{ to: string; n: bigint }>>`
    SELECT payload->>'to' AS "to", COUNT(DISTINCT "sessionId") AS n
    FROM "TraceEvent"
    WHERE type = 'screen_transition'
    GROUP BY payload->>'to'
  `;
  const reachedByScreen = new Map(rows.map((r) => [String(r.to).toLowerCase(), Number(r.n)]));

  // Every attempt starts on Understand, so it is the denominator rather than a
  // measured step.
  const steps = [
    { key: 'statement', label: 'Understand', reached: attempts },
    { key: 'dashboard', label: 'Build', reached: reachedByScreen.get('dashboard') ?? 0 },
    { key: 'eval', label: 'Stress Testing', reached: reachedByScreen.get('eval') ?? 0 },
    { key: 'report', label: 'Result', reached: reachedByScreen.get('report') ?? 0 },
  ];

  return steps.map((s) => ({ ...s, pct: attempts ? Math.round((s.reached / attempts) * 100) : 0 }));
}

export interface LearnerRow {
  id: string;
  email: string;
  program: string | null;
  batch: string | null;
  attempts: number;
  completed: number;
  avgScore: number | null;
  lastActive: string | null;
}

export async function getLearners(limit = 200): Promise<LearnerRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      email: string;
      program: string | null;
      batch: string | null;
      attempts: bigint;
      completed: bigint;
      avgscore: number | null;
      lastactive: Date | null;
    }>
  >`
    SELECT u.id, u.email, p.key AS program, b.name AS batch,
           COUNT(s.id)                                        AS attempts,
           COUNT(s.id) FILTER (WHERE s.status = 'COMPLETED')   AS completed,
           AVG(g."understandingScore")                         AS avgscore,
           MAX(COALESCE(s."completedAt", s."startedAt"))       AS lastactive
    FROM "User" u
    LEFT JOIN "Batch" b ON b.id = u."batchId"
    LEFT JOIN "Program" p ON p.id = b."programId"
    LEFT JOIN "Session" s ON s."userId" = u.id
    LEFT JOIN "GradingReport" g ON g."sessionId" = s.id
    WHERE u.role = 'LEARNER'
    GROUP BY u.id, u.email, p.key, b.name
    ORDER BY lastactive DESC NULLS LAST
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    program: r.program,
    batch: r.batch,
    attempts: Number(r.attempts),
    completed: Number(r.completed),
    avgScore: r.avgscore != null ? Math.round(Number(r.avgscore)) : null,
    lastActive: r.lastactive ? r.lastactive.toISOString() : null,
  }));
}

/** Every attempt by one learner, newest first, for the drill-down. */
export async function getLearnerSessions(userId: string) {
  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    include: {
      problem: { select: { slug: true, title: true } },
      reports: { select: { understandingScore: true, status: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { events: true } },
    },
  });

  return sessions.map((s) => ({
    id: s.id,
    problem: s.problem.title,
    slug: s.problem.slug,
    status: s.status,
    startedAt: s.startedAt.toISOString(),
    completedAt: s.completedAt?.toISOString() ?? null,
    events: s._count.events,
    score: s.reports[0]?.understandingScore ?? null,
  }));
}

/** One attempt, event by event — the read-only session timeline. */
export async function getSessionTimeline(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: { select: { email: true } },
      problem: { select: { title: true, slug: true } },
      reports: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  if (!session) return null;

  const events = await prisma.traceEvent.findMany({
    where: { sessionId },
    orderBy: { seq: 'asc' },
    select: { seq: true, clientSeq: true, type: true, payload: true, clientTs: true },
  });

  return {
    id: session.id,
    learner: session.user.email,
    problem: session.problem.title,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    score: session.reports[0]?.understandingScore ?? null,
    report: session.reports[0]?.reportJson ?? null,
    events: events.map((e) => ({
      seq: e.seq,
      // Which side recorded it: null clientSeq means the server did, which is
      // every graded decision.
      source: e.clientSeq == null ? 'server' : 'client',
      type: e.type,
      at: e.clientTs.toISOString(),
      payload: e.payload,
    })),
  };
}
