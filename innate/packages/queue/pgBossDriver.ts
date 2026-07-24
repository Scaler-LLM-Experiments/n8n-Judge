import PgBoss from 'pg-boss';
import {
  type Queue,
  type EnqueueOptions,
  type JobHandler,
  type JobStatus,
  NonRetryableError,
} from './types.ts';

interface Registered {
  jobType: string;
  handler: JobHandler<unknown>;
  concurrency: number;
}

// pg-boss keeps its own tables in the `pgboss` schema of the same Postgres
// database Prisma uses. Prisma must never migrate that schema; dropping it is
// the entire cleanup when the SQS driver takes over.
export class PgBossQueue implements Queue {
  private boss: PgBoss;
  private handlers: Registered[] = [];
  private started = false;
  private knownQueues = new Set<string>();

  constructor(connectionString: string) {
    this.boss = new PgBoss({
      connectionString,
      // Keep completed/failed jobs around long enough to serve getStatus()
      // polling from the report screen.
      deleteAfterHours: 24,
    });
  }

  private async ensureStarted() {
    if (!this.started) {
      await this.boss.start();
      this.started = true;
    }
  }

  private async ensureQueue(jobType: string) {
    if (this.knownQueues.has(jobType)) return;
    await this.boss.createQueue(jobType).catch(() => {}); // idempotent
    this.knownQueues.add(jobType);
  }

  async enqueue<T>(jobType: string, payload: T, opts: EnqueueOptions = {}) {
    await this.ensureStarted();
    await this.ensureQueue(jobType);
    const jobId = await this.boss.send(jobType, payload as object, {
      singletonKey: opts.idempotencyKey,
      retryLimit: opts.retryLimit ?? 3,
      retryDelay: 5,
      retryBackoff: true,
      expireInMinutes: 10,
    });
    return { jobId };
  }

  registerHandler<T>(jobType: string, handler: JobHandler<T>, opts: { concurrency?: number } = {}) {
    this.handlers.push({
      jobType,
      handler: handler as JobHandler<unknown>,
      concurrency: opts.concurrency ?? 1,
    });
  }

  async start() {
    await this.ensureStarted();
    for (const { jobType, handler, concurrency } of this.handlers) {
      await this.ensureQueue(jobType);
      await this.boss.work(
        jobType,
        { batchSize: concurrency },
        async (jobs: PgBoss.Job<unknown>[]) => {
          await Promise.all(
            jobs.map(async (job) => {
              try {
                await handler(job.data, { jobId: job.id, attempt: 0 });
              } catch (e) {
                if (e instanceof NonRetryableError) {
                  // Fail permanently without burning retries.
                  await this.boss.fail(jobType, job.id, { reason: e.message, nonRetryable: true });
                  return;
                }
                throw e; // pg-boss retries per job options
              }
            })
          );
        }
      );
    }
  }

  async stop() {
    if (this.started) await this.boss.stop({ graceful: true });
    this.started = false;
  }

  async getStatus(jobType: string, jobId: string): Promise<{ status: JobStatus; error?: string }> {
    await this.ensureStarted();
    const job = await this.boss.getJobById(jobType, jobId);
    if (!job) return { status: 'unknown' };
    const map: Record<string, JobStatus> = {
      created: 'queued',
      retry: 'queued',
      active: 'running',
      completed: 'succeeded',
      cancelled: 'failed',
      failed: 'failed',
    };
    const status = map[job.state] ?? 'unknown';
    const output = job.output as { reason?: string; message?: string } | null;
    return {
      status,
      error: status === 'failed' ? output?.reason ?? output?.message : undefined,
    };
  }
}
