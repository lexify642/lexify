// Shared embedded-Postgres lifecycle helper. No admin rights / Windows service
// / external DB account needed — this runs a real Postgres binary as a plain
// child process of whichever Node process calls ensureRunning() (the Next.js
// server via instrumentation.js, or a one-off CLI script). Data persists in
// .pgdata/ (gitignored) between runs.
import EmbeddedPostgres from "embedded-postgres";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export const DB_HOST = "127.0.0.1";
export const DB_PORT = 5433;
export const DB_USER = "postgres";
export const DB_PASSWORD = "postgres";
export const DB_NAME = "lexifyi_cases";
export const DATABASE_URL = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`;

export const pg = new EmbeddedPostgres({
  databaseDir: path.join(ROOT, ".pgdata"),
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  persistent: true,
  // Indian case-law text needs real UTF-8 (Windows' default initdb locale
  // picks WIN1252, which cannot represent it and breaks import mid-way).
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

function isPortOpen(port, host) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host, timeout: 800 });
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

// Idempotent: safe to call from multiple entry points (instrumentation.js on
// `next dev`/`next start`, or a standalone script) without port conflicts.
export async function ensureRunning() {
  if (await isPortOpen(DB_PORT, DB_HOST)) {
    return { alreadyRunning: true };
  }
  const fs = await import("node:fs");
  const initialized = fs.existsSync(path.join(ROOT, ".pgdata", "PG_VERSION"));
  if (!initialized) {
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase(DB_NAME);
  } catch {
    // database already exists — fine
  }
  return { alreadyRunning: false };
}
