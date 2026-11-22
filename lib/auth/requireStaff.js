import "server-only";
import { jsonError } from "@/lib/api-response";
import { getSessionAndProfile } from "@/lib/supabase/server";

// Mirrors components/*/permissions.js's MANAGER_ROLES ("Senior Advocate"/
// "Admin") — kept as the single source of truth for the DB-facing role
// checks so Route Handlers and RLS agree on the same vocabulary.
const MANAGER_ROLES = ["admin", "senior_advocate"];
const ADMIN_ROLES = ["admin"];

// Every Route Handler outside /api/auth/* should call one of these before
// touching data — the whole app is an internal firm tool, nothing is public.
// Returns {ok:true, user, profile} or {ok:false, response} where `response`
// is a ready-to-return jsonError(...) NextResponse, matching the early-return
// validation style already used for zod parsing in these routes.

export async function requireStaff() {
  const { supabase, user, profile } = await getSessionAndProfile();
  if (!user) return { ok: false, response: jsonError("Sign in required.", 401) };
  if (!profile) {
    return { ok: false, response: jsonError("Your account has not been set up yet. Contact your firm administrator.", 403) };
  }
  if (!profile.is_active) {
    return { ok: false, response: jsonError("Your account has been deactivated. Contact your firm administrator.", 403) };
  }
  return { ok: true, supabase, user, profile };
}

export async function requireManager() {
  const staff = await requireStaff();
  if (!staff.ok) return staff;
  if (!MANAGER_ROLES.includes(staff.profile.role)) {
    return { ok: false, response: jsonError("You do not have permission to perform this action.", 403) };
  }
  return staff;
}

export async function requireAdmin() {
  const staff = await requireStaff();
  if (!staff.ok) return staff;
  if (!ADMIN_ROLES.includes(staff.profile.role)) {
    return { ok: false, response: jsonError("Administrator access required.", 403) };
  }
  return staff;
}
