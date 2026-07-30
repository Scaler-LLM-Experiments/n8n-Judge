// Identity and catalogue copy: what a learner sees before they commit.
//
// `brief` is capped at 125 characters by the schema and `flowSummary` labels at three
// words — both rules exist because these strings appear on surfaces narrower than the
// prose they were written for. See the problem-authoring skill.

export const id = 'email-triage';

export const title = 'Email Triage Automation';

export const statement =
  "Your inbox is full of mixed feedback. Build a flow that watches for new emails, uses AI to classify each one (Bug Report / Feature Request / Complaint), and routes urgent complaints differently from everything else — each path sends the right reply.";

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
  prompt:
    'A single retro pixel-art computer on the left, and three simple cube trays on the right, with one envelope travelling between them on a short stream of binary. Wide, sparse, left to right.',
  src: '/covers/email-triage.png',
  alt: 'A retro computer streaming an email up into three sorting bins',
};
