"use client";

import { STATES, computeAdValoremFee } from "@/data/calculatorReference";
import { resolveValuation } from "../costEngine";
import { formatInr } from "../format";
import BarChart from "./BarChart";
import EstimatedVsActualChart from "./EstimatedVsActualChart";
import LineChart from "./LineChart";
import MeterChart from "./MeterChart";
import SplitBarChart from "./SplitBarChart";
import { CHART_COLORS } from "./chartColors";

export default function AnalyticsDashboard({ result, history, onActualExpensesChange }) {
  const { input, totals, timeline } = result;
  const valuation = resolveValuation(input);

  const stateComparison = STATES.map((state) => ({
    label: state,
    value: input.valuationMethod === "Ad Valorem" ? computeAdValoremFee(state, valuation) : totals.courtFee,
    color: state === input.state ? CHART_COLORS.blue : CHART_COLORS.muted,
  }));

  const stageDistribution = timeline
    .filter((t) => t.estimatedExpenditure > 0)
    .map((t) => ({ label: t.stage, value: t.estimatedExpenditure, color: CHART_COLORS.blue }));

  const historyPoints = [...history].reverse().map((h) => ({ value: h.totals.grandTotal, savedAt: h.savedAt }));

  return (
    <div className="analytics-grid">
      <SplitBarChart
        title="Court Fee vs. Other Litigation Expenses"
        segments={[
          { label: "Court Fee", value: totals.courtFee, color: CHART_COLORS.blue },
          { label: "Other Expenses", value: Math.max(0, totals.grandTotal - totals.courtFee), color: CHART_COLORS.green },
        ]}
      />
      <SplitBarChart
        title="Government Fees vs. Professional Expenses"
        segments={[
          { label: "Government Fees", value: totals.governmentFees + totals.courtFee, color: CHART_COLORS.purple },
          { label: "Professional Expenses", value: totals.professionalExpenses, color: CHART_COLORS.orange },
        ]}
      />
      <BarChart title="Stage-wise Cost Distribution" data={stageDistribution} />
      <BarChart title="State-wise Fee Comparison" data={stateComparison} />
      <MeterChart title="Total Budget Utilisation" used={input.actualExpensesSoFar} budget={totals.grandTotal} />
      <div className="card chart-card">
        <div className="chart-card-head">
          <h3>Actual Expenses So Far</h3>
        </div>
        <div className="field">
          <label htmlFor="actual-expenses">Amount spent to date (₹)</label>
          <input
            id="actual-expenses"
            inputMode="numeric"
            value={input.actualExpensesSoFar}
            onChange={(e) => onActualExpensesChange(e.target.value)}
          />
          <div className="hint">Feeds the Budget Utilisation and Estimated vs. Actual charts.</div>
        </div>
      </div>
      <EstimatedVsActualChart estimated={totals.grandTotal} actual={input.actualExpensesSoFar} />
      <LineChart title="Historical Cost Trend (this case)" points={historyPoints} />
    </div>
  );
}
