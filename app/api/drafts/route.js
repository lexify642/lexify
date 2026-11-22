import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { draftCreateSchema } from "@/lib/validation";
import { serializeDraft, groupBy } from "@/lib/drafts/serialize";
import { jsonToText } from "@/lib/drafts/jsonToText";

function emptyDoc() {
  return { type: "doc", content: [{ type: "legalParagraph", content: [] }] };
}

export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  try {
    const [draftsRes, versionsRes, mattersRes] = await Promise.all([
      supabase.from("drafts").select("*").order("created_at", { ascending: false }),
      supabase.from("draft_versions").select("*"),
      supabase.from("matters").select("id, display_no"),
    ]);
    if (draftsRes.error) throw draftsRes.error;
    if (versionsRes.error) throw versionsRes.error;
    if (mattersRes.error) throw mattersRes.error;

    const matterDisplayNoById = new Map((mattersRes.data ?? []).map((m) => [m.id, m.display_no]));
    const versionsByDraft = groupBy(versionsRes.data ?? [], "draft_id");

    const result = (draftsRes.data ?? []).map((row) =>
      serializeDraft(row, {
        versions: versionsByDraft.get(row.id) ?? [],
        matterDisplayNo: row.matter_id ? (matterDisplayNoById.get(row.matter_id) ?? null) : null,
      })
    );

    return jsonOk(result);
  } catch (err) {
    console.error("[api/drafts GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading drafts.");
  }
}

export async function POST(request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, user, profile } = auth;

  const body = await request.json().catch(() => null);
  const parsed = draftCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid draft.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    let matterId = null;
    if (data.caseNo) {
      const { data: matter } = await supabase.from("matters").select("id").eq("display_no", data.caseNo).maybeSingle();
      matterId = matter?.id ?? null;
    }

    const { data: draft, error: draftError } = await supabase
      .from("drafts")
      .insert({
        ...(data.id ? { id: data.id } : {}),
        title: data.title,
        type: data.type || "Draft",
        matter_id: matterId,
        client_name: data.clientName || "",
        description: data.description || "",
        layout: {},
        design: { preset: data.type || null },
        created_by: user.id,
      })
      .select("*")
      .single();
    if (draftError) throw draftError;

    const contentJson = data.contentJson || emptyDoc();
    const { data: version, error: versionError } = await supabase
      .from("draft_versions")
      .insert({
        ...(data.versionId ? { id: data.versionId } : {}),
        draft_id: draft.id,
        number: 1,
        label: "v1",
        content_json: contentJson,
        content_text: jsonToText(contentJson),
        action: "Created",
        created_by_name: profile.full_name || profile.email,
      })
      .select("*")
      .single();
    if (versionError) throw versionError;

    const { data: updatedDraft, error: updateError } = await supabase
      .from("drafts")
      .update({ active_version_id: version.id })
      .eq("id", draft.id)
      .select("*")
      .single();
    if (updateError) throw updateError;

    return jsonOk(serializeDraft(updatedDraft, { versions: [version], matterDisplayNo: data.caseNo || null }));
  } catch (err) {
    console.error("[api/drafts POST]", err);
    return jsonErrorFromException(err, "Something went wrong while creating this draft.");
  }
}
