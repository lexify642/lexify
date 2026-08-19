// Shared Resend send helper — the requireResend()/honest-error pattern
// originally inline in lib/auth/otp.js, factored out so the OTP login flow
// and the Draft Review "Send for Review" flow share one implementation
// instead of duplicating the same env-var check and error handling twice.
const { Resend } = require("resend");

function requireResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const err = new Error("Email sending is not configured yet. Add RESEND_API_KEY to .env.");
    err.code = "EMAIL_NOT_CONFIGURED";
    throw err;
  }
  return new Resend(apiKey);
}

function fromAddress() {
  return process.env.RESEND_FROM_EMAIL || "LEXIFYI <onboarding@resend.dev>";
}

async function sendEmail({ to, cc, bcc, subject, html, attachments }) {
  const resend = requireResend();
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to,
    cc: cc && cc.length ? cc : undefined,
    bcc: bcc && bcc.length ? bcc : undefined,
    subject,
    html,
    attachments: attachments && attachments.length ? attachments : undefined,
  });
  if (error) {
    // Resend's own error messages (e.g. "verify a domain to send to other
    // recipients") are meant to be shown to the developer/operator, not a
    // secret — surfacing them directly saves a trip to the server logs.
    const err = new Error(error.message || "Could not send the email. Please try again.");
    err.code = "EMAIL_SEND_FAILED";
    throw err;
  }
}

module.exports = { requireResend, fromAddress, sendEmail };
