import { describe, it, expect } from 'vitest';
import {
  dialectFromEnv,
  resolveEndpoint,
  llmConfigured,
  buildStructuredRequest,
  extractJson,
  jsonOnlyInstruction,
  type StructuredCallOptions,
} from './client.ts';

// The dialect switch and the parse are the two things that decide whether a
// learner gets their written feedback. Neither is observable in the app until a
// report comes back empty, so both are pinned here.

const SCHEMA = {
  type: 'object',
  properties: { strengths: { type: 'array', items: { type: 'string' } } },
  required: ['strengths'],
  additionalProperties: false,
} as const;

const opts: StructuredCallOptions = {
  model: 'test-model',
  system: 'You grade attempts.',
  user: 'Grade this.',
  schema: SCHEMA as unknown as Record<string, unknown>,
  effort: 'low',
  maxTokens: 3000,
};

const env = (o: Record<string, string>) => o as unknown as NodeJS.ProcessEnv;

describe('resolveEndpoint', () => {
  it('uses the Anthropic key and the SDK default when only that is set', () => {
    expect(resolveEndpoint(env({ ANTHROPIC_API_KEY: 'sk-ant-x' }))).toEqual({
      apiKey: 'sk-ant-x',
      baseURL: undefined,
    });
  });

  it('an OpenRouter key alone brings its own base url', () => {
    // A key for one service with no URL for it is the misconfiguration this
    // avoids: the request would go to Anthropic with an OpenRouter key.
    expect(resolveEndpoint(env({ OPENROUTER_API_KEY: 'sk-or-x' }))).toEqual({
      apiKey: 'sk-or-x',
      baseURL: 'https://openrouter.ai/api',
    });
  });

  it('an explicit base url still wins', () => {
    expect(
      resolveEndpoint(env({ OPENROUTER_API_KEY: 'sk-or-x', ANTHROPIC_BASE_URL: 'https://gw.local/api' }))
    ).toEqual({ apiKey: 'sk-or-x', baseURL: 'https://gw.local/api' });
  });

  it('an Anthropic key wins over an OpenRouter one, so an existing deploy is untouched', () => {
    expect(
      resolveEndpoint(env({ ANTHROPIC_API_KEY: 'sk-ant-x', OPENROUTER_API_KEY: 'sk-or-x' }))
    ).toEqual({ apiKey: 'sk-ant-x', baseURL: undefined });
  });
});

describe('dialectFromEnv', () => {
  it('defaults to extended with no base url (the SDK default is Anthropic)', () => {
    expect(dialectFromEnv(env({}))).toBe('extended');
  });

  it('is extended for Anthropic', () => {
    expect(dialectFromEnv(env({ ANTHROPIC_BASE_URL: 'https://api.anthropic.com' }))).toBe('extended');
  });

  it('is extended for OpenRouter — measured, not assumed', () => {
    // 2026-08-19: a schema-constrained request there returned bare JSON even when
    // the prompt asked for prose in a code fence, on an OpenAI model.
    expect(dialectFromEnv(env({ OPENROUTER_API_KEY: 'sk-or-x' }))).toBe('extended');
    expect(dialectFromEnv(env({ ANTHROPIC_BASE_URL: 'https://openrouter.ai/api' }))).toBe('extended');
  });

  it('assumes basic for an unknown gateway', () => {
    expect(dialectFromEnv(env({ ANTHROPIC_BASE_URL: 'https://gw.example.com/api' }))).toBe('basic');
  });

  it('lets an operator force either dialect', () => {
    expect(
      dialectFromEnv(env({ ANTHROPIC_BASE_URL: 'https://gw.example.com/api', JUDGE_LLM_DIALECT: 'extended' }))
    ).toBe('extended');
    expect(
      dialectFromEnv(env({ ANTHROPIC_BASE_URL: 'https://api.anthropic.com', JUDGE_LLM_DIALECT: 'basic' }))
    ).toBe('basic');
  });

  it('falls back to basic on an unparseable base url', () => {
    // The failure that matters is a gateway silently ignoring a schema, which
    // surfaces only at the end of a request the learner already waited through.
    expect(dialectFromEnv(env({ ANTHROPIC_BASE_URL: 'not a url' }))).toBe('basic');
  });
});

