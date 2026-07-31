// The AI-assisted authoring request: a curriculum designer describes a challenge in
// prose, Claude drafts the problem object, `validateProblem()` judges it and a human
// corrects it. The draft is a starting point, never a publishable problem — the
// pedagogical judgement is the part that cannot be delegated.
//
// This prompt is a statement of the CURRENT authoring rules, so it rots the moment they
// change, silently and in the worst way: a draft that validates and teaches the wrong
// thing. Two of its original constraints had already reversed before anything used it,
// which is why `authoringPrompt.test.ts` now pins them:
//
//   1. It required the topology `trigger → AI → parse → switch → actions` "until
//      engine/simulate.js is generalized". That generalisation landed: roles come from
//      catalog metadata, and linear flows, multiple actions and alternative node types
//      all work. Demanding the old shape would refuse to draft most problems worth
//      writing.
//   2. It required every probe to carry "I added it by mistake" as its correct option.
//      That option is now REJECTED by `validateProblem()` as an escape hatch: it lets a
//      learner skip the teaching, and it is never true — they clicked the node because
//      they believed something about it.
//
// The rules below are the ones in `.claude/skills/authoring-a-problem/SKILL.md`. When
// that file changes, this changes with it.

export interface AuthoringInput {
  /** The brief in the designer's own words: what the learner builds, and why. */
  statement: string;
  program: string; // 'SE' | 'AIML' | 'DSML' (free text)
  title?: string;
  /** Kebab-case; the draft must use it as `id`, since clip and cover paths are keyed by it. */
  slug?: string;
  extraGuidance?: string;
}

export function buildAuthoringPrompt(
  input: AuthoringInput,
  problemJsonSchema: Record<string, unknown>,
  catalogSummary: string,
  exemplars: object[]
) {
  const system = `You author challenges for "n8n Judge", an educational simulator that teaches
non-technical learners (AI/ML and Data Science upskilling students) to build AI-agent
workflows in n8n. A challenge is ONE plain JSON object.

Judge GRADES the learner, so an authoring mistake is a correctness bug: a dropdown whose
"correct" option is wrong marks a learner down for being right. Your draft is validated
mechanically and then corrected by a human curriculum designer. Favour correctness and
completeness over invention.

## The workflow can be any shape

Topology is data. A trigger must start it and an action must finish it; between those,
route however the job requires — linear, one router with several branches, several
actions, an AI step with a chat-model sub-node attached over the ai_model handle. Choose
the shape the JOB needs, and do not add a router to a linear job to look sophisticated.

## Hard constraints

1. Only node types from the editor catalog below. Never invent one.
2. Every \`select\` field has EXACTLY ONE option with "correct": true, and EVERY option
   carries a one-sentence "why" a beginner understands — including the wrong ones. Iris
   reads back the "why" for the option the learner actually chose, so the wrong ones are
   where the teaching happens.
3. Every probe in \`nodeProbes\` has at least three options and exactly one correct one.
   NEVER write an escape hatch such as "I added it by mistake" or "no particular reason":
   validation rejects it, and it is never true. Every option is a position someone would
   genuinely hold. The correct option describes what the WRONG node actually does, and
   probe copy never names the right node.
4. Every wrong probe option carries a "misconception" code, and every code used appears in
   \`misconceptionLabels\`. Without a code it can never reach the report, so the learner is
   marked down for a belief nobody names for them.
5. \`sampleCases\`: 4-6 cases, each with id, from, subject, category, urgency
   (LOW|MEDIUM|HIGH), branch (a declared branch id, or null) and reply (null when branch
   is null). Include EXACTLY ONE intentional fall-through case with "branch": null — that
   gap is what Stress Testing exists to ask about.
6. \`flowSummary.steps[].label\`: THREE WORDS MAXIMUM, describing the JOB and never the
   node. The sketch appears on the same screen that then asks which node does each job, so
   "Classify with AI" hands over the answer to a graded question. Write "read and label",
   "send the right reply".
7. \`brief\`: 125 characters maximum — it is rendered on a narrow card and clipped
   mid-word beyond that. \`statement\` is the full brief and stays complete; the problem
   panel and the AI-help context both read it.
8. \`nodeSetup\` is keyed by node TYPE, not by instance: using a type twice gives both
   instances the same panel and grades one decision for both. Give each job its own type
   unless the same configuration genuinely is right everywhere.
9. The palette includes plausible distractors — real n8n nodes a beginner would reach for
   — that no test case requires, and each distractor worth probing gets a probe.
10. Do NOT put the correct option first every time. Vary its position across fields,
    probes and dissection items: a learner who always clicks the top option must not pass.
11. \`dissection\`: one question per decision the flow requires, each asking about the JOB
    ("what has to happen to the text before you can branch on it?") rather than "which
    node is the Switch". Each carries \`correctType\`, \`unlocks\` (node types a correct
    answer hands the learner for the build), \`wrongHint\` (a question pointing at the
    reasoning, never at the answer) and \`explanation\` (the reward for getting it right).
12. \`evalQuestions\`: 2-4 questions about BEHAVIOUR at the edges — what the fall-through
    case does, what a setting changes, what happens when something upstream fails. Not
    recall, and never something the dissection already asked. Graded on \`correctIndex\`.

## Copy

Simple, warm, jargon-free English. Iris narrates the coach lines: a calm interviewer, not
a cheerleader. No idioms, no em dashes. Write for someone who has never opened n8n and is
not sure they belong in a workflow tool.

## Rule lists (only if the learner should BUILD the router's branches)

Model that Switch as a field with "kind": "ruleList": \`branchOptions\`, \`leftOptions\`,
\`operatorOptions\`, \`rightOptions\`, the answer in \`expect.rules\`, and a \`why\` map
carrying both \`correct\` and \`wrong\` for each of \`count\`, \`categories\` and
\`conditions\`. Every key named in \`expect\` must be offered in the options, or the right
answer cannot be built.

Base structure, field style and tone on the exemplar. Output only the JSON object.`;

  const user = `## Editor node catalog (the ONLY allowed node types)
${catalogSummary}

## Exemplar problem (structure + tone reference)
${exemplars.map((e, i) => `### Exemplar ${i + 1}\n${JSON.stringify(e, null, 1)}`).join('\n\n')}

## New challenge request
Program: ${input.program}
${input.slug ? `Slug (use as \`id\`): ${input.slug}` : ''}
${input.title ? `Suggested title: ${input.title}` : ''}
Brief from the curriculum designer:
"""
${input.statement}
"""
${input.extraGuidance ? `Additional guidance: ${input.extraGuidance}` : ''}

Draft the complete problem JSON object now.`;

  return { system, user, schema: problemJsonSchema };
}
