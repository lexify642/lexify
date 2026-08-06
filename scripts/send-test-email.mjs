// One-off sanity check for the Resend integration — sends a single "Hello
// World" email so you can confirm RESEND_API_KEY actually works end to end
// before relying on the OTP-login flow that shares the same lib/auth/otp.js
// send path. Run with: npm run email:test
import { Resend } from "resend";

process.loadEnvFile();

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("RESEND_API_KEY is not set in .env — add it, then re-run this script.");
  process.exit(1);
}

const resend = new Resend(apiKey);

const { data, error } = await resend.emails.send({
  from: "onboarding@resend.dev",
  to: "lexify642@gmail.com",
  subject: "Hello World",
  html: "<p>This is a test email from the LEXIFY Resend integration.</p>",
});

if (error) {
  console.error("Resend returned an error:");
  console.error(error);
  process.exit(1);
}

console.log("Email sent. Resend response:");
console.log(data);
