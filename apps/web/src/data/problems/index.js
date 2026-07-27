// Web-app shim over the shared problem registry. The registry itself lives in
// @judge/problems (shared with seeds/tests/worker); this adds the client-only
// URL resolution the prototype used. Once problems are served from the DB
// (M1), the journey fetches /api/problems/<slug> instead and this shim remains
// only for dev routes.
export { problems, problemList, defaultProblem, getProblem } from '@judge/problems';
import { getProblem, defaultProblem } from '@judge/problems';

// Pick a problem from a `?problem=<id>` param in the URL (hash or search).
// Falls back to the default. Client-only.
export function resolveProblem() {
  if (typeof window === 'undefined') return defaultProblem;
  const m = `${window.location.hash || ''}&${window.location.search || ''}`.match(/[?&]problem=([\w-]+)/);
  return m ? getProblem(m[1]) : defaultProblem;
}
