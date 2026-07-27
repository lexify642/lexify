"use client";

import { useState } from "react";
import { formatInr } from "../format";

// Hand-rolled horizontal bar chart (flex/width divs — no SVG needed). Used for
// single-hue magnitude comparisons (stage distribution) and emphasis comparisons
// (state-wise fee comparison, where one bar is accent-colored and the rest muted).
export default function BarChart({ title, data, formatValue = formatInr }) {
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="card chart-card">
      <div className="chart-card-head">
        <h3>{title}</h3>
        <button type="button" className="link" onClick={() => setAsTable((v) => !v)}>
          {asTable ? "View as chart" : "View as table"}
        </button>
      </div>
      {asTable ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <td>{d.label}</td>
                <td>{formatValue(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="chart-bar-list">
          {data.map((d) => (
            <div className="chart-bar-row" key={d.label}>
              <span className="chart-bar-label">{d.label}</span>
              <span className="chart-bar-track">
                <span
                  className="chart-bar-fill"
                  style={{ width: `${Math.max(2, (d.value / max) * 100)}%`, background: d.color || "var(--blue)" }}
                />
              </span>
              <span className="chart-bar-value">{formatValue(d.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
