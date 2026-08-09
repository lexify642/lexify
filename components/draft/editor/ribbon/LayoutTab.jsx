"use client";

import { useDrafts } from "../../DraftsContext";

const MARGINS = ["normal", "narrow", "moderate", "custom"];
const PAGE_SIZES = ["A4", "A3", "Letter", "Legal", "Custom"];
const COLUMN_OPTIONS = [1, 2, 3];

export default function LayoutTab({ draft }) {
  const { updateDraftLayout } = useDrafts();

  return (
    <div className="ribbon-groups">
      <div className="ribbon-group">
        <div className="ribbon-group-body">
          {MARGINS.map((m) => (
            <button
              key={m}
              type="button"
              className={`ribbon-btn${draft.layout.margin === m ? " active" : ""}`}
              onClick={() => updateDraftLayout(draft.id, { margin: m })}
            >
              {m[0].toUpperCase() + m.slice(1)}
            </button>
          ))}
          {draft.layout.margin === "custom" && (
            <input
              className="ribbon-select ribbon-select-narrow"
              type="number"
              min={10}
              max={120}
              placeholder="px"
              value={draft.layout.customMargin || ""}
              onChange={(e) => updateDraftLayout(draft.id, { customMargin: Number(e.target.value) || null })}
            />
          )}
        </div>
        <div className="ribbon-group-label">Margins</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button
            type="button"
            className={`ribbon-btn${draft.layout.orientation === "portrait" ? " active" : ""}`}
            onClick={() => updateDraftLayout(draft.id, { orientation: "portrait" })}
          >
            Portrait
          </button>
          <button
            type="button"
            className={`ribbon-btn${draft.layout.orientation === "landscape" ? " active" : ""}`}
            onClick={() => updateDraftLayout(draft.id, { orientation: "landscape" })}
          >
            Landscape
          </button>
        </div>
        <div className="ribbon-group-label">Orientation</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <select className="ribbon-select" value={draft.layout.pageSize} onChange={(e) => updateDraftLayout(draft.id, { pageSize: e.target.value })}>
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {draft.layout.pageSize === "Custom" && (
            <input
              className="ribbon-select ribbon-select-narrow"
              type="number"
              min={300}
              max={1400}
              placeholder="width px"
              value={draft.layout.customPageWidth || ""}
              onChange={(e) => updateDraftLayout(draft.id, { customPageWidth: Number(e.target.value) || null })}
            />
          )}
        </div>
        <div className="ribbon-group-label">Page Size</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          {COLUMN_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              className={`ribbon-btn${draft.layout.columns === c ? " active" : ""}`}
              onClick={() => updateDraftLayout(draft.id, { columns: c })}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="ribbon-group-label">Columns</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button
            type="button"
            className={`ribbon-btn${draft.layout.lineNumbers ? " active" : ""}`}
            onClick={() => updateDraftLayout(draft.id, { lineNumbers: !draft.layout.lineNumbers })}
          >
            Line Numbers
          </button>
          <button
            type="button"
            className={`ribbon-btn${draft.layout.differentFirstPage ? " active" : ""}`}
            onClick={() => updateDraftLayout(draft.id, { differentFirstPage: !draft.layout.differentFirstPage })}
          >
            Different First Page
          </button>
        </div>
        <div className="ribbon-group-label">Document Layout</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <label className="ribbon-color-swatch" title="Header distance from top (px)">
            H
            <input
              type="number"
              min={0}
              max={80}
              value={draft.layout.headerDistance}
              onChange={(e) => updateDraftLayout(draft.id, { headerDistance: Number(e.target.value) || 0 })}
              style={{ width: 44, border: "none", background: "transparent" }}
            />
          </label>
          <label className="ribbon-color-swatch" title="Footer distance from bottom (px)">
            F
            <input
              type="number"
              min={0}
              max={80}
              value={draft.layout.footerDistance}
              onChange={(e) => updateDraftLayout(draft.id, { footerDistance: Number(e.target.value) || 0 })}
              style={{ width: 44, border: "none", background: "transparent" }}
            />
          </label>
        </div>
        <div className="ribbon-group-label">Header/Footer Distance</div>
      </div>
    </div>
  );
}
