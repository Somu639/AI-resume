import { PrismaClient } from "@prisma/client";

/**
 * Shared Prisma client — one instance per process to avoid connection storms.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Do not connect at import time — Vercel cold starts must not hang on a bad DATABASE_URL
export async function ensureDb() {
  await prisma.$connect();
}
