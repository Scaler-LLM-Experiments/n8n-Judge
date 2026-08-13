// Identity and catalogue copy: what a learner sees before they commit.
//
// `brief` is capped at 125 characters by the schema and `flowSummary` labels at three
// words — both rules exist because these strings appear on surfaces narrower than the
// prose they were written for. See the problem-authoring skill.

export const id = 'email-triage';

export const title = 'Email Triage Automation';

export const statement =
  "Your inbox is full of mixed feedback. Build a flow that watches for new emails and uses AI to classify each one: Bug Report, Feature Request or Complaint. Urgent complaints route differently from everything else, and each path sends the right reply.";

export const tagline = 'Classify incoming support emails with AI and route each to the right reply.';
// Two lines, for the Understand hero and the Home card. The full brief above is
// what the problem panel and Ask-AI read.
export const brief =
  'A support inbox gets bug reports, feature requests and angry complaints. Sort each one and send the right reply.';
// Sized from this problem's real decision count (30: 5 understand, 6 placements,
// 17 config, 2 stress), then rounded to something a human would say.
export const difficulty = 'moderate';

export const difficultyNote = 'One router, three branches, and every node needs configuring.';

export const estimatedMinutes = 25;

export const coverImage = {
  // Motif reserved for this case only: soft diagonal chevron (not X, not sparkles).
  // Palette reserved: bright brand / electric blue (keep it vivid, not navy-black).
  prompt:
    'Bright vivid electric blue and sky-blue colour field. Saturated #0055FF to luminous cyan-blue gradients, airy and high-key, not dark navy. Soft spray-paint grain. Single large soft-edged pale white-blue diagonal chevron or arrow-shard in the upper-left, slightly soft-focus. Empty bright lower-right atmosphere. No other symbols.',
  src: '/covers/email-triage.png',
  alt: 'Bright blue spray field with a soft diagonal chevron',
};
