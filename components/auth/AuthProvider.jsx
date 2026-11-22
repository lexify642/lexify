"use client";

import { createContext, useContext, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const AuthContext = createContext(null);

// Session identity for the whole (app) route group — replaces the hardcoded
// CURRENT_USER export from data/team.js. The initial value is fetched
// server-side (app/(app)/layout.js) from the real Supabase session + the
// caller's profiles row, so there's no client-side flash of an unauthenticated
// state.
export function AuthProvider({ user, children }) {
  const value = useMemo(
    () => ({
      user,
      async signOut() {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        window.location.href = "/login";
      },
    }),
    [user]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Returns {id, email, name, role}. Consuming components should treat `role`
// as the source of truth for what the signed-in user is allowed to do —
// mirrors the role vocabulary already used by components/*/permissions.js.
export function useCurrentUser() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useCurrentUser must be used within an AuthProvider");
  return ctx.user;
}

export function useSignOut() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useSignOut must be used within an AuthProvider");
  return ctx.signOut;
}
