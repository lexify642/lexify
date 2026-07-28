"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Pagination from "./Pagination";
import { displayDate, toneForDisposition } from "./utils";

const EMPTY_FILTERS = { q: "", court: "", judge: "", year: "", act: "", section: "", citation: "" };

function buildQueryString(filters, sort, page) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  if (sort) params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  return params.toString();
}

export default function CaseResearchWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    q: searchParams.get("q") || "",
    court: searchParams.get("court") || "",
    judge: searchParams.get("judge") || "",
    year: searchParams.get("year") || "",
    act: searchParams.get("act") || "",
    section: searchParams.get("section") || "",
    citation: searchParams.get("citation") || "",
  }));
  const [sort, setSort] = useState(searchParams.get("sort") === "relevance" ? "relevance" : "latest");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [pageSize] = useState(20);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeFilterCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);

  useEffect(() => {
    const qs = buildQueryString(filters, sort, page);
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      fetch(`/api/cases/search?${qs}&pageSize=${pageSize}`)
        .then((res) => res.json())
        .then((body) => {
          if (body.error) {
            setError(body.error.message);
            setResults([]);
          } else {
            setResults(body.data);
            setPagination(body.pagination);
          }
        })
        .catch(() => setError("Could not reach the search service."))
        .finally(() => setLoading(false));

      router.replace(`/case-research${qs ? `?${qs}` : ""}`, { scroll: false });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort, page, pageSize]);

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function handleClearFilters() {
    setFilters(EMPTY_FILTERS);
    setSort("latest");
    setPage(1);
  }

  return (
    <div className="page">
      <div className="heading-row">
        <div>
          <h1 className="page-title">Case Research</h1>
          <p className="page-subtitle">Search Indian case law by title, parties, judge, court, citation, act or section.</p>
        </div>
      </div>

      <section className="card">
        <div className="search case-research-search">
          <span>⌕</span>
          <input
            placeholder="Search case title, petitioner, respondent, judge, court, citation, act, section, keywords..."
            value={filters.q}
            onChange={(e) => handleFilterChange("q", e.target.value)}
          />
        </div>

        <div className="field-group">
          <h4>Filters</h4>
          <div className="field-row">
            <div className="field">
              <label htmlFor="cr-court">Court</label>
              <input id="cr-court" value={filters.court} onChange={(e) => handleFilterChange("court", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="cr-judge">Judge</label>
              <input id="cr-judge" value={filters.judge} onChange={(e) => handleFilterChange("judge", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="cr-year">Year</label>
              <input id="cr-year" inputMode="numeric" value={filters.year} onChange={(e) => handleFilterChange("year", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="cr-act">Act</label>
              <input id="cr-act" value={filters.act} onChange={(e) => handleFilterChange("act", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="cr-section">Section</label>
              <input id="cr-section" value={filters.section} onChange={(e) => handleFilterChange("section", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="cr-citation">Citation</label>
              <input id="cr-citation" value={filters.citation} onChange={(e) => handleFilterChange("citation", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="case-research-toolbar">
          <div className="date-nav">
            <button
              type="button"
              className={sort === "relevance" ? "active" : ""}
              disabled={!filters.q}
              title={filters.q ? "" : "Enter a search term to sort by relevance"}
              onClick={() => setSort("relevance")}
            >
              Relevance
            </button>
            <button type="button" className={sort === "latest" ? "active" : ""} onClick={() => setSort("latest")}>
              Latest
            </button>
          </div>
          {activeFilterCount > 0 && (
            <button type="button" className="btn btn-outline" onClick={handleClearFilters}>
              Clear filters
            </button>
          )}
        </div>
      </section>

      <section className="card">
        <div className="diary-summary" style={{ margin: "0 0 14px" }}>
          {loading ? "Searching…" : `${pagination.total.toLocaleString("en-IN")} judgment(s) found.`}
        </div>
        {error && <div className="empty-inline">{error}</div>}
        {!error && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Court</th>
                  <th>Judge</th>
                  <th>Decision Date</th>
                  <th>Citation</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((c) => (
                  <tr className="case-row" tabIndex={0} key={c.id} onClick={() => router.push(`/case-research/${c.id}`)}>
                    <td>
                      <strong>{c.caseTitle}</strong>
                      <br />
                      <small>{c.docketNumber}</small>
                    </td>
                    <td>{c.courtName}</td>
                    <td>{c.presidingJudge || "—"}</td>
                    <td>{displayDate(c.decisionDate)}</td>
                    <td>{c.neutralCitation || c.lawReportCitation || c.cnrNumber || "—"}</td>
                    <td>
                      <span className={`badge ${toneForDisposition(c.dispositionText)}`}>{c.dispositionText || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && !results.length && (
          <div className="no-cases">
            <b>No judgments found</b>
            <span>Try a different search term or clear some filters.</span>
          </div>
        )}
        <Pagination page={page} totalPages={pagination.totalPages} onChange={setPage} />
      </section>
    </div>
  );
}
