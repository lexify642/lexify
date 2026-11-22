import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { clauseCollectionAddClausesSchema, idParamSchema } from "@/lib/validation";

export async function POST(request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid collection id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = clauseCollectionAddClausesSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid request.", 400, parsed.error.flatten());
  }

  try {
    const { data: existing, error: findError } = await supabase.from("clause_collections").select("clause_ids").eq("id", id).maybeSingle();
    if (findError) throw findError;
    if (!existing) return jsonError("Collection not found.", 404);

    const clauseIds = [...new Set([...(existing.clause_ids || []), ...parsed.data.clauseIds])];
    const { data: updated, error } = await supabase.from("clause_collections").update({ clause_ids: clauseIds }).eq("id", id).select("clause_ids").single();
    if (error) throw error;

    return jsonOk({ clauseIds: updated.clause_ids });
  } catch (err) {
    console.error("[api/clause-collections/:id/clauses POST]", err);
    return jsonErrorFromException(err, "Something went wrong while adding clauses to this collection.");
  }
}
