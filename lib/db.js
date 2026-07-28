// Prisma Client singleton for the Cases module. Prisma 7 requires an explicit
// driver adapter at runtime (the schema's datasource no longer carries a URL —
// see prisma.config.js for the CLI/migrate side of this same split).
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile();
  } catch {
    // no .env file (e.g. Next.js already loaded env itself) — fine
  }
}

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const globalForPrisma = globalThis;

function createClient() {
  const adapter = new PrismaPg(process.env.DATABASE_URL);
  return new PrismaClient({ adapter });
}

// Reuse the client across Next.js dev hot-reloads instead of opening a new
// connection pool on every file change.
const prisma = globalForPrisma.__prisma ?? createClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

module.exports = { prisma };
