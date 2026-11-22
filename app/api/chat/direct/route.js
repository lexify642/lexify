import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { startDirectSchema } from "@/lib/validation";
import { serializeDirectConversation } from "@/lib/chat/serialize";

export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  try {
    const { data, error } = await supabase.from("direct_conversations").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    return jsonOk((data ?? []).map(serializeDirectConversation));
  } catch (err) {
    console.error("[api/chat/direct GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading direct messages.");
  }
}

// Idempotent by design: directConversationId() in ChatContext.jsx computes
// the same deterministic id for the same pair of people every time, so
// starting a DM with someone you've already messaged just returns the
// existing row instead of creating a duplicate.
export async function POST(request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const body = await request.json().catch(() => null);
  const parsed = startDirectSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid request.", 400, parsed.error.flatten());
  }

  try {
    const { data: existing, error: findError } = await supabase.from("direct_conversations").select("*").eq("id", parsed.data.id).maybeSingle();
    if (findError) throw findError;
    if (existing) return jsonOk(serializeDirectConversation(existing));

    const { data: created, error } = await supabase
      .from("direct_conversations")
      .insert({ id: parsed.data.id, member_names: parsed.data.memberNames })
      .select("*")
      .single();
    if (error) throw error;
    return jsonOk(serializeDirectConversation(created));
  } catch (err) {
    console.error("[api/chat/direct POST]", err);
    return jsonErrorFromException(err, "Something went wrong while starting this chat.");
  }
}
