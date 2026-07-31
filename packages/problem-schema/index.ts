export * from './types.ts';
export { validateProblem } from './validateProblem.ts';
export type { ProblemIssue, ValidateProblemResult } from './validateProblem.ts';
export { toPublicProblem, findLeakedAnswers, KNOWN_REMAINING_LEAKS } from './publicProjection.ts';
export type { PublicProblem } from './publicProjection.ts';
export { checkAnswer } from './answerCheck.ts';
export type { CheckKind, CheckRequest, CheckResult } from './answerCheck.ts';
export { isFieldVisible, visibleFields, pruneHidden } from './fieldVisibility.ts';
export type { ConditionalField } from './fieldVisibility.ts';
export {
  // Structured lists: n8n's repeatable-group parameters (Switch rules, Edit
  // Fields assignments). One algorithm, per-kind vocabulary — see ruleList.ts.
  LIST_SPECS,
  isListKind,
  aspectsFor,
  aspectLabel,
  aspectRowLabel,
  gradeListItems,
  asListItems,
  emptyListItem,
  isListItemComplete,
  listReady,
  gradeListAspect,
  ruleAspectId,
  parseRuleAspectId,
  whyForAspect,
  // Rule-list-specific aliases, kept because most callers name them directly.
  RULE_ASPECTS,
  RULE_ASPECT_LABEL,
  asRules,
  emptyRule,
  isRuleComplete,
  rulesReady,
  gradeRuleAspect,
} from './ruleList.ts';
export type { RuleAspect, LearnerRule, LearnerAssignment } from './ruleList.ts';
