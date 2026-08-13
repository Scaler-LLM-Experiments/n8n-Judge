// WHO this challenge is, and how it is advertised.
//
// Everything here is read before a learner commits, so it is the copy that decides
// whether they start at all.

/** Kebab-case, unique, and permanent — sessions and clip paths are keyed by it. */
export const id = 'ops-request-desk';

/** Title case, on the card and the Understand hero. */
export const title = 'Fernwood Robotics. Ops Request Desk';

/**
 * The FULL brief. Stays complete: the problem panel, the sticky note and Ask-AI's
 * context all read this, so it must carry every detail a learner needs mid-build.
 *
 * It states the REQUIREMENTS and never the behaviour the edge-case quiz grades. So it
 * says a request that is neither a record-this nor a send-this has to reach a person,
 * and it does not say what happens to one the routing has no rule for — that is the
 * first Stress Testing question, and answering it here would put the answer on the
 * sticky note for the whole session.
 *
 * Two things it deliberately does NOT spell out, because both are graded elsewhere:
 * which of the Ops Log’s six columns comes from which source (the assignment list is
 * the decision), and which Slack channel the escalation lands in.
 */
// 136 words in 9 sentences, none over 25, no dashes. It was 193 words.
//
// This case has seven nodes and three ways out, so its statement legitimately carries more
// than the others. Every fact a graded decision reads is still here: the three form fields
// (the extractor's answers are keyed by them), the three outcomes, the three things to pull
// out, and both traps. What went was restatement.
//
// The second trap has to survive in the requirement, not in an aside. An outgoing message
// goes to the address INSIDE the request, and a learner who maps the form's own email
// address instead has built something that quietly mails the wrong person forever.
export const statement =
  'Priya runs operations alone at Fernwood Robotics. Everything that is not engineering or sales reaches her through one form: your name, your email, and "What do you need?".\n\n' +
  'Every submission is one of three things. Something to record in her Ops Log sheet, an email to a named person, or something only Priya can handle.\n\n' +
  'Build the flow that reads each one and decides which it is. It also has to pull out who it is about, any address inside it, and a one-line summary.\n\n' +
  'The Ops Log\'s six columns come from two places: some typed into the form, the rest worked out from the sentence. And an outgoing message goes to the address inside the request, not to the person who filled in the form.\n\n' +
  'Anything needing a person goes to the channel Priya watches, with the requester\'s name and their own words.';
export const tagline =
  'Read a free-text ops request with AI, pull out the details it hides, and send it down one of three paths.';

/**
 * The TWO-LINE version, on the Understand hero and the Home card.
 *
 * Capped at 125 characters by the schema, and the cap comes from the card — 13.5px in a
 * ~440px column, clamped to two lines, so longer copy is cut mid-word. Measured.
 */
export const brief =
  'One form, three kinds of request. Record it, send it on, or hand it to a person. And keep the details straight.';

/**
 * `easy | moderate | difficult`, and roughly how long a first attempt takes.
 *
 * Authored, not derived — a promise to someone deciding whether to start now. Sized
 * from the real decision count (30: 5 understand, 7 placements, 15 config, 3 stress),
 * which is email-triage's count almost exactly, and email-triage is moderate / 25 min.
 */
export const difficulty = 'moderate';
export const difficultyNote =
  'Seven nodes, three exits, and one AI step that has to decide the route and produce the details at the same time.';
export const estimatedMinutes = 25;

/**
 * Card art. `prompt` is authored now; `src` is filled in after
 * `npm run covers:generate` writes `apps/web/public/covers/<id>.png`.
 *
 * A null `src` is a normal state — the card draws its own placeholder. The prompt is
 * production material and is stripped at the API boundary, never sent to a browser.
 *
 * Motif reserved for this case only: ONE line that splits into THREE prongs (not a
 * chevron, not a sparkle, not a lattice). Palette reserved: warm mustard-amber on
 * charcoal (not blue, not coral, not lime).
 */
export const coverImage = {
  prompt:
    'Deep charcoal ground with a warm mustard-amber colour field washing across it. Soft spray-paint grain, matte, no gloss. A single thin amber line enters from the left, travels most of the way across, and splits once into three prongs that fan out slightly to the right, positioned a little below centre. Nothing else: no arrows, no arrowheads, no icons, no text, no chevrons, no sparkles, no grid. Wide empty charcoal atmosphere on the left where the line begins.',
  src: '/covers/ops-request-desk.png',
  alt: 'A single amber line on charcoal that splits into three prongs',
};
