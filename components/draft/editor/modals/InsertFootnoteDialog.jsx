"use client";

import { useState } from "react";

export default function InsertFootnoteDialog({ kind, onClose, onInsert }) {
  const [text, setText] = useState("");

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">REFERENCES</p>
            <h2>Insert {kind === "endnote" ? "Endnote" : "Footnote"}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <label className="form-field full" style={{ display: "block" }}>
            Note text
            <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
          </label>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            disabled={!text.trim()}
            onClick={() => {
              onInsert(text.trim());
              onClose();
            }}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}
