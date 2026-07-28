import { auth } from '../../../../../auth';
import { prisma } from '@judge/db';
import {
  attemptsFromTrace,
  scoreSession,
  phaseBreakdown,
  scoreBand,
  problemComplexity,
} from '@judge/engine';
import { MODELS, structuredCall, buildGradingPrompt, DEFAULT_RUBRIC_SYSTEM_PROMPT } from '@judge/llm';
import type { GradingReportJson } from '@judge/llm';
import { getVersionById } from '../../../../../src/server/problemVersions';

// The Result screen's data, assembled server-side.
//
// Two halves, deliberately split:
//   the NUMBER   — engine arithmetic replayed from recorded TraceEvents. The
//                  browser's grading store is not consulted at all, so a
//                  fabricated store can no longer reach a fake Report.
//   the WORDS    — Claude, from the same replayed decisions: positives,
//                  negatives, next steps.
//
// If the number came from Claude it could disagree with itself between runs and
// nobody could audit it. If the words came from arithmetic they would be the
// canned strings this replaced. Hence the split.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authed = await auth();
  if (!authed?.user?.id) return Response.json({ error: 'unauthenticated' }, { status: 401 });

  const { id: sessionId } = await ctx.params;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true, problemVersionId: true },
  });
  if (!session) return Response.json({ error: 'not_found' }, { status: 404 });
  if (session.userId !== authed.user.id) return Response.json({ error: 'forbidden' }, { status: 403 });

  const version = await getVersionById(session.problemVersionId);
  if (!version) return Response.json({ error: 'version_missing' }, { status: 500 });
  const problem = version.data as Record<string, unknown>;

  // ---- the number: replay this session's own recorded decisions -------------
  const events = await prisma.traceEvent.findMany({
    where: { sessionId },
    orderBy: { seq: 'asc' },
    select: { type: true, payload: true },
  });
  const trace = events.map((e) => ({ type: e.type, payload: e.payload as Record<string, unknown> }));

  const attempts = attemptsFromTrace(trace);
  const score = scoreSession(problem, attempts);
  const band = scoreBand(score.total);
  const phases = phaseBreakdown(score).map((p) => ({
    key: p.key,
    label: p.label,
    weight: Math.round(p.weight),
    earned: Math.round(p.earned * 10) / 10,
    score: Math.round(p.score),
  }));

  const scorePayload = { total: score.total, band: band.band, definition: band.definition, phases };

  // Reaching the report ends the attempt. This is what keeps "reuse the session
  // in progress" (POST /api/sessions) from handing a learner their previous
  // attempt forever: once completed, the next start opens a fresh row.
  await prisma.session.update({
    where: { id: sessionId },
    data: { status: 'COMPLETED', completedAt: new Date(), currentScreen: 'REPORT' },
  });

  // ---- the words: Claude, over the same replayed decisions ------------------
  // No key configured is a normal state, not an error: the score is the part the
  // learner cannot do without, so serve it and let the UI omit the narrative.
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ ...scorePayload, report: null, reason: 'llm_unconfigured' });
  }

  const rubric = await prisma.rubricVersion.findFirst({
    orderBy: [{ rubric: { createdAt: 'asc' } }, { version: 'desc' }],
    select: { id: true, systemPrompt: true },
  });

  const decisions = trace
    .filter((e) => e.type === 'decision')
    .map((e) => {
      const p = e.payload as Record<string, any>;
      return {
        kind: String(p.kind ?? ''),
        label: String(p.id ?? ''),
        correct: Boolean(p.correct),
        firstTry: Boolean(p.firstTry),
        ...(p.misconception ? { misconception: String(p.misconception) } : {}),
      };
    });

  // Attempts beyond the first, per decision — the signal the rubric grades on.
  const retriesByDecisionId: Record<string, number> = {};
  for (const e of trace) {
    if (e.type !== 'decision') continue;
    const p = e.payload as Record<string, any>;
    const key = String(p.key ?? `${p.kind}:${p.id}`);
    retriesByDecisionId[key] = Math.max(retriesByDecisionId[key] ?? 0, Number(p.attempt ?? 1) - 1);
  }

  // Other challenges, easiest first, so "practise more" can name a real next one
  // and escalate difficulty rather than offering a wall of equal options.
  const others = await prisma.problem.findMany({
    where: { slug: { not: version.slug } },
    select: { slug: true, title: true, versions: { where: { status: 'PUBLISHED' }, orderBy: { version: 'desc' }, take: 1 } },
  });
  const catalog = others
    .filter((o) => o.versions[0])
    .map((o) => ({
      slug: o.slug,
      title: o.title,
      complexity: problemComplexity(o.versions[0]!.data as Record<string, unknown>),
    }))
    .sort((a, b) => a.complexity - b.complexity);

  const { system, user, schema } = buildGradingPrompt(rubric?.systemPrompt ?? DEFAULT_RUBRIC_SYSTEM_PROMPT, {
    problemTitle: String(problem.title ?? version.slug),
    problemStatement: String(problem.statement ?? ''),
    score: {
      total: score.total,
      band: band.band,
      definition: band.definition,
      buckets: score.buckets.map((b) => ({
        key: b.key,
        label: b.label,
        weight: Math.round(b.weight),
        score: Math.round(b.score * 10) / 10,
        itemCount: b.itemCount,
        missed: b.missed,
      })),
    },
    decisions,
    retriesByDecisionId,
    misconceptionLabels: (problem.misconceptionLabels as Record<string, string>) ?? {},
    runOutcome: null,
    timeline: [],
    catalog,
  });

  try {
    const { data, usage } = await structuredCall<GradingReportJson>({
      model: MODELS.grading(),
      system,
      user,
      schema,
    });

    // Persisted so the report is stable on reload and auditable later — it
    // records WHICH rubric version produced these words.
    if (rubric) {
      await prisma.gradingReport.create({
        data: {
          sessionId,
          rubricVersionId: rubric.id,
          status: 'SUCCEEDED',
          understandingScore: score.total,
          reportJson: data as unknown as object,
          promptTokens: usage.inputTokens,
          completionTokens: usage.outputTokens,
        },
      });
    }

    return Response.json({ ...scorePayload, report: data });
  } catch (err) {
    // A failed narrative must never cost the learner their score.
    console.error('[report] grading call failed', err);
    return Response.json({ ...scorePayload, report: null, reason: 'llm_failed' });
  }
}
