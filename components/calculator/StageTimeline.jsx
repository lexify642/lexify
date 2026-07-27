"use client";

import { formatInr } from "./format";

export default function StageTimeline({ timeline }) {
  return (
    <section className="card">
      <h2 className="panel-title">Stage-wise Cost Projection</h2>
      <p className="page-subtitle" style={{ margin: "0 0 20px" }}>
        Estimated expenditure at each stage of the litigation lifecycle, projected from the grand total.
      </p>
      <div className="case-timeline timeline-stages">
        {timeline.map((t) => (
          <article key={t.stage} className={t.isPast ? "stage-past" : t.isCurrent ? "stage-current" : ""}>
            <time>{formatInr(t.estimatedExpenditure)}</time>
            <div>
              <b>{t.stage}</b>
              <p>Cumulative through this stage: {formatInr(t.cumulativeTotal)}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
