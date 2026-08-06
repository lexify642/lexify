import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// jsPDF's built-in fonts don't include the ₹ glyph (outside WinAnsi
// encoding) — it renders as a blank box, so PDF output uses "Rs." instead
// of the ₹ symbol used on-screen (see format.js's formatInr).
function formatInrForPdf(amount) {
  const n = Number(amount) || 0;
  return "Rs. " + Math.round(n).toLocaleString("en-IN");
}

export function downloadEstimatePdf({ rows, totals, matterDescription, filename }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.setFontSize(16);
  doc.text("Court Fees & Litigation Cost Estimate", 40, 44);
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(matterDescription, 40, 62);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 80,
    head: [["Particular", "Stage", "Jurisdiction", "Amount", "Risk", "Notes"]],
    body: rows.map((r) => [r.particular, r.stage, r.jurisdictionLabel, formatInrForPdf(r.amount), r.risk, r.notes]),
    styles: { fontSize: 8, cellPadding: 6 },
    headStyles: { fillColor: [94, 43, 157] },
    columnStyles: { 3: { halign: "right" } },
  });

  const finalY = doc.lastAutoTable.finalY + 24;
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text(`Grand Total: ${formatInrForPdf(totals.grandTotal)}`, 40, finalY);
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  doc.text(totals.grandTotalWords, 40, finalY + 16);

  doc.save(filename);
}
