"use client";

import { createBrowserClient } from "@supabase/ssr";

let client;

// Shared browser Supabase client — safe to use in Client Components (anon
// key only, RLS enforces access). Reused across renders instead of
// reconstructing on every call.
export function createSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  return client;
}
