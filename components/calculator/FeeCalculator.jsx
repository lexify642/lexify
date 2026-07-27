"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { initialCases } from "@/data/cases";
import AiInsightsPanel from "./AiInsightsPanel";
import AlertsBanner from "./AlertsBanner";
import AuditLogPanel from "./AuditLogPanel";
import { inferInputsFromCase } from "./caseMapping";
import CalculationExplanationPanel from "./CalculationExplanationPanel";
import CaseSelectorBar from "./CaseSelectorBar";
import CostBreakdownTable from "./CostBreakdownTable";
import { calculateEstimate, DEFAULT_INPUT } from "./costEngine";
import { buildCsvBlob, buildMailtoHref, buildSummaryText, buildWhatsAppHref, downloadBlob } from "./exporters";
import GrandTotalSummary from "./GrandTotalSummary";
import InputDetailsCard from "./InputDetailsCard";
import StageTimeline from "./StageTimeline";
import StatutoryReferencesPanel from "./StatutoryReferencesPanel";
import { appendAuditEvent, getAuditLog, getEstimateHistory, saveEstimateSnapshot } from "./storage";
import VersionHistoryPanel from "./VersionHistoryPanel";
import AnalyticsDashboard from "./analytics/AnalyticsDashboard";

const TABS = [
  { key: "estimate", label: "Estimate" },
  { key: "timeline", label: "Timeline" },
  { key: "analytics", label: "Analytics" },
  { key: "history", label: "History & Audit" },
];

export default function FeeCalculator() {
  const [inputs, setInputs] = useState(DEFAULT_INPUT);
  const [linkedCaseNo, setLinkedCaseNo] = useState(null);
  const [activeTab, setActiveTab] = useState("estimate");
  const [dismissedAlertIds, setDismissedAlertIds] = useState([]);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [toast, setToast] = useState({ message: "", visible: false });
  const toastTimer = useRef(null);

  const linkedCase = useMemo(() => initialCases.find((c) => c.no === linkedCaseNo) || null, [linkedCaseNo]);
  const result = useMemo(() => calculateEstimate(inputs), [inputs]);

  useEffect(() => {
    setHistory(getEstimateHistory(linkedCaseNo));
  }, [linkedCaseNo]);

  useEffect(() => {
    setAuditLog(getAuditLog());
  }, []);

  function showToast(message) {
    setToast({ message, visible: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
  }

  function logEvent(event) {
    setAuditLog(
      appendAuditEvent({
        event,
        stateCourt: `${inputs.state} · ${inputs.court}`,
        rulesVersion: result.meta.rulesVersion,
      })
    );
  }

  function handleChange(key, value) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleCalculate() {
    setDismissedAlertIds([]);
    logEvent("Recalculated estimate");
    showToast("Estimate recalculated.");
  }

  function handleReset() {
    setInputs(linkedCase ? { ...DEFAULT_INPUT, ...inferInputsFromCase(linkedCase) } : DEFAULT_INPUT);
    setDismissedAlertIds([]);
    showToast("Inputs reset.");
  }

  function handleLinkCase(caseNo) {
    setLinkedCaseNo(caseNo);
    const found = initialCases.find((c) => c.no === caseNo);
    if (found) setInputs((prev) => ({ ...prev, ...inferInputsFromCase(found) }));
  }

  function handleUnlinkCase() {
    setLinkedCaseNo(null);
  }

  function handleRefresh() {
    setHistory(getEstimateHistory(linkedCaseNo));
    setAuditLog(getAuditLog());
    showToast("Refreshed from saved data.");
  }

  function handleSaveToCase() {
    const updated = saveEstimateSnapshot(linkedCaseNo, { inputs, totals: result.totals });
    setHistory(updated);
    logEvent(linkedCase ? `Saved estimate to case ${linkedCase.number}` : "Saved estimate (no case linked)");
    showToast("Estimate saved to case.");
  }

  function handleRestore(snapshot) {
    setInputs(snapshot.inputs);
    setActiveTab("estimate");
    showToast("Restored a previous version.");
  }

  function handlePrint(label) {
    setActiveTab("estimate");
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
          <h1 className="page-title">Court Fees &amp; Litigation Cost Calculator</h1>
          <p className="page-subtitle">
            {linkedCase ? `${linkedCase.parties} · ${linkedCase.number}` : "Estimate filing fees and common litigation expenses for your matter."}
          </p>
        </div>
        <div className="header-actions">
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

      <CaseSelectorBar cases={initialCases} linkedCase={linkedCase} onLink={handleLinkCase} onUnlink={handleUnlinkCase} />

      <AlertsBanner
        alerts={result.alerts}
        dismissedIds={dismissedAlertIds}
        onDismiss={(id) => setDismissedAlertIds((prev) => [...prev, id])}
      />

      <div className="workspace-tabs">
        {TABS.map((tab) => (
          <a
            key={tab.key}
            href={`#${tab.key}`}
            className={activeTab === tab.key ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab(tab.key);
            }}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <section className={`library-view${activeTab === "estimate" ? " active" : ""}`}>
        <div className="calculator-estimate-grid">
          <div className="calculator-estimate-main">
            <InputDetailsCard values={inputs} onChange={handleChange} onCalculate={handleCalculate} onReset={handleReset} />
            <CostBreakdownTable rows={result.rows} alerts={result.alerts} />
            <GrandTotalSummary totals={result.totals} input={inputs} onToggle={handleChange} />
          </div>
          <div className="calculator-estimate-side">
            <StatutoryReferencesPanel references={result.statutoryReferences} />
            <CalculationExplanationPanel rows={result.rows} />
            <AiInsightsPanel insights={result.insights} />
          </div>
        </div>
      </section>

      <section className={`library-view${activeTab === "timeline" ? " active" : ""}`}>
        <StageTimeline timeline={result.timeline} />
      </section>

      <section className={`library-view${activeTab === "analytics" ? " active" : ""}`}>
        <AnalyticsDashboard result={result} history={history} onActualExpensesChange={(v) => handleChange("actualExpensesSoFar", v)} />
      </section>

      <section className={`library-view${activeTab === "history" ? " active" : ""}`}>
        <VersionHistoryPanel history={history} onRestore={handleRestore} />
        <AuditLogPanel entries={auditLog} />
      </section>

      <div className={`toast${toast.visible ? " show" : ""}`} role="status">
        {toast.message}
      </div>
    </div>
  );
}
