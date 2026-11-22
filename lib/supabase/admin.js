import "server-only";
import { createClient } from "@supabase/supabase-js";

let client;

// Service-role client — bypasses RLS entirely. Import ONLY from Route
// Handlers that have already verified the caller is authorized (e.g. via
// getSessionAndProfile()+is_admin check). Never import this from anything
// under components/ or any other Client Component — the `server-only`
// import above makes an accidental client-side import a build error.
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    const err = new Error("Admin operations are not configured — set SUPABASE_SERVICE_ROLE_KEY.");
    err.code = "SUPABASE_ADMIN_NOT_CONFIGURED";
    throw err;
  }
  if (!client) {
    client = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  return client;
}
