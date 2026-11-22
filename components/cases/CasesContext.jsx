"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useCurrentUser } from "@/components/auth/AuthProvider";

const CasesContext = createContext(null);

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) {
    throw new Error(payload?.error?.message || "Something went wrong.");
  }
  return payload.data;
}

// Backed by Supabase (app/api/matters/*) instead of the old in-memory
// useState(initialCases) seed — but every consumer (CaseDiary, CaseModal,
// EditCaseModal, the dashboard, clientDirectory.js, calendar's
// eventAggregation.js, chat's accessListForCase, useCaseActions.js, etc.)
// keeps working unmodified: `cases` is the same nested shape, and `setCases`
// still accepts a plain updater function exactly like React's own setState.
// The only new behavior is that setCases() now also fires a best-effort
// background sync to Supabase for whatever matter(s) changed, diffed
// against the previous state — nothing that reads `cases` needs to know
// that's happening.
export function CasesProvider({ children }) {
  const [cases, setCasesState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const currentUser = useCurrentUser();

  useEffect(() => {
    let cancelled = false;
    fetchJson("/api/matters")
      .then((data) => {
        if (!cancelled) setCasesState(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function syncChanges(prev, next) {
    const prevByNo = new Map(prev.map((c) => [c.no, c]));
    next.forEach((nextCase) => {
      const prevCase = prevByNo.get(nextCase.no);
      if (!prevCase) {
        fetchJson("/api/matters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextCase),
        }).catch((err) => console.error("[CasesContext] create failed", err));
        return;
      }
      if (JSON.stringify(prevCase) !== JSON.stringify(nextCase)) {
        fetchJson(`/api/matters/${encodeURIComponent(nextCase.no)}/sync`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextCase),
        }).catch((err) => console.error("[CasesContext] sync failed", err));
      }
    });
  }

  function setCases(updater) {
    setCasesState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      syncChanges(prev, next);
      return next;
    });
  }

  function logCaseEdit(caseNo, changes) {
    if (!changes.length) return;
    setAuditLog((prev) => [
      { id: `audit-${Date.now()}`, timestamp: new Date().toISOString(), user: currentUser?.name || "Unknown", caseNo, changes },
      ...prev,
    ]);
  }

  return (
    <CasesContext.Provider value={{ cases, setCases, auditLog, logCaseEdit, loading, error }}>{children}</CasesContext.Provider>
  );
}

export function useCases() {
  const ctx = useContext(CasesContext);
  if (!ctx) throw new Error("useCases must be used within a CasesProvider");
  return ctx;
}
