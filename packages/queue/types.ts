// SQS-shaped queue abstraction. The web app only calls enqueue()/getStatus();
// the worker process registers handlers and calls start(). Today the driver is
// pg-boss (Postgres); the planned AWS migration swaps in an SQS driver behind
// the same interface — handler code never changes (QUEUE_DRIVER env selects).

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'unknown';

export interface JobHandlerCtx {
  jobId: string;
  attempt: number;
}

export interface EnqueueOptions {
  // Deduplication key: while a job with this key is queued/active, further
  // enqueues with the same key are no-ops (pg-boss singletonKey / SQS FIFO
  // MessageDeduplicationId).
  idempotencyKey?: string;
  retryLimit?: number;
}

export type JobHandler<T> = (payload: T, ctx: JobHandlerCtx) => Promise<void>;

export interface Queue {
  enqueue<T>(jobType: string, payload: T, opts?: EnqueueOptions): Promise<{ jobId: string | null }>;
  registerHandler<T>(jobType: string, handler: JobHandler<T>, opts?: { concurrency?: number }): void;
  /** Begin consuming (worker process only). */
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(jobType: string, jobId: string): Promise<{ status: JobStatus; error?: string }>;
}

// Throw this from a handler for permanent failures (bad payload, deleted
// session) — the driver marks the job failed without burning retries.
export class NonRetryableError extends Error {
  readonly nonRetryable = true;
  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

export const JOB_TYPES = {
  gradeSession: 'grade_session',
  renderVoiceClips: 'render_voice_clips',
  renderNameClips: 'render_name_clips',
  renderPhaseIntros: 'render_phase_intros',
} as const;
