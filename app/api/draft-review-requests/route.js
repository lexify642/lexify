import { jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { serializeReviewRequest } from "@/lib/drafts/serialize";

export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  try {
    const [reviewsRes, mattersRes] = await Promise.all([
      supabase.from("draft_review_requests").select("*").order("sent_at", { ascending: false }),
      supabase.from("matters").select("id, display_no"),
    ]);
    if (reviewsRes.error) throw reviewsRes.error;
    if (mattersRes.error) throw mattersRes.error;

    const matterDisplayNoById = new Map((mattersRes.data ?? []).map((m) => [m.id, m.display_no]));
    const result = (reviewsRes.data ?? []).map((row) =>
      serializeReviewRequest(row, { matterDisplayNo: row.matter_id ? (matterDisplayNoById.get(row.matter_id) ?? null) : null })
    );

    return jsonOk(result);
  } catch (err) {
    console.error("[api/draft-review-requests GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading review requests.");
  }
}
