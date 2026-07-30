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

export const problems = {
  [emailTriage.id]: emailTriage,
};

export const problemList = Object.values(problems);
export const defaultProblem = emailTriage;

export function getProblem(id) {
  return problems[id] || defaultProblem;
}
