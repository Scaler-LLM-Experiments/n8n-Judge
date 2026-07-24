import { PrismaClient } from '@prisma/client';

// A single PrismaClient per process. In dev, Next.js hot-reload re-imports
// modules repeatedly; without this guard each reload would open a new pool and
// exhaust connections. The worker service imports the same singleton.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '@prisma/client';
