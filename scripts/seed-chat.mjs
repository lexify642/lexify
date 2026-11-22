// One-time seed: carries data/conversations.js's demo groups and messages
// into the real `groups`/`messages` tables. Manual, not part of the app
// runtime:
//
//   node scripts/seed-chat.mjs
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

try {
  process.loadEnvFile();
} catch {
  // no .env.local present — fine if the vars are already in the environment
}

import { createClient } from "@supabase/supabase-js";
import { INITIAL_GROUPS, INITIAL_MESSAGES } from "../data/conversations.js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const groupIdByLegacyId = new Map();

for (const g of INITIAL_GROUPS) {
  const { data, error } = await supabase.from("groups").insert({ name: g.name, member_names: g.memberNames }).select("id").single();
  if (error) throw error;
  groupIdByLegacyId.set(g.id, data.id);
  console.log(`Seeded group ${g.name}`);
}

for (const m of INITIAL_MESSAGES) {
  const conversationId = groupIdByLegacyId.get(m.conversationId) || m.conversationId;
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_name: m.senderName,
    text: m.text,
    pinned_by: m.pinnedBy || [],
    created_at: m.createdAt,
    status: "sent",
  });
  if (error) throw error;
  console.log(`Seeded message from ${m.senderName}`);
}

console.log(`Done — seeded ${INITIAL_GROUPS.length} group(s) and ${INITIAL_MESSAGES.length} message(s).`);
console.log("Note: seeded messages have no sender_id (no profile match attempted) — fine for RLS (select is broad), but editMessage/deleteMessage's manager-or-own-message rule will only allow a manager to touch them.");
