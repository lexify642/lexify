"use client";

import { exportClausesAsWord, exportClausesAsPdf, copyClausesAsText } from "../exportUtils";
import { useState } from "react";
import { useClauses } from "../ClausesContext";

export default function ViewCollectionModal({ collection, onClose }) {
  const [copied, setCopied] = useState(false);
  const { clauses: allClauses } = useClauses();
  const clauseById = new Map(allClauses.map((c) => [c.id, c]));
  const clauses = collection.clauseIds.map((id) => clauseById.get(id)).filter(Boolean);

  async function handleCopyAll() {
    await copyClausesAsText(clauses);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal wide">
        <div className="modal-head">
          <div>
            <p className="eyebrow">CLAUSE COLLECTION</p>
            <h2>{collection.name}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {collection.description && <p className="page-subtitle">{collection.description}</p>}
          <div className="matter-meta">
            <span>
              <b>{collection.createdBy}</b>Created by
            </span>
            <span>
              <b>{new Date(collection.createdAt).toLocaleDateString("en-IN")}</b>Created
            </span>
            <span>
              <b>{collection.clauseIds.length}</b>Clauses
            </span>
          </div>

          <div className="drawer-section-title" style={{ marginTop: 18 }}>
            <h3>Clauses</h3>
          </div>
          <div className="reorder-list">
            {clauses.map((c, i) => (
              <div className="reorder-item static" key={c.id}>
                <span className="reorder-index">{i + 1}.</span>
                <span className="reorder-label">{c.name || c.type}</span>
                <span className="clause-id">{c.id}</span>
              </div>
            ))}
            {clauses.length === 0 && <div className="empty-inline">No clauses in this collection.</div>}
          </div>
        </div>
        <div className="modal-foot">
          {copied && <span className="clause-copied-toast">Copied.</span>}
          <button type="button" className="btn btn-outline" onClick={() => exportClausesAsWord(clauses, `${collection.name}.doc`)}>
            Export as Word
          </button>
          <button type="button" className="btn btn-outline" onClick={() => exportClausesAsPdf(clauses, `${collection.name}.pdf`)}>
            Export as PDF
          </button>
          <button type="button" className="btn btn-outline" onClick={handleCopyAll}>
            Copy All Clause Text
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
