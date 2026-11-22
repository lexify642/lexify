import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireManager } from "@/lib/auth/requireStaff";
import { taskUpdateSchema, idParamSchema } from "@/lib/validation";

// Full task edits (reassignment, priority, due date, etc.) are manager-only,
// matching the `manage` gate in TaskDetailsWorkspace.jsx that's the only UI
// path to this endpoint. Status-only changes go through ./status/route.js,
// which a task's assignee can also use.
export async function PATCH(request, { params }) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid task id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = taskUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid task.", 400, parsed.error.flatten());
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
    if (data.description !== undefined) updates.description = data.description;
    if (data.clientName !== undefined) updates.client_name = data.clientName;
    if (data.assignedByName !== undefined) updates.assigned_by_name = data.assignedByName;
    if (data.assignedByRole !== undefined) updates.assigned_by_role = data.assignedByRole;
    if (data.assignedToName !== undefined) updates.assigned_to_name = data.assignedToName;
    if (data.assignedToRole !== undefined) updates.assigned_to_role = data.assignedToRole;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.dueDate !== undefined) updates.due_date = data.dueDate || null;
    if (data.dueTime !== undefined) updates.due_time = data.dueTime;
    if (data.reminder !== undefined) updates.reminder = data.reminder;
    if (data.customReminderMinutes !== undefined) updates.custom_reminder_minutes = data.customReminderMinutes;
    if (data.notes !== undefined) updates.notes = data.notes;

    if (!Object.keys(updates).length && data.attachments === undefined) {
      return jsonError("No changes provided.", 400);
    }

    let updated;
    if (Object.keys(updates).length) {
      const { data: row, error } = await supabase.from("tasks").update(updates).eq("id", id).select("*").single();
      if (error) throw error;
      updated = row;
    } else {
      const { data: row, error } = await supabase.from("tasks").select("*").eq("id", id).single();
      if (error) throw error;
      updated = row;
    }

    // TaskFormFields' "Attach documents" file input is shared between create
    // and edit — editing a task can add new attachments the same way
    // addAttachment() does, so a full-replace here (same pattern as the
    // matters sync endpoint) keeps that path from silently failing to persist.
    if (data.attachments !== undefined) {
      const { error: delError } = await supabase.from("task_attachments").delete().eq("task_id", id);
      if (delError) throw delError;
      if (data.attachments.length) {
        const { error: insError } = await supabase
          .from("task_attachments")
          .insert(data.attachments.map((a) => ({ task_id: id, name: a.name })));
        if (insError) throw insError;
      }
    }

    return jsonOk(updated);
  } catch (err) {
    console.error("[api/tasks/:id PATCH]", err);
    return jsonErrorFromException(err, "Something went wrong while updating this task.");
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid task id.", 400);
  }

  try {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw error;
    return jsonOk({ deleted: true });
  } catch (err) {
    console.error("[api/tasks/:id DELETE]", err);
    return jsonErrorFromException(err, "Something went wrong while deleting this task.");
  }
}
