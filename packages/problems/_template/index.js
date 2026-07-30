// TODO Problem Name — copied from `packages/problems/_template/`.
//
// TO USE THIS TEMPLATE:
//   1. cp -r packages/problems/_template packages/problems/<your-slug>
//   2. rename the export below, and fill in every TODO across the seven files
//   3. register it in packages/problems/index.js (registry order = catalogue order)
//   4. npm test          — validateProblem() runs here and rejects authoring mistakes
//   5. npm run db:seed   — nothing reaches the app until you do
//   6. npm run covers:generate && npm run voice:generate && npm run voice:sync
//   7. npm run smoke     — there are no component tests; this is what catches a
//                          render-time break on a screen you did not happen to open
//
// The full rules, and why each exists, are in the problem-authoring skill.
import * as meta from './meta.js';
import { dissection } from './dissection.js';
import { nodePalette, branches, flowSummary, flow, buildPhases } from './build.js';
import { nodeSetup } from './nodeSetup.js';
import { nodeProbes, misconceptionLabels } from './probes.js';
import { referenceGraph, testCases, sampleCases, evalQuestions } from './cases.js';
import { voice } from './voice.js';

export const templateProblem = {
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
  evalQuestions,
};
