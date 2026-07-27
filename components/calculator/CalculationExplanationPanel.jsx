"use client";

import { STATUTORY_REFERENCE_CORPUS } from "@/data/calculatorReference";
import { formatInr } from "./format";

const ACT_BY_ID = STATUTORY_REFERENCE_CORPUS.reduce((acc, r) => {
  acc[r.id] = r.act;
  return acc;
}, {});

export default function CalculationExplanationPanel({ rows }) {
  return (
    <section className="card">
      <h2 className="panel-title">4. Calculation Explanation</h2>
      <div className="explanation-list">
        {rows.map((row) => (
          <div className="explanation-item" key={row.id}>
            <div className="explanation-item-head">
              <b>{row.particular}</b>
              <span>{formatInr(row.amount)}</span>
            </div>
            <p>{row.explanation.formula}</p>
            <small>
              {ACT_BY_ID[row.explanation.provision]} · {row.explanation.notificationRef} ·{" "}
              {row.explanation.mandatory ? "Mandatory" : "Optional"} · Rules updated {row.explanation.lastUpdated}
            </small>
          </div>
        ))}
      </div>
    </section>
  );
}
