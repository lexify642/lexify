"use client";

import { useState } from "react";
import Link from "next/link";
import { useCalculator } from "./CalculatorContext";
import { buildCsvBlob, buildMailtoHref, buildSummaryText, buildWhatsAppHref, downloadBlob } from "./exporters";
import GrandTotalSummary from "./GrandTotalSummary";
import { saveEstimateSnapshot } from "./storage";

export default function CalculatorEstimateWorkspace() {
  const { inputs, setInputs, linkedCaseNo, linkedCase, result, setHistory, logEvent, refreshFromStorage, showToast } =
    useCalculator();
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  function handleToggle(key, value) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleRefresh() {
    refreshFromStorage();
    showToast("Refreshed from saved data.");
  }

  function handleSaveToCase() {
    const updated = saveEstimateSnapshot(linkedCaseNo, { inputs, totals: result.totals });
    setHistory(updated);
    logEvent(linkedCase ? `Saved estimate to case ${linkedCase.number}` : "Saved estimate (no case linked)");
    showToast("Estimate saved to case.");
  }

  function handlePrint(label) {
    logEvent(label);
    setTimeout(() => window.print(), 50);
  }

  function handleExportCsv() {
    const blob = buildCsvBlob(result.rows, result.totals);
    downloadBlob(blob, `litigation-cost-estimate-${Date.now()}.csv`);
    logEvent("Exported CSV/Excel breakdown");
    showToast("CSV export downloaded.");
  }

  function handleEmail() {
    const text = buildSummaryText(inputs, result.totals, linkedCase?.parties);
    window.location.href = buildMailtoHref(text);
    setShareMenuOpen(false);
    logEvent("Shared estimate via email");
  }

  function handleWhatsApp() {
    const text = buildSummaryText(inputs, result.totals, linkedCase?.parties);
    window.open(buildWhatsAppHref(text, linkedCase?.client?.phone), "_blank", "noopener,noreferrer");
    setShareMenuOpen(false);
    logEvent("Shared estimate via WhatsApp");
  }

  return (
    <div className="calculator-workspace">
      <div className="heading-row">
        <div>
          <h1 className="page-title">Estimated Total Litigation Cost</h1>
          <p className="page-subtitle">
            {linkedCase ? `${linkedCase.parties} · ${linkedCase.number}` : "Estimate filing fees and common litigation expenses for your matter."}
          </p>
        </div>
        <div className="header-actions">
          <Link className="btn btn-outline" href="/calculator">
            ← Edit Inputs
          </Link>
          <button type="button" className="btn btn-outline" onClick={handleRefresh}>
            ↻ Refresh
          </button>
          <button type="button" className="btn btn-outline" onClick={handleExportCsv}>
            ⭳ Export
          </button>
          <button type="button" className="btn btn-outline" onClick={() => handlePrint("Printed estimate")}>
            🖶 Print
          </button>
          <button type="button" className="btn btn-outline" onClick={() => handlePrint("Generated PDF")}>
            📄 Generate PDF
          </button>
          <div className="share-menu-wrap">
            <button type="button" className="btn btn-outline" onClick={() => setShareMenuOpen((v) => !v)}>
              ↗ Share Estimate
            </button>
            {shareMenuOpen && (
              <div className="share-menu">
                <button type="button" onClick={handleEmail}>
                  ✉ Email estimate
                </button>
                <button type="button" onClick={handleWhatsApp}>
                  ⌾ Share via WhatsApp
                </button>
              </div>
            )}
          </div>
          <button type="button" className="btn" onClick={handleSaveToCase}>
            💾 Save to Case
          </button>
        </div>
      </div>

      <GrandTotalSummary totals={result.totals} input={inputs} onToggle={handleToggle} />
    </div>
  );
}
