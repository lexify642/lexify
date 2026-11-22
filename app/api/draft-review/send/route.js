import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth/requireStaff";
import { sendDraftForReview } from "@/lib/email/draftReview";
import { reviewRequestSchema } from "@/lib/validation";
import { serializeReviewRequest } from "@/lib/drafts/serialize";

// Fixes the trust gap the audit found: this used to only send the email —
// the draft_review_requests row was written by the client, in a second,
// separate call, AFTER this one succeeded. A dropped connection or a bug in
// that second call meant an email could go out with no record it ever
// existed. Now the row is created here, server-side, in the same request —
// email first (if it fails, nothing is persisted, same as before), then the
// real INSERT using the authenticated sender's own identity.
export async function POST(request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { supabase, user, profile } = auth;

  const body = await request.json().catch(() => null);
  const parsed = reviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid review request.", 400, parsed.error.flatten());
  }

  const data = parsed.data;

  try {
    await sendDraftForReview({
      to: data.to,
      cc: data.cc,
      bcc: data.bcc,
      subject: data.subject,
      message: data.message,
      instructions: data.instructions,
      format: data.format,
      draftTitle: data.draftTitle,
      senderName: profile.full_name || profile.email,
      deadline: data.deadline,
      pdfBase64: data.pdfBase64,
      wordHtml: data.wordHtml,
    });
  } catch (err) {
    console.error("[api/draft-review/send] email failed", err);
    return jsonErrorFromException(err, "Something went wrong while sending the review request.");
  }

  // Mail Merge (MailMergeDialog.jsx) sends personalized copies through this
  // same endpoint without `recipients` — it was never a formal "review
  // request", just a bulk personalized send, so there's nothing to persist.
  if (!data.recipients?.length) {
    return jsonOk({ sent: true });
  }

  try {
    let matterId = null;
    if (data.caseNo) {
      const { data: matter } = await supabase.from("matters").select("id").eq("display_no", data.caseNo).maybeSingle();
      matterId = matter?.id ?? null;
    }

    const { data: created, error } = await supabase
      .from("draft_review_requests")
      .insert({
        draft_id: data.draftId || null,
        version_id: data.versionId || null,
        matter_id: matterId,
        sender_id: user.id,
        sender_name: profile.full_name || profile.email,
        recipients: data.recipients,
        cc: data.cc || [],
        bcc: data.bcc || [],
        subject: data.subject,
        message: data.message || "",
        format: data.format,
        deadline: data.deadline || null,
        instructions: data.instructions || "",
        allow_comments: !!data.allowComments,
        allow_track_changes: !!data.allowTrackChanges,
        allow_editing: !!data.allowEditing,
        require_approval: !!data.requireApproval,
      })
      .select("*")
      .single();
    if (error) throw error;

    return jsonOk(serializeReviewRequest(created, { matterDisplayNo: data.caseNo || null }));
  } catch (err) {
    // Email already went out at this point — surface a distinct message so
    // the sender isn't told the send failed when it didn't.
    console.error("[api/draft-review/send] persistence failed after successful email", err);
    return jsonError("The review email was sent, but saving the review request record failed. Contact an administrator.", 500);
  }
}
