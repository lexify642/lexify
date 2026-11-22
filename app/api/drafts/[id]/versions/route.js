import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { draftVersionCreateSchema, idParamSchema } from "@/lib/validation";
import { serializeVersion } from "@/lib/drafts/serialize";
import { jsonToText } from "@/lib/drafts/jsonToText";

export async function POST(request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, profile } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid draft id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = draftVersionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid version.", 400, parsed.error.flatten());
  }

  try {
    const newText = jsonToText(parsed.data.contentJson);

    const { data: latest } = await supabase
      .from("draft_versions")
      .select("id, number, content_text")
      .eq("draft_id", id)
      .order("number", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Same "only a genuine change creates a new version" rule
    // DraftsContext.jsx's saveVersion() already enforces client-side —
    // re-checked here so autosave can't spam duplicate versions if that
    // client-side guard is ever bypassed.
    if (latest && latest.content_text === newText) {
      const { data: unchanged } = await supabase.from("draft_versions").select("*").eq("id", latest.id).single();
      return jsonOk(serializeVersion(unchanged));
    }

    const nextNumber = (latest?.number || 0) + 1;
    const { data: version, error } = await supabase
      .from("draft_versions")
      .insert({
        ...(parsed.data.id ? { id: parsed.data.id } : {}),
        draft_id: id,
        number: nextNumber,
        label: parsed.data.label || `v${nextNumber}`,
        content_json: parsed.data.contentJson,
        content_text: newText,
        action: parsed.data.action || "Edited",
        created_by_name: profile.full_name || profile.email,
      })
      .select("*")
      .single();
    if (error) throw error;

    const { error: draftError } = await supabase.from("drafts").update({ active_version_id: version.id }).eq("id", id);
    if (draftError) throw draftError;

    return jsonOk(serializeVersion(version));
  } catch (err) {
    console.error("[api/drafts/:id/versions POST]", err);
    return jsonErrorFromException(err, "Something went wrong while saving this version.");
  }
}
