import { jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { serializeCommentThread, groupBy } from "@/lib/drafts/serialize";

// All threads across all drafts, same "load everything, filter client-side
// per draft" design DraftCommentsContext.jsx already had (threads keyed by
// id in one flat object).
export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  try {
    const [threadsRes, repliesRes] = await Promise.all([
      supabase.from("draft_comments").select("*").order("created_at", { ascending: false }),
      supabase.from("draft_comment_replies").select("*"),
    ]);
    if (threadsRes.error) throw threadsRes.error;
    if (repliesRes.error) throw repliesRes.error;

    const repliesByThread = groupBy(repliesRes.data ?? [], "thread_id");
    const threads = {};
    (threadsRes.data ?? []).forEach((row) => {
      threads[row.id] = serializeCommentThread(row, repliesByThread.get(row.id) ?? []);
    });

    return jsonOk(threads);
  } catch (err) {
    console.error("[api/draft-comments GET]", err);
    return jsonErrorFromException(err, "Something went wrong while loading comments.");
  }
}
