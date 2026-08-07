// Problem registry — the source of truth for seeds and tests. The web app does NOT
// import this: problems are served from Postgres via /api/problems, so nothing here
// reaches a learner until `npm run db:seed`.
//
// To add a challenge, copy `packages/problems/_template/`, fill it in, and register it
// below. The rules live in the problem-authoring skill; `validateProblem()` enforces
// the ones that can be enforced.
//
// **Registry order is the catalogue order.** Home lists problems in the order they
// appear here, so put a new challenge where a learner should meet it.
//
// email-triage is the only problem, deliberately: on 2026-07-31 the other three were
// removed so the template could be extracted from one fully-authored reference (voice,
// cover art, difficulty, brief) rather than from four problems of which three predate
// those fields. They are recoverable from git history — but the commit that removed
// them also deleted their database rows, so restoring one means re-registering it AND
// re-seeding.
import { emailTriage } from './email-triage/index.js';
import { expenseApprovals } from './expense-approvals/index.js';
import { trialSignupDesk } from './trial-signup-desk/index.js';
import { opsRequestDesk } from './ops-request-desk/index.js';
import { lowStockMorningPost } from './low-stock-morning-post/index.js';

export const problems = {
  [emailTriage.id]: emailTriage,
  // Second, not first: it is the same weight of work as email-triage (31 scored
  // decisions to its 30) and reads as easier once you have met that one, because the
  // shape is the same and only the judgement is new.
  [expenseApprovals.id]: expenseApprovals,
  // Appended last, which is where a new case belongs — registry order is the catalogue
  // order on Home. It is the easiest of the three (20 scored decisions, no AI step and no
  // branching), but it lands after the ones a learner has already met rather than being
  // pushed to the front of a list they are part-way through.
  [trialSignupDesk.id]: trialSignupDesk,
  // Appended last, same reasoning. The heaviest of the four (31 scored decisions across
  // seven nodes and three ways out), and the only one whose AI step has to produce the
  // fields a later node maps — which is the idea it exists to teach, and the reason it
  // reads as harder than expense-approvals despite the same decision count.
  [opsRequestDesk.id]: opsRequestDesk,
  // Appended last, same reasoning. 28 scored decisions over five nodes, and the only
  // case with no AI step at all — knowing when NOT to reach for a model is the thing
  // it exists to teach, so `basic-llm-chain` is offered as a distractor rather than
  // withheld. It is also the first case whose flow reads a data source mid-flow
  // rather than only writing to one at the end.
  [lowStockMorningPost.id]: lowStockMorningPost,
};

export const problemList = Object.values(problems);
export const defaultProblem = emailTriage;

export function getProblem(id) {
  return problems[id] || defaultProblem;
}
