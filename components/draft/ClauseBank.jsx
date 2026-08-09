"use client";

import { useMemo, useState } from "react";
import clauses from "@/data/clauses.json";
import { searchClauses } from "./clauseUtils";
import { useClauseWorkspace } from "./ClauseWorkspaceContext";
import ClauseSearchFilters from "./clause-bank/ClauseSearchFilters";
import ClauseResultsTable from "./clause-bank/ClauseResultsTable";
import ClauseDetailModal from "./clause-bank/ClauseDetailModal";
import ClauseSelectionBar from "./clause-bank/ClauseSelectionBar";
import RecentlyUsedStrip from "./clause-bank/RecentlyUsedStrip";
import Pagination from "@/components/case-research/Pagination";

const PAGE_SIZE = 12;

export default function ClauseBank({ active = true }) {
  const { savedClauseIds, logRecentUse } = useClauseWorkspace();

  const [hasSearched, setHasSearched] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [activeQuery, setActiveQuery] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [viewingClause, setViewingClause] = useState(null);

  const results = useMemo(() => {
    if (!hasSearched) return [];
    let list = searchClauses(clauses, { filters: activeFilters, query: activeQuery });
    if (savedOnly) list = list.filter((c) => savedClauseIds.includes(c.id));
    return list;
  }, [hasSearched, activeFilters, activeQuery, savedOnly, savedClauseIds]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pageResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedClauses = useMemo(() => clauses.filter((c) => selectedIds.has(c.id)), [selectedIds]);

  function handleSearch(filters, query) {
    const hasCriteria = Object.values(filters).some(Boolean) || query.trim();
    if (!hasCriteria) return;
    setActiveFilters(filters);
    setActiveQuery(query);
    setHasSearched(true);
    setPage(1);
  }

  function handleReset() {
    setActiveFilters({});
    setActiveQuery("");
    setSavedOnly(false);
    setHasSearched(false);
    setSelectedIds(new Set());
    setPage(1);
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleView(clause) {
    setViewingClause(clause);
    logRecentUse(clause.id, "viewed");
  }

  return (
    <section className={`library-view${active ? " active" : ""}`} data-library-view="clauses">
      <div className="section-head">
        <div>
          <h2 className="section-title">Clause Bank</h2>
          <p className="page-subtitle">
            {hasSearched ? `${results.length} clause${results.length === 1 ? "" : "s"} match your selection` : "Complete commercial and litigation clause library."}
          </p>
        </div>
        <span className="badge blue">{clauses.length} clauses</span>
      </div>

      <RecentlyUsedStrip onView={handleView} />

      <ClauseSearchFilters
        clauses={clauses}
        onSearch={handleSearch}
        onReset={handleReset}
        savedOnly={savedOnly}
        onToggleSavedOnly={() => setSavedOnly((v) => !v)}
      />

      {hasSearched ? (
        <>
          <ClauseResultsTable
            clauses={pageResults}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onRowClick={handleView}
          />
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      ) : (
        <div className="clause-search-empty-state">Choose at least one filter above to search clauses.</div>
      )}

      <ClauseSelectionBar selectedClauses={selectedClauses} onClear={() => setSelectedIds(new Set())} />

      {viewingClause && <ClauseDetailModal clause={viewingClause} onClose={() => setViewingClause(null)} />}
    </section>
  );
}
