import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { taskCommentSchema, idParamSchema } from "@/lib/validation";

export async function POST(request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, profile } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid task id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = taskCommentSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid comment.", 400, parsed.error.flatten());
  }

  try {
    const authorName = profile.full_name || profile.email;
    const { data: created, error } = await supabase
      .from("task_comments")
      .insert({ task_id: id, author_name: authorName, body: parsed.data.text })
      .select("*")
      .single();
    if (error) throw error;

    return jsonOk({ id: created.id, user: created.author_name, timestamp: created.created_at, text: created.body });
  } catch (err) {
    console.error("[api/tasks/:id/comments POST]", err);
    return jsonErrorFromException(err, "Something went wrong while adding this comment.");
  }
}
