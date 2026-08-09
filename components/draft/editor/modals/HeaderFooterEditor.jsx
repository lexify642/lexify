"use client";

import { useRef, useState } from "react";
import { useDrafts } from "../../DraftsContext";

// Header/footer are real, separate editable regions stored per-draft
// (DraftsContext.headerHtml/footerHtml) — plain contentEditable is enough
// here (no tables/comments needed in a running head), same pattern the app
// used for the whole document before TipTap. {{PAGE}}/{{PAGES}} tokens are
// resolved to real page numbers by pdfExport.js when the document is
// paginated; on screen they show literally since the page is one
// continuous scroll.
export default function HeaderFooterEditor({ draft, onClose }) {
  const { updateHeaderFooter, updateDraftLayout } = useDrafts();
  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const lastFocused = useRef("header");
  const [differentFirstPage, setDifferentFirstPage] = useState(draft.layout.differentFirstPage);

  function insertPageToken(token) {
    const el = lastFocused.current === "footer" ? footerRef.current : headerRef.current;
    if (!el) return;
    el.focus();
    document.execCommand("insertText", false, token);
  }

  function handleSave() {
    updateHeaderFooter(draft.id, { headerHtml: headerRef.current?.innerHTML || "", footerHtml: footerRef.current?.innerHTML || "" });
    updateDraftLayout(draft.id, { differentFirstPage });
    onClose();
  }

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal wide">
        <div className="modal-head">
          <div>
            <p className="eyebrow">INSERT</p>
            <h2>Header &amp; Footer</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-field full" style={{ marginBottom: 14 }}>
            Header
            <div
              ref={headerRef}
              className="header-footer-editable"
              contentEditable
              suppressContentEditableWarning
              onFocus={() => (lastFocused.current = "header")}
              dangerouslySetInnerHTML={{ __html: draft.headerHtml || "" }}
            />
          </div>
          <div className="form-field full" style={{ marginBottom: 14 }}>
            Footer
            <div
              ref={footerRef}
              className="header-footer-editable"
              contentEditable
              suppressContentEditableWarning
              onFocus={() => (lastFocused.current = "footer")}
              dangerouslySetInnerHTML={{ __html: draft.footerHtml || "" }}
            />
          </div>
          <div className="event-mode-toggle" style={{ marginBottom: 14 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => insertPageToken("Page {{PAGE}} of {{PAGES}}")}>
              Insert Page Number
            </button>
          </div>
          <label className="form-field full" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={differentFirstPage} onChange={(e) => setDifferentFirstPage(e.target.checked)} />
            Different first page (no header/footer on page 1)
          </label>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
