// CLI: `npm run db:start` — starts the embedded Postgres and keeps this
// process alive so the database stays up (its lifetime is tied to whichever
// Node process started it). Ctrl+C to stop.
import { ensureRunning, DATABASE_URL, DB_PORT, DB_NAME } from "./db-server.mjs";

const { alreadyRunning } = await ensureRunning();
console.log(
  alreadyRunning
    ? `Postgres already running on port ${DB_PORT} (database "${DB_NAME}").`
    : `Postgres started on port ${DB_PORT} (database "${DB_NAME}").`
);
console.log(`DATABASE_URL=${DATABASE_URL}`);
console.log("Press Ctrl+C to stop.");

await new Promise(() => {});
