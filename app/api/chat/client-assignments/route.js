import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff, requireManager } from "@/lib/auth/requireStaff";
import { reassignClientChatSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  try {
    const { data, error } = await supabase.from("client_chat_assignments").select("*");
    if (error) throw error;
    const map = {};
    (data ?? []).forEach((row) => {
      map[row.client_name] = { assignedToName: row.assigned_to_name, assignedToRole: row.assigned_to_role };
    });
    return jsonOk(map);
  } catch (err) {
    console.error("[api/chat/client-assignments GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading client chat assignments.");
  }
}

// Matches canReassignClientChat() (Admin/Senior Advocate only) — enforced
// here server-side too, not just by hiding the Reassign button.
export async function PATCH(request) {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const body = await request.json().catch(() => null);
  const parsed = reassignClientChatSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid request.", 400, parsed.error.flatten());
  }

  try {
    const { error } = await supabase.from("client_chat_assignments").upsert({
      client_name: parsed.data.clientName,
      assigned_to_name: parsed.data.assignedToName,
      assigned_to_role: parsed.data.assignedToRole,
    });
    if (error) throw error;
    return jsonOk({ ok: true });
  } catch (err) {
    console.error("[api/chat/client-assignments PATCH]", err);
    return jsonErrorFromException(err, "Something went wrong while reassigning this chat.");
  }
}
