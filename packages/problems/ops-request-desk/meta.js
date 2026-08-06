// WHO this challenge is, and how it is advertised.
//
// Everything here is read before a learner commits, so it is the copy that decides
// whether they start at all.

/** Kebab-case, unique, and permanent — sessions and clip paths are keyed by it. */
export const id = 'ops-request-desk';

/** Title case, on the card and the Understand hero. */
export const title = 'Fernwood Robotics — Ops Request Desk';

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
 * which of the Ops Log's six columns comes from which source (the assignment list is
 * the decision), and which Slack channel the escalation lands in.
 */
export const statement =
  'Fernwood Robotics builds picking robots, and Priya Raghavan is its entire operations function. Anything that is not engineering or sales reaches her through one internal form, the Ops Desk request: your name, your email, and a free-text box that just asks "What do you need?". Almost everything that comes back wants one of two things. Some requests want something recorded in her Ops Log spreadsheet. Some want an email sent to a named person. A steady trickle is neither — questions about the desk itself, and things the desk simply cannot do — and those have to reach Priya rather than be answered by a machine. Build the flow that reads each submission, decides which of the three it is, and pulls out the details the destination needs: who or what the request is about, any email address written inside it, and a one-line summary. The Ops Log has six columns, and they do not all come from the same place — some are answers the requester typed into the form, and the rest have to be worked out from the sentence they wrote, so keeping the two apart is most of the job. When a request asks for a message to be sent, it goes to the address written inside the request, not to the person who filled in the form: those are two different people and this item carries an address for each of them. Requests that need a person go to the channel Priya already watches, carrying her the requester\'s name and their own words, and nothing else happens to them.';

/** One line, for the catalogue. */
export const tagline =
  'Read a free-text ops request with AI, pull out the details it hides, and send it down one of three paths.';

/**
 * The TWO-LINE version, on the Understand hero and the Home card.
 *
 * Capped at 125 characters by the schema, and the cap comes from the card — 13.5px in a
 * ~440px column, clamped to two lines, so longer copy is cut mid-word. Measured.
 */
export const brief =
  'One form, three kinds of request. Record it, send it on, or hand it to a person — and keep the details straight.';

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
    'Deep charcoal ground with a warm mustard-amber colour field washing across it — soft spray-paint grain, matte, no gloss. A single thin amber line enters from the left, travels most of the way across, and splits once into three prongs that fan out slightly to the right, positioned a little below centre. Nothing else: no arrows, no arrowheads, no icons, no text, no chevrons, no sparkles, no grid. Wide empty charcoal atmosphere on the left where the line begins.',
  src: '/covers/ops-request-desk.png',
  alt: 'A single amber line on charcoal that splits into three prongs',
};
