// ═════════════════════════════════════════════════════════════════════
// Client transport for the experience rating (stars + optional comment).
//
// Ported from the for-emergent simulator, whose design holds here for the same
// reason: this is DELIBERATELY decoupled from grading. A rating is not a
// decision — it is never written to `TraceEvent`, never replayed by the rubric,
// and cannot change a score. Every write lands in localStorage immediately (so
// nothing is lost offline, or on the dev hash routes that run without a
// session) and is POSTed best-effort. `saveFeedback` is fire-and-forget and can
// NEVER throw into the caller, because collecting feedback must not be able to
// break the Result screen.
// ═════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'judge-feedback-v1';

export interface FeedbackRecord {
  /** Session id when there is one; else the per-attempt key (local only). */
  key: string;
  sessionId: string | null;
  problemId: string;
  rating: number;
  comment: string;
  /** true once the learner pressed Send (vs a bare star click). */
  submitted: boolean;
  savedAt: number;
}

function readAll(): FeedbackRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Upsert the local copy by key (one record per attempt), newest wins. */
function writeLocal(rec: FeedbackRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const all = readAll().filter((r) => r.key !== rec.key);
    all.push(rec);
    // Feedback records are tiny; keep a generous recent window.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(-200)));
  } catch {
    // Storage full / disabled: the server POST below is the other copy.
  }
}

export interface SaveFeedbackInput {
  sessionId: string | null;
  attemptKey: string;
  problemId: string;
  rating: number;
  comment: string;
  submitted: boolean;
}

/**
 * Persist a rating (+ optional comment). Writes localStorage synchronously,
 * then fires a best-effort server POST when there is a session. Resolves to
 * void and never rejects.
 */
export async function saveFeedback(input: SaveFeedbackInput): Promise<void> {
  const rec: FeedbackRecord = {
    key: input.sessionId ?? input.attemptKey,
    sessionId: input.sessionId,
    problemId: input.problemId,
    rating: input.rating,
    comment: input.comment,
    submitted: input.submitted,
    savedAt: Date.now(),
  };
  writeLocal(rec);

  // No session (a dev hash route, or a signed-out preview): localStorage is the
  // record. Skip the POST rather than firing a guaranteed 401/404.
  if (!input.sessionId) return;
  try {
    await fetch(`/api/sessions/${input.sessionId}/rating`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The learner may click Next or close the tab in the same breath as the
      // last keystroke; keepalive lets the request outlive the page.
      keepalive: true,
      body: JSON.stringify({ rating: input.rating, comment: input.comment || null }),
    });
  } catch {
    // Offline / server down: the localStorage copy stands.
  }
}

/** The local copy of one attempt's rating, for a screen that remounts. */
export function readFeedback(key: string): FeedbackRecord | null {
  return readAll().find((r) => r.key === key) ?? null;
}
