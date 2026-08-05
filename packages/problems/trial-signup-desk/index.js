// TerraTrek Gear — Free-Trial Signup Desk — copied from `packages/problems/_template/`.
//
// This file only ASSEMBLES. Every value lives in a sibling file, grouped by the job it
// does, and the exported object is what the engine, the schema, the seed and the app all
// see.
//
//   meta.js        who this challenge is and how it is advertised
//   dissection.js  the Understand quiz
//   build.js       the shape of the flow and the order it is built in
//   nodeSetup.js   the NDV, per node type
//   probes.js      the wrong-node questions + misconception labels
//   cases.js       the reference build, the Run's cases and narration, the Stress questions
//   voice.js       Iris's narration
//
// STILL TO DO before a learner sees this:
//   1. voice.js is UNWRITTEN — it is still the template scaffold, and its placeholder
//      lines are the only reason `npm test` and `problem:check` are not clean on this
//      case. Narration is authored by a separate stage.
//   2. npm run covers:generate  — then set coverImage.src in meta.js
//   3. npm run voice:generate && npm run voice:sync
//   4. npm run db:seed          — nothing reaches the app until this runs
//   5. npm run smoke            — there are no component tests
//
// The full rules, and why each exists, are in the problem-authoring skill.
import * as meta from './meta.js';
import { dissection } from './dissection.js';
import { nodePalette, branches, flowSummary, flow, buildPhases } from './build.js';
import { nodeSetup } from './nodeSetup.js';
import { nodeProbes, misconceptionLabels } from './probes.js';
import { referenceGraph, testCases, sampleCases, simulation, evalQuestions } from './cases.js';
import { voice } from './voice.js';

export const trialSignupDesk = {
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
  // The engine's default Run narration is written for email triage — new email from,
  // a category and an urgency, a Switch taking a branch. None of that applies to a
  // linear form-to-spreadsheet flow, so this problem supplies its own wording.
  simulation,
  evalQuestions,
};
