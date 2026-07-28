import type { TraceEventInput } from './events.ts';

// Turning a submitted batch into rows to write.
//
// Pure, and separate from the route, because the two things it decides are the
// two things easy to get subtly wrong: which events are new, and what `seq` each
// new one gets. Both are worth testing without a database in the way.

export interface PlanIngestInput {
  events: TraceEventInput[];
  /** clientSeq values already stored for this session. */
  existingClientSeqs: number[];
  /** Highest `seq` already stored for this session; 0 for a fresh session. */
  maxSeq: number;
}

export interface PlannedRow {
  clientSeq: number;
  seq: number;
  type: string;
  payload: unknown;
  clientTs: string;
}

export interface PlanIngestResult {
  rows: PlannedRow[];
  /** clientSeq values dropped because they were already stored. */
  skipped: number[];
}

export function planIngest({ events, existingClientSeqs, maxSeq }: PlanIngestInput): PlanIngestResult {
  const already = new Set(existingClientSeqs);
  const skipped: number[] = [];
  const seen = new Set<number>();

  // Sorted by clientSeq so rows land in the order the learner produced them,
  // however the batch happened to arrive.
  const fresh = [...events]
    .sort((a, b) => a.clientSeq - b.clientSeq)
    .filter((e) => {
      if (already.has(e.clientSeq)) {
        // Only report each duplicate once, even if the batch repeats it.
        if (!skipped.includes(e.clientSeq)) skipped.push(e.clientSeq);
        return false;
      }
      // A retrying client can append the same event twice before it flushes.
      if (seen.has(e.clientSeq)) return false;
      seen.add(e.clientSeq);
      return true;
    });

  return {
    rows: fresh.map((e, i) => ({
      clientSeq: e.clientSeq,
      seq: maxSeq + 1 + i,
      type: e.type,
      payload: e.payload,
      clientTs: e.clientTs,
    })),
    skipped,
  };
}
