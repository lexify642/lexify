"use client";

import { useState } from "react";
import { formatDateTime, formatInr } from "../format";

// Small SVG polyline with markers + a hover tooltip, used for the Historical Cost
// Trend chart sourced from saved estimate versions.
export default function LineChart({ title, points }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (points.length < 2) {
    return (
      <div className="card chart-card">
        <div className="chart-card-head">
          <h3>{title}</h3>
        </div>
        <div className="empty-inline">Save at least two estimates for this case to see a historical trend.</div>
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * 100,
    y: 100 - ((p.value - min) / range) * 80 - 10,
    ...p,
  }));
  const path = coords.map((c) => `${c.x},${c.y}`).join(" ");

  return (
    <div className="card chart-card">
      <div className="chart-card-head">
        <h3>{title}</h3>
      </div>
      <div className="chart-line-wrap">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="chart-line-svg">
          <polyline points={path} fill="none" stroke="var(--blue)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={hoverIndex === i ? 2.4 : 1.6}
              fill="var(--blue)"
              stroke="#fff"
              strokeWidth="0.6"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          ))}
        </svg>
        {hoverIndex !== null && (
          <div className="chart-tooltip" style={{ left: `${coords[hoverIndex].x}%`, top: `${coords[hoverIndex].y}%` }}>
            <b>{formatInr(coords[hoverIndex].value)}</b>
            <span>{formatDateTime(coords[hoverIndex].savedAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
