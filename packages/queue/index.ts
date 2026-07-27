export * from './types.ts';
export { PgBossQueue } from './pgBossDriver.ts';
export { SqsQueue } from './sqsDriver.ts';

import type { Queue } from './types.ts';
import { PgBossQueue } from './pgBossDriver.ts';
import { SqsQueue } from './sqsDriver.ts';

export function createQueue(env: { QUEUE_DRIVER?: string; DATABASE_URL?: string } = process.env): Queue {
  const driver = env.QUEUE_DRIVER ?? 'pgboss';
  if (driver === 'sqs') return new SqsQueue();
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required for the pg-boss queue driver');
  return new PgBossQueue(env.DATABASE_URL);
}
