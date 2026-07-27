"use client";

import { formatDateTime, formatInr } from "./format";

export default function VersionHistoryPanel({ history, onRestore }) {
  return (
    <section className="card version-card">
      <h2 className="panel-title">Version History</h2>
      {history.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Saved</th>
                <th>Grand Total</th>
                <th>Nature of Proceeding</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {history.map((snap) => (
                <tr key={snap.id}>
                  <td>{formatDateTime(snap.savedAt)}</td>
                  <td>
                    <strong>{formatInr(snap.totals.grandTotal)}</strong>
                  </td>
                  <td>{snap.inputs.natureOfProceeding}</td>
                  <td>
                    <button type="button" className="link" onClick={() => onRestore(snap)}>
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-inline">No saved estimates yet for this case. Use "Save to Case" to create the first version.</div>
      )}
    </section>
  );
}
