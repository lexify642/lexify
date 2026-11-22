"use client";

import { useState } from "react";
import { generateHTML } from "@tiptap/html";
import { useDrafts } from "../../DraftsContext";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import { editorExtensions } from "../extensions";
import { downloadDraftPdf } from "../pdfExport";
import CompareVersionsModal from "./CompareVersionsModal";
import { canRestoreVersion } from "../../permissions";

export default function VersionHistoryPanel({ draft, onClose }) {
  const { restoreVersion } = useDrafts();
  const currentUser = useCurrentUser();
  const [selected, setSelected] = useState([]);
  const [previewVersion, setPreviewVersion] = useState(null);
  const [compareIds, setCompareIds] = useState(null);

  const versions = [...draft.versions].sort((a, b) => b.number - a.number);

  function toggleSelect(versionId) {
    setSelected((prev) => {
      if (prev.includes(versionId)) return prev.filter((id) => id !== versionId);
      if (prev.length >= 2) return [prev[1], versionId];
      return [...prev, versionId];
    });
  }

  function handleRestore(versionId) {
    restoreVersion(draft.id, versionId);
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal wide">
        <div className="modal-head">
          <div>
            <p className="eyebrow">REVIEW</p>
            <h2>Version History — {draft.title}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <p className="page-subtitle" style={{ margin: "0 0 12px" }}>
            Select two versions to compare, or use Open/Restore/Download per version. Restoring creates a new version — history is never deleted.
          </p>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Version</th>
                  <th>Date</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id} className={v.id === draft.activeVersionId ? "clause-row-clickable" : ""}>
                    <td>
                      <input type="checkbox" checked={selected.includes(v.id)} onChange={() => toggleSelect(v.id)} aria-label={`Select ${v.label}`} />
                    </td>
                    <td>
                      <strong>{v.label}</strong>
                      {v.id === draft.activeVersionId && <span className="badge blue" style={{ marginLeft: 6 }}>Current</span>}
                    </td>
                    <td>{new Date(v.createdAt).toLocaleString("en-IN")}</td>
                    <td>{v.createdBy}</td>
                    <td>{v.action}</td>
                    <td>{v.status}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setPreviewVersion(v)}>
                        Open
                      </button>{" "}
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => downloadDraftPdf(draft, v)}>
                        Download
                      </button>{" "}
                      {canRestoreVersion(currentUser) && (
                        <button type="button" className="btn btn-outline btn-sm" disabled={v.id === draft.activeVersionId} onClick={() => handleRestore(v.id)}>
                          Restore
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn" disabled={selected.length !== 2} onClick={() => setCompareIds(selected)}>
            Compare Selected
          </button>
        </div>
      </div>

      {previewVersion && (
        <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && setPreviewVersion(null)}>
          <div className="case-modal wide">
            <div className="modal-head">
              <div>
                <p className="eyebrow">VERSION PREVIEW</p>
                <h2>{previewVersion.label} — {new Date(previewVersion.createdAt).toLocaleString("en-IN")}</h2>
              </div>
              <button type="button" className="modal-close" onClick={() => setPreviewVersion(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="document" style={{ margin: 0, maxWidth: "none" }} dangerouslySetInnerHTML={{ __html: generateHTML(previewVersion.contentJson, editorExtensions) }} />
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setPreviewVersion(null)}>
                Close
              </button>
              {canRestoreVersion(currentUser) && (
                <button type="button" className="btn" onClick={() => handleRestore(previewVersion.id)}>
                  Restore This Version
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {compareIds && (
        <CompareVersionsModal
          draft={draft}
          versionAId={compareIds[0]}
          versionBId={compareIds[1]}
          onClose={() => setCompareIds(null)}
        />
      )}
    </div>
  );
}
