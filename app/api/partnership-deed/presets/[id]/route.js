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

export async function PATCH(request, { params }) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = deedPresetSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid preset.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    const updates = {};
    if (data.posture !== undefined) updates.posture = data.posture;
    if (data.interestPath !== undefined) updates.interest_path = data.interestPath;
    if (data.votingLock !== undefined) updates.voting_lock = data.votingLock;
    if (data.friction !== undefined) updates.friction = data.friction;
    if (data.guidelines !== undefined) updates.guidelines = data.guidelines;
    if (data.selections !== undefined) updates.selections = data.selections;

    if (!Object.keys(updates).length) {
      return jsonError("No changes provided.", 400);
    }

    const { data: updated, error } = await supabase.from("deed_presets").update(updates).eq("id", id).select("*").single();
    if (error) throw error;

    return jsonOk(serializePreset(updated));
  } catch (err) {
    console.error("[api/partnership-deed/presets/:id PATCH]", err);
    return jsonErrorFromException(err, "Something went wrong while updating this preset.");
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  try {
    const { error } = await supabase.from("deed_presets").delete().eq("id", id);
    if (error) throw error;
    return jsonOk({ deleted: true });
  } catch (err) {
    console.error("[api/partnership-deed/presets/:id DELETE]", err);
    return jsonErrorFromException(err, "Something went wrong while deleting this preset.");
  }
}
