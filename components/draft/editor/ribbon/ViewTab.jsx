"use client";

import { Ruler, Pilcrow, PanelLeft, ZoomIn, ZoomOut, Search, File, MoveHorizontal } from "lucide-react";
import { pageMetricsFor } from "../pagination";

const ZOOM_STEPS = [50, 75, 90, 100, 125, 150, 175, 200];

function Big({ icon: Icon, label, onClick, active, title }) {
  return (
    <button type="button" className={`ribbon-btn ribbon-btn-big${active ? " active" : ""}`} onClick={onClick} title={title || label} aria-pressed={active === undefined ? undefined : !!active}>
      <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

export default function ViewTab({ draft, activePanel, onTogglePanel, ui }) {
  const { zoom, setZoom } = ui;

  // Next preset above/below the current zoom (which the slider may have
  // left between presets).
  function step(delta) {
    const next = delta > 0 ? ZOOM_STEPS.find((z) => z > zoom) : [...ZOOM_STEPS].reverse().find((z) => z < zoom);
    if (next) setZoom(next);
  }

  // Fit the page (or its width) into the visible canvas.
  function fit(mode) {
    const canvas = document.querySelector(".word-canvas");
    if (!canvas) return;
    const m = pageMetricsFor(draft.layout);
    const rulerAllowance = ui.showRuler ? 28 : 0;
    const byWidth = (canvas.clientWidth - 48 - rulerAllowance) / m.width;
    const byHeight = (canvas.clientHeight - 32 - rulerAllowance) / m.height;
    const ratio = mode === "page" ? Math.min(byWidth, byHeight) : byWidth;
    setZoom(Math.max(50, Math.min(200, Math.round(ratio * 100))));
  }

  return (
    <div className="ribbon-groups">
      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <Big icon={Ruler} label="Ruler" active={ui.showRuler} onClick={() => ui.setShowRuler(!ui.showRuler)} />
          <Big icon={Pilcrow} label="Formatting Marks" active={ui.showMarks} onClick={() => ui.setShowMarks(!ui.showMarks)} />
          <Big icon={PanelLeft} label="Navigation Pane" active={activePanel === "references"} onClick={() => onTogglePanel("references")} />
        </div>
        <div className="ribbon-group-label">Show</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <Big icon={ZoomOut} label="Zoom Out" onClick={() => step(-1)} />
          <Big icon={Search} label={`${zoom}%`} title="Back to 100%" onClick={() => setZoom(100)} />
          <Big icon={ZoomIn} label="Zoom In" onClick={() => step(1)} />
          <Big icon={File} label="One Page" onClick={() => fit("page")} />
          <Big icon={MoveHorizontal} label="Page Width" onClick={() => fit("width")} />
        </div>
        <div className="ribbon-group-label">Zoom</div>
      </div>
    </div>
  );
}
