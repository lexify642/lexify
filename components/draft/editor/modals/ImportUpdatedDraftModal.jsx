"use client";

import { useState } from "react";
import { generateJSON } from "@tiptap/html";
import { useDrafts } from "../../DraftsContext";
import { useDraftReview } from "../../DraftReviewContext";
import { editorExtensions, plainTextToDoc } from "../extensions";
import { docxToContent } from "../docxImport";

// The real "Updated Draft Received by Email" flow (per the user's confirmed
// decision — no inbound-email/webhook infra exists in this environment, so
// this is a genuine file-upload/paste action instead of automatic email
// ingestion). Accepts a Word .docx (read with mammoth, see docxImport.js),
// .html/.htm (the older Word-compatible export), .txt, or pasted text.
export default function ImportUpdatedDraftModal({ draft, onClose }) {
  const { saveVersion } = useDrafts();
  const { reviewRequests, recordImportedVersion } = useDraftReview();

  const linkedRequests = reviewRequests.filter((r) => r.draftId === draft.id && r.status !== "Approved" && r.status !== "Rejected");

  const [mode, setMode] = useState("file");
  const [linkedReviewId, setLinkedReviewId] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [docxFile, setDocxFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isHtml = /\.html?$/i.test(file.name);
    const isTxt = /\.txt$/i.test(file.name);
    const isDocx = /\.docx$/i.test(file.name);
    if (!isHtml && !isTxt && !isDocx) {
      setError("Choose a Word (.docx), .html, .htm or .txt file, or paste the text instead.");
      return;
    }
    setError("");
    setFileName(file.name);
    if (isDocx) {
      setDocxFile(file);
      setFileContent("");
      return;
    }
    setDocxFile(null);
    const reader = new FileReader();
    reader.onload = () => setFileContent(String(reader.result || ""));
    reader.readAsText(file);
  }

  async function handleImport() {
    let contentJson;
    if (mode === "file" && docxFile) {
      setBusy(true);
      try {
        ({ contentJson } = await docxToContent(docxFile));
      } catch {
        setBusy(false);
        setError("That file couldn't be read as a Word document.");
        return;
      }
      setBusy(false);
    } else if (mode === "file") {
      if (!fileContent) {
        setError("Choose a file to import.");
        return;
      }
      contentJson = /\.html?$/i.test(fileName) ? generateJSON(fileContent, editorExtensions) : plainTextToDoc(fileContent);
    } else {
      if (!pastedText.trim()) {
        setError("Paste the updated draft text.");
        return;
      }
      contentJson = plainTextToDoc(pastedText);
    }

    saveVersion(draft.id, contentJson, "Changes Received (imported)");
    if (linkedReviewId) recordImportedVersion(linkedReviewId);
    setDone(true);
    setTimeout(onClose, 1000);
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal wide">
        <div className="modal-head">
          <div>
            <p className="eyebrow">REVIEW</p>
            <h2>Import Updated Draft</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {done ? (
            <div className="empty-inline">Imported as a new version — the original is preserved in Version History.</div>
          ) : (
            <>
              {linkedRequests.length > 0 && (
                <label className="form-field full" style={{ display: "block", marginBottom: 12 }}>
                  Link to review request (optional)
                  <select value={linkedReviewId} onChange={(e) => setLinkedReviewId(e.target.value)}>
                    <option value="">Not linked</option>
                    {linkedRequests.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.recipients[0]?.email} — sent {new Date(r.sentAt).toLocaleDateString("en-IN")}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="event-mode-toggle" style={{ marginBottom: 12 }}>
                <button type="button" className={`event-mode-btn${mode === "file" ? " active" : ""}`} onClick={() => setMode("file")}>
                  Upload File
                </button>
                <button type="button" className={`event-mode-btn${mode === "paste" ? " active" : ""}`} onClick={() => setMode("paste")}>
                  Paste Text
                </button>
              </div>

              {mode === "file" ? (
                <label className="form-field full" style={{ display: "block" }}>
                  File (.docx, .html, .htm, or .txt)
                  <input type="file" accept=".docx,.html,.htm,.txt" onChange={handleFileChange} />
                  {fileName && <small>{docxFile ? `${fileName} ready to import` : `${fileName} loaded (${fileContent.length.toLocaleString()} characters)`}</small>}
                </label>
              ) : (
                <label className="form-field full" style={{ display: "block" }}>
                  Updated draft text
                  <textarea rows={10} value={pastedText} onChange={(e) => setPastedText(e.target.value)} placeholder="Paste the reviewer's returned text here…" />
                </label>
              )}

              {error && <div className="empty-inline" style={{ borderColor: "#E8C4C0", color: "var(--red)", marginTop: 10 }}>{error}</div>}
            </>
          )}
        </div>
        {!done && (
          <div className="modal-foot">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={handleImport} disabled={busy}>
              {busy ? "Importing…" : "Import as New Version"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
