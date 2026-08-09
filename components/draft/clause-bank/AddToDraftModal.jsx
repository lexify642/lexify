"use client";

import { useState } from "react";
import { useDrafts } from "../DraftsContext";
import { useClauseWorkspace } from "../ClauseWorkspaceContext";
import { DRAFT_POSITIONS } from "../clauseUtils";

function escapeHtml(text) {
  return (text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function clauseToBlockHtml(clause) {
  return `<p class="doc-body" style="white-space:pre-line">${escapeHtml(clause.text)}</p>`;
}

// Inserts every clause in `clauses` (one from the detail view, or many from
// a bulk selection) into a chosen draft at a chosen position, without ever
// touching that draft's existing content — see DraftsContext.insertClauseIntoDraft.
export default function AddToDraftModal({ clauses, onClose }) {
  const { drafts, insertClauseIntoDraft, addDraft } = useDrafts();
  const { logRecentUse } = useClauseWorkspace();

  const [targetMode, setTargetMode] = useState("existing");
  const [draftId, setDraftId] = useState(drafts[0]?.id || "");
  const [newDraftTitle, setNewDraftTitle] = useState("");
  const [position, setPosition] = useState(DRAFT_POSITIONS[0]);
  const [customPosition, setCustomPosition] = useState("");
  const [inserted, setInserted] = useState(false);

  const sectionLabel = position === "Custom position" ? customPosition || "Custom position" : position;

  function handleConfirm() {
    let targetId = draftId;
    if (targetMode === "new") {
      const entry = addDraft({
        title: newDraftTitle || "Untitled Draft",
        type: "Draft",
        blocks: [],
      });
      targetId = entry.id;
    }
    if (!targetId) return;
    clauses.forEach((clause) => {
      insertClauseIntoDraft(targetId, clauseToBlockHtml(clause), sectionLabel);
      logRecentUse(clause.id, "addedToDraft");
    });
    setInserted(true);
    setTimeout(onClose, 900);
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">CLAUSE BANK</p>
            <h2>Add to Draft</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {inserted ? (
            <div className="empty-inline">
              {clauses.length} clause{clauses.length === 1 ? "" : "s"} inserted.
            </div>
          ) : (
            <>
              <div className="event-mode-toggle">
                <button
                  type="button"
                  className={`event-mode-btn${targetMode === "existing" ? " active" : ""}`}
                  onClick={() => setTargetMode("existing")}
                >
                  Existing Draft
                </button>
                <button
                  type="button"
                  className={`event-mode-btn${targetMode === "new" ? " active" : ""}`}
                  onClick={() => setTargetMode("new")}
                >
                  New Draft
                </button>
              </div>

              {targetMode === "existing" ? (
                <label className="form-field full" style={{ display: "block", marginBottom: 14 }}>
                  Select draft
                  <select value={draftId} onChange={(e) => setDraftId(e.target.value)}>
                    {drafts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="form-field full" style={{ display: "block", marginBottom: 14 }}>
                  New draft title
                  <input value={newDraftTitle} onChange={(e) => setNewDraftTitle(e.target.value)} placeholder="e.g. NDA — Orion Logistics" />
                </label>
              )}

              <label className="form-field full" style={{ display: "block", marginBottom: 14 }}>
                Insert at position
                <select value={position} onChange={(e) => setPosition(e.target.value)}>
                  {DRAFT_POSITIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  <option value="Custom position">Custom position</option>
                </select>
              </label>
              {position === "Custom position" && (
                <label className="form-field full" style={{ display: "block", marginBottom: 14 }}>
                  Custom position label
                  <input value={customPosition} onChange={(e) => setCustomPosition(e.target.value)} placeholder="e.g. Annexure A" />
                </label>
              )}

              <div className="drawer-section-title">
                <h3>
                  Preview ({clauses.length} clause{clauses.length === 1 ? "" : "s"})
                </h3>
              </div>
              <div className="clause-detail-text" style={{ maxHeight: 180, overflow: "auto" }}>
                {clauses.map((c) => (
                  <p key={c.id} style={{ marginTop: 0 }}>
                    <b>{c.name || c.type}</b>
                    <br />
                    {c.text}
                  </p>
                ))}
              </div>
            </>
          )}
        </div>
        {!inserted && (
          <div className="modal-foot">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              onClick={handleConfirm}
              disabled={targetMode === "existing" ? !draftId : !newDraftTitle.trim()}
            >
              Confirm Insertion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
