import { useCallback, useState } from 'react';
import { saveFeedback } from './feedback';

// The rating a learner gives the whole challenge, held in ONE place so the same
// answer can be collected in two.
//
// It is asked for twice: inside the grading loader, while the score is being put
// together, and again on the Result screen for anyone who did not answer during
// the wait. Both render the same widget against this state, so a star clicked in
// the loader is still there — and still theirs — on the report.
//
// Every write goes out immediately. A star click is a complete answer on its own:
// most learners never type a word, and one who clicks four stars and closes the
// tab has still told us something. The comment is a bonus that arrives later, on
// Send or on blur, and updates the same row.
export function useExperienceRating({ sessionId, problemId }) {
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  // Whether the comment box has focus. The Result screen does not care; the
  // loader does — it must not vanish out from under someone mid-sentence.
  const [commentFocused, setCommentFocused] = useState(false);

  const persist = useCallback(
    (stars, text, isSubmitted) => {
      // Fire-and-forget: it writes localStorage synchronously, POSTs when there
      // is a session, and cannot throw into the caller.
      void saveFeedback({
        sessionId: sessionId ?? null,
        attemptKey: problemId ?? 'preview',
        problemId: problemId ?? 'preview',
        rating: stars,
        comment: text,
        submitted: isSubmitted,
      });
    },
    [sessionId, problemId]
  );

  const onRate = useCallback(
    (n) => {
      setRating(n);
      // Immediately, before any comment exists. This is the whole point.
      persist(n, comment, submitted);
    },
    [comment, submitted, persist]
  );

  const onCommentChange = useCallback((v) => {
    setComment(v);
    // Editing invalidates the "saved" confirmation until they send again.
    setSubmitted(false);
  }, []);

  const onSubmit = useCallback(() => {
    if (rating == null || !comment.trim()) return;
    setSubmitted(true);
    persist(rating, comment, true);
  }, [rating, comment, persist]);

  const onCommentFocusChange = useCallback(
    (focused) => {
      setCommentFocused(focused);
      // On blur, keep a typed-but-unsent draft: leaving the box with words in it
      // should not throw them away, and the handoff from loader to report is
      // exactly when that happens.
      if (!focused && rating != null && comment.trim() && !submitted) {
        persist(rating, comment, false);
      }
    },
    [rating, comment, submitted, persist]
  );

  return {
    // Spread straight onto <ExperienceRating />.
    props: { rating, comment, submitted, onRate, onCommentChange, onSubmit, onCommentFocusChange },
    /** True while they are typing — the loader holds itself open on this. */
    commentFocused,
    /** Whether anything has been given yet, so the report can stop asking. */
    answered: rating != null,
  };
}
