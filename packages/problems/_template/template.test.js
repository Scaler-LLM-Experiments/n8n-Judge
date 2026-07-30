import { describe, it, expect } from 'vitest';
import { problemSchema } from '@judge/problem-schema';
import { problemList } from '../index.js';
import { templateProblem } from './index.js';
import { emailTriage } from '../email-triage/index.js';

// The template's job is to be the thing someone copies. That only works if it stays in
// step with two moving targets: the schema (what a problem must contain) and the
// reference problem (what a good one looks like). Both move without anyone thinking
// about this folder, so the drift is caught here rather than discovered by the next
// author wondering why their problem fails validation.

describe('the template covers the schema', () => {
  it('has a slot for every field the schema requires', () => {
    const required = Object.entries(problemSchema.shape)
      .filter(([, field]) => !field.isOptional())
      .map(([key]) => key);
    const missing = required.filter((key) => !(key in templateProblem));
    expect(missing).toEqual([]);
  });

  /**
   * Schema fields the template deliberately has no slot for, and why.
   *
   * This list is the whole value of the test below: a field is either in the template or
   * it is named here with a reason. "Optional in the schema" is not a reason on its own —
   * `brief`, `difficulty`, `estimatedMinutes` and `coverImage` are all optional so that
   * problems written before they existed still validate, and a new problem should still
   * fill every one of them in.
   */
  const DELIBERATELY_ABSENT = {
    // Per-node simulated output, for a problem whose Run needs to show something the
    // catalog's sample I/O cannot produce. email-triage does not use it either, so
    // putting a TODO block in the template would teach a new author that it is expected.
    simulation: 'rare; only when the catalog’s sample output is not enough for the Run',
  };

  it('has a slot for every OPTIONAL field too, or names it as deliberately absent', () => {
    const all = Object.keys(problemSchema.shape);
    const missing = all.filter((key) => !(key in templateProblem) && !(key in DELIBERATELY_ABSENT));
    expect(missing).toEqual([]);
  });

  it('is shaped like the reference problem, key for key', () => {
    // If email-triage grows a field, the template should grow it too — otherwise the
    // next problem is authored against a stale idea of what a problem is.
    expect(Object.keys(templateProblem).sort()).toEqual(Object.keys(emailTriage).sort());
  });
});

describe('no registered problem ships template placeholders', () => {
  /** Every string anywhere in the object, with the path that reached it. */
  function strings(node, path = '', out = []) {
    if (typeof node === 'string') out.push([path, node]);
    else if (Array.isArray(node)) node.forEach((v, i) => strings(v, `${path}[${i}]`, out));
    else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) strings(v, path ? `${path}.${k}` : k, out);
    }
    return out;
  }

  it('leaves no TODO behind — a half-filled copy must not reach a learner', () => {
    // The failure this prevents is quiet: a problem seeds and renders perfectly well
    // with "TODO Field Label" on a dropdown, and nothing else complains.
    const offenders = [];
    for (const problem of problemList) {
      for (const [path, value] of strings(problem)) {
        if (value.includes('TODO')) offenders.push(`${problem.id}: ${path}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('does not register the template itself', () => {
    expect(problemList.map((p) => p.id)).not.toContain(templateProblem.id);
  });
});
