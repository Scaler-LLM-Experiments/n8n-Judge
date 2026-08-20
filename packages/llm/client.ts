import Anthropic from '@anthropic-ai/sdk';

// One client, models from env. Judge's LLM features (grading reports, authoring
// drafts, Ask-AI chat) all speak the Anthropic Messages API.
//
// **The provider is not necessarily Anthropic.** The same SDK points at any
// Messages-API-compatible gateway — OpenRouter is the one this was built for, and
// through it the models need not be Anthropic's either (gpt-5.6-luna runs fine).
// Two of the three call sites send nothing Anthropic-specific; only the structured
// (grading) call does, which is what `dialectFromEnv` exists to decide. See
// `buildStructuredRequest` below.
let client: Anthropic | null = null;

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api';

/**
 * Where to send requests and with which key.
 *
 * `ANTHROPIC_*` wins, so an existing Anthropic deployment is untouched. Setting
 * `OPENROUTER_API_KEY` alone is enough to move the whole app over: the base URL
 * defaults with it, because a key for one service and a URL for another is a
 * misconfiguration nobody would choose on purpose.
 */
export function resolveEndpoint(env: NodeJS.ProcessEnv = process.env): {
  apiKey: string | undefined;
  baseURL: string | undefined;
} {
  const openRouterKey = env.OPENROUTER_API_KEY?.trim();
  const anthropicKey = env.ANTHROPIC_API_KEY?.trim();
  const explicitBase = env.ANTHROPIC_BASE_URL?.trim();

  if (!anthropicKey && openRouterKey) {
    return { apiKey: openRouterKey, baseURL: explicitBase || OPENROUTER_BASE_URL };
  }
  return { apiKey: anthropicKey || undefined, baseURL: explicitBase || undefined };
}

/**
 * Is any provider configured at all?
 *
 * Callers gate on this instead of reading `ANTHROPIC_API_KEY` themselves. Both
 * routes used to do the latter, which is why Ask Iris reported "not configured"
 * and the Result screen dropped its written half on a deploy that had a perfectly
 * good OPENROUTER_API_KEY: the key was there, the check was looking elsewhere.
 */
export function llmConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(resolveEndpoint(env).apiKey);
}

export function claude(): Anthropic {
  if (!client) {
    const { apiKey, baseURL } = resolveEndpoint();
    client = new Anthropic({ ...(apiKey ? { apiKey } : {}), ...(baseURL ? { baseURL } : {}) });
  }
  return client;
}

/** Reset the memoized client. Tests only — nothing in the app rebuilds it. */
export function resetClient(): void {
  client = null;
}

// Model tiers (swappable via env). Decision: Sonnet for grading and authoring
// (authoring doesn't need a heavier model); a cheaper tier for the Ask-AI chat.
//
// A gateway needs its own ids — OpenRouter wants `anthropic/claude-sonnet-5`,
// not `claude-sonnet-5` — which is why all three are env-driven.
export const MODELS = {
  grading: () => process.env.JUDGE_GRADING_MODEL ?? 'claude-sonnet-5',
  authoring: () => process.env.JUDGE_AUTHORING_MODEL ?? 'claude-sonnet-5',
  askAi: () => process.env.JUDGE_ASKAI_MODEL ?? 'claude-haiku-4-5-20251001',
};

/**
 * How much of the Messages API the endpoint actually implements — a property of
 * the ENDPOINT, not of the model vendor. `extended` may use adaptive thinking,
 * `output_config.format` and `effort`; `basic` is messages-in, text-out.
 *
 * Anthropic is `extended` by definition. OpenRouter was measured (2026-08-19) to
 * be `extended` too — a schema-constrained request there returned bare JSON even
 * when the prompt explicitly asked for prose inside a code fence — and that holds
 * for OpenAI models routed through it, not only Anthropic ones.
 */
export type LlmDialect = 'extended' | 'basic';

/** Hosts known to implement the Anthropic-only request fields. */
const EXTENDED_HOSTS = [/(^|\.)anthropic\.com$/, /(^|\.)openrouter\.ai$/];

/**
 * Which dialect to speak. `JUDGE_LLM_DIALECT` wins when set; otherwise inferred
 * from the endpoint. An unknown gateway is assumed `basic`: the failure that
 * matters is a gateway silently IGNORING a schema, which surfaces as unparseable
 * grading output at the end of a request a learner already waited through.
 */
