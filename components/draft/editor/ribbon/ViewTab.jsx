"use client";

const ZOOM_STEPS = [50, 75, 90, 100, 125, 150, 175, 200];

export default function ViewTab({ activePanel, onTogglePanel, zoom, onZoomChange }) {
  function step(delta) {
    const idx = ZOOM_STEPS.indexOf(zoom);
    const nextIdx = idx === -1 ? ZOOM_STEPS.indexOf(100) : Math.min(Math.max(idx + delta, 0), ZOOM_STEPS.length - 1);
    onZoomChange(ZOOM_STEPS[nextIdx]);
  }

  return (
    <div className="ribbon-groups">
      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button
            type="button"
            className="ribbon-btn"
            onClick={() => document.querySelector(".document")?.classList.toggle("show-marks")}
          >
            Formatting Marks
          </button>
          <button type="button" className={`ribbon-btn${activePanel === "references" ? " active" : ""}`} onClick={() => onTogglePanel("references")}>
            Navigation Pane
          </button>
        </div>
        <div className="ribbon-group-label">Show</div>
      </div>

      <div className="ribbon-group">
        <div className="ribbon-group-body">
          <button type="button" className="ribbon-btn" onClick={() => step(-1)}>
            Zoom −
          </button>
          <span className="ribbon-select ribbon-select-narrow" style={{ textAlign: "center" }}>
            {zoom}%
          </span>
          <button type="button" className="ribbon-btn" onClick={() => step(1)}>
            Zoom +
          </button>
          <button type="button" className="ribbon-btn" onClick={() => onZoomChange(100)}>
            Reset
          </button>
        </div>
        <div className="ribbon-group-label">Zoom</div>
      </div>
    </div>
  );
}
