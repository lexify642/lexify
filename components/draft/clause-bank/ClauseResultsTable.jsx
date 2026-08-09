"use client";

import { riskTone, statusTone, displayValue } from "../clauseUtils";

// Every clause row is one clickable unit that opens the full clause detail
// modal — all per-clause actions (View/Copy/Add to Draft/Save) now live
// inside that modal instead of as buttons crowding every row. The checkbox
// stops its own click from bubbling up so selecting a clause for bulk
// actions never also opens the modal.
export default function ClauseResultsTable({ clauses, selectedIds, onToggleSelect, onRowClick }) {
  function handleRowKeyDown(event, clause) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick(clause);
    }
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th></th>
            <th>Clause ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Type</th>
            <th>Domain</th>
            <th>Version</th>
            <th>Risk</th>
            <th>Favorability</th>
            <th>Status</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {clauses.map((c) => (
            <tr
              key={c.id}
              className="clause-row-clickable"
              tabIndex={0}
              onClick={() => onRowClick(c)}
              onKeyDown={(event) => handleRowKeyDown(event, c)}
            >
              <td onClick={(event) => event.stopPropagation()}>
                <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => onToggleSelect(c.id)} aria-label={`Select ${c.id}`} />
              </td>
              <td>
                <span className="clause-id">{c.id}</span>
              </td>
              <td>
                <strong>{c.name || c.type}</strong>
              </td>
              <td>{displayValue(c.category)}</td>
              <td>{displayValue(c.type)}</td>
              <td>{displayValue(c.domain)}</td>
              <td>{displayValue(c.version)}</td>
              <td>
                <span className={`badge ${riskTone(c.risk)}`}>{displayValue(c.risk, "N/A")}</span>
              </td>
              <td>{displayValue(c.favorability)}</td>
              <td>
                <span className={`badge ${statusTone(c.status)}`}>{displayValue(c.status)}</span>
              </td>
              <td>Not tracked</td>
            </tr>
          ))}
          {clauses.length === 0 && (
            <tr>
              <td colSpan={11} className="empty-inline">
                No clauses match these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
