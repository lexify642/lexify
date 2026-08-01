"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initialCases } from "@/data/cases";
import AlertsBanner from "./AlertsBanner";
import AuditLogPanel from "./AuditLogPanel";
import { inferInputsFromCase } from "./caseMapping";
import CaseSelectorBar from "./CaseSelectorBar";
import { useCalculator } from "./CalculatorContext";
import { DEFAULT_INPUT } from "./costEngine";
import InputDetailsCard from "./InputDetailsCard";
import VersionHistoryPanel from "./VersionHistoryPanel";
import ViewCalculationModal from "./ViewCalculationModal";

const TABS = [
  { key: "estimate", label: "Estimate" },
  { key: "history", label: "History & Audit" },
];

export default function CalculatorInputWorkspace() {
  const router = useRouter();
  const {
    inputs,
    setInputs,
    linkedCaseNo,
    setLinkedCaseNo,
    linkedCase,
    result,
    dismissedAlertIds,
    setDismissedAlertIds,
    history,
    auditLog,
    logEvent,
    showToast,
  } = useCalculator();
  const [activeTab, setActiveTab] = useState("estimate");
  const [viewingEntry, setViewingEntry] = useState(null);

  function handleChange(key, value) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleCalculate() {
    setDismissedAlertIds([]);
    logEvent("Recalculated estimate");
    showToast("Estimate calculated.");
    router.push("/calculator/estimate");
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

  function handleRestore(snapshot) {
    setInputs(snapshot.inputs);
    setActiveTab("estimate");
    showToast("Restored a previous version.");
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
        <InputDetailsCard values={inputs} onChange={handleChange} onCalculate={handleCalculate} onReset={handleReset} />
      </section>

      <section className={`library-view${activeTab === "history" ? " active" : ""}`}>
        <VersionHistoryPanel history={history} onRestore={handleRestore} />
        <AuditLogPanel entries={auditLog} onViewCalculation={setViewingEntry} />
      </section>

      <ViewCalculationModal entry={viewingEntry} onClose={() => setViewingEntry(null)} />
    </div>
  );
}
