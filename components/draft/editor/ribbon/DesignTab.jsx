"use client";

import { useState } from "react";
import { useDrafts, LEGAL_PRESETS } from "../../DraftsContext";

const FONT_PAIRINGS = [
  { key: "classic", label: "Classic (Georgia)" },
  { key: "modern", label: "Modern (Arial)" },
  { key: "traditional", label: "Traditional (Times)" },
];
const SPACINGS = [
  { key: "compact", label: "Compact" },
  { key: "normal", label: "Normal" },
  { key: "relaxed", label: "Relaxed" },
];
const PAGE_BACKGROUNDS = [
  { key: "white", label: "White" },
  { key: "ivory", label: "Ivory" },
  { key: "secondary", label: "Soft Grey" },
];

export default function DesignTab({ draft }) {
  const { updateDraftDesign, applyPreset } = useDrafts();
  const [watermarkInput, setWatermarkInput] = useState(draft.design.watermark || "");

  return (
    <div className="ribbon-groups">
      <div className="ribbon-group ribbon-group-grow">
        <div className="ribbon-group-body ribbon-group-body-wrap">
          {Object.keys(LEGAL_PRESETS).map((name) => (
            <button
              key={name}
              type="button"
              className={`ribbon-btn${draft.design.preset === name ? " active" : ""}`}
              onClick={() => applyPreset(draft.id, name)}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="ribbon-group-label">Legal Document Presets</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <select className="ribbon-select" value={draft.design.fontPairing} onChange={(e) => updateDraftDesign(draft.id, { fontPairing: e.target.value })}>
            {FONT_PAIRINGS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="ribbon-group-label">Font Combination</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          {SPACINGS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`ribbon-btn${draft.design.spacing === s.key ? " active" : ""}`}
              onClick={() => updateDraftDesign(draft.id, { spacing: s.key })}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="ribbon-group-label">Paragraph Spacing</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          {PAGE_BACKGROUNDS.map((bg) => (
            <button
              key={bg.key}
              type="button"
              className={`ribbon-btn${draft.design.pageBackground === bg.key ? " active" : ""}`}
              onClick={() => updateDraftDesign(draft.id, { pageBackground: bg.key })}
            >
              {bg.label}
            </button>
          ))}
          <button
            type="button"
            className={`ribbon-btn${draft.design.pageBorder ? " active" : ""}`}
            onClick={() => updateDraftDesign(draft.id, { pageBorder: !draft.design.pageBorder })}
          >
            Page Border
          </button>
        </div>
        <div className="ribbon-group-label">Background &amp; Borders</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <input
            className="ribbon-select"
            placeholder="e.g. DRAFT"
            value={watermarkInput}
            onChange={(e) => setWatermarkInput(e.target.value)}
            onBlur={() => updateDraftDesign(draft.id, { watermark: watermarkInput.trim() || null })}
            onKeyDown={(e) => e.key === "Enter" && updateDraftDesign(draft.id, { watermark: watermarkInput.trim() || null })}
          />
          {draft.design.watermark && (
            <button type="button" className="ribbon-btn" onClick={() => { setWatermarkInput(""); updateDraftDesign(draft.id, { watermark: null }); }}>
              Remove
            </button>
          )}
        </div>
        <div className="ribbon-group-label">Watermark</div>
      </div>
    </div>
  );
}
