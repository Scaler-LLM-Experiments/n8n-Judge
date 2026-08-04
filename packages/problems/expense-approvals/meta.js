// Identity and catalogue copy: what a learner sees before they commit.
//
// `brief` is capped at 125 characters by the schema and `flowSummary` labels at three
// words — both rules exist because these strings appear on surfaces narrower than the
// prose they were written for. See the problem-authoring skill.

export const id = 'expense-approvals';

export const title = 'Expense Claim Approvals';

export const statement =
  'Expense claims arrive in the finance inbox as ordinary emails, written however the claimant felt like writing them. Build a flow that reads each claim and decides between three outcomes: approve it on the spot, send it to a manager for sign off, or send it back because something is missing. Finance policy is that a claim under 5,000 rupees with an amount, a date and a reason is approved automatically, and anything from 5,000 up needs a manager. Every outcome replies to the person who submitted the claim, and each reply says something different.';

export const tagline = 'Read each expense claim with AI and route it to approval, sign off, or a request for what is missing.';
// Two lines, for the Understand hero and the Home card. The full statement above is
// what the problem panel, the sticky note and Ask-AI read.
export const brief =
  'Expense claims land in a finance inbox. Decide which get paid, which need a manager, and which go back.';
// Sized from this problem's real decision count (31: 5 understand, 6 placements,
// 17 config, 3 stress) — one stress question more than email-triage, and otherwise
// the same weight of work, so it earns the same label.
export const difficulty = 'moderate';

export const difficultyNote = 'One AI judgement, three outcomes, and a spending policy the routing must not try to re-write.';

export const estimatedMinutes = 25;

export const coverImage = {
  // Motif reserved for this case only: multi-size four-point sparkles (not chevron, not X).
  // Palette reserved: bright coral / hot peach (not dusty muted rose).
  prompt:
    'Bright vivid coral and hot peach-orange colour field — saturated warm pink-coral to sunny peach gradients, high-key and cheerful, not dusty or brown. Soft spray-paint grain. Three four-point sparkles of different sizes on the right half — one large pale near-white sparkle, two smaller softer ones — lightly soft-focus. Empty bright left atmosphere. No chevrons, no X marks, no other symbols.',
  src: '/covers/expense-approvals.png',
  alt: 'Bright coral spray field with soft four-point sparkles',
};
