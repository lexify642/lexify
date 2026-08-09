"use client";

import { useState } from "react";
import { useCases } from "@/components/cases/CasesContext";
import CaseSearchSelect from "@/components/calendar/CaseSearchSelect";
import { useClauseWorkspace } from "../ClauseWorkspaceContext";

export default function CreateCollectionModal({ clauseIds, onClose, defaultLinkCase = true }) {
  const { cases } = useCases();
  const { createCollection } = useClauseWorkspace();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [linkCase, setLinkCase] = useState(defaultLinkCase);
  const [caseNo, setCaseNo] = useState("");
  const [created, setCreated] = useState(false);

  const selectedCase = cases.find((c) => c.no === caseNo);

  function handleCreate() {
    if (!name.trim()) return;
    createCollection({ name: name.trim(), description, linkedCaseNo: linkCase ? caseNo || null : null, clauseIds });
    setCreated(true);
    setTimeout(onClose, 900);
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">CLAUSE BANK</p>
            <h2>Save Clause Collection</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {created ? (
            <div className="empty-inline">
              Collection saved with {clauseIds.length} clause{clauseIds.length === 1 ? "" : "s"}.
            </div>
          ) : (
            <>
              <label className="form-field full" style={{ display: "block", marginBottom: 14 }}>
                Collection name
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder='e.g. "ABC Corp – NDA Clauses"' />
              </label>
              <label className="form-field full" style={{ display: "block", marginBottom: 14 }}>
                Description (optional)
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>

              <div className="event-mode-toggle">
                <button type="button" className={`event-mode-btn${linkCase ? " active" : ""}`} onClick={() => setLinkCase(true)}>
                  Link to Case
                </button>
                <button type="button" className={`event-mode-btn${!linkCase ? " active" : ""}`} onClick={() => setLinkCase(false)}>
                  Create without linking a case
                </button>
              </div>

              {linkCase && (
                <>
                  <label className="form-field full" style={{ display: "block", margin: "14px 0" }}>
                    Case
                    <CaseSearchSelect cases={cases} value={caseNo} onChange={setCaseNo} />
                  </label>
                  {selectedCase && (
                    <div className="matter-meta">
                      <span>
                        <b>{selectedCase.number}</b>Case number
                      </span>
                      <span>
                        <b>{selectedCase.client?.name ?? "No client linked"}</b>Client
                      </span>
                      <span>
                        <b>{selectedCase.parties}</b>Matter
                      </span>
                      <span>
                        <b>{selectedCase.court}</b>Court
                      </span>
                      <span>
                        <b>{selectedCase.caseDetails?.caseStatus ?? "—"}</b>Case status
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="drawer-section-title" style={{ marginTop: 18 }}>
                <h3>
                  {clauseIds.length} clause{clauseIds.length === 1 ? "" : "s"} in this collection
                </h3>
              </div>
            </>
          )}
        </div>
        {!created && (
          <div className="modal-foot">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={handleCreate} disabled={!name.trim()}>
              Save Collection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
