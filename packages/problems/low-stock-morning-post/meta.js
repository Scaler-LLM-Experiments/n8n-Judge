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
export const statement =
  'Brightleaf Coffee Roasters roasts in Pune and runs three cafés — Koregaon Park, Baner and Kalyani Nagar — plus the roastery itself. Green bean stock for all four sits in one Google Sheet, "Bean Inventory 2026", on a tab called Stock: one row per bean per location, about forty rows, with the columns bean, location, kg_on_hand, reorder_level, supplier and last_counted.\n\n' +
  'Every weekday morning Ritika, the roastery\'s ops coordinator, opens that sheet before the first roast and reads down it looking for any row where kg_on_hand has dropped below that row\'s own reorder_level. The levels differ per bean — the house Brazil moves fast and sits at 25 kg, a single-lot Ethiopia Guji sits at 6 — so she cannot simply look for small numbers, she has to compare two columns on every line. She then types the shortlist into the #supply-chain Slack channel so the buyer can raise purchase orders before the suppliers\' 10 a.m. cut-off.\n\n' +
  'Build the flow that does it for her. At 07:30, Monday to Friday, it should read the whole Stock tab, keep only the rows that have dropped below their own reorder level, and put the shortlist in front of the buyer as a single message giving bean, location, kg on hand and reorder level — rather than one message per bean.\n\n' +
  'Nobody opens the sheet, and getting it wrong by hand is invisible: nobody notices the line Ritika skipped until a café runs out of Ethiopia Guji mid-service on a Saturday.';

export const tagline =
  'Sweep an inventory sheet every weekday morning and put one low-stock shortlist in front of the buyer.';

// Two lines, for the Understand hero and the Home card. The full statement above is
// what the problem panel, the sticky note and Ask-AI read. 118 characters.
export const brief =
  'Forty rows of coffee stock, one sheet, 07:30 every weekday. Find what is running low and post it once.';

// Sized from this problem's real decision count (27: 5 understand, 5 placements,
// 13 config, 4 stress). Fewer nodes than email-triage and no AI, but three of the
// decisions are genuinely arguable, so it lands in the same band.
export const difficulty = 'moderate';

export const difficultyNote =
  'No AI anywhere in it. Five steps in a straight line, and every one of them can be quietly wrong.';

export const estimatedMinutes = 25;

export const coverImage = {
  // Motif reserved for this case only: three stacked horizontal bars of decreasing
  // length, shortest at the bottom — a level draining away. Not a chevron (email-triage),
  // not sparkles (expense-approvals), not a lattice.
  // Palette reserved: deep amber / burnt orange. Nothing else in the set is warm.
  prompt:
    'Deep amber and burnt-orange colour field — saturated warm amber into burnt orange, rich and glowing, not brown or muddy. Soft spray-paint grain. Three horizontal soft-edged pale bars stacked on the right half, each noticeably shorter than the one above it, the shortest at the bottom, lightly soft-focus, reading as a level draining away. Empty warm amber atmosphere on the left. No cups, no beans, no sacks, no chevrons, no sparkles, no text, no other symbols.',
  src: null,
  alt: 'Deep amber spray field with three stacked bars, each shorter than the last',
};
