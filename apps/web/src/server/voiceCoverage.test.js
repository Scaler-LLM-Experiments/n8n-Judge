import { describe, expect, it } from 'vitest';
import { problems } from '@judge/problems';
import { NODE_CATALOG } from '@judge/catalog';
import { buildScript } from './voiceScript.js';
import { clipId } from '../lib/voicePath.js';
import { labelForNodeType } from '../lib/voiceCatalogue.js';
import { resolveLines, speakingVars } from '../lib/voiceLines.js';

// Does every interaction a learner can trigger actually have audio?
//
// The generator enumerates what it thinks is speakable; the screens call
// `voice.play(moment, vars)` with whatever they happen to have to hand. Nothing
// forced those two to agree, and where they disagreed the failure was silent — the
// line resolved to no clip, the learner got a caption, and no log said anything.
//
// So this walks every play site in the app and asserts a clip exists. Adding a
// `voice.play` without adding it here is the mistake this is here to catch; the list
// is short and the screens are few.
//
// Call sites, verified by grep:
//   EvalScreen        stress_start
//   DissectionScreen  welcome, problem_intro, understand_start, answer_*, understand_done
//   BuildStage        build_start, phase_intro, idle_nudge, node_wrong, node_placed,
//                     phase_complete, build_complete, run_start, run_pass, run_fail
//   ReportScreen      report_ready
//   Ndv               verify_pass, verify_fail

const VOICE = { model: 'aura-2-test-en' };

/** Every (moment, vars) the screens can play for one problem. */
function playSites(problem) {
  const sites = [];
  const add = (moment, vars = {}) => sites.push({ moment, vars });

  for (const moment of [
    'welcome',
    'problem_intro',
    'understand_start',
    'understand_done',
    'build_start',
    'idle_nudge',
    'node_wrong',
    'run_start',
    'run_pass',
    'run_fail',
    'stress_start',
    'report_ready',
  ]) {
    add(moment);
  }

  // Understand: the verdict names the option the learner picked.
  for (const q of problem.dissection ?? []) {
    for (const opt of q.options ?? []) {
      const correct = opt.type === q.correctType;
      for (const moment of correct ? ['answer_correct'] : ['answer_wrong', 'answer_wrong_again']) {
        add(moment, { key: q.id, answer: opt.label });
      }
    }
  }

  // Build: one line per node placed and per node verified, plus the phase beats.
  const types = new Set();
  const phases = problem.buildPhases ?? [];
  for (const [i, phase] of phases.entries()) {
    for (const t of phase.nodeTypes ?? []) types.add(t);
    add('phase_intro', { key: phase.id, phase: phase.label });
    // BuildStage fires the final phase as `build_complete` instead, from the same
    // place and with the same phase id.
    add(i === phases.length - 1 ? 'build_complete' : 'phase_complete', { key: phase.id });
    add('phase_complete', { key: phase.id });
  }
  for (const type of types) {
    const node = labelForNodeType(problem, type, NODE_CATALOG);
    for (const moment of ['node_placed', 'verify_pass', 'verify_fail']) add(moment, { key: type, node });
  }

  // The Run narrates each test case as it enters — BuildStage plays this keyed by
  // the sample case id.
  for (const sample of problem.sampleCases ?? []) add('run_case', { key: sample.id });

  return sites;
}

describe('every interaction a learner can trigger has audio', () => {
  for (const [slug, problem] of Object.entries(problems)) {
    it(slug, () => {
      const table = buildScript(problem, NODE_CATALOG, VOICE);
      const missing = [];

      for (const { moment, vars } of playSites(problem)) {
        // Which wording a learner hears is picked in their browser from a session
        // seed, so EVERY variant has to exist, not just the first.
        const variants = resolveLines(moment, { problem, key: vars.key }) ?? [];
        if (!variants.length) {
          missing.push(`${moment} — the phrase book has no words for this at all`);
          continue;
        }
        for (let v = 0; v < variants.length; v += 1) {
          // Exactly what the player computes — see `urlFor` in voice.js.
          const id = clipId(moment, vars.key, speakingVars(variants, vars), v);
          if (!table.clips[id]) missing.push(`${moment} → ${id}`);
        }
      }

      expect([...new Set(missing)]).toEqual([]);
    });
  }
});
