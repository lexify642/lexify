import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireManager } from "@/lib/auth/requireStaff";
import { legalDraftCategoryUpdateSchema, idParamSchema } from "@/lib/validation";
import { serializeCategory } from "@/lib/legalDrafts/serialize";

export async function PATCH(request, { params }) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid category id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = legalDraftCategoryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid update.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    const updates = {};
    if (data.slug !== undefined) updates.slug = data.slug;
    if (data.practiceArea !== undefined) updates.practice_area = data.practiceArea || null;
    if (data.languages !== undefined) updates.languages = data.languages;
    if (data.filePath !== undefined) updates.file_path = data.filePath || null;
    if (data.translations !== undefined) updates.translations = data.translations;
    if (data.searchPlaceholder !== undefined) updates.search_placeholder = data.searchPlaceholder || null;
    if (data.sortOrder !== undefined) updates.sort_order = data.sortOrder;
    if (data.status !== undefined) updates.status = data.status;

    if (!Object.keys(updates).length) {
      return jsonError("No changes provided.", 400);
    }

    const { data: updated, error } = await supabase.from("legal_draft_categories").update(updates).eq("id", id).select("*").single();
    if (error) {
      if (error.code === "23505") return jsonError("A category with this slug already exists.", 409);
      throw error;
    }

    return jsonOk(serializeCategory(updated, {}));
  } catch (err) {
    console.error("[api/legal-drafts/:id PATCH]", err);
    return jsonErrorFromException(err, "Something went wrong while updating this category.");
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid category id.", 400);
  }

  try {
    const { error } = await supabase.from("legal_draft_categories").delete().eq("id", id);
    if (error) throw error;
    return jsonOk({ deleted: true });
  } catch (err) {
    console.error("[api/legal-drafts/:id DELETE]", err);
    return jsonErrorFromException(err, "Something went wrong while deleting this category.");
  }
}
