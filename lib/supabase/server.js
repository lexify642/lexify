import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Cookie-based Supabase client for Server Components and Route Handlers.
// Session cookies are refreshed by middleware.js on every request; the
// setAll() below is best-effort so a Server Component (which can't write
// cookies) doesn't throw when it tries.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component call site — middleware already refreshes the
          // session cookie, so a failed write here is safe to ignore.
        }
      },
    },
  });
}

// Returns { user, profile } or { user: null, profile: null }. profile is the
// caller's row in public.profiles (role, full_name, is_active) — null if the
// session is valid but no profile exists yet (shouldn't normally happen once
// invite-only signup is enforced, but callers should handle it).
// Wrapped in React's cache() so (app)/layout.js, (app)/admin/layout.js, and
// any Route Handler's requireStaff() call within the same request share one
// lookup instead of re-querying profiles on every nested layout.
export const getSessionAndProfile = cache(async function getSessionAndProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { supabase, user, profile: profile ?? null };
});
