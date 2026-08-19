// Composes and sends the "Send for Review" email — real attachments (the
// same PDF/Word bytes the Export buttons produce, generated client-side and
// passed in as base64/HTML), sent through the shared Resend helper.
const { sendEmail } = require("./resend");

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendDraftForReview({ to, cc, bcc, subject, message, format, draftTitle, senderName, deadline, instructions, pdfBase64, wordHtml }) {
  const attachments = [];
  const safeTitle = (draftTitle || "draft").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  if ((format === "pdf" || format === "both") && pdfBase64) {
    attachments.push({ filename: `${safeTitle}.pdf`, content: pdfBase64 });
  }
  if ((format === "editable" || format === "both") && wordHtml) {
    attachments.push({ filename: `${safeTitle}.doc`, content: Buffer.from(wordHtml, "utf8").toString("base64") });
  }

  const html = `
    <p>${senderName ? escapeHtml(senderName) : "A colleague"} has sent you a draft for review: <b>${escapeHtml(draftTitle)}</b>.</p>
    ${deadline ? `<p><b>Review deadline:</b> ${escapeHtml(deadline)}</p>` : ""}
    ${message ? `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>` : ""}
    ${instructions ? `<p><b>Instructions:</b> ${escapeHtml(instructions)}</p>` : ""}
    <p style="color:#64748d;font-size:12px;">Sent via LEXIFYI Draft Review.</p>
  `;

  await sendEmail({ to, cc, bcc, subject, html, attachments });
}

module.exports = { sendDraftForReview };
