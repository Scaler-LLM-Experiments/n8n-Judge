import type { NextRequest } from 'next/server';
import { claude, MODELS, buildAskAiSystemPrompt, type AskAiContext } from '@judge/llm';

// Streaming Ask-AI (Iris) chat. Scoped to the current problem/node context and
// prompted never to leak answers (see buildAskAiSystemPrompt). Turns are
// persisted client-side as `ask_ai_turn` trace events (M2). Runs on the cheap
// model tier (MODELS.askAi()).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AskBody {
  messages?: { role: 'user' | 'assistant'; content: string }[];
  context?: AskAiContext;
}

export async function POST(req: NextRequest) {
  // No key configured (e.g. before it's set on the deploy) — the client shows a
  // graceful fallback rather than a broken chat.
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'ask_ai_unconfigured' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }

  let body: AskBody;
  try {
    body = await req.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const messages = (body.messages ?? [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-12); // keep the prompt bounded
  if (!messages.length) return new Response('No messages', { status: 400 });

  const system = buildAskAiSystemPrompt((body.context ?? {}) as AskAiContext);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const s = claude().messages.stream({
          model: MODELS.askAi(),
          max_tokens: 400,
          system,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });
        s.on('text', (t) => controller.enqueue(encoder.encode(t)));
        await s.finalMessage();
      } catch {
        controller.enqueue(encoder.encode('Iris hit a snag answering just now — please try again in a moment.'));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });
}
