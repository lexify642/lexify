import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { matterSyncSchema } from "@/lib/validation";
import { serializeMatter, matterScalarColumns } from "@/lib/matters/serialize";
import { resolveClientId } from "@/lib/matters/resolveClient";

// One full-replace endpoint instead of separate note/previous-date/document
// sub-resource routes: components/cases/useCaseActions.js (the single choke
// point for every case mutation already, per its own top-of-file comment)
// already computes the matter's complete next state locally via setCases()
// before this ever runs — CasesContext just needs to persist that same
// next state, not re-derive individual diffs. Per-matter note/date counts
// are small, so delete+reinsert for the two child tables is simpler and
// safer than reconciling row-by-row.
export async function PATCH(request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const { displayNo } = await params;
  const body = await request.json().catch(() => null);
  const parsed = matterSyncSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid matter.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;

    const { data: existing, error: findError } = await supabase.from("matters").select("id").eq("display_no", displayNo).maybeSingle();
    if (findError) throw findError;
    if (!existing) return jsonError("Matter not found.", 404);
    const matterId = existing.id;

    const clientId = await resolveClientId(supabase, data.client);

    const { data: updated, error: updateError } = await supabase
      .from("matters")
      .update({ ...matterScalarColumns(data), client_id: clientId })
      .eq("id", matterId)
      .select("*")
      .single();
    if (updateError) throw updateError;

    const { error: delNotesError } = await supabase.from("matter_notes").delete().eq("matter_id", matterId);
    if (delNotesError) throw delNotesError;
    if (data.notes.length) {
      const { error: insNotesError } = await supabase.from("matter_notes").insert(
        data.notes.map((n) => ({
          matter_id: matterId,
          text: n.text,
          is_reminder: n.isReminder ?? false,
          due_date: n.dueDate || null,
          completed: n.completed ?? false,
          created_by: user.id,
        }))
      );
      if (insNotesError) throw insNotesError;
    }

    const { error: delDatesError } = await supabase.from("matter_previous_dates").delete().eq("matter_id", matterId);
    if (delDatesError) throw delDatesError;
    if (data.previousDates.length) {
      const { error: insDatesError } = await supabase.from("matter_previous_dates").insert(
        data.previousDates.map((p) => ({
          matter_id: matterId,
          date: p.date || null,
          court: p.court || null,
          stage: p.stage || null,
          purpose: p.purpose || null,
          outcome: p.outcome || null,
          advocate: p.advocate || null,
          full_notes: p.fullNotes || null,
        }))
      );
      if (insDatesError) throw insDatesError;
    }

    const [{ data: notes }, { data: previousDates }] = await Promise.all([
      supabase.from("matter_notes").select("*").eq("matter_id", matterId),
      supabase.from("matter_previous_dates").select("*").eq("matter_id", matterId),
    ]);

    return jsonOk(
      serializeMatter(updated, {
        notes: notes ?? [],
        previousDates: previousDates ?? [],
        client: data.client ? { name: data.client.name, phone: data.client.phone, address: data.client.address } : null,
      })
    );
  } catch (err) {
    console.error("[api/matters/:displayNo/sync PATCH]", err);
    return jsonErrorFromException(err, "Something went wrong while saving this matter.");
  }
}
