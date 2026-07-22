import { PrismaClient } from "@prisma/client";
import { logger } from "../lib/logger";

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

prisma
  .$connect()
  .then(() => logger.debug("Prisma connected"))
  .catch((err: unknown) => logger.warn({ err }, "Prisma connect deferred"));
