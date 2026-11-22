import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { draftCommentStatusSchema, idParamSchema } from "@/lib/validation";

export async function PATCH(request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid comment id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = draftCommentStatusSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid update.", 400, parsed.error.flatten());
  }

  try {
    const { data: updated, error } = await supabase.from("draft_comments").update({ status: parsed.data.status }).eq("id", id).select("id, status").single();
    if (error) throw error;
    return jsonOk(updated);
  } catch (err) {
    console.error("[api/draft-comments/:id PATCH]", err);
    return jsonErrorFromException(err, "Something went wrong while updating this comment.");
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid comment id.", 400);
  }

  try {
    const { error } = await supabase.from("draft_comments").delete().eq("id", id);
    if (error) throw error;
    return jsonOk({ deleted: true });
  } catch (err) {
    console.error("[api/draft-comments/:id DELETE]", err);
    return jsonErrorFromException(err, "Something went wrong while deleting this comment.");
  }
}
