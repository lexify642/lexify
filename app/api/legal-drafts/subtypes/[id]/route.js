import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireManager } from "@/lib/auth/requireStaff";
import { legalDraftSubtypeUpdateSchema, idParamSchema } from "@/lib/validation";
import { serializeSubtype } from "@/lib/legalDrafts/serialize";

export async function PATCH(request, { params }) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid sub-type id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = legalDraftSubtypeUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid update.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    const updates = {};
    if (data.subtypeKey !== undefined) updates.subtype_key = data.subtypeKey;
    if (data.translations !== undefined) updates.translations = data.translations;
    if (data.filePath !== undefined) updates.file_path = data.filePath || null;
    if (data.sortOrder !== undefined) updates.sort_order = data.sortOrder;
    if (data.status !== undefined) updates.status = data.status;

    if (!Object.keys(updates).length) {
      return jsonError("No changes provided.", 400);
    }

    const { data: updated, error } = await supabase.from("legal_draft_subtypes").update(updates).eq("id", id).select("*").single();
    if (error) {
      if (error.code === "23505") return jsonError("A sub-type with this key already exists in this category.", 409);
      throw error;
    }

    return jsonOk(serializeSubtype(updated));
  } catch (err) {
    console.error("[api/legal-drafts/subtypes/:id PATCH]", err);
    return jsonErrorFromException(err, "Something went wrong while updating this sub-type.");
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid sub-type id.", 400);
  }

  try {
    const { error } = await supabase.from("legal_draft_subtypes").delete().eq("id", id);
    if (error) throw error;
    return jsonOk({ deleted: true });
  } catch (err) {
    console.error("[api/legal-drafts/subtypes/:id DELETE]", err);
    return jsonErrorFromException(err, "Something went wrong while deleting this sub-type.");
  }
}
