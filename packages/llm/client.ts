import Anthropic from '@anthropic-ai/sdk';

// One client, models from env. All Judge LLM features (grading reports,
// authoring drafts, Ask-AI chat) run on the Claude API.
let client: Anthropic | null = null;

export function claude(): Anthropic {
  if (!client) client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  return client;
}

// Model tiers (swappable via env). Decision: Sonnet for grading and authoring
// (authoring doesn't need a heavier model); a cheaper tier for the Ask-AI chat.
export const MODELS = {
  grading: () => process.env.JUDGE_GRADING_MODEL ?? 'claude-sonnet-5',
  authoring: () => process.env.JUDGE_AUTHORING_MODEL ?? 'claude-sonnet-5',
  askAi: () => process.env.JUDGE_ASKAI_MODEL ?? 'claude-haiku-4-5-20251001',
};

export interface StructuredCallOptions {
  model: string;
  system: string;
  user: string;
  /** JSON Schema the response text must conform to (output_config.format). */
  schema: Record<string, unknown>;
  maxTokens?: number;
  /**
   * How much thinking to spend. Omitted means the API default, `high`.
   *
   * This is the main latency lever, and it is why the Result screen used to sit on
   * a loader: the default spends `high`-effort thinking on what is a short piece of
   * writing over a trace that is already summarised, and the learner waits for all
   * of it. Grading runs at `low`.
   */
  effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max';
}

// Structured-output call: streams (timeout safety), returns parsed JSON.
// output_config.format guarantees the first text block is valid JSON per schema.
export async function structuredCall<T>(opts: StructuredCallOptions): Promise<{
  data: T;
  usage: { inputTokens: number; outputTokens: number };
  stopReason: string | null;
}> {
  const stream = claude().messages.stream({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 16000,
    thinking: { type: 'adaptive' },
    system: opts.system,
    output_config: {
      format: { type: 'json_schema', schema: opts.schema },
      ...(opts.effort ? { effort: opts.effort } : {}),
    },
    messages: [{ role: 'user', content: opts.user }],
  } as Parameters<Anthropic['messages']['stream']>[0]);

  const message = await stream.finalMessage();

  if (message.stop_reason === 'refusal') {
    throw new Error('Model declined the grading/authoring request (stop_reason: refusal)');
  }
  const text = message.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') {
    throw new Error(`No text block in structured response (stop_reason: ${message.stop_reason})`);
  }
  return {
    data: JSON.parse(text.text) as T,
    usage: {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    },
    stopReason: message.stop_reason,
  };
}
