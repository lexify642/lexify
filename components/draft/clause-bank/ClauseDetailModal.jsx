"use client";

import { useState } from "react";
import Link from "next/link";
import { useClauseWorkspace } from "../ClauseWorkspaceContext";
import { displayValue, riskTone, statusTone, caseLawHref } from "../clauseUtils";
import AddToDraftModal from "./AddToDraftModal";
import CreateCollectionModal from "./CreateCollectionModal";

function Field({ label, value }) {
  return (
    <div className="clause-detail-field">
      <b>{label}</b>
      <span>{value}</span>
    </div>
  );
}

export default function ClauseDetailModal({ clause, onClose }) {
  const { savedClauseIds, toggleSaved, logRecentUse } = useClauseWorkspace();
  const [copied, setCopied] = useState(false);
  const [addToDraftOpen, setAddToDraftOpen] = useState(false);
  const [addToProjectOpen, setAddToProjectOpen] = useState(false);

  const isSaved = savedClauseIds.includes(clause.id);
  const lawHref = caseLawHref(clause.caseLaw);

  async function handleCopy() {
    await navigator.clipboard.writeText(clause.text || "");
    logRecentUse(clause.id, "copied");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleSave() {
    toggleSaved(clause.id);
    logRecentUse(clause.id, "saved");
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal wide">
        <div className="modal-head">
          <div>
            <p className="eyebrow">CLAUSE BANK</p>
            <h2>{clause.name || clause.type}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="clause-detail-grid">
            <Field label="Clause ID" value={clause.id} />
            <Field label="Category" value={displayValue(clause.category)} />
            <Field label="Type" value={displayValue(clause.type)} />
            <Field label="Name" value={displayValue(clause.name)} />
            <Field label="Position" value={displayValue(clause.position)} />
            <Field label="Domain" value={displayValue(clause.domain)} />
            <Field label="Version" value={displayValue(clause.version)} />
            <Field label="Last Updated" value="Not tracked" />
          </div>

          <div className="drawer-section-title" style={{ marginTop: 18 }}>
            <h3>Clause Text</h3>
          </div>
          <div className="clause-detail-text">{clause.text || "Clause text unavailable."}</div>

          <div className="drawer-section-title" style={{ marginTop: 18 }}>
            <h3>Risk &amp; Negotiation Intelligence</h3>
          </div>
          <div className="clause-detail-grid">
            <div className="clause-detail-field">
              <b>Risk Level</b>
              <span className={`badge ${riskTone(clause.risk)}`}>{displayValue(clause.risk, "N/A")}</span>
            </div>
            <div className="clause-detail-field">
              <b>Party Favorability</b>
              <span>{displayValue(clause.favorability)}</span>
            </div>
            <div className="clause-detail-field">
              <b>Clause Status</b>
              <span className={`badge ${statusTone(clause.status)}`}>{displayValue(clause.status)}</span>
            </div>
            <div className="clause-detail-field">
              <b>Dispute Frequency</b>
              <span>{displayValue(clause.frequency)}</span>
            </div>
            <div className="clause-detail-field full">
              <b>Common Negotiation Point</b>
              <span>{displayValue(clause.negotiation, "None recorded.")}</span>
            </div>
            <div className="clause-detail-field full">
              <b>Case Law Linked</b>
              {lawHref ? (
                <Link href={lawHref} className="link">
                  {clause.caseLaw} →
                </Link>
              ) : (
                <span>No case law linked to this clause yet.</span>
              )}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          {copied && <span className="clause-copied-toast">Clause copied successfully.</span>}
          <button type="button" className="btn btn-outline" onClick={handleCopy}>
            Copy Clause
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setAddToDraftOpen(true)}>
            Add to Draft
          </button>
          <button type="button" className={`btn ${isSaved ? "btn-soft" : "btn-outline"}`} onClick={handleSave}>
            {isSaved ? "Saved ✓" : "Save Clause"}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setAddToProjectOpen(true)}>
            Add to Project
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {addToDraftOpen && <AddToDraftModal clauses={[clause]} onClose={() => setAddToDraftOpen(false)} />}
      {addToProjectOpen && <CreateCollectionModal clauseIds={[clause.id]} onClose={() => setAddToProjectOpen(false)} />}
    </div>
  );
}
