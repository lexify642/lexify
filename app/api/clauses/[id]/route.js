import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireManager } from "@/lib/auth/requireStaff";
import { clauseUpdateSchema } from "@/lib/validation";
import { serializeClause } from "@/lib/clauses/serialize";

export async function PATCH(request, { params }) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = clauseUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid update.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    const updates = {};
    if (data.category !== undefined) updates.category = data.category || null;
    if (data.type !== undefined) updates.type = data.type || null;
    if (data.name !== undefined) updates.name = data.name || null;
    if (data.position !== undefined) updates.position = data.position || null;
    if (data.domain !== undefined) updates.domain = data.domain || null;
    if (data.text !== undefined) updates.text = data.text || null;
    if (data.version !== undefined) updates.version = data.version || null;
    if (data.risk !== undefined) updates.risk = data.risk;
    if (data.favorability !== undefined) updates.favorability = data.favorability || null;
    if (data.negotiation !== undefined) updates.negotiation = data.negotiation || null;
    if (data.frequency !== undefined) updates.frequency = data.frequency || null;
    if (data.caseLaw !== undefined) updates.case_law = data.caseLaw || null;
    if (data.status !== undefined) updates.status = data.status;
    if (data.isPublished !== undefined) updates.is_published = data.isPublished;

    if (!Object.keys(updates).length) {
      return jsonError("No changes provided.", 400);
    }

    const { data: updated, error } = await supabase.from("clauses").update(updates).eq("id", id).select("*").single();
    if (error) throw error;

    return jsonOk(serializeClause(updated));
  } catch (err) {
    console.error("[api/clauses/:id PATCH]", err);
    return jsonErrorFromException(err, "Something went wrong while updating this clause.");
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;

  try {
    const { error } = await supabase.from("clauses").delete().eq("id", id);
    if (error) throw error;
    return jsonOk({ deleted: true });
  } catch (err) {
    console.error("[api/clauses/:id DELETE]", err);
    return jsonErrorFromException(err, "Something went wrong while deleting this clause.");
  }
}
