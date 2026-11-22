import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { appointmentSchema, idParamSchema } from "@/lib/validation";
import { serializeAppointment } from "@/lib/appointments/serialize";

const appointmentUpdateSchema = appointmentSchema.partial().extend({ title: appointmentSchema.shape.title.optional() });

export async function PATCH(request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid appointment id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = appointmentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid event.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    const updates = {};

    if (data.caseNo !== undefined) {
      if (data.caseNo) {
        const { data: matter, error } = await supabase.from("matters").select("id").eq("display_no", data.caseNo).maybeSingle();
        if (error) throw error;
        updates.matter_id = matter?.id ?? null;
      } else {
        updates.matter_id = null;
      }
    }
    if (data.title !== undefined) updates.title = data.title;
    if (data.eventType !== undefined) updates.event_type = data.eventType;
    if (data.date !== undefined) updates.event_date = data.date || null;
    if (data.time !== undefined) updates.event_time = data.time;
    if (data.location !== undefined) updates.location = data.location;
    if (data.clientName !== undefined) updates.client_name = data.clientName;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.assignedToName !== undefined) updates.assigned_to_name = data.assignedToName;
    if (data.assignedToRole !== undefined) updates.assigned_to_role = data.assignedToRole;
    if (data.reminder !== undefined) updates.reminder = data.reminder;
    if (data.customReminderMinutes !== undefined) updates.custom_reminder_minutes = data.customReminderMinutes;
    if (data.status !== undefined) updates.status = data.status;
    if (data.priority !== undefined) updates.priority = data.priority;

    if (!Object.keys(updates).length) {
      return jsonError("No changes provided.", 400);
    }

    const { data: updated, error } = await supabase.from("appointments").update(updates).eq("id", id).select("*").single();
    if (error) throw error;

    return jsonOk(serializeAppointment(updated, { matterDisplayNo: data.caseNo ?? null }));
  } catch (err) {
    console.error("[api/appointments/:id PATCH]", err);
    return jsonErrorFromException(err, "Something went wrong while updating this event.");
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid appointment id.", 400);
  }

  try {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) throw error;
    return jsonOk({ deleted: true });
  } catch (err) {
    console.error("[api/appointments/:id DELETE]", err);
    return jsonErrorFromException(err, "Something went wrong while deleting this event.");
  }
}
