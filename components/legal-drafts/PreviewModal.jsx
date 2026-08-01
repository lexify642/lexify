"use client";

import { Download, FileText } from "lucide-react";
import { t } from "@/data/legalDrafts";

// Reuses the same .case-modal-backdrop/.case-modal/.modal-* classes used by
// every other modal in the app (CaseModal, EditCaseModal, ViewCalculationModal)
// rather than introducing a new dialog design.
export default function PreviewModal({ open, item, language, onClose, onDownload }) {
  if (!open || !item) return null;

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">{t(language, "preview").toUpperCase()}</p>
            <h2>{item.name}</h2>
          </div>
          <button type="button" className="modal-close" aria-label={t(language, "close")} onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="document-preview-placeholder">
            <FileText size={40} strokeWidth={1.5} />
            <p>{t(language, "previewNote")}</p>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            {t(language, "close")}
          </button>
          <button type="button" className="btn" onClick={() => onDownload(item)}>
            <Download size={16} strokeWidth={2} /> {t(language, "download")}
          </button>
        </div>
      </div>
    </div>
  );
}
