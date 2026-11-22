import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff, requireManager } from "@/lib/auth/requireStaff";
import { draftMetaUpdateSchema, idParamSchema } from "@/lib/validation";

export async function PATCH(request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid draft id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = draftMetaUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid update.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    const updates = {};

    if (data.caseNo !== undefined) {
      if (data.caseNo) {
        const { data: matter } = await supabase.from("matters").select("id").eq("display_no", data.caseNo).maybeSingle();
        updates.matter_id = matter?.id ?? null;
      } else {
        updates.matter_id = null;
      }
    }
    if (data.title !== undefined) updates.title = data.title;
    if (data.type !== undefined) updates.type = data.type;
    if (data.clientName !== undefined) updates.client_name = data.clientName;
    if (data.description !== undefined) updates.description = data.description;
    if (data.headerHtml !== undefined) updates.header_html = data.headerHtml;
    if (data.footerHtml !== undefined) updates.footer_html = data.footerHtml;
    if (data.activeVersionId !== undefined) updates.active_version_id = data.activeVersionId;

    // layout/design are merged (not replaced) — every mutator in
    // DraftsContext.jsx (updateDraftLayout, updateDraftDesign, applyPreset)
    // sends a partial patch expecting the existing bag to be preserved.
    if (data.layout !== undefined) {
      const { data: current } = await supabase.from("drafts").select("layout").eq("id", id).maybeSingle();
      updates.layout = { ...(current?.layout || {}), ...data.layout };
    }
    if (data.design !== undefined) {
      const { data: current } = await supabase.from("drafts").select("design").eq("id", id).maybeSingle();
      updates.design = { ...(current?.design || {}), ...data.design };
    }

    if (!Object.keys(updates).length) {
      return jsonError("No changes provided.", 400);
    }

    const { data: updated, error } = await supabase.from("drafts").update(updates).eq("id", id).select("*").single();
    if (error) throw error;

    return jsonOk(updated);
  } catch (err) {
    console.error("[api/drafts/:id PATCH]", err);
    return jsonErrorFromException(err, "Something went wrong while updating this draft.");
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid draft id.", 400);
  }

  try {
    const { error } = await supabase.from("drafts").delete().eq("id", id);
    if (error) throw error;
    return jsonOk({ deleted: true });
  } catch (err) {
    console.error("[api/drafts/:id DELETE]", err);
    return jsonErrorFromException(err, "Something went wrong while deleting this draft.");
  }
}
