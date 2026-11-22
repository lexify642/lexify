import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireManager } from "@/lib/auth/requireStaff";
import { deedPresetSchema } from "@/lib/validation";

function serializePreset(row) {
  return {
    pathId: row.id,
    posture: row.posture,
    interestPath: row.interest_path,
    votingLock: row.voting_lock,
    friction: row.friction,
    guidelines: row.guidelines,
    selections: row.selections || {},
  };
}

export async function POST(request) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const body = await request.json().catch(() => null);
  const parsed = deedPresetSchema.safeParse(body);
  if (!parsed.success || !parsed.data.pathId) {
    return jsonError("Invalid preset — pathId is required.", 400, parsed.success ? undefined : parsed.error.flatten());
  }

  try {
    const { count } = await supabase.from("deed_presets").select("id", { count: "exact", head: true });
    const data = parsed.data;

    const { data: created, error } = await supabase
      .from("deed_presets")
      .insert({
        id: data.pathId,
        posture: data.posture || "",
        interest_path: data.interestPath || "",
        voting_lock: data.votingLock || "",
        friction: data.friction || "",
        guidelines: data.guidelines || "",
        selections: data.selections || {},
        sort_order: count ?? 0,
      })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") return jsonError("A preset with this path id already exists.", 409);
      throw error;
    }

    return jsonOk(serializePreset(created));
  } catch (err) {
    console.error("[api/partnership-deed/presets POST]", err);
    return jsonErrorFromException(err, "Something went wrong while creating this preset.");
  }
}
