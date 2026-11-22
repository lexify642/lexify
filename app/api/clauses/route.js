import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff, requireManager } from "@/lib/auth/requireStaff";
import { clauseSchema } from "@/lib/validation";
import { serializeClause } from "@/lib/clauses/serialize";

// Everything is loaded at once and filtered client-side (same as the old
// `import clauses from "data/clauses.json"` did) — 254 rows is small enough
// that server-side pagination isn't worth the added complexity yet.
export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  try {
    const { data, error } = await supabase.from("clauses").select("*").order("id", { ascending: true });
    if (error) throw error;
    return jsonOk((data ?? []).map(serializeClause));
  } catch (err) {
    console.error("[api/clauses GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading the clause library.");
  }
}

export async function POST(request) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const body = await request.json().catch(() => null);
  const parsed = clauseSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid clause.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    const { data: created, error } = await supabase
      .from("clauses")
      .insert({
        id: data.id,
        category: data.category || null,
        type: data.type || null,
        name: data.name || null,
        position: data.position || null,
        domain: data.domain || null,
        text: data.text || null,
        version: data.version || null,
        risk: data.risk || "N/A",
        favorability: data.favorability || null,
        negotiation: data.negotiation || null,
        frequency: data.frequency || null,
        case_law: data.caseLaw || null,
        status: data.status || "APPROVED",
        is_published: data.isPublished ?? true,
        created_by: user.id,
      })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") return jsonError("A clause with this id already exists.", 409);
      throw error;
    }

    return jsonOk(serializeClause(created));
  } catch (err) {
    console.error("[api/clauses POST]", err);
    return jsonErrorFromException(err, "Something went wrong while creating this clause.");
  }
}
