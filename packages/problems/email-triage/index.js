// Email Triage Automation — the reference problem.
//
// This file only ASSEMBLES. Every value lives in a sibling file, grouped by the job it
// does, and the exported object is what the engine, the schema, the seed and the app all
// see. `packages/problems/_template/` mirrors this structure, so a new challenge is a
// copy of that folder with the same seven files filled in.
//
//   meta.js        who this challenge is and how it is advertised
//   dissection.js  the Understand quiz
//   build.js       the shape of the flow and the order it is built in
//   nodeSetup.js   the NDV, per node type
//   probes.js      the wrong-node questions + misconception labels
//   cases.js       the reference build, the Run's cases, the Stress questions
//   voice.js       Iris's narration
//
// The split is a MOVE, not a rewrite: `index.test.js` asserts this object still deep-
// equals a snapshot taken before the file was broken up, so the refactor is provable
// rather than hopeful. Nothing about the shape changed — the schema is unchanged, and
// `validateProblem()` is what enforces it.
import * as meta from './meta.js';
import { dissection } from './dissection.js';
import { nodePalette, branches, flowSummary, flow, buildPhases } from './build.js';
import { nodeSetup } from './nodeSetup.js';
import { nodeProbes, misconceptionLabels } from './probes.js';
import { referenceGraph, testCases, sampleCases, evalQuestions } from './cases.js';
import { voice } from './voice.js';

export const emailTriage = {
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
