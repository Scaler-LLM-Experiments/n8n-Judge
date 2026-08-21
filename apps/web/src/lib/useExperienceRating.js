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
    /**
     * Mid-sentence: the box has focus, there are words in it, and they have not
     * been sent. This is what the loader may hold itself open on, and all three
     * parts matter. Focus alone held the loader open forever, because focus is
     * sticky: a learner who clicked into an empty box and never clicked out sent
     * no blur event, so nothing ever released it. `submitted` is in here for the
     * same reason — a textarea keeps focus after the Send button is clicked, so
     * holding on focus alone kept the loader up after they had fully answered.
     */
    writing: commentFocused && !submitted && comment.trim() !== '',
    /** Whether anything has been given yet, so the report can stop asking. */
    answered: rating != null,
    /**
     * Whether the comment has been SENT. The report keeps asking until it has:
     * a bare star click is a complete answer for scoring us, but the comment is
     * the half that says why, and the loader closes on a timer shorter than a
     * sentence. Deliberately keyed on `submitted` rather than on "has any text",
     * so an unsent draft is carried onto the report with its Send button still
     * there, instead of disappearing with the loader.
     */
    complete: submitted,
  };
}
