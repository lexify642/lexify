import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireManager } from "@/lib/auth/requireStaff";
import { deedClauseOptionSchema } from "@/lib/validation";

export async function PATCH(request, { params }) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = deedClauseOptionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid clause.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    const updates = {};
    if (data.jumpLabel !== undefined) updates.jump_label = data.jumpLabel;
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.heading !== undefined) updates.heading = data.heading;
    if (data.options !== undefined) updates.options = data.options;
    if (data.extraField !== undefined) updates.extra_field = data.extraField;
    if (data.textTemplate !== undefined) updates.text_template = data.textTemplate;
    if (data.playbook !== undefined) {
      updates.playbook_impact = data.playbook?.impact || null;
      updates.playbook_guidance = data.playbook?.guidance || null;
    }

    if (!Object.keys(updates).length) {
      return jsonError("No changes provided.", 400);
    }

    const { data: updated, error } = await supabase.from("deed_clause_options").update(updates).eq("id", id).select("*").single();
    if (error) throw error;

    return jsonOk({
      id: updated.id,
      number: updated.number,
      jumpLabel: updated.jump_label,
      title: updated.title,
      description: updated.description,
      heading: updated.heading,
      options: updated.options || [],
      extraField: updated.extra_field || null,
      textTemplate: updated.text_template || "",
      playbook: updated.playbook_impact || updated.playbook_guidance ? { impact: updated.playbook_impact, guidance: updated.playbook_guidance } : null,
    });
  } catch (err) {
    console.error("[api/partnership-deed/clauses/:id PATCH]", err);
    return jsonErrorFromException(err, "Something went wrong while updating this clause.");
  }
}
