"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ClausesContext = createContext(null);

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) {
    throw new Error(payload?.error?.message || "Something went wrong.");
  }
  return payload.data;
}

// Backed by Supabase (app/api/clauses/*) instead of the static
// data/clauses.json import — ClauseBank.jsx, ViewCollectionModal.jsx, and
// RecentlyUsedStrip.jsx all just read `clauses` as an array, exactly as
// before; searchClauses()/distinctValues()/etc. in clauseUtils.js are pure
// functions over that array and need no changes.
export function ClausesProvider({ children }) {
  const [clauses, setClauses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function reload() {
    setLoading(true);
    return fetchJson("/api/clauses")
      .then(setClauses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let cancelled = false;
    fetchJson("/api/clauses")
      .then((data) => {
        if (!cancelled) setClauses(data);
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

  return <ClausesContext.Provider value={{ clauses, loading, error, reload }}>{children}</ClausesContext.Provider>;
}

export function useClauses() {
  const ctx = useContext(ClausesContext);
  if (!ctx) throw new Error("useClauses must be used within a ClausesProvider");
  return ctx;
}
