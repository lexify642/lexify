"use client";

export default function AiInsightsPanel({ insights }) {
  return (
    <section className="card ai-card">
      <h2 className="ai-heading">✦ AI Litigation Cost Insights</h2>
      <ul className="insight-list">
        {insights.map((text, i) => (
          <li key={i}>{text}</li>
        ))}
      </ul>
      <p className="insight-disclaimer">Simulated, rule-based analysis generated from this estimate — not a live AI/legal-research call.</p>
    </section>
  );
}
