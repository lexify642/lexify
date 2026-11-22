// One-time seed: carries data/partnershipDeed.js's CLAUSES/PRESETS/
// PLAYBOOK/DEFAULT_*/RECITALS_HTML/CLOSING_HTML into the real
// deed_clause_options/deed_presets/deed_settings tables.
//
//   node scripts/seed-partnership-deed.mjs
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
//
// Each clause's old buildText(optionLabel, extraValue) => `...${optionLabel}...`
// function is called here with the literal strings "{{optionLabel}}" and
// "{{extraValue}}" as its arguments — since every one of the 10 functions is
// pure template-literal interpolation (verified, no branching), the
// function's own output IS the stored template, with those tokens sitting
// exactly where the real values get substituted at render time
// (see PartnershipDeedEngine.jsx's interpolate()). No manual rewriting.

try {
  process.loadEnvFile();
} catch {
  // no .env.local present — fine if the vars are already in the environment
}

import { createClient } from "@supabase/supabase-js";
import { CLAUSES, PRESETS, PLAYBOOK, DEFAULT_SELECTIONS, DEFAULT_EXTRA_VALUES, RECITALS_HTML, CLOSING_HTML } from "../data/partnershipDeed.js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

for (const clause of CLAUSES) {
  const textTemplate = clause.buildText("{{optionLabel}}", "{{extraValue}}");
  const playbook = PLAYBOOK.find((p) => p.clauseId === clause.id) || null;

  const { error } = await supabase.from("deed_clause_options").insert({
    id: clause.id,
    number: clause.number,
    jump_label: clause.jumpLabel,
    title: clause.title,
    description: clause.description,
    heading: clause.heading,
    options: clause.options,
    extra_field: clause.extraField || null,
    text_template: textTemplate,
    playbook_impact: playbook?.impact || null,
    playbook_guidance: playbook?.guidance || null,
  });
  if (error) throw error;
  console.log(`Seeded deed clause ${clause.id}`);
}

for (const [index, preset] of PRESETS.entries()) {
  const { error } = await supabase.from("deed_presets").insert({
    id: preset.pathId,
    posture: preset.posture,
    interest_path: preset.interestPath,
    voting_lock: preset.votingLock,
    friction: preset.friction,
    guidelines: preset.guidelines,
    selections: preset.selections,
    sort_order: index,
  });
  if (error) throw error;
  console.log(`Seeded deed preset ${preset.pathId}`);
}

const { error: settingsError } = await supabase.from("deed_settings").upsert({
  id: true,
  default_selections: DEFAULT_SELECTIONS,
  default_extra_values: DEFAULT_EXTRA_VALUES,
  recitals_html: RECITALS_HTML,
  closing_html: CLOSING_HTML,
});
if (settingsError) throw settingsError;

console.log(`Done — seeded ${CLAUSES.length} clause option(s), ${PRESETS.length} preset(s), and deed_settings.`);
