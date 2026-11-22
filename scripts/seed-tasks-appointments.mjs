// One-time seed: carries data/tasks.js and data/appointments.js's demo
// records into the real `tasks`/`task_activity`/`appointments` tables.
// Run after scripts/seed-matters.mjs (tasks/appointments link to matters by
// display_no) — manual, not part of the app runtime:
//
//   node scripts/seed-tasks-appointments.mjs
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

try {
  process.loadEnvFile();
} catch {
  // no .env.local present — fine if the vars are already in the environment
}

import { createClient } from "@supabase/supabase-js";
import { initialTasks } from "../data/tasks.js";
import { initialAppointments } from "../data/appointments.js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function matterIdFor(displayNo) {
  if (!displayNo) return null;
  const { data, error } = await supabase.from("matters").select("id").eq("display_no", displayNo).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

async function seedTask(t) {
  const matterId = await matterIdFor(t.caseNo);

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      title: t.title,
      description: t.description || null,
      matter_id: matterId,
      client_name: t.clientName || null,
      assigned_by_name: t.assignedByName || null,
      assigned_by_role: t.assignedByRole || null,
      assigned_to_name: t.assignedToName || null,
      assigned_to_role: t.assignedToRole || null,
      assigned_at: t.assignedAt || new Date().toISOString(),
      priority: t.priority || null,
      due_date: t.dueDate || null,
      due_time: t.dueTime || null,
      status: t.status || "Pending",
      reminder: t.reminder || null,
      custom_reminder_minutes: t.customReminderMinutes || null,
      notes: t.notes || null,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (t.activity?.length) {
    const { error: activityError } = await supabase.from("task_activity").insert(
      t.activity.map((a) => ({ task_id: task.id, status_to: a.statusTo, note: a.note || null, actor_name: a.user || null, created_at: a.timestamp }))
    );
    if (activityError) throw activityError;
  }

  console.log(`Seeded task ${t.id} — ${t.title}`);
}

async function seedAppointment(a) {
  const matterId = await matterIdFor(a.caseNo);

  const { error } = await supabase.from("appointments").insert({
    title: a.title,
    event_type: a.eventType || null,
    event_date: a.date || null,
    event_time: a.time || null,
    location: a.location || null,
    matter_id: matterId,
    client_name: a.clientName || null,
    notes: a.notes || null,
    assigned_to_name: a.assignedToName || null,
    assigned_to_role: a.assignedToRole || null,
    reminder: a.reminder || null,
    custom_reminder_minutes: a.customReminderMinutes || null,
    status: a.status || "Scheduled",
    priority: a.priority || null,
  });
  if (error) throw error;

  console.log(`Seeded appointment ${a.id} — ${a.title}`);
}

for (const t of initialTasks) {
  await seedTask(t);
}
for (const a of initialAppointments) {
  await seedAppointment(a);
}

console.log(`Done — seeded ${initialTasks.length} task(s) and ${initialAppointments.length} appointment(s).`);
