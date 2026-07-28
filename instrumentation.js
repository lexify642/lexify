// Next.js instrumentation hook — runs once when the server process boots
// (`next dev` / `next start`). Boots the embedded, no-admin-required local
// Postgres so the Cases module works out of the box without a manual
// `npm run db:start` step. Idempotent — safe if the DB is already running.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureRunning } = await import("./scripts/db-server.mjs");
    try {
      await ensureRunning();
    } catch (err) {
      console.error("[cases] Failed to start embedded Postgres:", err);
    }
  }
}
