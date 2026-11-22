// One-time seed: carries the current data/cases.js demo matters into the
// real `matters`/`clients`/`matter_notes`/`matter_previous_dates` tables, so
// the app isn't empty right after cutting over from in-memory mock data.
// Not part of the app runtime — run manually:
//
//   node scripts/seed-matters.mjs
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service
// role — this bypasses RLS on purpose, the same way the Admin invite-user
// route does). Safe to re-run: matters are upserted by display_no and
// clients by lower(name), so it won't create duplicates.

try {
  process.loadEnvFile();
} catch {
  // no .env.local present — fine if the vars are already in the environment
}

import { createClient } from "@supabase/supabase-js";
import { initialCases } from "../data/cases.js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function resolveClientId(client) {
  if (!client?.name) return null;
  const { data: existing, error: findError } = await supabase.from("clients").select("id").ilike("name", client.name).maybeSingle();
  if (findError) throw findError;
  if (existing) return existing.id;

  const { data: created, error: insertError } = await supabase
    .from("clients")
    .insert({ name: client.name, phone: client.phone || null, address: client.address || null })
    .select("id")
    .single();
  if (insertError) throw insertError;
  return created.id;
}

async function seedOne(c) {
  const clientId = await resolveClientId(c.client);

  const { data: matter, error: upsertError } = await supabase
    .from("matters")
    .upsert(
      {
        display_no: c.no,
        number: c.number || null,
        court: c.court || null,
        city: c.city || null,
        room: c.room || null,
        judge: c.judge || null,
        parties: c.parties,
        hearing_date: c.date || null,
        hearing_time: c.time || null,
        stage: c.stage || null,
        tone: c.tone || null,
        activity_summary: c.activity || null,
        registered_on: c.registered || null,
        filing_type: c.filing || null,
        case_details: c.caseDetails || {},
        docs: c.docs || [],
        client_id: clientId,
      },
      { onConflict: "display_no" }
    )
    .select("id")
    .single();
  if (upsertError) throw upsertError;

  await supabase.from("matter_notes").delete().eq("matter_id", matter.id);
  if (c.notes?.length) {
    const { error } = await supabase.from("matter_notes").insert(
      c.notes.map((n) => ({
        matter_id: matter.id,
        text: n.text,
        is_reminder: !!n.isReminder,
        due_date: n.dueDate || null,
        completed: !!n.completed,
      }))
    );
    if (error) throw error;
  }

  await supabase.from("matter_previous_dates").delete().eq("matter_id", matter.id);
  if (c.previousDates?.length) {
    const { error } = await supabase.from("matter_previous_dates").insert(
      c.previousDates.map((p) => ({
        matter_id: matter.id,
        date: p.date || null,
        court: p.court || null,
        stage: p.stage || null,
        purpose: p.purpose || null,
        outcome: p.outcome || null,
        advocate: p.advocate || null,
        full_notes: p.fullNotes || null,
      }))
    );
    if (error) throw error;
  }

  console.log(`Seeded matter ${c.no} — ${c.parties}`);
}

for (const c of initialCases) {
  await seedOne(c);
}

console.log(`Done — seeded ${initialCases.length} matter(s).`);
