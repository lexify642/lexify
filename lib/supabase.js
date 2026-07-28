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
  if (!url || !anonKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be set (see .env.example)."
    );
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

// Reuse the client across Next.js dev hot-reloads instead of creating a new
// one on every file change.
const supabase = globalForSupabase.__supabase ?? createSupabaseClient();
if (process.env.NODE_ENV !== "production") {
  globalForSupabase.__supabase = supabase;
}

module.exports = { supabase };
