// Problem registry (in-memory source of truth for seeds/tests, and for the
// web app until problems are served from the database).
// To add a challenge, create packages/problems/<id>/index.js exporting a
// problem object, then register it here.
import { emailTriage } from './email-triage/index.js';
import { leadTriage } from './lead-triage/index.js';

export const problems = {
  [emailTriage.id]: emailTriage,
  [leadTriage.id]: leadTriage,
};

export const problemList = Object.values(problems);
export const defaultProblem = emailTriage;

export function getProblem(id) {
  return problems[id] || defaultProblem;
}
