import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { attachmentMetaSchema } from "@/lib/validation";
import { serializeAttachmentRow } from "@/lib/attachments/serialize";
import { categoryForFile } from "@/data/attachments";

const BUCKET = "firm-files";
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  try {
    const [attachmentsRes, mattersRes] = await Promise.all([
      supabase.from("attachments").select("*").order("uploaded_at", { ascending: false }),
      supabase.from("matters").select("id, display_no"),
    ]);
    if (attachmentsRes.error) throw attachmentsRes.error;
    if (mattersRes.error) throw mattersRes.error;

    const matterDisplayNoById = new Map((mattersRes.data ?? []).map((m) => [m.id, m.display_no]));
    const rows = attachmentsRes.data ?? [];

    const signedUrlByPath = new Map();
    if (rows.length) {
      const { data: signed, error: signError } = await supabase.storage.from(BUCKET).createSignedUrls(
        rows.map((r) => r.storage_path),
        SIGNED_URL_TTL_SECONDS
      );
      if (signError) throw signError;
      (signed ?? []).forEach((s) => {
        if (s.signedUrl) signedUrlByPath.set(s.path, s.signedUrl);
      });
    }

    const result = rows.map((row) =>
      serializeAttachmentRow(row, signedUrlByPath.get(row.storage_path) || null, {
        linkedCaseNo: row.linked_matter_id ? (matterDisplayNoById.get(row.linked_matter_id) ?? null) : null,
      })
    );

    return jsonOk(result);
  } catch (err) {
    console.error("[api/attachments GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading attachments.");
  }
}

export async function POST(request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, user, profile } = auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return jsonError("No file provided.", 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      return jsonError("File is too large (max 25MB).", 400);
    }

    const metaRaw = {};
    for (const key of [
      "sourceConversationId",
      "sourceMessageId",
      "category",
      "description",
      "linkedCaseNo",
      "linkedClientName",
      "linkedTaskId",
      "linkedAppointmentId",
      "linkedDraftSlug",
    ]) {
      const v = formData.get(key);
      if (v !== null && v !== "") metaRaw[key] = v;
    }
    const tagsRaw = formData.get("tags");
    if (tagsRaw) {
      metaRaw.tags = String(tagsRaw)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const parsed = attachmentMetaSchema.partial().safeParse(metaRaw);
    if (!parsed.success) {
      return jsonError("Invalid attachment metadata.", 400, parsed.error.flatten());
    }
    const meta = parsed.data;

    let matterId = null;
    if (meta.linkedCaseNo) {
      const { data: matter } = await supabase.from("matters").select("id").eq("display_no", meta.linkedCaseNo).maybeSingle();
      matterId = matter?.id ?? null;
    }

    const id = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_ ]/g, "_").slice(0, 200) || "file";
    const storagePath = `${user.id}/${id}-${safeName}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: created, error: insertError } = await supabase
      .from("attachments")
      .insert({
        id,
        name: file.name,
        mime_category: categoryForFile(file),
        size: file.size,
        storage_path: storagePath,
        uploaded_by: user.id,
        uploaded_by_name: profile.full_name || profile.email,
        source_conversation_id: meta.sourceConversationId || null,
        source_message_id: meta.sourceMessageId || null,
        category: meta.category || null,
        description: meta.description || "",
        tags: meta.tags || [],
        linked_matter_id: matterId,
        linked_client_name: meta.linkedClientName || null,
        linked_task_id: meta.linkedTaskId || null,
        linked_appointment_id: meta.linkedAppointmentId || null,
        linked_draft_slug: meta.linkedDraftSlug || null,
      })
      .select("*")
      .single();
    if (insertError) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      throw insertError;
    }

    const { data: signedData } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

    return jsonOk(serializeAttachmentRow(created, signedData?.signedUrl || null, { linkedCaseNo: meta.linkedCaseNo || null }));
  } catch (err) {
    console.error("[api/attachments POST]", err);
    return jsonErrorFromException(err, "Something went wrong while uploading this file.");
  }
}
