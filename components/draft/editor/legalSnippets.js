// Legal Document Elements (Insert tab) — real structured paragraphs, pulling
// real linked-case data when available (via CasesContext) and falling back
// to an honest editable placeholder rather than fabricating case details.
import { ROLE_LABELS } from "@/lib/roles";

function escapeHtml(text) {
  return (text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function courtHeadingSnippet(linkedCase) {
  const court = linkedCase ? `${linkedCase.court}${linkedCase.caseDetails?.courtComplex ? `, ${linkedCase.caseDetails.courtComplex}` : ""}` : "[COURT NAME]";
  const city = linkedCase?.city || "[CITY]";
  return `<h3 data-legal-style="legal-heading">IN THE ${escapeHtml(court).toUpperCase()} AT ${escapeHtml(city).toUpperCase()}</h3>`;
}

export function partyDetailsSnippet(linkedCase) {
  if (linkedCase?.parties) return `<p>${escapeHtml(linkedCase.parties)}</p>`;
  return `<p>[PARTY NAME]<br/>...Plaintiff/Petitioner</p><p><b>VERSUS</b></p><p>[PARTY NAME]<br/>...Defendant/Respondent</p>`;
}

export function caseNumberSnippet(linkedCase) {
  const number = linkedCase?.number || linkedCase?.caseDetails?.filingNumber || "[CASE NO.] OF [YEAR]";
  return `<p><b>${escapeHtml(number)}</b></p>`;
}

export function filingDetailsSnippet(linkedCase) {
  if (linkedCase) {
    return `<p>Filing: ${escapeHtml(linkedCase.filing || "N/A")}${linkedCase.registered ? ` — Registered ${escapeHtml(linkedCase.registered)}` : ""}</p>`;
  }
  return `<p>Filing: [FILING TYPE] — Registered [DATE]</p>`;
}

export function dateSnippet() {
  return `<p>Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>`;
}

export function placeSnippet(linkedCase) {
  return `<p>Place: ${escapeHtml(linkedCase?.city || "[PLACE]")}</p>`;
}

export function verificationBlockSnippet() {
  return `<p data-legal-style="legal-paragraph">I, the deponent above named, do hereby verify that the contents of the foregoing paragraphs are true and correct to the best of my knowledge, information, and belief, and nothing material has been concealed therefrom.</p>`;
}

export function signatureLineSnippet() {
  return `<p>_______________________</p>`;
}

export function advocateSignatureSnippet(currentUser) {
  const roleLabel = ROLE_LABELS[currentUser?.role] || currentUser?.role || "";
  return `<p data-legal-style="signature-block">Advocate for the Plaintiff/Petitioner<br/>${escapeHtml(currentUser?.name || "")}<br/>${escapeHtml(roleLabel)}</p>`;
}

export function clientSignatureSnippet(linkedCase) {
  const clientName = linkedCase?.client?.name || "[Client Name]";
  return `<p data-legal-style="signature-block">${escapeHtml(clientName)}<br/>(Client)</p>`;
}
