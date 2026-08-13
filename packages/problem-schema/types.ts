import { z } from 'zod';

// The problem JSON contract. This is the single source of truth for:
// - authoring-time validation (validateProblem)
// - the Claude structured-output contract for AI-drafted problems
// - the shape stored in ProblemVersion.data (JSONB)
//
// The legacy prototype fields (buildSteps, connectionGuide, testCaseSummary)
// have been removed from every problem along with the dead DashboardScreen
// path they fed. The "What Run will check" list is derived from
// testCases[].description, so it has a single source of truth.

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
      /**
       * The correct build's own configuration, for the parameters that change a
       * node's STRUCTURAL role rather than just its answer — today that is the
       * operation on an app node, which decides whether it ends the flow or
       * hands data on (see `passthroughWhen` in the catalog). Optional, and only
       * worth setting when the topology depends on it: everything else the
       * learner configures is graded through `nodeSetup`, not asserted here.
       */
      values: z.record(z.string(), z.unknown()).optional(),
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
  //
  // Two shapes. An array means every exit accepts the same types — right when a
  // router's branches all end at the same kind of node. A record keyed by branch id
  // scopes each exit separately, which is what a problem whose exits end at DIFFERENT
  // types needs: with one shared list the editor can only ask "is this a destination
  // at all?", so the right node on the wrong exit is accepted and only fails later,
  // at the Run, after the build phase has already gone green.
  branchNext: z.union([z.array(z.string()), z.record(z.string(), z.array(z.string()))]).optional(),
  modelNext: z.array(z.string()).optional(),
  /**
   * What the Chat Model drawer OFFERS, as distinct from what is correct.
   *
   * Everywhere else these are already two different things — a phase's `pickable`
   * is the menu and `flow.next` is the answer — which is what lets a build phase
   * offer plausible wrong nodes and have Iris probe the pick. The model slot had
   * no equivalent, so its drawer listed exactly the right answer and the hardest
   * "which brain?" decision in a case was a one-item menu.
   *
   * Optional, and defaults to `modelNext`, so a problem that does not author it
   * behaves exactly as before. Must CONTAIN every type in `modelNext`, or the
   * correct answer is not offerable — validateProblem rejects that.
   */
  modelOptions: z.array(z.string()).optional(),
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
  /**
   * The real n8n expression this option means, when that is not what the learner
   * should be shown.
   *
   * `label` used to do both jobs. The exporter resolves an authored
   * `expect.assignments` token back through `valueOptions` to the option's **label**
   * and writes it into the workflow file, so a label had to be a working expression
   * even when the thing being compared was a seven-entry lookup table. That is how one
   * case grew a 296-character inline JavaScript ternary as a dropdown choice, shown to
   * learners who cannot read JavaScript, truncated mid-token in a 420px control.
   *
   * Set `expression` and the two jobs separate: the learner reads `label`, the exported
   * workflow gets `expression`. Omit it and `label` is still used for both, which is
   * correct for the many options whose expression is already short and readable
   * (`{{ $json["Referral Source"] }}`).
   */
  expression: z.string().min(1).optional(),
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
        // Parameter kinds mirror n8n's. `select` is the default and the only
        // one that carries `options`; the rest compare a typed value against
        // `correct`, so they carry their own explanations instead of
        // per-option ones.
        // `resourceLocator` is n8n's "which record?" control and it is
        // structurally different from a select: the stored value is
        // `{ __rl: true, mode, value }` — the thing chosen PLUS how it was
        // chosen. Modelling it as a dropdown loses the mode, which is the part
        // that teaches "you can point at a resource by picking it, by pasting
        // its ID, or by URL". See docs/n8n-reference §4.
        kind: z
          .enum(['select', 'text', 'number', 'boolean', 'expression', 'resourceLocator', 'ruleList', 'assignmentList'])
          .optional(),
        /** resourceLocator: which lookup modes this field offers. */
        modes: z.array(z.enum(['list', 'id', 'url'])).min(1).optional(),
        /**
         * ruleList: the vocabulary a learner builds rules from. Each list should
         * carry plausible wrong choices as well as the right ones — a picker
         * containing only correct answers is not a question.
         */
        addLabel: z.string().optional(),
        branchOptions: z.array(nodeSetupFieldOptionSchema).min(2).optional(),
        leftOptions: z.array(nodeSetupFieldOptionSchema).min(2).optional(),
        operatorOptions: z.array(nodeSetupFieldOptionSchema).min(2).optional(),
        rightOptions: z.array(nodeSetupFieldOptionSchema).min(2).optional(),
        /**
         * assignmentList: n8n's Edit Fields, a repeatable list of name → value
         * assignments. Same machinery as a rule list, simpler entries.
         */
        nameOptions: z.array(nodeSetupFieldOptionSchema).min(2).optional(),
        valueOptions: z.array(nodeSetupFieldOptionSchema).min(2).optional(),
        /**
         * ruleList: one explanation per graded aspect, per verdict. A separate
         * shape from a select's per-option `why` because the three aspects are
         * three different questions, and from `whyCorrect`/`whyWrong` because
         * there are three of them.
         */
        why: z
          .record(z.object({ correct: z.string().min(1), wrong: z.string().min(1) }))
          .optional(),
        /** ruleList: the authored answer — the rules the flow actually needs. */
        expect: z
          .object({
            rules: z
              .array(
                z.object({
                  outputKey: z.string().min(1),
                  left: z.string().min(1),
                  operator: z.string().min(1),
                  right: z.string().min(1),
                })
              )
              .min(1)
              .optional(),
            assignments: z
              .array(z.object({ name: z.string().min(1), value: z.string().min(1) }))
              .min(1)
              .optional(),
          })
          .optional(),
        options: z.array(nodeSetupFieldOptionSchema).min(2).optional(),
        correct: z.union([z.string(), z.number(), z.boolean()]).optional(),
        /** Alternative spellings that should also be accepted (expressions). */
        accepts: z.array(z.string()).optional(),
        whyCorrect: z.string().optional(),
        whyWrong: z.string().optional(),
        placeholder: z.string().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        step: z.number().optional(),
        /**
         * Show this field only when other fields hold certain values — n8n's
         * `displayOptions.show`, in the same shape: every named key must match
         * one of its listed values (AND across keys, OR within one).
         *
         *   showWhen: { fallback: ['separate'] }
         *
         * Real nodes reveal and hide fields as you configure them, and that is
         * a large part of why the real NDV feels dense. It also carries a
         * grading rule: in n8n a required parameter that is currently HIDDEN is
         * never "missing" (node-helpers.ts:1532), so a hidden field must not be
         * demanded here either — and must not be scored against a learner who
         * was never shown it. See `enumerateItems` in packages/engine/rubric.ts
         * and docs/n8n-reference/00-how-n8n-actually-works.md §5.
         */
        showWhen: z.record(z.array(z.union([z.string(), z.number(), z.boolean()]))).optional(),
      })
        .refine(
          (f) => {
            const kind = f.kind ?? 'select';
            if (kind === 'select' || kind === 'resourceLocator') return Array.isArray(f.options);
            // A rule list's answer is a STRUCTURE, so it carries `expect` rather
            // than a single `correct` value.
            if (kind === 'ruleList') return Array.isArray(f.expect?.rules);
            if (kind === 'assignmentList') return Array.isArray(f.expect?.assignments);
            return f.correct !== undefined;
          },
          {
            message:
              'A select/resourceLocator field needs `options`; a ruleList needs `expect.rules`; any other kind needs a `correct` value',
          }
        )
    )
    .optional(),
  /**
   * Graded node settings — n8n's Settings tab, not its Parameters tab.
   *
   * A DIFFERENT shape from `fields` on purpose: a setting's control comes from
   * `SETTINGS_SPEC`, so the problem supplies only the answer and the explanations,
   * keyed by the value the learner chose. `why` keys are strings even when the
   * value is a boolean (`{ false: '…', true: '…' }`), because that is how a form
   * value arrives.
   *
   * This block was absent from the schema until 2026-08-11, and zod strips unknown
   * keys — so `validateProblem()` never saw it, and the template's wrong shape
   * (`options: [{ correct: true }]`) produced an undefined `graded.correct`, which
   * marks every learner wrong forever AND ships the answer key to the browser.
   */
  settings: z
    .array(
      z.object({
        key: z.string().min(1),
        correct: z.union([z.string(), z.number(), z.boolean()]),
        why: z.record(z.string().min(1)),
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
    /**
     * The two-line version, for every surface a learner reads BEFORE committing:
     * the Understand hero and the Home card.
     *
     * `statement` is the full brief and stays that way — it is what the problem
     * panel, the sticky note and Ask-AI's context all read, so it has to carry
     * every detail. But a wall of text is the wrong thing to open a screen with.
     * Hence a separate, hard-capped field rather than a truncation: the author
     * decides what survives the cut, not a CSS ellipsis.
     *
     * The cap is set by the NARROWER of the two surfaces. The Understand hero is
     * 17px in a 640px column and fits ~180 characters in two lines; the Home card
     * is 13.5px in a ~440px column and fits ~120. Cards clamp to two lines, so
     * anything past that gets cut mid-word — measured, after exactly that happened.
     */
    brief: z.string().min(1).max(125, 'brief must fit two lines on a Home card — keep it under 125 characters').optional(),
    /**
     * How hard this challenge is, as the author intends it to be read.
     *
     * Separate from `problemComplexity()`, which counts graded decisions and orders
     * the catalogue easiest-first. That number is right for "what should I practise
     * next" and wrong for a card badge: it is derived, so it moves when the rubric
     * moves, and it cannot say that a problem is long rather than subtle. A learner
     * choosing a challenge wants to know what they are in for before they start.
     *
     * Optional, and absent means no badge — the three original problems predate it.
     */
    difficulty: z.enum(['easy', 'moderate', 'difficult']).optional(),
    /** A short note on why it earns that label, shown under the badge. */
    difficultyNote: z.string().optional(),
    /**
     * Roughly how long a first attempt takes, in whole minutes, for the "Moderate ·
     * 25 min" line on the Home card.
     *
     * Authored, like `difficulty`, and for the same reason: it is a promise made to
     * someone deciding whether to start now, so it must not move when the rubric
     * does. The shipped values were sized from each problem's real decision count
     * (`enumerateItems`) and then rounded to something a human would say.
     */
    estimatedMinutes: z.number().int().positive().optional(),
    /**
     * The card's cover art.
     *
     * `prompt` is authored NOW and `src` is filled in LATER — the images are to be
     * generated from these prompts, so the field carries the intent even while
     * there is nothing to show. A null `src` is a normal, permanent-until-generated
     * state, and the card draws its own placeholder for it rather than leaving a
     * hole. Keeping the prompt in the problem data means the art can be regenerated
     * from the same description that produced it.
     */
    coverImage: z
      .object({
        prompt: z.string().min(1),
        src: z.string().min(1).nullable().default(null),
        alt: z.string().min(1).optional(),
      })
      .optional(),
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
    /**
     * What Iris says on this problem, overriding the default phrase book.
     *
     * Keys are moments, optionally suffixed with a node type for a line that only
     * plays for that node:
     *
     *   voice: {
     *     'node_placed:switch': ['[calm] This is where the three kinds of email split up.'],
     *     phase_complete:       ['[excited] That is the routing done.'],
     *   }
     *
     * The point is that generic narration cannot know what the flow is FOR. The
     * defaults in apps/web/src/lib/voiceLines.js are the floor; these are how a
     * problem stops sounding like every other problem.
     *
     * Same rule as everywhere else: a line must never give the answer. The
     * authoring lint checks for that, because unlike an option's `why`, a voice
     * line plays BEFORE the learner has committed to anything.
     */
    voice: z.record(z.string(), z.array(z.string().min(1)).min(1)).optional(),
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
/**
 * Every kind of graded decision that can appear in a trace.
 *
 * Two vocabularies meet here, and both are real:
 *   - what the CLIENT store records — `nodePick` for a node choice
 *   - what the CHECK API records    — `placement` for the same thing, plus
 *                                     `probe` for the follow-up question
 * The union has to cover both, because the grading worker replays rows written
 * by either. `setting` and `placement` shipped after this enum was first written
 * and were missing, so events for two of the five graded surfaces would have
 * been rejected at ingest.
 */
export const DECISION_KINDS = [
  'dissection',
  'nodePick',
  'placement',
  'field',
  'setting',
  'probe',
  'stress',
] as const;

export const decisionSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(DECISION_KINDS),
  label: z.string(),
  correct: z.boolean(),
  firstTry: z.boolean(),
  misconception: z.string().optional(),
  chosenLabel: z.string().optional(),
  correctLabel: z.string().optional(),
});
export type Decision = z.infer<typeof decisionSchema>;
