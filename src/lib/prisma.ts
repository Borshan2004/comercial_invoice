import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Retry wrapper for Neon cold-start: P1001 (can't reach server) and P1017 (server closed connection).
 * Neon free-tier suspends after ~5 min idle; the first query after wake-up can fail.
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1500): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const code = err?.code;
      // Only retry on connection errors (Neon cold-start)
      if (code === 'P1001' || code === 'P1017' || code === 'P1002') {
        if (attempt < retries) {
          console.warn(`DB connection error (${code}), retrying attempt ${attempt}/${retries} in ${delayMs}ms...`);
          await new Promise((r) => setTimeout(r, delayMs));
          delayMs *= 2; // exponential back-off
          continue;
        }
      }
      throw err;
    }
  }
  throw lastError;
}
