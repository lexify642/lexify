// Email-OTP login: generates a 6-digit code, stores it in Supabase
// (login_otps table — see the SQL provided alongside this feature), and
// sends it through Resend. Server-only (API routes), same pattern as
// lib/cases/query.js.
const { supabase } = require("../supabase");
const { Resend } = require("resend");

const OTP_TTL_MINUTES = 10;

function requireSupabase() {
  if (!supabase) {
    const err = new Error("Login is not configured yet. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env.");
    err.code = "AUTH_NOT_CONFIGURED";
    throw err;
  }
  return supabase;
}

function requireResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const err = new Error("Email sending is not configured yet. Add RESEND_API_KEY to .env.");
    err.code = "AUTH_NOT_CONFIGURED";
    throw err;
  }
  return new Resend(apiKey);
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function createAndSendOtp(email) {
  const db = requireSupabase();
  const resend = requireResend();

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  const { error: insertError } = await db.from("login_otps").insert({ email, code, expires_at: expiresAt });
  if (insertError) {
    const err = new Error("Could not create a login code. Please try again.");
    err.code = "AUTH_STORE_FAILED";
    throw err;
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || "LEXIFY <onboarding@resend.dev>";
  const { error: sendError } = await resend.emails.send({
    from: fromAddress,
    to: email,
    subject: `${code} is your LEXIFY sign-in code`,
    html: `<p>Your LEXIFY sign-in code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p><p>This code expires in ${OTP_TTL_MINUTES} minutes. If you didn't request this, you can ignore this email.</p>`,
  });
  if (sendError) {
    // Resend's error messages (e.g. "verify a domain to send to other
    // recipients") are meant to be shown to the developer/operator, not a
    // secret — surfacing them directly saves a trip to the server logs.
    const err = new Error(sendError.message || "Could not send the login code. Please try again.");
    err.code = "AUTH_SEND_FAILED";
    throw err;
  }
}

async function verifyOtp(email, code) {
  const db = requireSupabase();

  const { data, error } = await db
    .from("login_otps")
    .select("id, expires_at")
    .eq("email", email)
    .eq("code", code)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return false;
  if (new Date(data.expires_at).getTime() < Date.now()) return false;

  // Single-use: remove the code once it's been redeemed.
  await db.from("login_otps").delete().eq("id", data.id);
  return true;
}

module.exports = { createAndSendOtp, verifyOtp };
