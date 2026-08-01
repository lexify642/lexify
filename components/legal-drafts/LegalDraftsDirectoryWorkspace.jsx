"use client";

import { useMemo, useState } from "react";
import { LANGUAGES, PRACTICE_AREAS, LEGAL_DRAFT_CATEGORIES } from "@/data/legalDrafts";
import LegalDraftCard from "./LegalDraftCard";

export default function LegalDraftsDirectoryWorkspace() {
  const [language, setLanguage] = useState("english");
  const [search, setSearch] = useState("");
  const [practiceArea, setPracticeArea] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return LEGAL_DRAFT_CATEGORIES.filter((c) => {
      if (!c.languages.includes(language)) return false;
      if (practiceArea && c.practiceArea !== practiceArea) return false;
      if (term && !(c.name.toLowerCase().includes(term) || c.description.toLowerCase().includes(term))) return false;
      return true;
    });
  }, [language, search, practiceArea]);

  const languageLabel = LANGUAGES.find((l) => l.id === language)?.label ?? language;

  return (
    <div className="page">
      <div className="heading-row">
        <div>
          <h1 className="page-title">Legal Drafts Directory</h1>
          <p className="page-subtitle">Browse ready-to-use legal draft formats by category, practice area and language.</p>
        </div>
      </div>

      <div className="language-select">
        {LANGUAGES.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`language-btn${language === l.id ? " active" : ""}`}
            onClick={() => setLanguage(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>

      <section className="card">
        <div className="library-controls">
          <div className="search">
            <span>⌕</span>
            <input
              placeholder="Search legal drafts, agreements, affidavits, notices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select value={practiceArea} onChange={(e) => setPracticeArea(e.target.value)} aria-label="Filter by practice area">
            <option value="">All practice areas</option>
            {PRACTICE_AREAS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <p className="library-summary">
          {filtered.length} draft categor{filtered.length === 1 ? "y" : "ies"} available in {languageLabel}.
        </p>
      </section>

      {filtered.length ? (
        <div className="legal-draft-grid">
          {filtered.map((c) => (
            <LegalDraftCard category={c} activeLanguage={language} key={c.id} />
          ))}
        </div>
      ) : (
        <div className="no-cases">
          <b>No legal drafts found</b>
          <span>Try a different search term, language or practice area.</span>
        </div>
      )}
    </div>
  );
}
