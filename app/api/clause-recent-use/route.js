import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { clauseRecentUseSchema } from "@/lib/validation";

const LIMIT = 20;

export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  try {
    const { data, error } = await supabase
      .from("clause_recent_use")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(LIMIT);
    if (error) throw error;
    return jsonOk((data ?? []).map((r) => ({ id: r.id, clauseId: r.clause_id, action: r.action, timestamp: r.created_at })));
  } catch (err) {
    console.error("[api/clause-recent-use GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading recently used clauses.");
  }
}

export async function POST(request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const body = await request.json().catch(() => null);
  const parsed = clauseRecentUseSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid request.", 400, parsed.error.flatten());
  }

  try {
    const { data: created, error } = await supabase
      .from("clause_recent_use")
      .insert({ user_id: user.id, clause_id: parsed.data.clauseId, action: parsed.data.action || null })
      .select("*")
      .single();
    if (error) throw error;

    return jsonOk({ id: created.id, clauseId: created.clause_id, action: created.action, timestamp: created.created_at });
  } catch (err) {
    console.error("[api/clause-recent-use POST]", err);
    return jsonErrorFromException(err, "Something went wrong while logging recent use.");
  }
}
