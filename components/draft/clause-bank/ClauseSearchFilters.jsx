"use client";

import { useMemo, useState } from "react";
import { distinctValues } from "../clauseUtils";

const FILTER_FIELDS = [
  { field: "category", label: "Clause Category" },
  { field: "type", label: "Clause Type" },
  { field: "name", label: "Clause Name" },
  { field: "version", label: "Version" },
  { field: "favorability", label: "Party Favorability" },
  { field: "risk", label: "Risk Level" },
  { field: "domain", label: "Domain" },
  { field: "status", label: "Clause Status" },
];

export default function ClauseSearchFilters({ clauses, onSearch, onReset, savedOnly, onToggleSavedOnly }) {
  const [pendingFilters, setPendingFilters] = useState({});
  const [pendingQuery, setPendingQuery] = useState("");

  const options = useMemo(() => {
    const map = {};
    FILTER_FIELDS.forEach(({ field }) => {
      map[field] = distinctValues(clauses, field);
    });
    return map;
  }, [clauses]);

  function updateFilter(field, value) {
    setPendingFilters((prev) => ({ ...prev, [field]: value }));
  }

  function handleSearch() {
    onSearch(pendingFilters, pendingQuery);
  }

  function handleReset() {
    setPendingFilters({});
    setPendingQuery("");
    onReset();
  }

  return (
    <div className="card clause-filter-card">
      <div className="clause-filter-grid">
        {FILTER_FIELDS.map(({ field, label }) => (
          <label className="form-field" key={field}>
            {label.toUpperCase()}
            <select value={pendingFilters[field] || ""} onChange={(e) => updateFilter(field, e.target.value)}>
              <option value="">All</option>
              {options[field].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="clause-filter-search-row">
        <div className="search clause-main-search">
          <span>⌕</span>
          <input
            placeholder="Search by clause name, text, ID, category, type, or domain…"
            value={pendingQuery}
            onChange={(e) => setPendingQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <label className="checkbox-row" style={{ gap: 6, fontSize: 12, color: "var(--muted)" }}>
          <input type="checkbox" checked={savedOnly} onChange={onToggleSavedOnly} />
          Saved clauses only
        </label>
      </div>

      <div className="clause-filter-actions">
        <button type="button" className="btn" onClick={handleSearch}>
          Search
        </button>
        <button type="button" className="btn btn-outline" onClick={handleReset}>
          Reset Filters
        </button>
      </div>
    </div>
  );
}
