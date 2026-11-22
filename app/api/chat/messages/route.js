import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { sendMessageSchema } from "@/lib/validation";
import { serializeMessage } from "@/lib/chat/serialize";

// Loads every message across every conversation, same as the old flat
// INITIAL_MESSAGES array — matches ChatContext's existing "one array, filter
// client-side per conversation" design (search-across-all-chats and the
// sidebar's last-message previews both depend on having everything loaded).
export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  try {
    const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    return jsonOk((data ?? []).map(serializeMessage));
  } catch (err) {
    console.error("[api/chat/messages GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading messages.");
  }
}

export async function POST(request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, user, profile } = auth;

  const body = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid message.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    const { data: created, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: data.conversationId,
        sender_id: user.id,
        sender_name: profile.full_name || profile.email,
        sender_role: profile.role,
        text: data.text,
        attachment_ids: data.attachmentIds,
        reply_to_id: data.replyToId || null,
        forwarded_from_id: data.forwardedFromId || null,
        mentions: data.mentions,
      })
      .select("*")
      .single();
    if (error) throw error;

    return jsonOk(serializeMessage(created));
  } catch (err) {
    console.error("[api/chat/messages POST]", err);
    return jsonErrorFromException(err, "Something went wrong while sending this message.");
  }
}
