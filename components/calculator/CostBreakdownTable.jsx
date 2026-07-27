"use client";

import { formatInr } from "./format";

const RISK_TONE = { Low: "green", Medium: "orange", High: "red" };

export default function CostBreakdownTable({ rows, alerts }) {
  const alertsByRow = alerts.reduce((acc, a) => {
    if (!a.relatedRowId) return acc;
    (acc[a.relatedRowId] = acc[a.relatedRowId] || []).push(a);
    return acc;
  }, {});

  return (
    <section className="card">
      <h2 className="panel-title">2. Auto-Calculated Cost Breakdown</h2>
      <div className="table-wrap cost-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Particular</th>
              <th>Stage</th>
              <th>Jurisdiction</th>
              <th>Amount</th>
              <th>Risk</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{row.particular}</strong>
                  {alertsByRow[row.id] && <span className="row-alert-dot" title={alertsByRow[row.id][0].message} aria-hidden="true" />}
                </td>
                <td>{row.stage}</td>
                <td>{row.jurisdictionLabel}</td>
                <td>{formatInr(row.amount)}</td>
                <td>
                  <span className={`badge ${RISK_TONE[row.risk]}`}>{row.risk}</span>
                </td>
                <td>{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
