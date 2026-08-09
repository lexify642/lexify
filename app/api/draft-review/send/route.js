import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { sendDraftForReview } from "@/lib/email/draftReview";
import { draftReviewSendSchema } from "@/lib/validation";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const parsed = draftReviewSendSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid review request.", 400, parsed.error.flatten());
  }

  try {
    await sendDraftForReview(parsed.data);
    return jsonOk({ sent: true });
  } catch (err) {
    console.error("[api/draft-review/send]", err);
    return jsonErrorFromException(err, "Something went wrong while sending the review request.");
  }
}
