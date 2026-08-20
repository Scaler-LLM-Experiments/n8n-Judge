import { auth } from '../../../../../auth';
import { prisma } from '@judge/db';
import {
  attemptsFromTrace,
  scoreSession,
  phaseBreakdown,
  scoreBand,
  problemComplexity,
} from '@judge/engine';
import { MODELS, structuredCall, llmConfigured, buildGradingPrompt, DEFAULT_RUBRIC_SYSTEM_PROMPT } from '@judge/llm';
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

  // `?narrative=0` returns the score and stops, without calling Claude.
  //
  // The score is arithmetic over this session's own trace — tens of milliseconds —
  // while the words take about thirteen seconds. Blocking the whole Result screen on
  // the slower half meant a learner who had just finished stared at a loader with
  // their marks already computed and sitting in the database. The screen now asks
  // twice: once for the number, which paints immediately, then again for the words.
  const wantsNarrative = new URL(req.url).searchParams.get('narrative') !== '0';

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

  const rubric = await prisma.rubricVersion.findFirst({
    orderBy: [{ rubric: { createdAt: 'asc' } }, { version: 'desc' }],
    select: { id: true, systemPrompt: true },
  });

  // Persist the SCORE before going anywhere near Claude.
  //
  // It used to be written only inside the Claude-succeeded branch, so a session
  // graded without an API key — or with a failed call — kept its score on screen
  // and stored nothing. Both databases had zero GradingReport rows as a result,
  // which means analytics had no scores to average. The number is engine
  // arithmetic and always valid; the narrative is the optional part.
  //
  // One row per session, updated rather than appended: reaching the Result screen
  // twice (a reload is enough) would otherwise double-count that learner in every
  // average.
  const reportRow = rubric ? await upsertReport(sessionId, rubric.id, score.total) : null;
  if (!rubric) {
    console.error('[report] no RubricVersion exists — score not persisted. Run `npm run db:seed:rubric`.');
  }

  // ---- the words: Claude, over the same replayed decisions ------------------
  // No key configured is a normal state, not an error: the score is the part the
  // learner cannot do without, so serve it and let the UI omit the narrative.
  // The score half is done and persisted. Hand it back now if that is all that was
  // asked for — `narrative_pending` tells the screen the words are still coming, so
  // it renders a "writing this up" line rather than the missing-narrative notice.
  if (!wantsNarrative) {
    return Response.json({ ...scorePayload, report: null, reason: 'narrative_pending' });
  }

  if (!llmConfigured()) {
    return Response.json({ ...scorePayload, report: null, reason: 'llm_unconfigured' });
  }

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
      // A learner is watching a loader for the whole of this call, so both knobs are
      // set for latency. `low` effort because the hard thinking already happened —
      // the score is arithmetic and the trace arrives pre-summarised, leaving short
      // writing over a small input. `maxTokens` down from 16000 because the report is
      // a dozen short strings: the old ceiling let thinking sprawl, and with adaptive
      // thinking `max_tokens` bounds thinking AND text together. 3000 leaves room to
      // finish the JSON — going much lower risks a truncated object and a parse error,
      // which costs the narrative entirely.
      effort: 'low',
      maxTokens: 3000,
    });

    // Fill in the narrative on the row that already holds the score.
    if (reportRow) {
      await prisma.gradingReport.update({
        where: { id: reportRow.id },
        data: {
          status: 'SUCCEEDED',
          reportJson: data as unknown as object,
          promptTokens: usage.inputTokens,
          completionTokens: usage.outputTokens,
          completedAt: new Date(),
        },
      });
    }

    return Response.json({ ...scorePayload, report: data });
  } catch (err) {
    // A failed narrative must never cost the learner their score — which is
    // already stored, so record why the words are missing and move on.
    console.error('[report] grading call failed', err);
    if (reportRow) {
      await prisma.gradingReport
        .update({
          where: { id: reportRow.id },
          data: { status: 'FAILED', error: String(err).slice(0, 500) },
        })
        .catch(() => {});
    }
    return Response.json({ ...scorePayload, report: null, reason: 'llm_failed' });
  }
}

/**
 * One grading report per session, created on first sight and updated after.
 *
 * There is no unique index on sessionId to upsert against, and adding one would
 * block M4's "re-grade with a new rubric" (which wants a second row on purpose).
 * So: find, then update or create. `status: QUEUED` means the score is stored and
 * the narrative has not been written yet — which is exactly the state a session
 * graded without an API key is in.
 */
async function upsertReport(sessionId: string, rubricVersionId: string, understandingScore: number) {
  const existing = await prisma.gradingReport.findFirst({
    where: { sessionId, rubricVersionId },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  if (existing) {
    return prisma.gradingReport.update({
      where: { id: existing.id },
      data: { understandingScore },
      select: { id: true },
    });
  }

  return prisma.gradingReport.create({
    data: { sessionId, rubricVersionId, status: 'QUEUED', understandingScore },
    select: { id: true },
  });
}
