// Problem registry. To add a challenge, create data/problems/<id>/index.js
// exporting a problem object, then register it here.
import { emailTriage } from './emailTriage/index.js';
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

// Pick a problem from a `?problem=<id>` param in the URL (hash or search).
// Falls back to the default. Client-only.
export function resolveProblem() {
  if (typeof window === 'undefined') return defaultProblem;
  const m = `${window.location.hash || ''}&${window.location.search || ''}`.match(/[?&]problem=([\w-]+)/);
  return m ? getProblem(m[1]) : defaultProblem;
}
