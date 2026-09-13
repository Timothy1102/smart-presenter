import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    // Applies to every interactive transaction — `$transaction(async (tx) => …)`.
    // Prisma's own default is 5s, which a save could exceed when the database is
    // far from the server. Well under the function's own duration limit, so a
    // transaction that overruns fails as a clean error rather than a dead request.
    transactionOptions: {
      timeout: 15_000,
      maxWait: 5_000,
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
