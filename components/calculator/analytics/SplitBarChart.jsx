"use client";

import { formatInr } from "../format";

// Two-segment stacked horizontal bar (flat CSS, not SVG donut arcs — consistent
// with the rest of the app). A 2px surface gap separates the segments. Both
// segments are always direct-labeled via the legend row beneath.
export default function SplitBarChart({ title, segments }) {
  const total = Math.max(1, segments.reduce((s, seg) => s + seg.value, 0));
  return (
    <div className="card chart-card">
      <div className="chart-card-head">
        <h3>{title}</h3>
      </div>
      <div className="chart-split">
        {segments.map((seg) => (
          <span
            key={seg.label}
            className="chart-split-segment"
            style={{ width: `${Math.max(0, (seg.value / total) * 100)}%`, background: seg.color }}
          />
        ))}
      </div>
      <div className="chart-legend">
        {segments.map((seg) => (
          <span className="chart-legend-item" key={seg.label}>
            <i style={{ background: seg.color }} />
            {seg.label}: <b>{formatInr(seg.value)}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
