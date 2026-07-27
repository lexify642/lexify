"use client";

import { createContext, useContext, useState } from "react";
import { initialCases } from "@/data/cases";

const CasesContext = createContext(null);

// Shared, in-memory (no backend/localStorage) session store so the Cases page,
// the Dashboard's reminder widget, and the Case Details page all see the same
// case data. Resets on a full reload, same as the rest of this app.
export function CasesProvider({ children }) {
  const [cases, setCases] = useState(initialCases);
  const [auditLog, setAuditLog] = useState([]);

  function logCaseEdit(caseNo, changes) {
    if (!changes.length) return;
    setAuditLog((prev) => [{ id: `audit-${Date.now()}`, timestamp: new Date().toISOString(), user: "John Anderson", caseNo, changes }, ...prev]);
  }

  return <CasesContext.Provider value={{ cases, setCases, auditLog, logCaseEdit }}>{children}</CasesContext.Provider>;
}

export function useCases() {
  const ctx = useContext(CasesContext);
  if (!ctx) throw new Error("useCases must be used within a CasesProvider");
  return ctx;
}
