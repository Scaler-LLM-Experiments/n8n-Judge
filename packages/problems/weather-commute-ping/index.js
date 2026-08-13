// Commute Weather Ping — copied from `packages/problems/_template/`.
//
// WHAT IS LEFT TO DO:
//   1. fill in every TODO across the seven files
//   2. register it in packages/problems/index.js (registry order = catalogue order)
//   3. npm run problem:check -- weather-commute-ping   — structure, size, balance, voice, cover
//   4. npm run db:seed   — nothing reaches the app until you do
//   5. npm run covers:generate && npm run voice:generate && npm run voice:sync
//   6. npm run smoke     — there are no component tests; this is what catches a
//                          render-time break on a screen you did not happen to open
//
// The full rules, and why each exists, are in the problem-authoring skill.
import * as meta from './meta.js';
import { dissection } from './dissection.js';
import { nodePalette, branches, flowSummary, flow, buildPhases } from './build.js';
import { nodeSetup } from './nodeSetup.js';
import { nodeProbes, misconceptionLabels } from './probes.js';
import { referenceGraph, testCases, sampleCases, simulation, evalQuestions } from './cases.js';
import { voice } from './voice.js';

export const weatherCommutePing = {
  id: meta.id,
  title: meta.title,
  statement: meta.statement,
  tagline: meta.tagline,
  brief: meta.brief,
  difficulty: meta.difficulty,
  difficultyNote: meta.difficultyNote,
  estimatedMinutes: meta.estimatedMinutes,
  coverImage: meta.coverImage,

  dissection,
  nodePalette,
  referenceGraph,
  testCases,
  branches,
  flowSummary,
  flow,
  buildPhases,
  nodeSetup,
  nodeProbes,
  voice,
  misconceptionLabels,
  sampleCases,
  // The engine's default Run narration is written for email triage — "New email
  // from…", "{category} · {urgency}". None of those are this problem's words, so it
  // supplies its own. Wording only; the walk is unchanged.
  simulation,
  evalQuestions,
};
