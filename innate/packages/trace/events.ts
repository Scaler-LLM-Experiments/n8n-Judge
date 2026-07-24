import { z } from 'zod';
import { decisionSchema } from '@judge/problem-schema';

// The trace-event contract: every learner interaction the client reports to
// the backend. Append-only on the server (TraceEvent table). The client
// assigns a monotonic per-session `seq`; (sessionId, seq) is the idempotency
// key so re-sent batches after a dropped connection are safe.
//
// These events are BOTH the admin session-map source AND the input the
// grading worker replays (decision events through the engine's grading store;
// the last run_result/graph for structural re-validation).

const graphSchema = z.object({
  nodes: z.array(z.object({ id: z.string(), type: z.string() }).passthrough()),
  edges: z.array(
    z
      .object({
        source: z.string(),
        target: z.string(),
        sourceHandle: z.string().nullish(),
        targetHandle: z.string().nullish(),
      })
      .passthrough()
  ),
});

export const tracePayloadSchemas = {
  // A graded decision (dissection | nodePick | field | stress) — the same
  // object handed to the engine grading store, including retries the client
  // store would dedup away (server keeps everything; firstTry marks the first).
  decision: z.object({ decision: decisionSchema, attempt: z.number().int().min(0).optional() }),

  // Journey navigation: STATEMENT → DASHBOARD → EVAL → REPORT.
  screen_transition: z.object({ from: z.string(), to: z.string() }),

  // Build-stage sub-phase progress (buildPhases[].id).
  phase_transition: z.object({ phaseId: z.string(), label: z.string().optional() }),

  // Learner opened a node's NDV.
  ndv_open: z.object({ nodeType: z.string() }),

  // Canvas changed. `graph` is the full post-mutation snapshot (small graphs,
  // ~6 nodes) so the admin session map can replay build progress step by step.
  graph_mutation: z.object({
    op: z.enum(['add_node', 'remove_node', 'connect', 'disconnect']),
    nodeType: z.string().optional(),
    graph: graphSchema,
  }),

  // A wrong-pick probe MCQ was shown / answered (answer arrives as a decision).
  probe_shown: z.object({ nodeType: z.string() }),

  // The learner ran the flow: structural validation + simulation outcomes.
  run_result: z.object({
    graph: graphSchema,
    validation: z.object({ allPassed: z.boolean() }).passthrough(),
    simulation: z.unknown().optional(),
  }),

  // One Ask-AI chat turn (role user|assistant), persisted for admin tracing.
  ask_ai_turn: z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    nodeContext: z.string().optional(),
  }),

  // Journey finished (Report reached); grading job gets enqueued server-side.
  session_complete: z.object({}),
} as const;

export type TraceEventType = keyof typeof tracePayloadSchemas;

export const traceEventSchema = z
  .object({
    seq: z.number().int().min(0),
    type: z.string(),
    payload: z.unknown(),
    clientTs: z.string().datetime({ offset: true }).or(z.string().datetime()),
  })
  .superRefine((event, ctx) => {
    const schema = tracePayloadSchemas[event.type as TraceEventType];
    if (!schema) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Unknown trace event type "${event.type}"` });
      return;
    }
    const result = schema.safeParse(event.payload);
    if (!result.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid payload for "${event.type}": ${result.error.errors[0]?.message ?? 'invalid'}`,
      });
    }
  });

export const traceBatchSchema = z.object({
  events: z.array(traceEventSchema).min(1).max(500),
});

export type TraceEventInput = z.infer<typeof traceEventSchema>;
export type TraceBatchInput = z.infer<typeof traceBatchSchema>;
