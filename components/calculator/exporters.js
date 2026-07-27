import { formatInr } from "./format";

// Pure formatting helpers for the Save/Export actions. Each is an honest
// client-side approximation — see the plan's feasibility table: CSV stands in for
// a real .xlsx export, mailto/wa.me stand in for real delivery, print stands in
// for a real PDF binary.

export function buildCsvBlob(rows, totals) {
  const header = ["Particular", "Stage", "Jurisdiction", "Amount", "Risk", "Notes"];
  const lines = [header.join(",")];
  rows.forEach((r) => {
    const cells = [r.particular, r.stage, r.jurisdictionLabel, r.amount, r.risk, r.notes.replace(/,/g, ";")];
    lines.push(cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));
  });
  lines.push("");
  lines.push(`"Grand Total","","","${totals.grandTotal}","","${totals.grandTotalWords}"`);
  return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
}

export function buildSummaryText(input, totals, caseLabel) {
  const lines = [
    "Court Fees & Litigation Cost Estimate",
    caseLabel ? `Matter: ${caseLabel}` : null,
    `Nature of Proceeding: ${input.natureOfProceeding} (${input.caseCategory})`,
    `Court: ${input.court}, ${input.state}`,
    `Court Fee: ${formatInr(totals.courtFee)}`,
    `Filing & Process Fee: ${formatInr(totals.filingCharges)}`,
    `Documentation & Copying: ${formatInr(totals.documentation)}`,
    `Grand Total: ${formatInr(totals.grandTotal)} (${totals.grandTotalWords})`,
    "This is an indicative estimate only — actual costs may vary.",
  ].filter(Boolean);
  return lines.join("\n");
}

export function buildMailtoHref(summaryText, subject = "Litigation Cost Estimate") {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summaryText)}`;
}

export function buildWhatsAppHref(summaryText, phoneDigits) {
  const prefix = phoneDigits ? phoneDigits.replace(/[^0-9]/g, "") : "";
  return `https://wa.me/${prefix}?text=${encodeURIComponent(summaryText)}`;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
