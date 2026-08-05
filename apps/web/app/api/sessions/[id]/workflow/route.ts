import { auth } from '../../../../../auth';
import { prisma } from '@judge/db';
import {
  attemptsFromTrace,
  scoreSession,
  exportN8nWorkflow,
  validateN8nWorkflow,
  serializeWorkflow,
  workflowFileName,
} from '@judge/engine';
import { getVersionById } from '../../../../../src/server/problemVersions';

// The reward for doing well: the case's reference flow as a file that imports
// into real n8n.
//
// ---------------------------------------------------------------------------
// Why this is server-side and score-gated here rather than in the UI
// ---------------------------------------------------------------------------
// A "download" button that the browser decides to show is a suggestion, not a
// gate — anyone can call the endpoint directly. The threshold is enforced here,
// against a score recomputed from this session's own recorded TraceEvents, for
// the same reason the Result screen's number is: the browser's grading store is
// not evidence.
//
// The score is RECOMPUTED rather than read from `GradingReport.understandingScore`
// deliberately. That row only exists once a RubricVersion has been seeded, and a
// missing rubric is a documented silent failure — so reading it would make the
// download quietly unavailable on a correctly-working instance. Replaying the
// trace has no such dependency and is the same arithmetic the Result screen shows.
//
// The workflow is generated from the pinned `ProblemVersion`, so a learner always
// gets the flow for the content they were actually graded against, even if the
// case has been re-published since.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Percent of 100 a learner must reach before the flow is offered. */
export const WORKFLOW_UNLOCK_SCORE = 80;

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authed = await auth();
  if (!authed?.user?.id) return Response.json({ error: 'unauthenticated' }, { status: 401 });

  const { id: sessionId } = await ctx.params;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true, problemVersionId: true },
  });
  if (!session) return Response.json({ error: 'not_found' }, { status: 404 });
  // Another learner's session would otherwise be a way to read a case's answer
  // key without earning it.
  if (session.userId !== authed.user.id) return Response.json({ error: 'forbidden' }, { status: 403 });

  const version = await getVersionById(session.problemVersionId);
  if (!version) return Response.json({ error: 'version_missing' }, { status: 500 });
  const problem = version.data as Record<string, unknown>;

  const events = await prisma.traceEvent.findMany({
    where: { sessionId },
    orderBy: { seq: 'asc' },
    select: { type: true, payload: true },
  });
  const trace = events.map((e) => ({ type: e.type, payload: e.payload as Record<string, unknown> }));
  const score = scoreSession(problem, attemptsFromTrace(trace));

  if (score.total < WORKFLOW_UNLOCK_SCORE) {
    return Response.json(
      { error: 'locked', required: WORKFLOW_UNLOCK_SCORE, total: score.total },
      { status: 403 }
    );
  }

  const { workflow, unsupported, warnings } = exportN8nWorkflow(problem);
  if (!workflow) {
    // A case whose node types have no export spec. Better a clear 501 than a file
    // that imports into n8n and does not work.
    console.error(`[workflow] cannot export ${problem.id}: ${unsupported.join(', ') || warnings.join('; ')}`);
    return Response.json({ error: 'not_exportable', unsupported }, { status: 501 });
  }

  const issues = validateN8nWorkflow(workflow);
  if (issues.length) {
    // Never hand over a file we know is malformed; it would fail in the learner's
    // n8n and look like their mistake.
    console.error(`[workflow] ${problem.id} failed validation: ${issues.join('; ')}`);
    return Response.json({ error: 'invalid_workflow', issues }, { status: 500 });
  }

  const filename = workflowFileName(problem);
  return new Response(serializeWorkflow(workflow), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      // Private: this is a case's reference solution, so it must not sit in a
      // shared cache — the same reasoning as the voice clips.
      'cache-control': 'private, no-store',
    },
  });
}
