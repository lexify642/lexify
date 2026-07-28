// Prisma 7 config — connection URL for the CLI (migrate/studio/db push) lives
// here instead of the schema file. The runtime PrismaClient (lib/db.js) gets
// its connection via a `@prisma/adapter-pg` driver adapter instead.
const { defineConfig, env } = require("prisma/config");

// Prisma 7's config loader does not auto-load .env — do it explicitly
// (Node 20.6+ ships process.loadEnvFile natively, no `dotenv` dependency needed).
try {
  process.loadEnvFile();
} catch {
  // no .env file present — fine, DATABASE_URL may already be in the environment
}

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
