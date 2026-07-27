"use client";

import { formatInr } from "../format";

export default function MeterChart({ title, used, budget }) {
  const pct = budget > 0 ? Math.min(100, Math.round((used / budget) * 100)) : 0;
  const over = budget > 0 && used > budget;
  return (
    <div className="card chart-card">
      <div className="chart-card-head">
        <h3>{title}</h3>
      </div>
      <div className="chart-meter-track">
        <div className={`chart-meter-fill${over ? " over" : ""}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="chart-meter-labels">
        <span>
          {formatInr(used)} used of {formatInr(budget)}
        </span>
        <b className={over ? "over-label" : ""}>{pct}%</b>
      </div>
    </div>
  );
}
