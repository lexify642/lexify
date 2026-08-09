"use client";

import { useState } from "react";

export default function AddCommentDialog({ quotedText, onClose, onSubmit }) {
  const [body, setBody] = useState("");

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">INSERT</p>
            <h2>Add Comment</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="clause-detail-text" style={{ marginBottom: 12 }}>
            &ldquo;{quotedText}&rdquo;
          </div>
          <label className="form-field full" style={{ display: "block" }}>
            Comment
            <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} autoFocus />
          </label>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            disabled={!body.trim()}
            onClick={() => {
              onSubmit(body.trim());
              onClose();
            }}
          >
            Add Comment
          </button>
        </div>
      </div>
    </div>
  );
}
