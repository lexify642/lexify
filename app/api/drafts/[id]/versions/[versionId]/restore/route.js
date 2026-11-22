import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { idParamSchema, draftVersionRestoreSchema } from "@/lib/validation";
import { serializeVersion } from "@/lib/drafts/serialize";

// Never rewrites history — creates a new version that copies the target's
// content, exactly like restoreVersion() in DraftsContext.jsx always did.
export async function POST(request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, profile } = auth;

  const { id, versionId } = await params;
  if (!idParamSchema.safeParse(id).success || !idParamSchema.safeParse(versionId).success) {
    return jsonError("Invalid id.", 400);
  }

  const body = await request.json().catch(() => ({}));
  const parsedBody = draftVersionRestoreSchema.safeParse(body || {});
  if (!parsedBody.success) {
    return jsonError("Invalid request.", 400, parsedBody.error.flatten());
  }

  try {
    const { data: target, error: findError } = await supabase.from("draft_versions").select("*").eq("id", versionId).eq("draft_id", id).maybeSingle();
    if (findError) throw findError;
    if (!target) return jsonError("Version not found.", 404);

    const { data: latest } = await supabase
      .from("draft_versions")
      .select("number")
      .eq("draft_id", id)
      .order("number", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextNumber = (latest?.number || 0) + 1;

    const { data: version, error } = await supabase
      .from("draft_versions")
      .insert({
        ...(parsedBody.data.id ? { id: parsedBody.data.id } : {}),
        draft_id: id,
        number: nextNumber,
        label: `v${nextNumber}`,
        content_json: target.content_json,
        content_text: target.content_text,
        action: `Restored from ${target.label}`,
        created_by_name: profile.full_name || profile.email,
      })
      .select("*")
      .single();
    if (error) throw error;

    const { error: draftError } = await supabase.from("drafts").update({ active_version_id: version.id }).eq("id", id);
    if (draftError) throw draftError;

    return jsonOk(serializeVersion(version));
  } catch (err) {
    console.error("[api/drafts/:id/versions/:versionId/restore POST]", err);
    return jsonErrorFromException(err, "Something went wrong while restoring this version.");
  }
}
