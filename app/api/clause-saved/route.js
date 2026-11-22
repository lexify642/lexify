import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { clauseIdSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  try {
    const { data, error } = await supabase.from("clause_saved").select("clause_id").eq("user_id", user.id);
    if (error) throw error;
    return jsonOk((data ?? []).map((r) => r.clause_id));
  } catch (err) {
    console.error("[api/clause-saved GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading saved clauses.");
  }
}

// Toggles — inserts if not saved, removes if already saved. RLS
// (clause_saved_own) already restricts this to the caller's own rows.
export async function POST(request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const body = await request.json().catch(() => null);
  const parsed = clauseIdSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid request.", 400, parsed.error.flatten());
  }

  try {
    const { data: existing } = await supabase
      .from("clause_saved")
      .select("clause_id")
      .eq("user_id", user.id)
      .eq("clause_id", parsed.data.clauseId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("clause_saved").delete().eq("user_id", user.id).eq("clause_id", parsed.data.clauseId);
      if (error) throw error;
      return jsonOk({ saved: false });
    }

    const { error } = await supabase.from("clause_saved").insert({ user_id: user.id, clause_id: parsed.data.clauseId });
    if (error) throw error;
    return jsonOk({ saved: true });
  } catch (err) {
    console.error("[api/clause-saved POST]", err);
    return jsonErrorFromException(err, "Something went wrong while saving this clause.");
  }
}
