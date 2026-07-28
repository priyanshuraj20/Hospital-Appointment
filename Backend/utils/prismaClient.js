import { PrismaClient } from "@prisma/client";

// Singleton pattern — prevents creating multiple connection pools during hot-reloads
const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [], // Keep terminal logs clean; Prisma auto-reconnects on idle socket closure seamlessly
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
