import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { taskStatusSchema, idParamSchema } from "@/lib/validation";

export async function PATCH(request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, profile } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid task id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = taskStatusSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid status update.", 400, parsed.error.flatten());
  }

  try {
    const { status, note } = parsed.data;

    const { data: existing, error: fetchError } = await supabase.from("tasks").select("assigned_to_name").eq("id", id).single();
    if (fetchError) throw fetchError;

    const isManager = ["admin", "senior_advocate"].includes(profile.role);
    const isAssignee = existing.assigned_to_name === (profile.full_name || profile.email);
    if (!isManager && !isAssignee) {
      return jsonError("Only the assigned person or a manager can update this task's status.", 403);
    }

    const { error: updateError } = await supabase.from("tasks").update({ status }).eq("id", id);
    if (updateError) throw updateError;

    const actorName = profile.full_name || profile.email;
    const { data: activityEntry, error: activityError } = await supabase
      .from("task_activity")
      .insert({ task_id: id, status_to: status, note, actor_name: actorName })
      .select("*")
      .single();
    if (activityError) throw activityError;

    return jsonOk({
      status,
      activity: { id: activityEntry.id, timestamp: activityEntry.created_at, user: activityEntry.actor_name, statusTo: activityEntry.status_to, note: activityEntry.note || "" },
    });
  } catch (err) {
    console.error("[api/tasks/:id/status PATCH]", err);
    return jsonErrorFromException(err, "Something went wrong while updating the task status.");
  }
}
