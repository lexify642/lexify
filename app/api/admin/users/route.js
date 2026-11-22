import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/requireStaff";
import { inviteUserSchema, paginationOnlySchema } from "@/lib/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const parsed = paginationOnlySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return jsonError("Invalid query parameters.", 400, parsed.error.flatten());
  }
  const q = (searchParams.get("q") || "").trim();
  const { page, pageSize } = parsed.data;
  const offset = (page - 1) * pageSize;

  try {
    let query = supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (q) {
      const escaped = q.replace(/[%_\\]/g, (m) => `\\${m}`);
      query = query.or(`email.ilike.%${escaped}%,full_name.ilike.%${escaped}%`);
    }
    const { data, count, error } = await query;
    if (error) throw error;
    const total = count ?? 0;
    return jsonOk(data ?? [], { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (err) {
    console.error("[api/admin/users GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading users.");
  }
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const body = await request.json().catch(() => null);
  const parsed = inviteUserSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid invite.", 400, parsed.error.flatten());
  }
  const { email, fullName, role } = parsed.data;

  try {
    const admin = createSupabaseAdminClient();

    // Creates the auth.users row (service role — no email/password flow, the
    // invitee signs in the same way everyone does, via /login's OTP code).
    const { data: created, error: createError } = await admin.auth.admin.createUser({ email, email_confirm: true });
    if (createError) {
      if (createError.status === 422 || /already registered|already exists/i.test(createError.message || "")) {
        return jsonError("A user with this email already exists.", 409);
      }
      throw createError;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({ id: created.user.id, email, full_name: fullName, role })
      .select("*")
      .single();
    if (profileError) throw profileError;

    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: "created",
      entity_type: "user",
      entity_id: profile.id,
      summary: `Invited ${fullName} (${email}) as ${role}`,
    });

    return jsonOk(profile);
  } catch (err) {
    console.error("[api/admin/users POST]", err);
    return jsonErrorFromException(err, "Something went wrong while inviting this user.");
  }
}
