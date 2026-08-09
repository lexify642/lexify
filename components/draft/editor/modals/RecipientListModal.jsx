"use client";

import { TEAM_MEMBERS, CURRENT_USER } from "@/data/team";
import { useCases } from "@/components/cases/CasesContext";
import { buildClientDirectory } from "@/components/cases/clientDirectory";

export default function RecipientListModal({ onClose }) {
  const { cases } = useCases();
  const clients = buildClientDirectory(cases);
  const team = TEAM_MEMBERS.filter((m) => m.name !== CURRENT_USER.name);

  return (
    <div className="case-modal-backdrop show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="case-modal wide">
        <div className="modal-head">
          <div>
            <p className="eyebrow">MAILINGS</p>
            <h2>Recipient List</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <p className="page-subtitle" style={{ margin: "0 0 12px" }}>
            No email addresses are stored for team members or clients in this app yet — enter them manually when sending.
          </p>
          <div className="drawer-section-title">
            <h3>Team ({team.length})</h3>
          </div>
          <div className="table-wrap" style={{ marginBottom: 18 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {team.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="drawer-section-title">
            <h3>Clients ({clients.length})</h3>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Matters</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td>{c.phone || "—"}</td>
                    <td>{c.matters.length}</td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty-inline">
                      No clients on file.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
