"use client";

import { useMemo, useState } from "react";
import clauses from "@/data/clauses.json";

function riskTone(risk) {
  if (risk === "HIGH") return "red";
  if (risk === "MEDIUM") return "orange";
  return "blue";
}

export default function ClauseBank({ active, onInsert }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const categories = useMemo(
    () => [...new Set(clauses.map((clause) => clause.category).filter(Boolean))].sort(),
    []
  );

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    return clauses.filter(
      (clause) =>
        (!category || clause.category === category) &&
        [clause.id, clause.category, clause.type, clause.name, clause.domain, clause.text]
          .join(" ")
          .toLowerCase()
          .includes(term)
    );
  }, [search, category]);

  return (
    <section className={`library-view${active ? " active" : ""}`} data-library-view="clauses">
      <div className="section-head">
        <div>
          <h2 className="section-title">Clause Bank</h2>
          <p className="page-subtitle">
            Complete commercial and litigation clause library imported from your databases.
          </p>
        </div>
        <span className="badge blue">{clauses.length} clauses</span>
      </div>
      <div className="library-controls">
        <div className="search">
          <span>⌕</span>
          <input
            id="clause-search"
            placeholder="Search clause name, text, category or ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select id="clause-category" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">All categories</option>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <p id="clause-count" className="library-summary">
        {matches.length} clause{matches.length === 1 ? "" : "s"} available
      </p>
      <div id="clause-results" className="clause-grid">
        {matches.map((clause) => (
          <article className="card clause-card" key={clause.id}>
            <span className={`badge ${riskTone(clause.risk)}`}>{clause.risk || "Standard"}</span>
            <h3>{clause.name || clause.type}</h3>
            <div className="clause-meta">
              {clause.category} · {clause.type}
            </div>
            <p className="clause-text">{clause.text || "Clause text unavailable."}</p>
            <div className="clause-footer">
              <span className="clause-id">{clause.id}</span>
              <button className="btn btn-soft" onClick={() => onInsert(clause.text)}>
                Insert
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
