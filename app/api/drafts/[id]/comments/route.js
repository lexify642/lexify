import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { draftCommentCreateSchema, idParamSchema } from "@/lib/validation";
import { serializeCommentThread } from "@/lib/drafts/serialize";

export async function POST(request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, user, profile } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid draft id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = draftCommentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid comment.", 400, parsed.error.flatten());
  }

  try {
    const authorName = profile.full_name || profile.email;
    const { data: thread, error } = await supabase
      .from("draft_comments")
      .insert({ id: parsed.data.id, draft_id: id, quoted_text: parsed.data.quotedText || null, author_name: authorName, author_id: user.id })
      .select("*")
      .single();
    if (error) throw error;

    const { data: reply, error: replyError } = await supabase
      .from("draft_comment_replies")
      .insert({ thread_id: thread.id, author_name: authorName, body: parsed.data.body })
      .select("*")
      .single();
    if (replyError) throw replyError;

    return jsonOk(serializeCommentThread(thread, [reply]));
  } catch (err) {
    console.error("[api/drafts/:id/comments POST]", err);
    return jsonErrorFromException(err, "Something went wrong while adding this comment.");
  }
}
