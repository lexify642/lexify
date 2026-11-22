import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/requireStaff";
import { updateUserSchema, idParamSchema } from "@/lib/validation";

export async function PATCH(request, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const { id } = await params;
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return jsonError("Invalid user id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid update.", 400, parsed.error.flatten());
  }

  if (id === user.id && parsed.data.role && parsed.data.role !== "admin") {
    return jsonError("You cannot change your own role away from admin.", 400);
  }
  if (id === user.id && parsed.data.isActive === false) {
    return jsonError("You cannot deactivate your own account.", 400);
  }

  const updates = {};
  if (parsed.data.role !== undefined) updates.role = parsed.data.role;
  if (parsed.data.isActive !== undefined) updates.is_active = parsed.data.isActive;
  if (parsed.data.fullName !== undefined) updates.full_name = parsed.data.fullName;

  if (!Object.keys(updates).length) {
    return jsonError("No changes provided.", 400);
  }

  try {
    const { data: updated, error } = await supabase.from("profiles").update(updates).eq("id", id).select("*").single();
    if (error) throw error;

    const action =
      parsed.data.role !== undefined ? "role_changed" : parsed.data.isActive !== undefined ? (parsed.data.isActive ? "activated" : "deactivated") : "updated";

    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action,
      entity_type: "user",
      entity_id: id,
      summary: `Updated ${updated.email}: ${JSON.stringify(updates)}`,
    });

    return jsonOk(updated);
  } catch (err) {
    console.error("[api/admin/users/:id PATCH]", err);
    return jsonErrorFromException(err, "Something went wrong while updating this user.");
  }
}
