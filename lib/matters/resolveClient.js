import "server-only";

// Find-or-create a clients row by case-insensitive name match — the same
// dedup rule components/cases/clientDirectory.js's buildClientDirectory()
// has always used in-memory, now backed by a real table + unique index
// (clients_name_lower_idx) instead of a Map rebuilt from scratch on every
// render.
export async function resolveClientId(supabase, clientData) {
  if (!clientData || !clientData.name) return null;
  const name = clientData.name.trim();
  if (!name) return null;

  const escaped = name.replace(/[%_\\]/g, (m) => `\\${m}`);
  const { data: existing, error: findError } = await supabase.from("clients").select("id").ilike("name", escaped).maybeSingle();
  if (findError) throw findError;

  if (existing) {
    const { error: updateError } = await supabase
      .from("clients")
      .update({ phone: clientData.phone || null, address: clientData.address || null })
      .eq("id", existing.id);
    if (updateError) throw updateError;
    return existing.id;
  }

  const { data: created, error: insertError } = await supabase
    .from("clients")
    .insert({ name, phone: clientData.phone || null, address: clientData.address || null })
    .select("id")
    .single();
  if (insertError) throw insertError;
  return created.id;
}
