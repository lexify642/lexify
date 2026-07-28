// Supabase client singleton for the Cases module. Server-side only (API
// routes, scripts) — never imported from a Client Component, so the anon
// key never needs a NEXT_PUBLIC_ prefix.
if (!process.env.SUPABASE_URL) {
  try {
    process.loadEnvFile();
  } catch {
    // no .env file (e.g. Next.js already loaded env itself) — fine
  }
}

const { createClient } = require("@supabase/supabase-js");

const globalForSupabase = globalThis;

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  // Returning null (not throwing) here is deliberate: this module is
  // `require`d at import time by lib/cases/query.js, which is itself
  // imported at the top of every app/api/cases/**/route.js. A throw at this
  // point happens during module evaluation, *before* any route handler's own
  // try/catch runs, so it bypasses jsonError() entirely and surfaces as a
  // raw framework crash page instead of a clean {error:{message}} response.
  // Callers (query.js) check for null and throw *inside* a function body,
  // where the route's try/catch can actually catch it.
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

// Reuse the client across Next.js dev hot-reloads instead of creating a new
// one on every file change.
const supabase = globalForSupabase.__supabase ?? createSupabaseClient();
if (supabase && process.env.NODE_ENV !== "production") {
  globalForSupabase.__supabase = supabase;
}

module.exports = { supabase };