export function dialectFromEnv(env: NodeJS.ProcessEnv = process.env): LlmDialect {
  const explicit = env.JUDGE_LLM_DIALECT?.trim().toLowerCase();
  if (explicit === 'extended' || explicit === 'basic') return explicit;

  const { baseURL } = resolveEndpoint(env);
  if (!baseURL) return 'extended'; // the SDK default is Anthropic
  try {
    const host = new URL(baseURL).hostname;
    return EXTENDED_HOSTS.some((re) => re.test(host)) ? 'extended' : 'basic';
  } catch {
    return 'basic';
  }
}

export interface StructuredCallOptions {
  model: string;
  system: string;
  user: string;
  /** JSON Schema the response text must conform to. */
  schema: Record<string, unknown>;
  maxTokens?: number;
  /**
   * How much thinking to spend. Omitted means the API default, `high`.
   *
   * This is the main latency lever, and it is why the Result screen used to sit on
   * a loader: the default spends `high`-effort thinking on what is a short piece of
   * writing over a trace that is already summarised, and the learner waits for all
   * of it. Grading runs at `low`. Ignored on a `basic` endpoint, which has no such parameter.
   */
  effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max';
  /** Overrides the env-derived dialect. Tests and one-off scripts. */
  dialect?: LlmDialect;
}

/**
 * The instruction that replaces `output_config.format` on an endpoint that does
 * not implement it. Weaker than a schema the server enforces — which is exactly
 * why `extractJson` below refuses to trust the model's framing.
 */
export function jsonOnlyInstruction(schema: Record<string, unknown>): string {
  return [
    'Reply with a single JSON object and nothing else.',
    'No prose before or after it, and no markdown code fences.',
    'It must validate against this JSON Schema:',
    JSON.stringify(schema),
  ].join('\n');
}

/**
 * The request body, per dialect. Split out from `structuredCall` so the shape
 * is testable without a network call — the whole point of this file is which
 * fields are present, and that is otherwise only observable in production.
 */
export function buildStructuredRequest(
  opts: StructuredCallOptions,
  dialect: LlmDialect
): Record<string, unknown> {
  const base = {
    model: opts.model,
    max_tokens: opts.maxTokens ?? 16000,
    messages: [{ role: 'user', content: opts.user }],
  };

  if (dialect === 'extended') {
    return {
      ...base,
      system: opts.system,
      thinking: { type: 'adaptive' },
      output_config: {
        format: { type: 'json_schema', schema: opts.schema },
        ...(opts.effort ? { effort: opts.effort } : {}),
      },
    };
  }

  // A gateway may accept these fields and ignore them, which is worse than
  // rejecting them: the reply comes back unconstrained and the parse fails at
  // the end of a request the learner already waited for. So they are omitted,
  // and the schema moves into the system prompt where any model can honour it.
  return {
    ...base,
    system: `${opts.system}\n\n${jsonOnlyInstruction(opts.schema)}`,
  };
}

/**
 * Pull the JSON object out of a model's reply.
 *
 * With `output_config.format` the text IS the object and this is a no-op. Without
 * it, models wrap JSON in prose or a ```json fence often enough that a bare
 * `JSON.parse` is a coin toss — and losing that toss costs the learner the whole
 * written half of their report. Scans for the first balanced object, respecting
 * strings and escapes so a brace inside a sentence in one of the fields cannot
 * end the scan early.
 */
export function extractJson(text: string): string {
  const trimmed = text.trim();

  // Fenced block: take what is inside the first fence.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : trimmed).trim();
  if (body.startsWith('{')) {
    const balanced = firstBalancedObject(body);
    if (balanced) return balanced;
  }

  const balanced = firstBalancedObject(body);
  if (balanced) return balanced;
  // Nothing object-shaped: hand back the original so JSON.parse throws with the
  // model's actual words in the message, which is what a reader needs.
  return body;
}

function firstBalancedObject(s: string): string | null {
  const start = s.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < s.length; i += 1) {
    const ch = s[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      if (inString) escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

// Structured-output call: streams (timeout safety), returns parsed JSON.
export async function structuredCall<T>(opts: StructuredCallOptions): Promise<{
  data: T;
  usage: { inputTokens: number; outputTokens: number };
  stopReason: string | null;
}> {
  const dialect = opts.dialect ?? dialectFromEnv();
  const request = buildStructuredRequest(opts, dialect);

  const stream = claude().messages.stream(
    request as Parameters<Anthropic['messages']['stream']>[0]
  );

  const message = await stream.finalMessage();

  if (message.stop_reason === 'refusal') {
    throw new Error('Model declined the grading/authoring request (stop_reason: refusal)');
  }
  const text = message.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') {
    throw new Error(`No text block in structured response (stop_reason: ${message.stop_reason})`);
  }
  return {
    data: JSON.parse(extractJson(text.text)) as T,
    usage: {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    },
    stopReason: message.stop_reason,
  };
}
