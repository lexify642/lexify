"use client";

import { useState } from "react";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import { useStaffDirectory } from "@/components/staff/StaffDirectoryContext";
import { ROLE_LABELS } from "@/lib/roles";
import { useCases } from "@/components/cases/CasesContext";
import { buildClientDirectory } from "@/components/cases/clientDirectory";
import { useDrafts } from "../../DraftsContext";
import { useDraftReview } from "../../DraftReviewContext";
import { draftPdfBase64 } from "../pdfExport";
import { draftWordHtml } from "../wordExport";
import { canSendForReview } from "../../permissions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmailList(text) {
  return (text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// The "VERY IMPORTANT" review workflow. Neither team members nor clients
// have a stored email address anywhere in this app's data (data/team.js,
// data/cases.js) — so the recipient's email is always a real, manually
// entered field, never a fabricated address. Choosing a team member/client
// only pre-fills the name.
export default function SendForReviewModal({ draft, onClose, initialFormat = "pdf", initialRequireApproval = true }) {
  const { cases } = useCases();
  const { getLiveEditor, saveVersion, getActiveVersion } = useDrafts();
  const { createReviewRequest } = useDraftReview();
  const currentUser = useCurrentUser();
  const { staff } = useStaffDirectory();

  const linkedCase = cases.find((c) => c.no === draft.linkedCaseNo) || null;
  const clientDirectory = buildClientDirectory(cases);
  const teamOptions = staff.filter((p) => p.full_name !== currentUser.name).map((p) => ({ id: p.id, name: p.full_name, role: p.role }));

  const [recipientMode, setRecipientMode] = useState("custom");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(`Review Request: ${draft.title}`);
  const [message, setMessage] = useState("");
  const [format, setFormat] = useState(initialFormat);
  const [deadline, setDeadline] = useState("");
  const [instructions, setInstructions] = useState("");
  const [allowComments, setAllowComments] = useState(true);
  const [allowTrackChanges, setAllowTrackChanges] = useState(true);
  const [allowEditing, setAllowEditing] = useState(false);
  const [requireApproval, setRequireApproval] = useState(initialRequireApproval);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMessage, setErrorMessage] = useState("");

  function pickTeamMember(name) {
    setRecipientName(name);
    setRecipientEmail("");
  }

  function pickClient(name) {
    setRecipientName(name);
    setRecipientEmail("");
  }

  async function handleSend() {
    if (!EMAIL_RE.test(recipientEmail.trim())) {
      setStatus("error");
      setErrorMessage("Enter a valid recipient email address.");
      return;
    }
    setStatus("sending");
    setErrorMessage("");

    const editor = getLiveEditor(draft.id);
    const version = editor ? saveVersion(draft.id, editor.getJSON(), "Sent for Review") || getActiveVersion(draft) : getActiveVersion(draft);

    const payload = {
      draftId: draft.id,
      versionId: version.id,
      caseNo: draft.linkedCaseNo,
      to: [recipientEmail.trim()],
      cc: parseEmailList(cc),
      bcc: parseEmailList(bcc),
      recipients: [{ type: recipientMode, name: recipientName || recipientEmail, email: recipientEmail.trim() }],
      subject: subject.trim() || `Review Request: ${draft.title}`,
      message,
      instructions,
      format,
      draftTitle: draft.title,
      deadline,
      allowComments,
      allowTrackChanges,
      allowEditing,
      requireApproval,
    };
    if (format === "pdf" || format === "both") payload.pdfBase64 = draftPdfBase64(draft, version);
    if (format === "editable" || format === "both") payload.wordHtml = draftWordHtml(draft, version);

    try {
      // One call: sends the email AND persists the review request
      // server-side (see app/api/draft-review/send/route.js) — no separate
      // client-side DB write anymore.
      await createReviewRequest(payload);
      setStatus("sent");
      setTimeout(onClose, 1200);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err.message);
    }
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal wide">
        <div className="modal-head">
          <div>
            <p className="eyebrow">REVIEW</p>
            <h2>Send for Review</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {!canSendForReview(currentUser) ? (
            <div className="empty-inline">You don&apos;t have permission to send drafts for review.</div>
          ) : status === "sent" ? (
            <div className="empty-inline">Review request sent to {recipientEmail}.</div>
          ) : (
            <>
              <div className="event-mode-toggle" style={{ marginBottom: 12 }}>
                <button type="button" className={`event-mode-btn${recipientMode === "team" ? " active" : ""}`} onClick={() => setRecipientMode("team")}>
                  Team Member
                </button>
                <button type="button" className={`event-mode-btn${recipientMode === "client" ? " active" : ""}`} onClick={() => setRecipientMode("client")}>
                  Client
                </button>
                <button type="button" className={`event-mode-btn${recipientMode === "custom" ? " active" : ""}`} onClick={() => setRecipientMode("custom")}>
                  Any Email
                </button>
              </div>

              {recipientMode === "team" && (
                <label className="form-field full" style={{ display: "block", marginBottom: 10 }}>
                  Recipient
                  <select value={recipientName} onChange={(e) => pickTeamMember(e.target.value)}>
                    <option value="">Select team member…</option>
                    {teamOptions.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} — {ROLE_LABELS[m.role] || m.role}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {recipientMode === "client" && (
                <label className="form-field full" style={{ display: "block", marginBottom: 10 }}>
                  Recipient
                  <select value={recipientName} onChange={(e) => pickClient(e.target.value)}>
                    <option value="">{linkedCase ? `Select client (linked: ${linkedCase.client?.name})…` : "Select client…"}</option>
                    {clientDirectory.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {recipientMode === "custom" && (
                <label className="form-field full" style={{ display: "block", marginBottom: 10 }}>
                  Recipient name (optional)
                  <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="e.g. Adv. K. Mehra" />
                </label>
              )}

              <label className="form-field full" style={{ display: "block", marginBottom: 10 }}>
                Recipient email
                <input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="name@example.com" />
                {recipientMode !== "custom" && (
                  <small>No email is stored for {recipientMode === "team" ? "team members" : "clients"} yet — enter it to send.</small>
                )}
              </label>

              <div className="form-grid">
                <label className="form-field">
                  CC (comma-separated)
                  <input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="cc1@example.com, cc2@example.com" />
                </label>
                <label className="form-field">
                  BCC (comma-separated)
                  <input value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="bcc@example.com" />
                </label>
                <label className="form-field full">
                  Subject
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} />
                </label>
                <label className="form-field full">
                  Message
                  <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
                </label>
                <label className="form-field">
                  Format
                  <select value={format} onChange={(e) => setFormat(e.target.value)}>
                    <option value="editable">Editable (Word)</option>
                    <option value="pdf">PDF</option>
                    <option value="both">Both</option>
                  </select>
                </label>
                <label className="form-field">
                  Review deadline
                  <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </label>
                <label className="form-field full">
                  Instructions
                  <textarea rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
                </label>
              </div>

              <div className="drawer-section-title" style={{ marginTop: 14 }}>
                <h3>Reviewer permissions</h3>
              </div>
              <div className="form-grid">
                <label className="form-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} /> Allow comments
                </label>
                <label className="form-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={allowTrackChanges} onChange={(e) => setAllowTrackChanges(e.target.checked)} /> Allow track changes
                </label>
                <label className="form-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={allowEditing} onChange={(e) => setAllowEditing(e.target.checked)} /> Allow editing
                </label>
                <label className="form-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={requireApproval} onChange={(e) => setRequireApproval(e.target.checked)} /> Require approval/rejection
                </label>
              </div>

              {status === "error" && <div className="empty-inline" style={{ borderColor: "#E8C4C0", color: "var(--red)", marginTop: 10 }}>{errorMessage}</div>}
            </>
          )}
        </div>
        {status !== "sent" && canSendForReview(currentUser) && (
          <div className="modal-foot">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={handleSend} disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send for Review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
