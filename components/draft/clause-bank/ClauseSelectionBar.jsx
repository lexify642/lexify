"use client";

import { useState } from "react";
import AddToDraftModal from "./AddToDraftModal";
import CreateCollectionModal from "./CreateCollectionModal";
import CreateDraftFromClausesModal from "./CreateDraftFromClausesModal";
import { exportClausesAsWord, exportClausesAsPdf, copyClausesAsText } from "../exportUtils";

export default function ClauseSelectionBar({ selectedClauses, onClear }) {
  const [modal, setModal] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (selectedClauses.length === 0) return null;
  const ids = selectedClauses.map((c) => c.id);

  async function handleCopyAll() {
    await copyClausesAsText(selectedClauses);
    setCopied(true);
    setExportOpen(false);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <>
      <div className="clause-selection-bar">
        <strong>{selectedClauses.length} Clause{selectedClauses.length === 1 ? "" : "s"} Selected</strong>
        <div className="clause-selection-actions">
          <button type="button" className="btn btn-outline" onClick={() => setModal("collection")}>
            Save Collection
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setModal("draft")}>
            Add to Draft
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setModal("case")}>
            Add to Case
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setModal("newDraft")}>
            Create Draft from Selection
          </button>
          <div className="clause-export-wrap">
            <button type="button" className="btn btn-outline" onClick={() => setExportOpen((v) => !v)}>
              Export
            </button>
            {exportOpen && (
              <div className="attach-file-menu">
                <button type="button" onClick={() => exportClausesAsWord(selectedClauses, "clauses.doc")}>
                  Export as Word
                </button>
                <button type="button" onClick={() => exportClausesAsPdf(selectedClauses, "clauses.pdf")}>
                  Export as PDF
                </button>
                <button type="button" onClick={handleCopyAll}>
                  {copied ? "Copied ✓" : "Copy All Clause Text"}
                </button>
              </div>
            )}
          </div>
          <button type="button" className="btn btn-soft" onClick={onClear}>
            Clear Selection
          </button>
        </div>
      </div>

      {modal === "collection" && (
        <CreateCollectionModal clauseIds={ids} defaultLinkCase={false} onClose={() => setModal(null)} />
      )}
      {modal === "case" && <CreateCollectionModal clauseIds={ids} defaultLinkCase onClose={() => setModal(null)} />}
      {modal === "draft" && <AddToDraftModal clauses={selectedClauses} onClose={() => setModal(null)} />}
      {modal === "newDraft" && <CreateDraftFromClausesModal clauses={selectedClauses} onClose={() => setModal(null)} />}
    </>
  );
}
