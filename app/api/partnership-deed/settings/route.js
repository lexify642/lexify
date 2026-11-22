import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireManager } from "@/lib/auth/requireStaff";
import { deedSettingsSchema } from "@/lib/validation";

export async function PATCH(request) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const body = await request.json().catch(() => null);
  const parsed = deedSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid settings.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    const updates = { id: true };
    if (data.defaultSelections !== undefined) updates.default_selections = data.defaultSelections;
    if (data.defaultExtraValues !== undefined) updates.default_extra_values = data.defaultExtraValues;
    if (data.recitalsHtml !== undefined) updates.recitals_html = data.recitalsHtml;
    if (data.closingHtml !== undefined) updates.closing_html = data.closingHtml;

    const { data: updated, error } = await supabase.from("deed_settings").upsert(updates).select("*").single();
    if (error) throw error;

    return jsonOk({
      defaultSelections: updated.default_selections || {},
      defaultExtraValues: updated.default_extra_values || {},
      recitalsHtml: updated.recitals_html || "",
      closingHtml: updated.closing_html || "",
    });
  } catch (err) {
    console.error("[api/partnership-deed/settings PATCH]", err);
    return jsonErrorFromException(err, "Something went wrong while updating deed settings.");
  }
}
