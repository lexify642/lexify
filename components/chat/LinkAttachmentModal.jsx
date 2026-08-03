"use client";

import { useState } from "react";
import { useCases } from "@/components/cases/CasesContext";
import { useTasks } from "@/components/tasks/TasksContext";
import { useAppointments } from "@/components/appointments/AppointmentsContext";
import { buildClientDirectory } from "@/components/cases/clientDirectory";
import CaseSearchSelect from "@/components/calendar/CaseSearchSelect";
import { LEGAL_DRAFT_CATEGORIES } from "@/data/legalDrafts";
import { ATTACHMENT_CATEGORIES } from "@/data/conversations";
import { useAttachments } from "./AttachmentsContext";

const MODE_LABELS = {
  case: "Attach to Case",
  client: "Save to Client",
  task: "Attach to Task",
  calendar: "Attach to Calendar Event",
  draft: "Attach to Legal Draft",
};

export default function LinkAttachmentModal({ attachment, mode, onClose }) {
  const { cases } = useCases();
  const { tasks } = useTasks();
  const { appointments } = useAppointments();
  const { linkAttachment, updateAttachment } = useAttachments();
  const [query, setQuery] = useState("");
  const [caseNo, setCaseNo] = useState(attachment.linkedCaseNo || "");
  const [category, setCategory] = useState(attachment.category || "");
  const [description, setDescription] = useState(attachment.description || "");
  const [tags, setTags] = useState((attachment.tags || []).join(", "));
  const [saved, setSaved] = useState(false);

  function finish() {
    setSaved(true);
    setTimeout(onClose, 700);
  }

  function submitCase() {
    if (!caseNo) return;
    updateAttachment(attachment.id, {
      linkedCaseNo: caseNo,
      category: category || null,
      description,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    finish();
  }

  const term = query.trim().toLowerCase();

  const clientOptions = mode === "client" ? buildClientDirectory(cases).filter((c) => c.name.toLowerCase().includes(term)) : [];
  const taskOptions =
    mode === "task" ? tasks.filter((t) => t.title.toLowerCase().includes(term) || (t.caseNo || "").includes(term)) : [];
  const eventOptions = mode === "calendar" ? appointments.filter((a) => a.title.toLowerCase().includes(term)) : [];
  const draftOptions =
    mode === "draft"
      ? LEGAL_DRAFT_CATEGORIES.filter((d) => d.translations.english.name.toLowerCase().includes(term))
      : [];

  return (
    <div className="case-modal-backdrop show" onClick={onClose}>
      <div className="case-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{MODE_LABELS[mode]}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="client-card" style={{ marginBottom: 14 }}>
            <b>{attachment.name}</b>
            <span>{attachment.mimeCategory.toUpperCase()}</span>
          </div>

          {saved ? (
            <div className="empty-inline">Saved.</div>
          ) : mode === "case" ? (
            <>
              <label>
                Case
                <CaseSearchSelect cases={cases} value={caseNo} onChange={setCaseNo} />
              </label>
              <label style={{ marginTop: 10, display: "block" }}>
                Document category
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Select category…</option>
                  {ATTACHMENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label style={{ marginTop: 10, display: "block" }}>
                Description
                <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
              </label>
              <label style={{ marginTop: 10, display: "block" }}>
                Tags (comma separated)
                <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. urgent, annexure" />
              </label>
            </>
          ) : (
            <>
              <div className="search" style={{ width: "100%", marginBottom: 12 }}>
                <span>⌕</span>
                <input placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="forward-target-list">
                {mode === "client" &&
                  clientOptions.map((c) => (
                    <div className="forward-target-row" key={c.name}>
                      <span>{c.name}</span>
                      <button type="button" className="btn btn-outline" onClick={() => { linkAttachment(attachment.id, "linkedClientName", c.name); finish(); }}>
                        Save
                      </button>
                    </div>
                  ))}
                {mode === "task" &&
                  taskOptions.map((t) => (
                    <div className="forward-target-row" key={t.id}>
                      <span>{t.title}</span>
                      <button type="button" className="btn btn-outline" onClick={() => { linkAttachment(attachment.id, "linkedTaskId", t.id); finish(); }}>
                        Attach
                      </button>
                    </div>
                  ))}
                {mode === "calendar" &&
                  eventOptions.map((a) => (
                    <div className="forward-target-row" key={a.id}>
                      <span>{a.title} · {a.date}</span>
                      <button type="button" className="btn btn-outline" onClick={() => { linkAttachment(attachment.id, "linkedAppointmentId", a.id); finish(); }}>
                        Attach
                      </button>
                    </div>
                  ))}
                {mode === "draft" &&
                  draftOptions.map((d) => (
                    <div className="forward-target-row" key={d.slug}>
                      <span>{d.translations.english.name}</span>
                      <button type="button" className="btn btn-outline" onClick={() => { linkAttachment(attachment.id, "linkedDraftSlug", d.slug); finish(); }}>
                        Attach
                      </button>
                    </div>
                  ))}
                {((mode === "client" && clientOptions.length === 0) ||
                  (mode === "task" && taskOptions.length === 0) ||
                  (mode === "calendar" && eventOptions.length === 0) ||
                  (mode === "draft" && draftOptions.length === 0)) && (
                  <div className="empty-inline">No matches.</div>
                )}
              </div>
            </>
          )}
        </div>
        {mode === "case" && !saved && (
          <div className="modal-foot">
            <button type="button" className="btn" onClick={submitCase} disabled={!caseNo}>
              Save to Case
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
