import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { taskAttachmentSchema, idParamSchema } from "@/lib/validation";

export async function POST(request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid task id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = taskAttachmentSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid attachment.", 400, parsed.error.flatten());
  }

  try {
    const { data: created, error } = await supabase
      .from("task_attachments")
      .insert({ task_id: id, name: parsed.data.name })
      .select("*")
      .single();
    if (error) throw error;

    return jsonOk({ id: created.id, name: created.name });
  } catch (err) {
    console.error("[api/tasks/:id/attachments POST]", err);
    return jsonErrorFromException(err, "Something went wrong while adding this attachment.");
  }
}
