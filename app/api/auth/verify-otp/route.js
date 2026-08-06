import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { verifyOtp } from "@/lib/auth/otp";
import { verifyOtpSchema } from "@/lib/validation";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Enter the 6-digit code.", 400, parsed.error.flatten());
  }

  try {
    const ok = await verifyOtp(parsed.data.email, parsed.data.code);
    if (!ok) {
      return jsonError("That code is incorrect or has expired.", 401);
    }
    return jsonOk({ verified: true });
  } catch (err) {
    console.error("[api/auth/verify-otp]", err);
    return jsonErrorFromException(err, "Something went wrong while verifying the code.");
  }
}
