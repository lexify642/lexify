"use client";

import { useState } from "react";

export default function TextFieldDialog({ eyebrow, title, label, placeholder, onClose, onSubmit }) {
  const [value, setValue] = useState("");

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <label className="form-field full" style={{ display: "block" }}>
            {label}
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} autoFocus />
          </label>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            disabled={!value.trim()}
            onClick={() => {
              onSubmit(value.trim());
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
