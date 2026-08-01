"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { initialCases } from "@/data/cases";
import { calculateEstimate, DEFAULT_INPUT } from "./costEngine";
import { appendAuditEvent, getAuditLog, getEstimateHistory } from "./storage";

const CalculatorContext = createContext(null);

// Shared calculator state across the two-page flow (/calculator for inputs,
// /calculator/estimate for the result) — same in-memory session-store pattern
// as CasesContext, wrapped around both routes via app/calculator/layout.js so
// navigating between them doesn't lose the current inputs/result.
export function CalculatorProvider({ children }) {
  const [inputs, setInputs] = useState(DEFAULT_INPUT);
  const [linkedCaseNo, setLinkedCaseNo] = useState(null);
  const [clientName, setClientName] = useState("");
  const [manualMatterTitle, setManualMatterTitle] = useState("");
  const [dismissedAlertIds, setDismissedAlertIds] = useState([]);
  const [isEditingEstimate, setIsEditingEstimate] = useState(false);
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
        snapshot: {
          estimateId: `EST-${Date.now()}`,
          state: inputs.state,
          court: inputs.court,
          rulesVersion: result.meta.rulesVersion,
          lastModified: null,
          clientName,
          manualMatterTitle: linkedCase ? null : manualMatterTitle || null,
          linkedCase: linkedCase
            ? {
                title: linkedCase.parties,
                number: linkedCase.number,
                type: linkedCase.filing,
                court: `${linkedCase.court}, ${linkedCase.city}`,
              }
            : null,
          inputs,
          totals: result.totals,
          statutoryReferences: result.statutoryReferences,
        },
      })
    );
  }

  function refreshFromStorage() {
    setHistory(getEstimateHistory(linkedCaseNo));
    setAuditLog(getAuditLog());
  }

  const value = {
    inputs,
    setInputs,
    linkedCaseNo,
    setLinkedCaseNo,
    linkedCase,
    clientName,
    setClientName,
    manualMatterTitle,
    setManualMatterTitle,
    result,
    dismissedAlertIds,
    setDismissedAlertIds,
    isEditingEstimate,
    setIsEditingEstimate,
    history,
    setHistory,
    auditLog,
    toast,
    showToast,
    logEvent,
    refreshFromStorage,
  };

  return (
    <CalculatorContext.Provider value={value}>
      {children}
      <div className={`toast${toast.visible ? " show" : ""}`} role="status">
        {toast.message}
      </div>
    </CalculatorContext.Provider>
  );
}

export function useCalculator() {
  const ctx = useContext(CalculatorContext);
  if (!ctx) throw new Error("useCalculator must be used within a CalculatorProvider");
  return ctx;
}
