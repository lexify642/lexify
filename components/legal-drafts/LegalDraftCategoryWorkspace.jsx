"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getCategoryBySlug } from "@/data/legalDrafts";

// Categories with a `subTypes` array (Affidavit today) render as their own
// searchable mini-directory; every other category is a single-document leaf
// with a straightforward detail panel. Same component, driven entirely by
// data — no special-casing "Affidavit" in code.
export default function LegalDraftCategoryWorkspace({ slug }) {
  const category = getCategoryBySlug(slug);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ message: "", visible: false });
  const toastTimer = useRef(null);

  function showToast(message) {
    setToast({ message, visible: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
  }

  function handleDownload(name) {
    showToast(`"${name}" — connect a document source to enable downloads.`);
  }

  const filteredSubTypes = useMemo(() => {
    if (!category?.subTypes) return [];
    const term = search.trim().toLowerCase();
    if (!term) return category.subTypes;
    return category.subTypes.filter((s) => s.name.toLowerCase().includes(term));
  }, [category, search]);

  if (!category) {
    return (
      <div className="page">
        <div className="empty-inline">No legal draft category found for &quot;{slug}&quot;.</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="heading-row">
        <div>
          <p className="eyebrow">LEGAL DRAFTS</p>
          <h1 className="page-title">{category.name}</h1>
          <p className="page-subtitle">{category.description}</p>
        </div>
        <Link className="btn btn-outline" href="/legal-drafts">
          ← Back to Directory
        </Link>
      </div>

      {category.subTypes ? (
        <>
          <section className="card">
            <div className="search" style={{ width: "100%" }}>
              <span>⌕</span>
              <input
                placeholder={`Search ${category.name} formats...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </section>

          {filteredSubTypes.length ? (
            <div className="legal-draft-subtype-grid">
              {filteredSubTypes.map((s) => (
                <button
                  type="button"
                  className="legal-draft-subtype-card"
                  key={s.id}
                  onClick={() => handleDownload(s.name)}
                >
                  <span>{s.name}</span>
                  <span className="link">Download →</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="no-cases">
              <b>No matching formats</b>
              <span>Try a different search term.</span>
            </div>
          )}
        </>
      ) : (
        <section className="card">
          <div className="matter-meta">
            <span>
              <b>{category.practiceArea}</b>
              Practice Area
            </span>
            <span>
              <b>{category.languages.length}</b>
              Language(s) available
            </span>
          </div>
          <button type="button" className="btn" onClick={() => handleDownload(category.name)} style={{ marginTop: 20 }}>
            ⭳ Download {category.name}
          </button>
        </section>
      )}

      <div className={`toast${toast.visible ? " show" : ""}`} role="status">
        {toast.message}
      </div>
    </div>
  );
}
