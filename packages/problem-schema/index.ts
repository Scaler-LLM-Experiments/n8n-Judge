export * from './types.ts';
export { validateProblem } from './validateProblem.ts';
export type { ProblemIssue, ValidateProblemResult } from './validateProblem.ts';
export { toPublicProblem, findLeakedAnswers, KNOWN_REMAINING_LEAKS } from './publicProjection.ts';
export type { PublicProblem } from './publicProjection.ts';
export { checkAnswer } from './answerCheck.ts';
export type { CheckKind, CheckRequest, CheckResult } from './answerCheck.ts';
export { isFieldVisible, visibleFields, pruneHidden } from './fieldVisibility.ts';
export type { ConditionalField } from './fieldVisibility.ts';
