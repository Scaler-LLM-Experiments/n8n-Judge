// Identity and catalogue copy: what a learner sees before they commit.
//
// `brief` is capped at 125 characters by the schema and `flowSummary` labels at three
// words — both rules exist because these strings appear on surfaces narrower than the
// prose they were written for. See the problem-authoring skill.

export const id = 'weather-commute-ping';

export const title = 'Commute Weather Ping';

// The FULL brief. Three surfaces read this one string: the problem panel, the sticky
// note on the canvas, and Ask-AI's context — so it has to carry every fact the flow
// depends on. It is also rendered as the Understand hero with `white-space: pre-line`,
// which is why it is short paragraphs rather than one block.
//
// What it deliberately does NOT say, because each one is a graded decision or an
// edge-case question later on:
//   · WHERE the message lands. "Somewhere he is already looking" is the requirement;
//     naming a channel would answer both the last dissection question and the Slack
//     node's own graded field, which the learner would just be reading back.
//   · that nothing arrives to set the flow off, or that no judgement is needed — the
//     trigger and the absence of a model are the first two things the quiz asks.
//   · what happens on a morning the service answers with a code this mapping has never
//     seen, or a morning it does not answer at all. Both are Stress Testing questions,
//     and stating the outcome here answers them.
//   · which field names to create, or which value goes in each — that is the richest
//     config surface in the case and the statement must not enumerate it.
//
// What it DOES say, on purpose: that the forecast service answers in numbers and an
// integer code rather than in sentences, and what the codes it has seen so far mean.
// That is the fact the whole case rests on, and withholding it only makes the learner
// guess whether there is prose to interpret. The codes listed are the ones the three
// ordinary mornings produce; nothing here says the list is complete.
export const statement =
  'Sudhanva commutes across Bangalore to an office in Indiranagar, and every morning he does the same ten seconds of work. Half out the door, one shoe on, he opens a weather app and re-derives the same decision: is this a normal commute, or one to plan around — leave earlier for rain, carry water for the heat, go the long way round the underpass that floods.\n\n' +
  // The timeline has to hold, because `triggerAtHour` is a free-entry number with no
  // options to eliminate: the call goes out at 9:00 and he reads the message a few
  // minutes AFTER that, on his way out. An earlier version had him reading it "at ten to
  // nine", which made hour 8 the better-reasoned answer than the one the case grades.
  'The decision never changes shape. Only its answer does. So at 9:00 every morning the flow should ask a forecast service for Bangalore\'s current conditions by itself, and put one short message somewhere he is already looking on his phone. He picks the phone up a few minutes past nine, on his way out of the door.\n\n' +
  // "the codes he sees most mornings" is the one clause that makes the mapping decision
  // fair on first read. Without it the legend reads as the complete set, and a learner
  // has nothing to tell them a code outside it can arrive. It stops there deliberately:
  // WHICH codes are missing, and what they mean, is the discovery the case is built on.
  'The service does not answer in sentences. It answers with numbers: the temperature in degrees, and the conditions as a WMO weather code, which is an integer. 0 is a clear sky, 1 to 3 are increasing cloud, and 61 to 65 are rain from light to heavy — those are the codes he sees most mornings. Turning those into something a person can read is this flow\'s job, not his.\n\n' +
  'The message has two halves and both of them matter. One states the conditions in plain words with the temperature beside them. The other is a single line about what today\'s commute needs — and that line does not follow from the code on its own: a clear sky at 38°C is not the same commute as a clear sky at 24°C.\n\n' +
  'One message, once, every morning. He reads it, he does not look it up.';

export const tagline =
  'Ask a forecast service for this morning\'s numbers and turn them into one line he can act on.';

// Two lines, for the Understand hero and the Home card. 96 characters.
export const brief =
  'One forecast call at 9:00, and one line he can act on before he steps out of the door.';

// Sized from this problem's real decision count (20: 4 understand, 4 placements,
// 9 config, 3 stress). Four nodes, one straight line, nothing to authenticate — the
// entry point in the catalogue for somebody with no automation background.
export const difficulty = 'easy';

// Says nothing about what the flow does or does not need, because the Home card is
// read before the quiz. "One decision that only bites later" is true of the mapping
// gap without naming it.
export const difficultyNote =
  'Four steps in a straight line, nothing to authenticate, and one decision that only bites on a morning you did not plan for.';

export const estimatedMinutes = 15;

export const coverImage = {
  // Motif reserved for this case: ONE large soft-edged pale arc curving upward across
  // the lower half. Nothing else on the Home row uses an arc — taken already are the
  // diagonal chevron (email-triage), sparkles (expense-approvals), the lattice, the
  // fanning line, and the stacked bars (low-stock-morning-post).
  //
  // Palette is cool violet-indigo into lilac, chosen against the row rather than
  // against the subject: three of the five existing cards are warm (amber 24°,
  // amber-gold 38°, coral 17°) and a fourth warm card would make the row read as one
  // gradient. The author's original dusty orange is recorded in the case spec.
  prompt:
    'Cool violet-indigo into soft lilac colour field — saturated indigo through periwinkle to a pale lilac, cool and high-key, not navy and not purple-black. Soft spray-paint grain. A single large soft-edged pale arc curving upward across the lower half, like a horizon line lifting, lightly soft-focus, one continuous sweep, nothing rising above it. Empty cool violet atmosphere filling the upper half. No sun, no rays, no clouds, no droplets, no chevrons, no sparkles, no bars, no text, no other symbols.',
  src: '/covers/weather-commute-ping.png',
  alt: 'Cool violet spray field with a single pale arc curving upward across the lower half',
};
