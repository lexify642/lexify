import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { updateMessageSchema, idParamSchema } from "@/lib/validation";
import { serializeMessage } from "@/lib/chat/serialize";

// Covers editMessage(), the soft-delete deleteMessage() performs (an
// UPDATE, not a real row delete — so edit history/thread structure isn't
// lost), and togglePin()/toggleStar() (both just replace the pinned_by/
// starred_by array — the client computes the next array and sends it,
// same as everywhere else in this codebase that treats "the next full
// state" as the unit of change rather than diffing server-side).
export async function PATCH(request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid message id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = updateMessageSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid update.", 400, parsed.error.flatten());
  }

  try {
    const data = parsed.data;
    const updates = {};
    if (data.text !== undefined) updates.text = data.text;
    if (data.edited !== undefined) updates.edited = data.edited;
    if (data.deleted !== undefined) updates.deleted = data.deleted;
    if (data.pinnedBy !== undefined) updates.pinned_by = data.pinnedBy;
    if (data.starredBy !== undefined) updates.starred_by = data.starredBy;
    if (data.attachmentIds !== undefined) updates.attachment_ids = data.attachmentIds;

    if (!Object.keys(updates).length) {
      return jsonError("No changes provided.", 400);
    }

    const { data: updated, error } = await supabase.from("messages").update(updates).eq("id", id).select("*").single();
    if (error) throw error;

    return jsonOk(serializeMessage(updated));
  } catch (err) {
    console.error("[api/chat/messages/:id PATCH]", err);
    return jsonErrorFromException(err, "Something went wrong while updating this message.");
  }
}
