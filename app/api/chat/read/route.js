import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { markReadSchema } from "@/lib/validation";

// Only the caller's own read state (RLS restricts message_reads to
// user_id = auth.uid() anyway) — readState has always been a per-user
// concept, never shared.
export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  try {
    const { data, error } = await supabase.from("message_reads").select("conversation_id, last_read_at").eq("user_id", user.id);
    if (error) throw error;
    const readState = {};
    (data ?? []).forEach((row) => {
      readState[row.conversation_id] = row.last_read_at;
    });
    return jsonOk(readState);
  } catch (err) {
    console.error("[api/chat/read GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading read state.");
  }
}

export async function POST(request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const body = await request.json().catch(() => null);
  const parsed = markReadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid request.", 400, parsed.error.flatten());
  }

  try {
    const { error } = await supabase
      .from("message_reads")
      .upsert({ conversation_id: parsed.data.conversationId, user_id: user.id, last_read_at: new Date().toISOString() });
    if (error) throw error;
    return jsonOk({ ok: true });
  } catch (err) {
    console.error("[api/chat/read POST]", err);
    return jsonErrorFromException(err, "Something went wrong while marking this chat read.");
  }
}
