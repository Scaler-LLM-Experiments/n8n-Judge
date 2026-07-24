import { z } from 'zod';

// The problem JSON contract. This is the single source of truth for:
// - authoring-time validation (validateProblem)
// - the Claude structured-output contract for AI-drafted problems
// - the shape stored in ProblemVersion.data (JSONB)
//
// Legacy prototype fields (buildSteps, connectionGuide, testCaseSummary) fed
// only the dead DashboardScreen path and are deliberately NOT part of this
// schema; they are tolerated on input (passthrough) so the two seed problems
// load unmodified.

export const nodeCategorySchema = z.enum(['trigger', 'ai', 'model', 'core', 'action']);

export const dissectionQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  options: z.array(z.object({ label: z.string().min(1), type: z.string().min(1) })).min(2),
  correctType: z.string().min(1),
  wrongHint: z.string().min(1),
  explanation: z.string().min(1),
  unlocks: z.array(z.string()),
});

export const paletteNodeSchema = z.object({
  type: z.string().min(1),
  label: z.string().min(1),
  category: nodeCategorySchema,
  isDistractor: z.boolean(),
});

export const referenceGraphSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string().min(1),
      type: z.string().min(1),
      position: z.object({ x: z.number(), y: z.number() }),
      requiredLabel: z.string().optional(),
    })
  ),
  edges: z.array(
    z.object({
      source: z.string().min(1),
      target: z.string().min(1),
      targetHandle: z.string().optional(),
      branch: z.string().optional(),
    })
  ),
});

export const edgeCheckSchema = z.object({
  sourceType: z.string().optional(),
  sourceCategory: z.string().optional(),
  targetType: z.string().optional(),
  targetHandle: z.string().optional(),
  branch: z.string().optional(),
});

export const testCaseSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  kind: z.literal('structural'),
  checks: z.object({
    requiredNodeTypes: z.array(z.string()).optional(),
    requiredEdges: z.array(edgeCheckSchema).optional(),
  }),
});

// A router's labelled outputs. Empty for problems with no routing node.
export const branchSchema = z.object({ id: z.string().min(1), label: z.string().min(1) });

export const flowSummarySchema = z.object({
  steps: z.array(z.object({ type: z.string().min(1), label: z.string().min(1) })).min(1),
  caption: z.string(),
});

export const flowSchema = z.object({
  start: z.array(z.string()).min(1),
  next: z.record(z.string(), z.array(z.string())),
  // Optional: only problems with a router need branchNext; only problems with an
  // AI node that takes a Chat Model need modelNext. Topology is not assumed.
  branchNext: z.array(z.string()).optional(),
  modelNext: z.array(z.string()).optional(),
});

export const buildPhaseSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  coach: z.string().min(1),
  nodeTypes: z.array(z.string()).min(1),
  pickable: z.array(z.string()).min(1),
});

export const nodeSetupFieldOptionSchema = z.object({
  value: z.string(),
  label: z.string().min(1),
  correct: z.boolean(),
  why: z.string().min(1),
});

export const nodeSetupSchema = z.object({
  credential: z.string().optional(),
  locked: z
    .array(z.object({ label: z.string().min(1), value: z.string(), kind: z.string().optional() }))
    .optional(),
  fields: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        subtitle: z.string().optional(),
        options: z.array(nodeSetupFieldOptionSchema).min(2),
      })
    )
    .optional(),
});

export const nodeProbeSchema = z.object({
  prompt: z.string().min(1),
  options: z
    .array(
      z.object({
        text: z.string().min(1),
        correct: z.boolean(),
        misconception: z.string().optional(),
        response: z.string().min(1),
      })
    )
    .min(2),
});

export const sampleCaseSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  subject: z.string().min(1),
  category: z.string().min(1),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  branch: z.string().nullable(),
  reply: z.string().nullable(),
});

export const evalQuestionSchema = z.object({
  id: z.string().min(1),
  caseId: z.string().optional(),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  correctIndex: z.number().int().min(0),
  explanation: z.string().min(1),
});

export const problemSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'id must be a kebab-case slug'),
    title: z.string().min(1),
    tagline: z.string().min(1),
    statement: z.string().min(1),
    dissection: z.array(dissectionQuestionSchema).min(1),
    nodePalette: z.array(paletteNodeSchema).min(2),
    referenceGraph: referenceGraphSchema,
    testCases: z.array(testCaseSchema).min(1),
    branches: z.array(branchSchema), // may be empty for non-routing problems

    flowSummary: flowSummarySchema,
    flow: flowSchema,
    buildPhases: z.array(buildPhaseSchema).min(1),
    nodeSetup: z.record(z.string(), nodeSetupSchema),
    nodeProbes: z.record(z.string(), nodeProbeSchema),
    misconceptionLabels: z.record(z.string(), z.string()),
    sampleCases: z.array(sampleCaseSchema).min(1),
    simulation: z.record(z.string(), z.string()).optional(),
    evalQuestions: z.array(evalQuestionSchema).min(1),
  })
  .passthrough(); // tolerate legacy prototype fields on input

export type Problem = z.infer<typeof problemSchema>;
export type PaletteNode = z.infer<typeof paletteNodeSchema>;
export type BuildPhase = z.infer<typeof buildPhaseSchema>;
export type SampleCase = z.infer<typeof sampleCaseSchema>;
export type EvalQuestion = z.infer<typeof evalQuestionSchema>;

// Decision shape recorded by the grading store (mirrors packages/engine/grading.js).
export const decisionSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['dissection', 'nodePick', 'field', 'stress']),
  label: z.string(),
  correct: z.boolean(),
  firstTry: z.boolean(),
  misconception: z.string().optional(),
  chosenLabel: z.string().optional(),
  correctLabel: z.string().optional(),
});
export type Decision = z.infer<typeof decisionSchema>;
