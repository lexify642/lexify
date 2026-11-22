import { jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";

// Minimal active-staff directory for assignee pickers (Task/Appointment
// forms) — any signed-in staff member can read it (not admin-only, unlike
// /api/admin/users which exposes the full account list for management).
export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("is_active", true)
      .order("full_name", { ascending: true });
    if (error) throw error;
    return jsonOk(data ?? []);
  } catch (err) {
    console.error("[api/staff GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading the staff directory.");
  }
}
