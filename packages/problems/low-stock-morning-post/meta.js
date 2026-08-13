// Identity and catalogue copy: what a learner sees before they commit.
//
// `brief` is capped at 125 characters by the schema and `flowSummary` labels at three
// words — both rules exist because these strings appear on surfaces narrower than the
// prose they were written for. See the problem-authoring skill.

export const id = 'low-stock-morning-post';

export const title = 'Low-Stock Morning Post';

// The FULL brief. Three surfaces read this one string: the problem panel, the sticky
// note on the canvas, and Ask-AI's context — so it has to carry every fact the flow
// depends on. It is also rendered as the Understand hero with `white-space: pre-line`,
// which is why it is short paragraphs rather than one block.
//
// What it deliberately does NOT say, because each is a graded decision or an edge-case
// question somewhere later:
//   · that nothing arrives to set the flow off (the trigger is the first quiz question);
//   · that no judgement is needed, so no model is required (that is the whole point of
//     offering an AI node in the picker);
//   · what happens on a morning when nothing qualifies, or when a count is missing —
//     both are Stress Testing questions and stating the outcome here answers them.
// 149 words in 9 sentences, none over 25, no dashes. It was 250 words with a 56-word
// sentence in it, the longest in the repo.
//
// What went was setting, not fact: the cafe names, Ritika's job title, Pune, the supplier
// and last_counted columns, and the two named beans. What stayed is everything a graded
// decision reads. That each row carries its OWN reorder_level is the whole filter lesson,
// so it is said twice on purpose. "Not one message per bean" is the aggregate lesson and
// has to survive in the requirement rather than in an aside.
export const statement =
  'Brightleaf Coffee Roasters keeps green bean stock for four locations in one Sheet, on a tab called Stock. One row per bean per location, about forty rows, each carrying kg_on_hand and its own reorder_level.\n\n' +
  'Every weekday before the first roast, Ritika reads down it for any row below its own level. The levels differ per bean, so she cannot look for small numbers: she has to compare two columns on every line. She types the shortlist into #supply-chain so the buyer can raise orders before the suppliers\' 10 a.m. cut-off.\n\n' +
  'Build the flow that does it. At 07:30, Monday to Friday, it should read the whole Stock tab and keep only the rows below their own reorder level. The buyer needs one message giving bean, location, kg on hand and reorder level, not one message per bean.\n\n' +
  'Getting it wrong by hand is invisible until a cafe runs out mid-service.';
export const tagline =
  'Sweep an inventory sheet every weekday morning and put one low-stock shortlist in front of the buyer.';

// Two lines, for the Understand hero and the Home card. The full statement above is
// what the problem panel, the sticky note and Ask-AI read. 118 characters.
export const brief =
  'Forty rows of coffee stock, one sheet, 07:30 every weekday. Find what is running low and post it once.';

// Sized from this problem's real decision count (28: 5 understand, 5 placements,
// 14 config, 4 stress). Fewer nodes than email-triage and no AI, but three of the
// decisions are genuinely arguable, so it lands in the same band.
export const difficulty = 'moderate';

export const difficultyNote =
  'No AI anywhere in it. Five steps in a straight line, and every one of them can be quietly wrong.';

export const estimatedMinutes = 25;

export const coverImage = {
  // Motif reserved for this case only: three stacked horizontal bars of decreasing
  // length, shortest at the bottom — a level draining away. Not a chevron (email-triage),
  // not sparkles (expense-approvals), not a lattice.
  // Palette: deep amber / burnt orange, measured at mean hue 24°.
  //
  // NOT reserved, and the next author should not assume otherwise: three of the five
  // cards are now warm — ops-request-desk is amber-gold (38°) and expense-approvals
  // runs coral into orange (17°). They still separate on the Home row because their
  // compositions differ (half near-black, pink left half, uniform field) and every
  // motif is distinct, but the warm end of the wheel is full. Take violet, teal or
  // magenta next.
  prompt:
    'Deep amber and burnt-orange colour field. Saturated warm amber into burnt orange, rich and glowing, not brown or muddy. Soft spray-paint grain. Three horizontal soft-edged pale bars stacked on the right half, each noticeably shorter than the one above it, the shortest at the bottom, lightly soft-focus, reading as a level draining away. Empty warm amber atmosphere on the left. No cups, no beans, no sacks, no chevrons, no sparkles, no text, no other symbols.',
  src: '/covers/low-stock-morning-post.png',
  alt: 'Deep amber spray field with three stacked bars, each shorter than the last',
};
