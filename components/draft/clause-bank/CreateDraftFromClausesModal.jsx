"use client";

import { useState } from "react";
import { useCases } from "@/components/cases/CasesContext";
import CaseSearchSelect from "@/components/calendar/CaseSearchSelect";
import { useDrafts } from "../DraftsContext";
import { useClauseWorkspace } from "../ClauseWorkspaceContext";

const DRAFT_TYPES = ["Agreement", "Petition", "Affidavit", "Notice", "Deed", "Other"];

function escapeHtml(text) {
  return (text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Builds a brand-new draft from a multi-selected, drag-and-drop-reordered
// set of clauses — the final draft's blocks follow exactly the order shown
// here (see DraftsContext.addDraft).
export default function CreateDraftFromClausesModal({ clauses, onClose }) {
  const { cases } = useCases();
  const { addDraft } = useDrafts();
  const { logRecentUse } = useClauseWorkspace();

  const [ordered, setOrdered] = useState(clauses);
  const [title, setTitle] = useState("");
  const [type, setType] = useState(DRAFT_TYPES[0]);
  const [caseNo, setCaseNo] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [dragIndex, setDragIndex] = useState(null);
  const [created, setCreated] = useState(false);

  const selectedCase = cases.find((c) => c.no === caseNo);
  const resolvedClient = clientName || selectedCase?.client?.name || "";

  function handleDrop(targetIndex) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    setOrdered((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDragIndex(null);
  }

  function handleCreate() {
    if (!title.trim()) return;
    const blocks = ordered.map((c) => ({
      id: `block-${c.id}-${Date.now()}`,
      sectionLabel: c.name || c.type,
      html: `<p class="doc-body" style="white-space:pre-line">${escapeHtml(c.text)}</p>`,
    }));
    addDraft({ title: title.trim(), type, linkedCaseNo: caseNo || null, clientName: resolvedClient, description, blocks });
    ordered.forEach((c) => logRecentUse(c.id, "addedToDraft"));
    setCreated(true);
    setTimeout(() => {
      onClose();
      window.location.href = "/draft";
    }, 900);
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal wide">
        <div className="modal-head">
          <div>
            <p className="eyebrow">CLAUSE BANK</p>
            <h2>Create New Draft from Selected Clauses</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {created ? (
            <div className="empty-inline">Draft created with {ordered.length} clauses.</div>
          ) : (
            <>
              <div className="form-grid">
                <label className="form-field full">
                  Draft name
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. NDA — Orion Logistics" />
                </label>
                <label className="form-field">
                  Draft type
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    {DRAFT_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  Linked case (optional)
                  <CaseSearchSelect cases={cases} value={caseNo} onChange={setCaseNo} />
                </label>
                <label className="form-field">
                  Client
                  <input value={resolvedClient} onChange={(e) => setClientName(e.target.value)} placeholder="Client name" />
                </label>
                <label className="form-field full">
                  Description (optional)
                  <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
                </label>
              </div>

              <div className="drawer-section-title" style={{ marginTop: 18 }}>
                <h3>Clause order ({ordered.length})</h3>
                <span className="page-subtitle" style={{ margin: 0 }}>
                  Drag to reorder
                </span>
              </div>
              <div className="reorder-list">
                {ordered.map((c, i) => (
                  <div
                    key={c.id}
                    className={`reorder-item${dragIndex === i ? " dragging" : ""}`}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(i)}
                    onDragEnd={() => setDragIndex(null)}
                  >
                    <span className="reorder-handle">⠿</span>
                    <span className="reorder-index">{i + 1}.</span>
                    <span className="reorder-label">{c.name || c.type}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        {!created && (
          <div className="modal-foot">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={handleCreate} disabled={!title.trim()}>
              Create Draft
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
