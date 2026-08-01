"use client";

import { useState } from "react";
import { initialCases } from "@/data/cases";
import AlertsBanner from "./AlertsBanner";
import AuditLogPanel from "./AuditLogPanel";
import { inferInputsFromCase } from "./caseMapping";
import { useCalculator } from "./CalculatorContext";
import { DEFAULT_INPUT } from "./costEngine";
import CaseSelectorBar from "./CaseSelectorBar";
import { INPUT_FIELD_GROUPS } from "./inputFieldsConfig";
import InputDetailsCard from "./InputDetailsCard";
import VersionHistoryPanel from "./VersionHistoryPanel";
import ViewCalculationModal from "./ViewCalculationModal";

const TABS = [
  { key: "fields", label: "Fields" },
  { key: "history", label: "History & Audit" },
];

// One page per INPUT_FIELD_GROUPS entry (see app/calculator/page.js for
// "proceeding" and app/calculator/[group]/page.js for the rest) — the case
// linker and the History & Audit tab only make sense once, so they're only
// shown on the first step ("proceeding").
export default function CalculatorInputStepWorkspace({ groupId }) {
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
    showToast,
  } = useCalculator();
  const [activeTab, setActiveTab] = useState("fields");
  const [viewingEntry, setViewingEntry] = useState(null);
  const isFirstStep = groupId === "proceeding";
  const group = INPUT_FIELD_GROUPS.find((g) => g.id === groupId);

  function handleChange(key, value) {
    setInputs((prev) => ({ ...prev, [key]: value }));
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
    setActiveTab("fields");
    showToast("Restored a previous version.");
  }

  return (
    <div className="calculator-workspace">
      <div className="heading-row">
        <div>
          <h1 className="page-title">{group.title}</h1>
          <p className="page-subtitle">
            {linkedCase ? `${linkedCase.parties} · ${linkedCase.number}` : "Estimate filing fees and common litigation expenses for your matter."}
          </p>
        </div>
      </div>

      {isFirstStep && (
        <CaseSelectorBar cases={initialCases} linkedCase={linkedCase} onLink={handleLinkCase} onUnlink={handleUnlinkCase} />
      )}

      <AlertsBanner
        alerts={result.alerts}
        dismissedIds={dismissedAlertIds}
        onDismiss={(id) => setDismissedAlertIds((prev) => [...prev, id])}
      />

      {isFirstStep && (
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
      )}

      {(!isFirstStep || activeTab === "fields") && (
        <InputDetailsCard group={group} values={inputs} onChange={handleChange} onReset={handleReset} />
      )}

      {isFirstStep && activeTab === "history" && (
        <>
          <VersionHistoryPanel history={history} onRestore={handleRestore} />
          <AuditLogPanel entries={auditLog} onViewCalculation={setViewingEntry} />
        </>
      )}

      <ViewCalculationModal entry={viewingEntry} onClose={() => setViewingEntry(null)} />
    </div>
  );
}
