import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { reviewStatusUpdateSchema, idParamSchema } from "@/lib/validation";

export async function PATCH(request, { params }) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid review request id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = reviewStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid status.", 400, parsed.error.flatten());
  }

  try {
    const { data: updated, error } = await supabase
      .from("draft_review_requests")
      .update({ status: parsed.data.status })
      .eq("id", id)
      .select("id, status")
      .single();
    if (error) throw error;
    return jsonOk(updated);
  } catch (err) {
    console.error("[api/draft-review-requests/:id/status PATCH]", err);
    return jsonErrorFromException(err, "Something went wrong while updating the review status.");
  }
}
