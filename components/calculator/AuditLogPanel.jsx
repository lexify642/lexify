"use client";

import { formatDateTime } from "./format";

export default function AuditLogPanel({ entries, onViewCalculation }) {
  return (
    <section className="card">
      <h2 className="panel-title">Security &amp; Audit Trail</h2>
      <p className="hint" style={{ marginBottom: 16 }}>
        Local demo log recorded in this browser — not a substitute for a real audit/security backend. Click a row to view
        the calculation exactly as it existed at that time.
      </p>
      {entries.length ? (
        <div className="table-wrap">
          <table className="data-table audit-table">
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>User</th>
                <th>Event</th>
                <th>State · Court</th>
                <th>Rules Version</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  className="case-row"
                  tabIndex={0}
                  key={e.id}
                  onClick={() => e.snapshot && onViewCalculation(e)}
                  title={e.snapshot ? "View calculation" : "No snapshot saved for this entry"}
                >
                  <td>{formatDateTime(e.timestamp)}</td>
                  <td>{e.user}</td>
                  <td>{e.event}</td>
                  <td>{e.stateCourt}</td>
                  <td>{e.rulesVersion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-inline">No audit events recorded yet in this browser.</div>
      )}
    </section>
  );
}
