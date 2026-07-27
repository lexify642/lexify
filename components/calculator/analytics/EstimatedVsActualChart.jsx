"use client";

import { formatInr } from "../format";

// Estimated vs. Actual comparison. Actual is colored by status (green = within
// estimate, red = over) — a reserved status use, kept separate from the
// categorical color order used elsewhere in the dashboard.
export default function EstimatedVsActualChart({ estimated, actual }) {
  const max = Math.max(1, estimated, actual);
  const over = actual > estimated;

  return (
    <div className="card chart-card">
      <div className="chart-card-head">
        <h3>Estimated vs. Actual Litigation Cost</h3>
      </div>
      <div className="chart-bar-list">
        <div className="chart-bar-row">
          <span className="chart-bar-label">Estimated</span>
          <span className="chart-bar-track">
            <span className="chart-bar-fill" style={{ width: `${(estimated / max) * 100}%`, background: "var(--blue)" }} />
          </span>
          <span className="chart-bar-value">{formatInr(estimated)}</span>
        </div>
        <div className="chart-bar-row">
          <span className="chart-bar-label">Actual so far</span>
          <span className="chart-bar-track">
            <span
              className="chart-bar-fill"
              style={{ width: `${(actual / max) * 100}%`, background: over ? "var(--red)" : "var(--green)" }}
            />
          </span>
          <span className="chart-bar-value">{formatInr(actual)}</span>
        </div>
      </div>
      <p className="hint">{over ? "Actual expenses have exceeded the estimate." : "Actual expenses are within the estimate so far."}</p>
    </div>
  );
}
