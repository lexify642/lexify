"use client";

import { formatInr } from "./format";

const TILES = [
  { key: "courtFee", label: "Court Fee", icon: "⚖" },
  { key: "filingCharges", label: "Filing & Process Fee", icon: "📝" },
  { key: "documentation", label: "Documentation & Copying", icon: "📄" },
  { key: "miscExpenses", label: "Miscellaneous Disbursements", icon: "🗂" },
  { key: "administrativeCharges", label: "Administrative Charges", icon: "🏛" },
  { key: "governmentFees", label: "Government Fees", icon: "🏦" },
  { key: "courtProcessExpenses", label: "Court Process Expenses", icon: "📮" },
  { key: "incidentalExpenses", label: "Incidental Expenses", icon: "🧾" },
];

export default function GrandTotalSummary({ totals, input, onToggle }) {
  return (
    <section className="card">
      <h2 className="panel-title">3. Estimated Total Litigation Cost</h2>
      <div className="cost-summary-grid">
        <div className="cost-tile-grid">
          {TILES.map((tile) => (
            <div className="cost-tile" key={tile.key}>
              <span className="cost-tile-icon">{tile.icon}</span>
              <div>
                <small>{tile.label}</small>
                <strong>{formatInr(totals[tile.key])}</strong>
              </div>
            </div>
          ))}
          <div className="cost-tile">
            <span className="cost-tile-icon">👤</span>
            <div>
              <small>
                Professional Expenses (Est.){" "}
                <label className="mini-toggle">
                  <input type="checkbox" checked={input.professionalFeesEnabled} onChange={(e) => onToggle("professionalFeesEnabled", e.target.checked)} />
                </label>
              </small>
              <strong>{formatInr(totals.professionalExpenses)}</strong>
            </div>
          </div>
          <div className="cost-tile">
            <span className="cost-tile-icon">%</span>
            <div>
              <small>
                GST (18%){" "}
                <label className="mini-toggle">
                  <input type="checkbox" checked={input.gstEnabled} onChange={(e) => onToggle("gstEnabled", e.target.checked)} />
                </label>
              </small>
              <strong>{formatInr(totals.gstAmount)}</strong>
            </div>
          </div>
        </div>
        <div className="cost-total">
          <small>Grand Total</small>
          <strong>{formatInr(totals.grandTotal)}</strong>
          <small>{totals.grandTotalWords}</small>
        </div>
      </div>
      <div className="disclaimer-box">
        This is only an indicative estimate based on the information provided and the applicable statutory provisions. Actual
        costs may vary depending upon court directions, amendments in law, additional proceedings, local rules, and practical
        litigation requirements.
      </div>
    </section>
  );
}
