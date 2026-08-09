"use client";

import { useState } from "react";

export default function InsertTableDialog({ onClose, onInsert }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [withHeaderRow, setWithHeaderRow] = useState(true);

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">INSERT</p>
            <h2>Insert Table</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <label className="form-field">
              Rows
              <input type="number" min={1} max={30} value={rows} onChange={(e) => setRows(Number(e.target.value) || 1)} />
            </label>
            <label className="form-field">
              Columns
              <input type="number" min={1} max={12} value={cols} onChange={(e) => setCols(Number(e.target.value) || 1)} />
            </label>
            <label className="form-field full" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={withHeaderRow} onChange={(e) => setWithHeaderRow(e.target.checked)} />
              Header row
            </label>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              onInsert({ rows, cols, withHeaderRow });
              onClose();
            }}
          >
            Insert Table
          </button>
        </div>
      </div>
    </div>
  );
}
