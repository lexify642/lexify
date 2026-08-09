"use client";

import { useState } from "react";

export default function InsertHyperlinkDialog({ initialUrl, onClose, onInsert, onRemove }) {
  const [url, setUrl] = useState(initialUrl || "");

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">INSERT</p>
            <h2>{initialUrl ? "Edit Link" : "Insert Hyperlink"}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <label className="form-field full" style={{ display: "block" }}>
            URL
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" autoFocus />
          </label>
        </div>
        <div className="modal-foot">
          {initialUrl && (
            <button
              type="button"
              className="btn btn-outline btn-danger"
              onClick={() => {
                onRemove();
                onClose();
              }}
            >
              Remove Link
            </button>
          )}
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            disabled={!url.trim()}
            onClick={() => {
              onInsert(url.trim());
              onClose();
            }}
          >
            {initialUrl ? "Update Link" : "Insert Link"}
          </button>
        </div>
      </div>
    </div>
  );
}
