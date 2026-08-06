import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { createAndSendOtp } from "@/lib/auth/otp";
import { emailSchema } from "@/lib/validation";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const parsed = emailSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Enter a valid email address.", 400, parsed.error.flatten());
  }

  try {
    await createAndSendOtp(parsed.data.email);
    return jsonOk({ sent: true });
  } catch (err) {
    console.error("[api/auth/send-otp]", err);
    return jsonErrorFromException(err, "Something went wrong while sending the code.");
  }
}
