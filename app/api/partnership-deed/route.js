import { jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";

function serializeClauseOption(row) {
  return {
    id: row.id,
    number: row.number,
    jumpLabel: row.jump_label,
    title: row.title,
    description: row.description,
    heading: row.heading,
    options: row.options || [],
    extraField: row.extra_field || null,
    textTemplate: row.text_template || "",
    playbook: row.playbook_impact || row.playbook_guidance ? { impact: row.playbook_impact, guidance: row.playbook_guidance } : null,
  };
}

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

export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  try {
    const [clausesRes, presetsRes, settingsRes] = await Promise.all([
      supabase.from("deed_clause_options").select("*").order("number", { ascending: true }),
      supabase.from("deed_presets").select("*").order("sort_order", { ascending: true }),
      supabase.from("deed_settings").select("*").eq("id", true).maybeSingle(),
    ]);
    if (clausesRes.error) throw clausesRes.error;
    if (presetsRes.error) throw presetsRes.error;
    if (settingsRes.error) throw settingsRes.error;

    const settings = settingsRes.data;

    return jsonOk({
      clauses: (clausesRes.data ?? []).map(serializeClauseOption),
      presets: (presetsRes.data ?? []).map(serializePreset),
      defaultSelections: settings?.default_selections || {},
      defaultExtraValues: settings?.default_extra_values || {},
      recitalsHtml: settings?.recitals_html || "",
      closingHtml: settings?.closing_html || "",
    });
  } catch (err) {
    console.error("[api/partnership-deed GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading the Partnership Deed configuration.");
  }
}
