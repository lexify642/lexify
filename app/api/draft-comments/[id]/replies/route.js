import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { draftCommentReplySchema, idParamSchema } from "@/lib/validation";

export async function POST(request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, profile } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid comment id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = draftCommentReplySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid reply.", 400, parsed.error.flatten());
  }

  try {
    const { data: reply, error } = await supabase
      .from("draft_comment_replies")
      .insert({ thread_id: id, author_name: profile.full_name || profile.email, body: parsed.data.body })
      .select("*")
      .single();
    if (error) throw error;

    return jsonOk({ id: reply.id, author: reply.author_name, body: reply.body, createdAt: reply.created_at });
  } catch (err) {
    console.error("[api/draft-comments/:id/replies POST]", err);
    return jsonErrorFromException(err, "Something went wrong while adding this reply.");
  }
}
