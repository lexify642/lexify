import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { matterCreateSchema } from "@/lib/validation";
import { serializeMatter, groupByMatterId, matterScalarColumns } from "@/lib/matters/serialize";
import { resolveClientId } from "@/lib/matters/resolveClient";

// GET returns every matter reassembled into the nested shape CasesContext
// has always exposed to the rest of the app. There's no per-matter GET —
// nothing in the UI ever needed one (every page finds a matter out of the
// already-loaded `cases` array by `no`), so this single list endpoint is
// the whole read surface for Phase 1.
export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  try {
    const [mattersRes, notesRes, previousDatesRes, clientsRes] = await Promise.all([
      supabase.from("matters").select("*").order("created_at", { ascending: true }),
      supabase.from("matter_notes").select("*"),
      supabase.from("matter_previous_dates").select("*"),
      supabase.from("clients").select("*"),
    ]);
    if (mattersRes.error) throw mattersRes.error;
    if (notesRes.error) throw notesRes.error;
    if (previousDatesRes.error) throw previousDatesRes.error;
    if (clientsRes.error) throw clientsRes.error;

    const clientsById = new Map((clientsRes.data ?? []).map((c) => [c.id, c]));
    const notesByMatter = groupByMatterId(notesRes.data ?? []);
    const previousDatesByMatter = groupByMatterId(previousDatesRes.data ?? []);

    const result = (mattersRes.data ?? []).map((row) =>
      serializeMatter(row, {
        notes: notesByMatter.get(row.id) ?? [],
        previousDates: previousDatesByMatter.get(row.id) ?? [],
        client: row.client_id ? (clientsById.get(row.client_id) ?? null) : null,
      })
    );

    return jsonOk(result);
  } catch (err) {
    console.error("[api/matters GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading matters.");
  }
}

export async function POST(request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const body = await request.json().catch(() => null);
  const parsed = matterCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid matter.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    const clientId = await resolveClientId(supabase, data.client);

    // Not race-proof under concurrent creates (two advocates filing a case
    // in the same instant could both compute the same next number) — the
    // unique index on display_no is the real safety net: a collision fails
    // the insert with a 409 instead of silently overwriting a matter.
    const { count } = await supabase.from("matters").select("id", { count: "exact", head: true });
    const displayNo = data.no || String((count ?? 0) + 1).padStart(2, "0");

    const insertPayload = {
      display_no: displayNo,
      ...matterScalarColumns(data),
      client_id: clientId,
      created_by: user.id,
    };

    const { data: created, error } = await supabase.from("matters").insert(insertPayload).select("*").single();
    if (error) {
      if (error.code === "23505") {
        return jsonError("A matter with this number already exists — please retry.", 409);
      }
      throw error;
    }

    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: "created",
      entity_type: "matter",
      entity_id: created.id,
      summary: `Created matter ${created.display_no} — ${created.parties}`,
    });

    return jsonOk(
      serializeMatter(created, {
        notes: [],
        previousDates: [],
        client: data.client ? { name: data.client.name, phone: data.client.phone, address: data.client.address } : null,
      })
    );
  } catch (err) {
    console.error("[api/matters POST]", err);
    return jsonErrorFromException(err, "Something went wrong while creating the matter.");
  }
}
