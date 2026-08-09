"use client";

import { createContext, useContext, useState } from "react";
import { CURRENT_USER } from "@/data/team";

const ClauseWorkspaceContext = createContext(null);

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const RECENT_LIMIT = 20;

// Session-local bookmarks, a recently-used log, and named Clause Collections
// — none of this existed before this feature, same in-memory Provider/
// useState pattern as every other store in this app (CasesContext,
// TasksContext, etc.).
export function ClauseWorkspaceProvider({ children }) {
  const [savedClauseIds, setSavedClauseIds] = useState([]);
  const [recentlyUsed, setRecentlyUsed] = useState([]);
  const [collections, setCollections] = useState([]);

  function toggleSaved(clauseId) {
    setSavedClauseIds((prev) => (prev.includes(clauseId) ? prev.filter((id) => id !== clauseId) : [clauseId, ...prev]));
  }

  function logRecentUse(clauseId, action) {
    setRecentlyUsed((prev) => [{ id: newId("recent"), clauseId, action, timestamp: nowIso() }, ...prev].slice(0, RECENT_LIMIT));
  }

  function createCollection({ name, description, linkedCaseNo, clauseIds }) {
    const entry = {
      id: newId("collection"),
      name,
      description: description || "",
      linkedCaseNo: linkedCaseNo || null,
      createdBy: CURRENT_USER.name,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      clauseIds: clauseIds || [],
      status: "Active",
    };
    setCollections((prev) => [entry, ...prev]);
    return entry;
  }

  function addClausesToCollection(collectionId, clauseIds) {
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collectionId
          ? { ...c, clauseIds: [...new Set([...c.clauseIds, ...clauseIds])], updatedAt: nowIso() }
          : c
      )
    );
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
