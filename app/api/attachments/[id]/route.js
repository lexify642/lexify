import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { attachmentUpdateSchema, idParamSchema } from "@/lib/validation";

const BUCKET = "firm-files";

export async function PATCH(request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid attachment id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = attachmentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid update.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    const updates = {};

    if (data.linkedCaseNo !== undefined) {
      if (data.linkedCaseNo) {
        const { data: matter } = await supabase.from("matters").select("id").eq("display_no", data.linkedCaseNo).maybeSingle();
        updates.linked_matter_id = matter?.id ?? null;
      } else {
        updates.linked_matter_id = null;
      }
    }
    if (data.category !== undefined) updates.category = data.category;
    if (data.description !== undefined) updates.description = data.description;
    if (data.tags !== undefined) updates.tags = data.tags;
    if (data.linkedClientName !== undefined) updates.linked_client_name = data.linkedClientName;
    if (data.linkedTaskId !== undefined) updates.linked_task_id = data.linkedTaskId;
    if (data.linkedAppointmentId !== undefined) updates.linked_appointment_id = data.linkedAppointmentId;
    if (data.linkedDraftSlug !== undefined) updates.linked_draft_slug = data.linkedDraftSlug;

    if (!Object.keys(updates).length) {
      return jsonError("No changes provided.", 400);
    }

    const { data: updated, error } = await supabase.from("attachments").update(updates).eq("id", id).select("id").single();
    if (error) throw error;

    return jsonOk({ id: updated.id });
  } catch (err) {
    console.error("[api/attachments/:id PATCH]", err);
    return jsonErrorFromException(err, "Something went wrong while updating this attachment.");
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid attachment id.", 400);
  }

  try {
    const { data: existing, error: findError } = await supabase.from("attachments").select("storage_path").eq("id", id).maybeSingle();
    if (findError) throw findError;
    if (!existing) return jsonOk({ deleted: true });

    const { error: deleteError } = await supabase.from("attachments").delete().eq("id", id);
    if (deleteError) throw deleteError;

    await supabase.storage.from(BUCKET).remove([existing.storage_path]);

    return jsonOk({ deleted: true });
  } catch (err) {
    console.error("[api/attachments/:id DELETE]", err);
    return jsonErrorFromException(err, "Something went wrong while deleting this attachment.");
  }
}
