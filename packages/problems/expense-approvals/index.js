// Expense Claim Approvals — copied from `packages/problems/_template/`.
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
// STILL TO DO before a learner sees this (all of it needs a machine this was not built on):
//   1. npm run db:seed          — nothing reaches the app until this runs
//   2. npm run covers:generate  — then set coverImage.src in meta.js and re-seed
//   3. npm run voice:generate && npm run voice:sync — the voice.js lines are unrendered
//   4. npm run smoke            — there are no component tests
//
// The full rules, and why each exists, are in the problem-authoring skill.
import * as meta from './meta.js';
import { dissection } from './dissection.js';
import { nodePalette, branches, flowSummary, flow, buildPhases } from './build.js';
import { nodeSetup } from './nodeSetup.js';
import { nodeProbes, misconceptionLabels } from './probes.js';
import { referenceGraph, testCases, sampleCases, simulation, evalQuestions } from './cases.js';
import { voice } from './voice.js';

export const expenseApprovals = {
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
  // The engine's default Run narration is written for email triage. This problem's
  // fields are not `category` and `urgency`, so it supplies its own wording — the only
  // optional key the template leaves out, deliberately, so a new author does not think
  // it is expected.
  simulation,
  evalQuestions,
};
