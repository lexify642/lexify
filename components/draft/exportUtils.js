import { jsPDF } from "jspdf";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function clauseHeading(clause) {
  return clause.name || clause.type || clause.id;
}

// Same technique already used by PartnershipDeedEngine.jsx's "Download as MS
// Word" button (an HTML string saved with the application/msword mimetype,
// which Word opens natively) — generalized here for an arbitrary list of
// clauses instead of that generator's own fixed deed shape, so this is the
// same pattern extended, not a second export system.
export function exportClausesAsWord(clauses, filename = "clauses.doc") {
  const body = clauses
    .map(
      (c) =>
        `<h3>${clauseHeading(c)}</h3><p style="color:#666;font-size:11px">${c.id} · ${c.category || ""}${
          c.type ? ` · ${c.type}` : ""
        }</p><p style="white-space:pre-line">${(c.text || "").replace(/\n/g, "<br>")}</p><hr>`
    )
    .join("");
  const html = `<html><head><meta charset="utf-8"></head><body>${body}</body></html>`;
  downloadBlob(new Blob(["﻿", html], { type: "application/msword" }), filename);
}

// A new, purpose-built PDF export (the Fee Calculator's exporters.js is
// tightly coupled to its own cost-table shape via jspdf-autotable — clause
// text is plain paragraphs, not a table, so this uses jsPDF directly).
export function exportClausesAsPdf(clauses, filename = "clauses.pdf") {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - marginX * 2;
  let y = 56;

  clauses.forEach((c, index) => {
    if (index > 0) {
      doc.setDrawColor(220);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 18;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const heading = doc.splitTextToSize(clauseHeading(c), maxWidth);
    doc.text(heading, marginX, y);
    y += heading.length * 15 + 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(`${c.id} · ${[c.category, c.type].filter(Boolean).join(" · ")}`, marginX, y);
    y += 16;

    doc.setTextColor(20);
    doc.setFontSize(10.5);
    const lines = doc.splitTextToSize(c.text || "Clause text unavailable.", maxWidth);
    lines.forEach((line) => {
      if (y > pageHeight - 56) {
        doc.addPage();
        y = 56;
      }
      doc.text(line, marginX, y);
      y += 14;
    });
    y += 18;
    if (y > pageHeight - 56 && index < clauses.length - 1) {
      doc.addPage();
      y = 56;
    }
  });

  doc.save(filename);
}

export async function copyClausesAsText(clauses) {
  const text = clauses.map((c) => `${clauseHeading(c)} (${c.id})\n\n${c.text || ""}`).join("\n\n---\n\n");
  await navigator.clipboard.writeText(text);
}
