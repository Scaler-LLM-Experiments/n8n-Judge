export {
  claude,
  MODELS,
  structuredCall,
  dialectFromEnv,
  llmConfigured,
  resolveEndpoint,
  resetClient,
  buildStructuredRequest,
  extractJson,
  jsonOnlyInstruction,
} from './client.ts';
export type { StructuredCallOptions, LlmDialect } from './client.ts';
export {
  buildGradingPrompt,
  GRADING_REPORT_SCHEMA,
  DEFAULT_RUBRIC_SYSTEM_PROMPT,
} from './gradingPrompt.ts';
export type { GradingDigest, GradingReportJson } from './gradingPrompt.ts';
export { buildAuthoringPrompt } from './authoringPrompt.ts';
export type { AuthoringInput } from './authoringPrompt.ts';
export { buildAskAiSystemPrompt } from './askAiPrompt.ts';
export type { AskAiContext } from './askAiPrompt.ts';
