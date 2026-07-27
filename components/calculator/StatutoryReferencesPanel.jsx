"use client";

import { useState } from "react";

export default function StatutoryReferencesPanel({ references }) {
  const [openId, setOpenId] = useState(null);

  return (
    <section className="card">
      <h2 className="panel-title">3. Statutory References</h2>
      <div className="accordion statutory-accordion">
        {references.map((ref) => (
          <div key={ref.id}>
            <button type="button" onClick={() => setOpenId(openId === ref.id ? null : ref.id)}>
              <span>
                <b>{ref.act}</b>
                <br />
                <small>{ref.sections}</small>
              </span>
              <span>{openId === ref.id ? "▾" : "▸"}</span>
            </button>
            {openId === ref.id && (
              <div className="explanation-item">
                <p>
                  <strong>Why applicable:</strong> {ref.whyApplicable}
                </p>
                <p>{ref.fullText}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