describe('buildStructuredRequest', () => {
  it('sends the Anthropic-only fields on an extended endpoint', () => {
    const req = buildStructuredRequest(opts, 'extended') as Record<string, any>;
    expect(req.thinking).toEqual({ type: 'adaptive' });
    expect(req.output_config.format).toEqual({ type: 'json_schema', schema: SCHEMA });
    expect(req.output_config.effort).toBe('low');
    expect(req.system).toBe('You grade attempts.');
    expect(req.max_tokens).toBe(3000);
  });

  it('omits every Anthropic-only field on a basic endpoint', () => {
    const req = buildStructuredRequest(opts, 'basic') as Record<string, any>;
    expect(req.thinking).toBeUndefined();
    expect(req.output_config).toBeUndefined();
    expect(req.max_tokens).toBe(3000);
  });

  it('moves the schema into the system prompt when the server cannot enforce it', () => {
    const req = buildStructuredRequest(opts, 'basic') as Record<string, any>;
    expect(req.system).toContain('You grade attempts.');
    expect(req.system).toContain(jsonOnlyInstruction(SCHEMA as unknown as Record<string, unknown>));
    expect(req.system).toContain('"strengths"');
  });

  it('keeps the same model and user message either way', () => {
    const a = buildStructuredRequest(opts, 'extended') as Record<string, any>;
    const b = buildStructuredRequest(opts, 'basic') as Record<string, any>;
    expect(a.model).toBe(b.model);
    expect(a.messages).toEqual(b.messages);
  });
});

describe('extractJson', () => {
  it('passes a bare object through', () => {
    expect(extractJson('{"ok":true}')).toBe('{"ok":true}');
  });

  it('unwraps a json code fence', () => {
    expect(extractJson('```json\n{"ok":true}\n```')).toBe('{"ok":true}');
  });

  it('unwraps an unlabelled fence', () => {
    expect(extractJson('```\n{"ok":true}\n```')).toBe('{"ok":true}');
  });

  it('drops prose before and after the object', () => {
    expect(extractJson('Here is the report:\n{"ok":true}\nHope that helps!')).toBe('{"ok":true}');
  });

  it('does not stop at a brace inside a string', () => {
    // A grading narrative really can contain a brace: "set onError to {{ $json }}".
    const text = '{"note":"set it to {{ $json }} here","ok":true}';
    expect(extractJson(`prose ${text}`)).toBe(text);
    expect(JSON.parse(extractJson(`prose ${text}`)).ok).toBe(true);
  });

  it('does not stop at an escaped quote', () => {
    const text = '{"note":"she said \\"no\\" twice","ok":true}';
    expect(JSON.parse(extractJson(text)).ok).toBe(true);
  });

  it('keeps nested objects whole', () => {
    const text = '{"a":{"b":{"c":1}},"d":2}';
    expect(extractJson(`\n${text}\n`)).toBe(text);
  });

  it('returns the text unchanged when there is no object, so the error names it', () => {
    expect(extractJson('I cannot grade this.')).toBe('I cannot grade this.');
  });
});

describe('llmConfigured', () => {
  it('is false with no key at all', () => {
    expect(llmConfigured(env({}))).toBe(false);
  });

  it('is true for either provider key', () => {
    // The bug this pins: both routes read ANTHROPIC_API_KEY directly, so a deploy
    // holding only OPENROUTER_API_KEY reported "not configured" while working.
    expect(llmConfigured(env({ ANTHROPIC_API_KEY: 'sk-ant-x' }))).toBe(true);
    expect(llmConfigured(env({ OPENROUTER_API_KEY: 'sk-or-x' }))).toBe(true);
  });

  it('ignores an empty or whitespace key', () => {
    expect(llmConfigured(env({ ANTHROPIC_API_KEY: '   ' }))).toBe(false);
  });
});
