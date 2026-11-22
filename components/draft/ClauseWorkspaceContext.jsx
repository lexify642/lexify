"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useCurrentUser } from "@/components/auth/AuthProvider";

const ClauseWorkspaceContext = createContext(null);

function nowIso() {
  return new Date().toISOString();
}

function newUuid() {
  return crypto.randomUUID();
}

const RECENT_LIMIT = 20;

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) {
    throw new Error(payload?.error?.message || "Something went wrong.");
  }
  return payload.data;
}

// Backed by Supabase (app/api/clause-saved, app/api/clause-recent-use,
// app/api/clause-collections) instead of in-memory state. savedClauseIds
// and recentlyUsed are genuinely personal (RLS scopes them to the caller);
// collections are shared team artifacts, same as everything else in this
// app that doesn't have per-user visibility rules.
export function ClauseWorkspaceProvider({ children }) {
  const currentUser = useCurrentUser();
  const [savedClauseIds, setSavedClauseIds] = useState([]);
  const [recentlyUsed, setRecentlyUsed] = useState([]);
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchJson("/api/clause-saved"), fetchJson("/api/clause-recent-use"), fetchJson("/api/clause-collections")])
      .then(([saved, recent, cols]) => {
        if (cancelled) return;
        setSavedClauseIds(saved);
        setRecentlyUsed(recent);
        setCollections(cols);
      })
      .catch((err) => console.error("[ClauseWorkspaceContext] initial load failed", err));
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleSaved(clauseId) {
    setSavedClauseIds((prev) => (prev.includes(clauseId) ? prev.filter((id) => id !== clauseId) : [clauseId, ...prev]));
    fetchJson("/api/clause-saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clauseId }) }).catch(
      (err) => console.error("[ClauseWorkspaceContext] toggleSaved failed", err)
    );
  }

  function logRecentUse(clauseId, action) {
    setRecentlyUsed((prev) => [{ id: newUuid(), clauseId, action, timestamp: nowIso() }, ...prev].slice(0, RECENT_LIMIT));
    fetchJson("/api/clause-recent-use", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clauseId, action }),
    }).catch((err) => console.error("[ClauseWorkspaceContext] logRecentUse failed", err));
  }

  function createCollection({ name, description, linkedCaseNo, clauseIds }) {
    const entry = {
      id: newUuid(),
      name,
      description: description || "",
      linkedCaseNo: linkedCaseNo || null,
      createdBy: currentUser.name,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      clauseIds: clauseIds || [],
      status: "Active",
    };
    setCollections((prev) => [entry, ...prev]);

    fetchJson("/api/clause-collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry.id, name, description, linkedCaseNo, clauseIds }),
    }).catch((err) => console.error("[ClauseWorkspaceContext] createCollection failed", err));

    return entry;
  }

  function addClausesToCollection(collectionId, clauseIds) {
    setCollections((prev) =>
      prev.map((c) => (c.id === collectionId ? { ...c, clauseIds: [...new Set([...c.clauseIds, ...clauseIds])], updatedAt: nowIso() } : c))
    );
    fetchJson(`/api/clause-collections/${collectionId}/clauses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clauseIds }),
    }).catch((err) => console.error("[ClauseWorkspaceContext] addClausesToCollection failed", err));
  }

  return (
    <ClauseWorkspaceContext.Provider
      value={{
        savedClauseIds,
        recentlyUsed,
        collections,
        toggleSaved,
        logRecentUse,
        createCollection,
        addClausesToCollection,
      }}
    >
      {children}
    </ClauseWorkspaceContext.Provider>
  );
}

export function useClauseWorkspace() {
  const ctx = useContext(ClauseWorkspaceContext);
  if (!ctx) throw new Error("useClauseWorkspace must be used within a ClauseWorkspaceProvider");
  return ctx;
}
