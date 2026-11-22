import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { createGroupSchema } from "@/lib/validation";
import { serializeGroup } from "@/lib/chat/serialize";

export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  try {
    const { data, error } = await supabase.from("groups").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    return jsonOk((data ?? []).map(serializeGroup));
  } catch (err) {
    console.error("[api/chat/groups GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading groups.");
  }
}

export async function POST(request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, user, profile } = auth;

  const body = await request.json().catch(() => null);
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid group.", 400, parsed.error.flatten());
  }

  try {
    const memberNames = Array.from(new Set([profile.full_name, ...parsed.data.memberNames]));
    const { data: created, error } = await supabase
      .from("groups")
      .insert({ name: parsed.data.name, member_names: memberNames, created_by: user.id })
      .select("*")
      .single();
    if (error) throw error;
    return jsonOk(serializeGroup(created));
  } catch (err) {
    console.error("[api/chat/groups POST]", err);
    return jsonErrorFromException(err, "Something went wrong while creating this group.");
  }
}
