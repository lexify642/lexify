import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireManager } from "@/lib/auth/requireStaff";
import { legalDraftSubtypeSchema, idParamSchema } from "@/lib/validation";
import { serializeSubtype } from "@/lib/legalDrafts/serialize";

export async function POST(request, { params }) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid category id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = legalDraftSubtypeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid sub-type.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    const { data: created, error } = await supabase
      .from("legal_draft_subtypes")
      .insert({
        category_id: id,
        subtype_key: data.subtypeKey,
        translations: data.translations,
        file_path: data.filePath || null,
        sort_order: data.sortOrder ?? 0,
        status: data.status || "published",
      })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") return jsonError("A sub-type with this key already exists in this category.", 409);
      throw error;
    }

    return jsonOk(serializeSubtype(created));
  } catch (err) {
    console.error("[api/legal-drafts/:id/subtypes POST]", err);
    return jsonErrorFromException(err, "Something went wrong while creating this sub-type.");
  }
}
