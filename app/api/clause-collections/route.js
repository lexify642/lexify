import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { clauseCollectionCreateSchema } from "@/lib/validation";

function serializeCollection(row, matterDisplayNo = null) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    linkedCaseNo: matterDisplayNo,
    createdBy: row.created_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clauseIds: row.clause_ids || [],
    status: row.status,
  };
}

export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  try {
    const [collectionsRes, mattersRes] = await Promise.all([
      supabase.from("clause_collections").select("*").order("created_at", { ascending: false }),
      supabase.from("matters").select("id, display_no"),
    ]);
    if (collectionsRes.error) throw collectionsRes.error;
    if (mattersRes.error) throw mattersRes.error;

    const matterDisplayNoById = new Map((mattersRes.data ?? []).map((m) => [m.id, m.display_no]));
    const result = (collectionsRes.data ?? []).map((row) =>
      serializeCollection(row, row.linked_matter_id ? (matterDisplayNoById.get(row.linked_matter_id) ?? null) : null)
    );

    return jsonOk(result);
  } catch (err) {
    console.error("[api/clause-collections GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading clause collections.");
  }
}

export async function POST(request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, user, profile } = auth;

  const body = await request.json().catch(() => null);
  const parsed = clauseCollectionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid collection.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    let matterId = null;
    if (data.linkedCaseNo) {
      const { data: matter } = await supabase.from("matters").select("id").eq("display_no", data.linkedCaseNo).maybeSingle();
      matterId = matter?.id ?? null;
    }

    const { data: created, error } = await supabase
      .from("clause_collections")
      .insert({
        ...(data.id ? { id: data.id } : {}),
        name: data.name,
        description: data.description || "",
        linked_matter_id: matterId,
        created_by: user.id,
        created_by_name: profile.full_name || profile.email,
        clause_ids: data.clauseIds,
      })
      .select("*")
      .single();
    if (error) throw error;

    return jsonOk(serializeCollection(created, data.linkedCaseNo || null));
  } catch (err) {
    console.error("[api/clause-collections POST]", err);
    return jsonErrorFromException(err, "Something went wrong while creating this collection.");
  }
}
