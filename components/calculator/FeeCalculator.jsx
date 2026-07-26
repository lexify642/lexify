"use client";

import { useState } from "react";

function formatInr(amount) {
  return "₹" + amount.toLocaleString("en-IN");
}

export default function FeeCalculator() {
  const [caseType, setCaseType] = useState("Civil Suit");
  const [relief, setRelief] = useState("2500000");
  const [state, setState] = useState("Maharashtra");
  const [courtFee, setCourtFee] = useState(87500);
  const [totalCost, setTotalCost] = useState(116100);

  const handleCalculate = () => {
    const amount = Number(relief.replace(/,/g, "")) || 2500000;
    const fee = Math.min(Math.round(amount * 0.035), 300000);
    setCourtFee(fee);
    setTotalCost(fee + 28600);
  };

  return (
    <div className="calculator">
      <section className="card">
        <h2 className="panel-title">Matter Details</h2>
        <div className="field">
          <label htmlFor="case-type">Case Type</label>
          <select id="case-type" value={caseType} onChange={(event) => setCaseType(event.target.value)}>
            <option>Civil Suit</option>
            <option>Writ Petition</option>
            <option>Commercial Suit</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="relief">Relief Claimed (₹)</label>
          <input
            id="relief"
            value={relief}
            inputMode="numeric"
            onChange={(event) => setRelief(event.target.value)}
          />
          <div className="hint">Example: ₹25,00,000</div>
        </div>
        <div className="field">
          <label htmlFor="state">State</label>
          <select id="state" value={state} onChange={(event) => setState(event.target.value)}>
            <option>Maharashtra</option>
            <option>Delhi</option>
            <option>Karnataka</option>
          </select>
        </div>
        <button className="btn" onClick={handleCalculate}>
          Calculate estimated costs
        </button>
      </section>
      <section className="card">
        <h2 className="panel-title">Estimated Cost Summary</h2>
        <div className="cost-total">
          <small>Estimated total litigation cost</small>
          <strong>{formatInr(totalCost)}</strong>
          <small>Indicative estimate, excluding counsel fees and taxes.</small>
        </div>
        <div className="cost-row">
          <span>Court fee</span>
          <b>{formatInr(courtFee)}</b>
        </div>
        <div className="cost-row">
          <span>Filing &amp; process fee</span>
          <b>₹8,600</b>
        </div>
        <div className="cost-row">
          <span>Documentation &amp; copying</span>
          <b>₹12,500</b>
        </div>
        <div className="cost-row">
          <span>Miscellaneous disbursements</span>
          <b>₹7,500</b>
        </div>
        <div className="provision">
          <strong>Applicable provision</strong>
          <br />
          The Maharashtra Court Fees Act, 1959, Section 6 — ad valorem fee on plaints and memoranda
          of appeal. Verify the final amount with the relevant court registry.
        </div>
      </section>
    </div>
  );
}
