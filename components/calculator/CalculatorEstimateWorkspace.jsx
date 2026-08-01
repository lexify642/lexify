"use client";

import { useCalculator } from "./CalculatorContext";
import { downloadEstimatePdf } from "./exporters";
import { describeMatter } from "./format";
import GrandTotalSummary from "./GrandTotalSummary";
import { saveEstimateSnapshot } from "./storage";

export default function CalculatorEstimateWorkspace() {
  const { inputs, setInputs, linkedCaseNo, linkedCase, clientName, manualMatterTitle, result, setHistory, logEvent, showToast } =
    useCalculator();

  function handleToggle(key, value) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleSaveToCase() {
    const updated = saveEstimateSnapshot(linkedCaseNo, { inputs, totals: result.totals });
    setHistory(updated);
    logEvent(
      linkedCase
        ? `Saved estimate to case ${linkedCase.number}`
        : clientName
          ? `Saved estimate for ${clientName}`
          : "Saved estimate (no case linked)"
    );
    showToast("Estimate saved to case.");
  }

  function handleDownload() {
    downloadEstimatePdf({
      rows: result.rows,
      totals: result.totals,
      matterDescription: describeMatter({ linkedCase, clientName, manualMatterTitle }),
      filename: `litigation-cost-estimate-${Date.now()}.pdf`,
    });
    logEvent("Downloaded cost breakdown (PDF)");
    showToast("Download started.");
  }

  return (
    <div className="calculator-workspace">
      <div className="heading-row">
        <div>
          <h1 className="page-title">Estimated Total Litigation Cost</h1>
          <p className="page-subtitle">{describeMatter({ linkedCase, clientName, manualMatterTitle })}</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-outline" onClick={handleDownload}>
            ⭳ Download
          </button>
          <button type="button" className="btn" onClick={handleSaveToCase}>
            💾 Save to Case
          </button>
        </div>
      </div>

      <GrandTotalSummary totals={result.totals} input={inputs} onToggle={handleToggle} />
    </div>
  );
}
