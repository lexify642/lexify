"use client";

import { useState } from "react";
import { initialCases } from "@/data/cases";
import AuditLogPanel from "./AuditLogPanel";
import { inferInputsFromCase } from "./caseMapping";
import { useCalculator } from "./CalculatorContext";
import CaseSelectorBar from "./CaseSelectorBar";
import { describeMatter } from "./format";
import VersionHistoryPanel from "./VersionHistoryPanel";
import ViewCalculationModal from "./ViewCalculationModal";

const TABS = [
  { key: "details", label: "Client & Matter" },
  { key: "history", label: "History & Audit" },
];

// Step 1 of the wizard — who this estimate is for. Link an existing case (in
// which case the client name auto-fills from it) or, if there isn't one yet,
// enter the client name and a matter description by hand.
export default function CalculatorClientStepWorkspace() {
  const {
    setInputs,
    setLinkedCaseNo,
    linkedCase,
    clientName,
    setClientName,
    manualMatterTitle,
    setManualMatterTitle,
    history,
    auditLog,
    showToast,
  } = useCalculator();
  const [activeTab, setActiveTab] = useState("details");
  const [viewingEntry, setViewingEntry] = useState(null);
  const [manualEntryOpen, setManualEntryOpen] = useState(Boolean(manualMatterTitle));

  function handleLinkCase(caseNo) {
    setLinkedCaseNo(caseNo);
    const found = initialCases.find((c) => c.no === caseNo);
    if (found) {
      setInputs((prev) => ({ ...prev, ...inferInputsFromCase(found) }));
      setClientName(found.client?.name || "");
    }
  }

  function handleUnlinkCase() {
    setLinkedCaseNo(null);
  }

  function handleRestore(snapshot) {
    setInputs(snapshot.inputs);
    setActiveTab("details");
    showToast("Restored a previous version.");
  }

  return (
    <div className="calculator-workspace">
      <div className="heading-row">
        <div>
          <h1 className="page-title">Client &amp; Matter</h1>
          <p className="page-subtitle">{describeMatter({ linkedCase, clientName, manualMatterTitle })}</p>
        </div>
      </div>

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

      {activeTab === "details" && (
        <>
          <section className="card">
            <h2 className="panel-title">Who is this estimate for?</h2>
            <div className="field">
              <label htmlFor="calc-client-name">
                Client / Party Name <span className="req">*</span>
              </label>
              <input
                id="calc-client-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Ramesh Patil"
              />
              <div className="hint">Auto-fills from the linked case below, or enter it directly.</div>
            </div>
          </section>

          <CaseSelectorBar cases={initialCases} linkedCase={linkedCase} onLink={handleLinkCase} onUnlink={handleUnlinkCase} />

          {!linkedCase && (
            <section className="card">
              {!manualEntryOpen ? (
                <button type="button" className="link" onClick={() => setManualEntryOpen(true)}>
                  + No case on file — add matter details manually
                </button>
              ) : (
                <div className="field" style={{ marginBottom: 0 }}>
                  <label htmlFor="calc-manual-matter">Matter / Case Description</label>
                  <input
                    id="calc-manual-matter"
                    value={manualMatterTitle}
                    onChange={(e) => setManualMatterTitle(e.target.value)}
                    placeholder="e.g. Property dispute — Sharma family"
                  />
                  <div className="hint">Used only to label this estimate; it won't create a case record.</div>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {activeTab === "history" && (
        <>
          <VersionHistoryPanel history={history} onRestore={handleRestore} />
          <AuditLogPanel entries={auditLog} onViewCalculation={setViewingEntry} />
        </>
      )}

      <ViewCalculationModal entry={viewingEntry} onClose={() => setViewingEntry(null)} />
    </div>
  );
}
