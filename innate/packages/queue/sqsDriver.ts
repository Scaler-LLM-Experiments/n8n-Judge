import type { Queue, EnqueueOptions, JobHandler, JobStatus } from './types.ts';

// Placeholder for the planned AWS migration (plan milestone M7). Implement
// against @aws-sdk/client-sqs with a FIFO queue per job type:
//   enqueue  -> SendMessage { MessageGroupId: jobType, MessageDeduplicationId: idempotencyKey }
//   start    -> long-poll ReceiveMessage loop per registered handler; visibility
//               timeout as the retry mechanism; DLQ after retryLimit receives
//   getStatus-> job-status table (SQS has no per-message status API) — reuse the
//               GradingReport row status instead of polling the queue itself.
export class SqsQueue implements Queue {
  constructor() {
    throw new Error(
      'SqsQueue is not implemented yet. Set QUEUE_DRIVER=pgboss (default) until the AWS migration (plan M7).'
    );
  }
  enqueue<T>(_jobType: string, _payload: T, _opts?: EnqueueOptions): Promise<{ jobId: string | null }> {
    return Promise.reject(new Error('not implemented'));
  }
  registerHandler<T>(_jobType: string, _handler: JobHandler<T>): void {}
  start(): Promise<void> {
    return Promise.reject(new Error('not implemented'));
  }
  stop(): Promise<void> {
    return Promise.resolve();
  }
  getStatus(): Promise<{ status: JobStatus }> {
    return Promise.resolve({ status: 'unknown' });
  }
}
