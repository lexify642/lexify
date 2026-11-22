import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { appointmentSchema } from "@/lib/validation";
import { serializeAppointment } from "@/lib/appointments/serialize";

export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  try {
    const [appointmentsRes, mattersRes] = await Promise.all([
      supabase.from("appointments").select("*").order("created_at", { ascending: false }),
      supabase.from("matters").select("id, display_no"),
    ]);
    if (appointmentsRes.error) throw appointmentsRes.error;
    if (mattersRes.error) throw mattersRes.error;

    const matterDisplayNoById = new Map((mattersRes.data ?? []).map((m) => [m.id, m.display_no]));
    const result = (appointmentsRes.data ?? []).map((row) =>
      serializeAppointment(row, { matterDisplayNo: row.matter_id ? (matterDisplayNoById.get(row.matter_id) ?? null) : null })
    );

    return jsonOk(result);
  } catch (err) {
    console.error("[api/appointments GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading appointments.");
  }
}

export async function POST(request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const body = await request.json().catch(() => null);
  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid event.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    let matterId = null;
    if (data.caseNo) {
      const { data: matter, error } = await supabase.from("matters").select("id").eq("display_no", data.caseNo).maybeSingle();
      if (error) throw error;
      matterId = matter?.id ?? null;
    }

    const insertPayload = {
      title: data.title,
      event_type: data.eventType,
      event_date: data.date || null,
      event_time: data.time,
      location: data.location,
      matter_id: matterId,
      client_name: data.clientName,
      notes: data.notes,
      assigned_to_name: data.assignedToName,
      assigned_to_role: data.assignedToRole,
      reminder: data.reminder,
      custom_reminder_minutes: data.customReminderMinutes,
      status: data.status,
      priority: data.priority,
      created_by: user.id,
    };

    const { data: created, error } = await supabase.from("appointments").insert(insertPayload).select("*").single();
    if (error) throw error;

    return jsonOk(serializeAppointment(created, { matterDisplayNo: data.caseNo || null }));
  } catch (err) {
    console.error("[api/appointments POST]", err);
    return jsonErrorFromException(err, "Something went wrong while creating this event.");
  }
}
