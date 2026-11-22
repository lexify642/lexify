"use client";

import { useMemo, useState } from "react";
import { useCases } from "@/components/cases/CasesContext";
import { buildClientDirectory } from "@/components/cases/clientDirectory";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import { useStaffDirectory } from "@/components/staff/StaffDirectoryContext";
import { ROLE_LABELS } from "@/lib/roles";
import { useDrafts } from "../../DraftsContext";
import { detectMergeFields, mergeContentJson, mergeText, valuesForTeamMember, valuesForClient } from "../mailMerge";
import { draftPdfBase64 } from "../pdfExport";

export default function MailMergeDialog({ draft, editor, onClose }) {
  const { cases } = useCases();
  const { getActiveVersion } = useDrafts();
  const currentUser = useCurrentUser();
  const { staff } = useStaffDirectory();
  const activeVersion = getActiveVersion(draft);
  const currentJson = editor ? editor.getJSON() : activeVersion.contentJson;

  const linkedCase = cases.find((c) => c.no === draft.linkedCaseNo) || null;
  const teamOptions = staff
    .filter((p) => p.full_name !== currentUser.name)
    .map((p) => ({ id: p.id, name: p.full_name, role: ROLE_LABELS[p.role] || p.role }));
  const clientOptions = buildClientDirectory(cases);

  const [source, setSource] = useState(linkedCase ? "client" : "team");
  const [selectedNames, setSelectedNames] = useState(() => new Set());
  const [emails, setEmails] = useState({});
  const [subject, setSubject] = useState(`${draft.title} — for your records`);
  const [message, setMessage] = useState("Dear {{Name}},\n\nPlease find the attached draft.\n\nRegards,\n" + currentUser.name);
  const [previewFor, setPreviewFor] = useState("");
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);

  const recipients = source === "team" ? teamOptions : clientOptions;
  const detectedFields = useMemo(() => {
    const docText = JSON.stringify(currentJson);
    return Array.from(new Set([...detectMergeFields(docText), ...detectMergeFields(message)]));
  }, [currentJson, message]);

  function toggleRecipient(name) {
    setSelectedNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function valuesFor(recipient) {
    return source === "team" ? valuesForTeamMember(recipient) : valuesForClient(recipient);
  }

  const previewRecipient = recipients.find((r) => r.name === previewFor) || recipients.find((r) => selectedNames.has(r.name));
  const previewText = previewRecipient ? mergeText(message, valuesFor(previewRecipient)) : message;

  async function handleSendAll() {
    const targets = recipients.filter((r) => selectedNames.has(r.name));
    if (!targets.length) return;
    setSending(true);
    const outcomes = [];
    for (const recipient of targets) {
      const email = (emails[recipient.name] || "").trim();
      if (!email) {
        outcomes.push({ name: recipient.name, ok: false, note: "No email entered" });
        continue;
      }
      const values = valuesFor(recipient);
      const mergedJson = mergeContentJson(currentJson, values);
      const mergedVersion = { ...activeVersion, contentJson: mergedJson };
      try {
        const res = await fetch("/api/draft-review/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: [email],
            subject: mergeText(subject, values),
            message: mergeText(message, values),
            format: "pdf",
            draftTitle: draft.title,
            pdfBase64: draftPdfBase64(draft, mergedVersion),
          }),
        });
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error?.message || "Send failed");
        outcomes.push({ name: recipient.name, ok: true });
      } catch (err) {
        outcomes.push({ name: recipient.name, ok: false, note: err.message });
      }
    }
    setResults(outcomes);
    setSending(false);
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal wide">
        <div className="modal-head">
          <div>
            <p className="eyebrow">MAILINGS</p>
            <h2>Mail Merge</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="event-mode-toggle" style={{ marginBottom: 12 }}>
            <button type="button" className={`event-mode-btn${source === "team" ? " active" : ""}`} onClick={() => setSource("team")}>
              Team Members
            </button>
            <button type="button" className={`event-mode-btn${source === "client" ? " active" : ""}`} onClick={() => setSource("client")}>
              Case Clients
            </button>
          </div>

          {detectedFields.length > 0 && (
            <p className="page-subtitle" style={{ margin: "0 0 10px" }}>
              Detected fields: {detectedFields.map((f) => `{{${f}}}`).join(", ")}
            </p>
          )}

          <div className="reorder-list" style={{ marginBottom: 14 }}>
            {recipients.map((r) => (
              <div key={r.name} className="reorder-item static">
                <input type="checkbox" checked={selectedNames.has(r.name)} onChange={() => toggleRecipient(r.name)} />
                <span className="reorder-label">{r.name}{source === "team" ? ` — ${r.role}` : ""}</span>
                <input
                  className="comment-reply-input"
                  placeholder="email@example.com"
                  value={emails[r.name] || ""}
                  onChange={(e) => setEmails((prev) => ({ ...prev, [r.name]: e.target.value }))}
                  style={{ maxWidth: 220 }}
                />
              </div>
            ))}
            {recipients.length === 0 && <div className="empty-inline">No {source === "team" ? "team members" : "clients"} found.</div>}
          </div>

          <div className="form-grid">
            <label className="form-field full">
              Subject
              <input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </label>
            <label className="form-field full">
              Message (supports {"{{Name}}"}, {"{{ClientName}}"}, {"{{Role}}"}, {"{{ClientPhone}}"}, {"{{ClientAddress}}"})
              <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
          </div>

          {recipients.length > 0 && (
            <>
              <div className="drawer-section-title" style={{ marginTop: 12 }}>
                <h3>Preview</h3>
                <select value={previewFor} onChange={(e) => setPreviewFor(e.target.value)}>
                  <option value="">Auto (first selected)</option>
                  {recipients.map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="clause-detail-text" style={{ whiteSpace: "pre-line" }}>{previewText}</div>
            </>
          )}

          {results && (
            <div className="drawer-section-title" style={{ marginTop: 12 }}>
              <h3>
                Sent {results.filter((r) => r.ok).length}/{results.length}
              </h3>
            </div>
          )}
          {results && (
            <ul style={{ fontSize: 12, color: "var(--muted)" }}>
              {results.map((r) => (
                <li key={r.name}>
                  {r.name}: {r.ok ? "Sent" : `Failed — ${r.note}`}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn" disabled={selectedNames.size === 0 || sending} onClick={handleSendAll}>
            {sending ? "Sending…" : `Send All (${selectedNames.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}
