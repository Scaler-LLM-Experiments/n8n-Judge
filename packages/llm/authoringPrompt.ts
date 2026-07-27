// Builds the AI-assisted authoring request: admin pastes a problem statement +
// program, Claude drafts a full problem object constrained to the editor's
// node vocabulary and the canonical topology (until engine/simulate.js is
// generalized — plan risk #1). The draft is then validated by
// @judge/problem-schema validateProblem() and edited by a human before publish.

export interface AuthoringInput {
  statement: string;
  program: string; // 'SE' | 'AIML' | 'DSML' (free text)
  title?: string;
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
workflows in n8n. A challenge is ONE plain JSON object. Your draft will be validated
mechanically and then reviewed by a human curriculum designer — favor correctness and
completeness over creativity in structure.

HARD CONSTRAINTS
1. The workflow topology MUST be exactly: trigger → AI classify step (with a chat-model
   sub-node attached via the ai_model handle) → parse → switch (with named branches) →
   one reply action per branch. Do not invent other topologies; the simulator's run
   engine only supports this shape today.
2. Only use node types that exist in the editor catalog (listed below). Never invent
   node types.
3. Every nodeSetup field must have EXACTLY ONE option with "correct": true, and every
   option needs a one-sentence "why" a beginner can understand.
4. Every nodeProbes entry must have EXACTLY ONE option with "correct": true (the honest
   "I added it by mistake" escape hatch); wrong options carry a "misconception" code
   that MUST also appear in misconceptionLabels.
5. sampleCases: 4-6 cases; include exactly one intentional fall-through case with
   "branch": null to teach fallback behavior.
6. Distractor nodes in the palette must be plausible (real n8n nodes a beginner might
   reach for) but must never be required by any test case.
7. Write all copy in simple, warm, jargon-free English. The mascot "Iris" narrates the
   coach lines — calm interviewer tone, never a cheerleader, no idioms.
8. Ground distractors and probes in REAL n8n misconceptions, e.g.: forgetting the chat
   model sub-node, feeding raw LLM text into a Switch without parsing, IF vs Switch
   confusion, Switch's silent fallback drop, test-vs-production webhook URLs, hardcoding
   values instead of expressions, Agent-vs-Chain conflation, System-vs-User prompt
   conflation.

The JSON you output must conform to the provided schema. Base structure, field style,
and copy tone on the two exemplar problems.`;

  const user = `## Editor node catalog (the ONLY allowed node types)
${catalogSummary}

## Exemplar problems (structure + tone reference)
${exemplars.map((e, i) => `### Exemplar ${i + 1}\n${JSON.stringify(e, null, 1)}`).join('\n\n')}

## New challenge request
Program: ${input.program}
${input.title ? `Suggested title: ${input.title}` : ''}
Problem statement from the curriculum designer:
"""
${input.statement}
"""
${input.extraGuidance ? `Additional guidance: ${input.extraGuidance}` : ''}

Draft the complete problem JSON object now.`;

  return { system, user, schema: problemJsonSchema };
}
