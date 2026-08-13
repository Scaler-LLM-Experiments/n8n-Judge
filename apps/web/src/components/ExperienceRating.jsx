import React, { useRef, useState } from 'react';
import { Button } from '../design-system/Button.jsx';

// ═════════════════════════════════════════════════════════════════════
// ExperienceRating — five stars plus an optional written comment on the whole
// challenge. Ported from the for-emergent simulator: same behaviour, same
// wording, same keyboard model, restyled to this app's system (inline CSS
// custom properties, square corners, hairline borders) so it sits on the white
// Result sheet instead of on that app's dark card.
//
// Fully CONTROLLED: the parent owns rating/comment/submitted. That is what lets
// a star click persist the instant it happens, and lets the widget be rendered
// in more than one place without losing what the learner typed.
// ═════════════════════════════════════════════════════════════════════

// The comment prompt follows the rating band, so the question matches how the
// learner actually felt. Plain English — many learners are not native speakers.
export function promptFor(rating) {
  if (rating <= 2) {
    return {
      title: 'We are sorry it was not a good experience. What went wrong, and what happened?',
      placeholder: 'Tell us what went wrong',
    };
  }
  if (rating === 3) {
    return {
      title: 'Thanks for rating. What went well, and what could be better?',
      placeholder: 'What went well, and what could be better',
    };
  }
  return {
    title: 'Great to hear. What did you like the most?',
    placeholder: 'Tell us what you liked the most',
  };
}

export const RATING_WORD = {
  1: 'Poor',
  2: 'Not great',
  3: 'Okay',
  4: 'Good',
  5: 'Loved it',
};

// The star itself is the one place a filled shape is allowed to carry colour:
// `--status-warning` is the system's amber, so nothing here is a raw hex.
export function StarShape({ filled, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill={filled ? 'var(--status-warning)' : 'transparent'}
        stroke={filled ? 'var(--status-warning)' : 'var(--border-strong)'}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExperienceRating({
  variant = 'report',
  rating,
  comment,
  submitted,
  onRate,
  onCommentChange,
  onSubmit,
  // Lets a parent that auto-advances hold still while the comment box is
  // focused, rather than moving the screen out from under a learner mid-sentence.
  onCommentFocusChange,
}) {
  const [hover, setHover] = useState(null);
  const starsRef = useRef([]);

  const starSize = variant === 'overlay' ? 32 : 36;
  const shown = hover ?? rating ?? 0;

  const select = (n) => {
    onRate(n);
    starsRef.current[n - 1]?.focus();
  };

  // Arrow keys move within the group and 1–5 jump straight to a value, so the
  // rating is reachable without a mouse. `radiogroup` + roving tabindex below is
  // what makes that the expected behaviour rather than a surprise.
  const onKeyDown = (e) => {
    const cur = rating ?? 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      select(Math.min(5, cur + 1 || 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (cur > 1) select(cur - 1);
      else if (cur === 0) select(1);
    } else if (/^[1-5]$/.test(e.key)) {
      e.preventDefault();
      select(Number(e.key));
    }
  };

  const prompt = rating ? promptFor(rating) : null;

  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-subtle)',
        padding: variant === 'overlay' ? '16px 18px' : '18px 20px',
        textAlign: 'left',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>How was your experience?</div>
      <div style={{ marginTop: 3, fontSize: 12.5, lineHeight: 1.6, color: 'var(--fg-2)' }}>
        Rate the whole challenge. Your feedback helps us make this better.
      </div>

      {/* Stars */}
      <div
        role="radiogroup"
        aria-label="Rate your experience from 1 to 5 stars"
        onKeyDown={onKeyDown}
        onMouseLeave={() => setHover(null)}
        style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= shown;
          const isSel = rating === n;
          return (
            <button
              key={n}
              ref={(el) => {
                starsRef.current[n - 1] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSel}
              aria-label={`${n} of 5 stars, ${RATING_WORD[n]}`}
              // Roving tabindex: the group is one tab stop, not five.
              tabIndex={rating ? (isSel ? 0 : -1) : n === 1 ? 0 : -1}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(null)}
              onClick={() => select(n)}
              style={{
                border: 'none',
                background: 'none',
                padding: 2,
                lineHeight: 0,
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <StarShape filled={filled} size={starSize} />
            </button>
          );
        })}
        {/* The word for whatever is currently shown, so the value reads plainly
            rather than having to be counted. */}
        <span
          aria-hidden="true"
          style={{
            marginLeft: 8,
            minWidth: 64,
            fontSize: 12.5,
            fontWeight: 600,
            color: shown ? 'var(--status-warning)' : 'var(--fg-3)',
          }}
        >
          {shown ? RATING_WORD[shown] : 'Tap a star'}
        </span>
      </div>

      {/* The comment appears only once a star is chosen, with the prompt for
          that band. Asking "what went wrong" before knowing how it went reads as
          an accusation, and asking nothing wastes the one moment they are here. */}
      {rating && prompt ? (
        <div style={{ marginTop: 14 }}>
          <label
            htmlFor="experience-rating-comment"
            style={{ display: 'block', marginBottom: 7, fontSize: 12.5, lineHeight: 1.55, color: 'var(--fg-2)' }}
          >
            {prompt.title}
          </label>
          <textarea
            id="experience-rating-comment"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            onFocus={() => onCommentFocusChange?.(true)}
            onBlur={() => onCommentFocusChange?.(false)}
            placeholder={prompt.placeholder}
            rows={variant === 'overlay' ? 2 : 3}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              resize: 'vertical',
              border: '1px solid var(--border-strong)',
              background: 'var(--surface-0)',
              padding: '9px 11px',
              fontSize: 13,
              lineHeight: 1.55,
              fontFamily: 'var(--font-body)',
              color: 'var(--fg-1)',
            }}
          />
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span
              aria-live="polite"
              style={{
                fontSize: 12,
                color: 'var(--status-success)',
                opacity: submitted ? 1 : 0,
                transition: 'opacity 0.2s',
              }}
            >
              Thank you, your feedback is saved.
            </span>
            <Button
              variant="primary"
              onClick={onSubmit}
              disabled={!comment.trim() || submitted}
              style={{ flex: 'none' }}
            >
              {submitted ? 'Saved' : 'Send feedback'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
