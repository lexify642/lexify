import { jsonError, jsonErrorFromException, jsonOk } from "@/lib/api-response";
import { verifyOtp } from "@/lib/auth/otp";
import { verifyOtpSchema } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Enter the 6-digit code.", 400, parsed.error.flatten());
  }

  const { email, code } = parsed.data;

  try {
    const ok = await verifyOtp(email, code);
    if (!ok) {
      return jsonError("That code is incorrect or has expired.", 401);
    }

    const admin = createSupabaseAdminClient();

    // Defense in depth: /api/auth/send-otp already refuses to send a code
    // for an email with no profiles row, so this should never trip for a
    // normal login — but a verify call only depends on the code matching a
    // login_otps row, so it's worth checking again before minting a session.
    const { data: profile } = await admin.from("profiles").select("is_active").eq("email", email).maybeSingle();
    if (!profile) {
      return jsonError("This email isn't registered with your firm. Ask your administrator to add you.", 403);
    }
    if (!profile.is_active) {
      return jsonError("Your account has been deactivated. Contact your firm administrator.", 403);
    }

    // The 6-digit code above is our own branded UX (lib/auth/otp.js +
    // Resend). This exchange is what turns a verified code into an actual
    // Supabase Auth session: generateLink (service role) mints a one-time
    // token for the email, then verifyOtp() on the cookie-aware SSR client
    // redeems it, which is what actually sets the session cookies.
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("[api/auth/verify-otp] generateLink failed", linkError);
      return jsonError("Something went wrong while signing you in. Please try again.", 500);
    }

    const supabase = await createSupabaseServerClient();
    const { error: exchangeError } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: linkData.properties.hashed_token,
    });
    if (exchangeError) {
      console.error("[api/auth/verify-otp] session exchange failed", exchangeError);
      return jsonError("Something went wrong while signing you in. Please try again.", 500);
    }

    return jsonOk({ verified: true });
  } catch (err) {
    console.error("[api/auth/verify-otp]", err);
    return jsonErrorFromException(err, "Something went wrong while verifying the code.");
  }
}
