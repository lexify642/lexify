"use client";

import { createContext, useContext, useEffect, useState } from "react";

const LegalDraftsContext = createContext(null);

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) {
    throw new Error(payload?.error?.message || "Something went wrong.");
  }
  return payload.data;
}

// Backed by Supabase (app/api/legal-drafts/*) instead of the static
// LEGAL_DRAFT_CATEGORIES import in data/legalDrafts.js — that file's pure
// helpers (categoryName, categoryDescription, subTypeName,
// translatePracticeArea, t) all keep working unchanged against the
// `categories` array this exposes, since the reassembled shape is identical
// to what the static array always had.
export function LegalDraftsProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function reload() {
    setLoading(true);
    return fetchJson("/api/legal-drafts")
      .then(setCategories)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let cancelled = false;
    fetchJson("/api/legal-drafts")
      .then((data) => {
        if (!cancelled) setCategories(data);
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

  return <LegalDraftsContext.Provider value={{ categories, loading, error, reload }}>{children}</LegalDraftsContext.Provider>;
}

export function useLegalDrafts() {
  const ctx = useContext(LegalDraftsContext);
  if (!ctx) throw new Error("useLegalDrafts must be used within a LegalDraftsProvider");
  return ctx;
}
