// Pure calculation engine for the Court Fees & Litigation Cost Calculator.
// calculateEstimate(input) is the single source of truth every panel renders from —
// no component should re-derive any of these numbers independently.
import {
  AD_VALOREM_SLABS,
  CASE_STAGE_TO_TIMELINE_STAGE,
  FEE_PARTICULARS,
  FIXED_COURT_FEE_BY_CATEGORY,
  LITIGATION_STAGES,
  PERCENTAGE_METHOD_RATE,
  RULES_LAST_UPDATED,
  RULES_VERSION,
  SCHEDULE_FEE_BY_PROCEEDING,
  STAGE_WEIGHTS_BY_CATEGORY,
  STATUTORY_REFERENCE_CORPUS,
  computeAdValoremFee,
} from "@/data/calculatorReference";

export const DEFAULT_INPUT = {
  linkedCaseNo: null,
  currentStageLabel: null,
  natureOfProceeding: "Money Recovery",
  caseCategory: "Civil",
  state: "Maharashtra",
  district: "Mumbai",
  court: "City Civil Court, Mumbai",
  courtLevel: "District Court",
  jurisdiction: "Original",
  reliefClaimed: 2500000,
  suitValuation: 2500000,
  marketValue: 2500000,
  considerationAmount: 0,
  valuationMethod: "Ad Valorem",
  plaintiffs: 1,
  defendants: 1,
  reliefs: 2,
  applications: 1,
  annexures: 15,
  pages: 120,
  certifiedCopies: 2,
  witnesses: 2,
  urgentFiling: false,
  interimReliefRequired: false,
  appealOrOriginal: "Original",
  additionalClaims: 0,
  counterClaimValue: 0,
  interestClaimed: 0,
  previousCourtFeePaid: 0,
  professionalFeesEnabled: false,
  gstEnabled: false,
};

const TOTAL_BUCKET_KEYS = [
  "courtFee",
  "filingCharges",
  "documentation",
  "miscExpenses",
  "administrativeCharges",
  "governmentFees",
  "courtProcessExpenses",
  "incidentalExpenses",
];

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigitWords(n) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
}

function threeDigitWords(n) {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  return (hundred ? ONES[hundred] + " Hundred" + (rest ? " " : "") : "") + (rest ? twoDigitWords(rest) : "");
}

// Indian numbering (lakh/crore) — deliberately not a generic international
// number-to-words util, since court-fee amounts are always quoted this way.
export function numberToIndianWords(amount) {
  const value = Math.round(Math.abs(amount));
  if (value === 0) return "Zero Rupees Only";
  const crore = Math.floor(value / 10000000);
  const lakh = Math.floor((value % 10000000) / 100000);
  const thousand = Math.floor((value % 100000) / 1000);
  const hundred = value % 1000;
  const parts = [];
  if (crore) parts.push(threeDigitWords(crore) + " Crore");
  if (lakh) parts.push(threeDigitWords(lakh) + " Lakh");
  if (thousand) parts.push(threeDigitWords(thousand) + " Thousand");
  if (hundred) parts.push(threeDigitWords(hundred));
  return parts.join(" ") + " Rupees Only";
}

function normalizeInput(raw) {
  const input = { ...DEFAULT_INPUT, ...raw };
  const num = (v, fallback = 0) => {
    const n = Number(String(v ?? "").toString().replace(/,/g, ""));
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    ...input,
    reliefClaimed: num(input.reliefClaimed),
    suitValuation: num(input.suitValuation),
    marketValue: num(input.marketValue),
    considerationAmount: num(input.considerationAmount),
    plaintiffs: Math.max(1, Math.round(num(input.plaintiffs, 1))),
    defendants: Math.max(0, Math.round(num(input.defendants, 1))),
    reliefs: Math.max(1, Math.round(num(input.reliefs, 1))),
    applications: Math.max(0, Math.round(num(input.applications, 0))),
    annexures: Math.max(0, Math.round(num(input.annexures, 0))),
    pages: Math.max(0, Math.round(num(input.pages, 0))),
    certifiedCopies: Math.max(0, Math.round(num(input.certifiedCopies, 0))),
    witnesses: Math.max(0, Math.round(num(input.witnesses, 0))),
    additionalClaims: num(input.additionalClaims),
    counterClaimValue: num(input.counterClaimValue),
    interestClaimed: num(input.interestClaimed),
    previousCourtFeePaid: num(input.previousCourtFeePaid),
  };
}

export function resolveValuation(input) {
  const base = input.reliefClaimed || input.suitValuation || input.marketValue || 0;
  return Math.max(0, base + input.additionalClaims + input.interestClaimed);
}

function resolveCourtFee(input, valuation) {
  let fee;
  switch (input.valuationMethod) {
    case "Fixed Court Fee":
      fee = FIXED_COURT_FEE_BY_CATEGORY[input.caseCategory] || 500;
      break;
    case "Schedule Fee":
      fee = SCHEDULE_FEE_BY_PROCEEDING[input.natureOfProceeding] || 1000;
      break;
    case "Percentage Based":
      fee = Math.round(valuation * PERCENTAGE_METHOD_RATE);
      break;
    case "Ad Valorem":
    default:
      fee = computeAdValoremFee(input.state, valuation);
      break;
  }
  if (input.appealOrOriginal === "Appeal" && input.previousCourtFeePaid > 0) {
    fee = Math.max(0, fee - input.previousCourtFeePaid);
  }
  return fee;
}

function riskFor(entry, amount, ctx) {
  if (entry.riskOverride) return entry.riskOverride(ctx, amount);
  if (entry.mandatory && amount <= 0) return "High";
  if (entry.affectedByUrgency && ctx.input.urgentFiling) return "Medium";
  if (entry.id === "court-fee" && ctx.valuationMismatch) return "High";
  return "Low";
}

function buildAlerts(ctx, rows, totals) {
  const alerts = [];
  const relief = ctx.input.reliefClaimed || ctx.input.suitValuation;
  if (ctx.valuationMismatch) {
    alerts.push({
      id: "valuation-mismatch",
      severity: "warning",
      message: "Suit valuation differs materially from relief claimed — this may affect pecuniary jurisdiction.",
      relatedRowId: "court-fee",
    });
  }
  const slab = AD_VALOREM_SLABS[ctx.input.state] || AD_VALOREM_SLABS.Maharashtra;
  if (ctx.input.valuationMethod === "Ad Valorem" && ctx.courtFeeAmount >= slab.cap) {
    alerts.push({
      id: "fee-capped",
      severity: "info",
      message: `Court fee has been capped at the ${ctx.input.state} statutory maximum of ₹${slab.cap.toLocaleString("en-IN")}.`,
      relatedRowId: "court-fee",
    });
  }
  if (ctx.input.appealOrOriginal === "Appeal" && ctx.input.previousCourtFeePaid <= 0) {
    alerts.push({
      id: "appeal-no-credit",
      severity: "warning",
      message: "No previous court fee recorded for this appeal — the full fresh fee has been computed. Enter the fee already paid below to adjust.",
      relatedRowId: "court-fee",
    });
  }
  if (ctx.input.counterClaimValue > 0) {
    alerts.push({
      id: "counter-claim",
      severity: "info",
      message: `A counter-claim of ₹${ctx.input.counterClaimValue.toLocaleString("en-IN")} will attract its own separate ad valorem court fee, not included in this estimate.`,
      relatedRowId: null,
    });
  }
  if (ctx.input.urgentFiling) {
    alerts.push({
      id: "urgent-multiplier",
      severity: "info",
      message: "Urgent filing multiplier (+25%) has been applied to process and process-server charges.",
      relatedRowId: "process-fee",
    });
  }
  if (ctx.n.pages <= 0) {
    alerts.push({
      id: "missing-pages",
      severity: "critical",
      message: "Page count has not been entered — documentation, printing, typing and scanning charges may be understated.",
      relatedRowId: "documentation",
    });
  }
  if (ctx.input.valuationMethod === "Fixed Court Fee" && relief > 1000000) {
    alerts.push({
      id: "fixed-fee-high-value",
      severity: "critical",
      message: "A high-value matter has been filed under Fixed Court Fee — confirm this valuation method is legally permissible, or ad valorem fees may apply on scrutiny.",
      relatedRowId: "court-fee",
    });
  }
  const zeroMandatory = rows.filter((r) => r.mandatoryFee && r.amount <= 0);
  zeroMandatory.forEach((r) => {
    alerts.push({
      id: `missing-mandatory-${r.id}`,
      severity: "warning",
      message: `${r.particular} is a mandatory charge but computed to ₹0 — check the related input fields.`,
      relatedRowId: r.id,
    });
  });
  return alerts;
}

function buildInsights(ctx, totals, timeline, rows) {
  const insights = [];
  insights.push(
    `Expected overall litigation cost through final judgment is approximately ₹${totals.grandTotal.toLocaleString("en-IN")}, based on the inputs provided.`
  );
  const missingMandatory = rows.filter((r) => r.mandatoryFee && r.amount <= 0);
  if (missingMandatory.length) {
    insights.push(`${missingMandatory.map((r) => r.particular).join(", ")} may have been omitted or under-counted — these are mandatory charges.`);
  } else {
    insights.push("No mandatory fee appears to have been omitted based on the current inputs.");
  }
  if (ctx.input.caseCategory === "Consumer") {
    insights.push("Consumer disputes attract a concessional fixed-fee slab under the Consumer Protection Rules — a cheaper procedural alternative to ad valorem valuation where applicable.");
  }
  if (ctx.input.caseCategory === "Labour") {
    insights.push("References before the Labour Court/Tribunal are ordinarily exempt from ordinary court fees under the Industrial Disputes Act, 1947.");
  }
  if (ctx.input.caseCategory === "Family") {
    insights.push("Family Court proceedings may qualify for a reduced or nominal court fee — confirm eligibility under the applicable State Family Courts Rules.");
  }
  insights.push("Parties with limited means may be eligible for legal aid and court-fee exemption under the Legal Services Authorities Act, 1987 — worth exploring before institution.");
  const admissionIndex = LITIGATION_STAGES.indexOf("Admission");
  const settlementCost = timeline.slice(0, admissionIndex + 1).reduce((s, t) => s + t.estimatedExpenditure, 0);
  insights.push(`If the matter settles before trial (by the Admission stage), estimated cost incurred would be approximately ₹${settlementCost.toLocaleString("en-IN")}.`);
  const appealIndex = LITIGATION_STAGES.indexOf("Appeal");
  const appealCost = timeline.slice(0, appealIndex + 1).reduce((s, t) => s + t.estimatedExpenditure, 0);
  insights.push(`If the matter proceeds through appeal, cumulative estimated cost rises to approximately ₹${appealCost.toLocaleString("en-IN")}.`);
  insights.push("Possible future expenses beyond this estimate include execution proceedings, further certified copies, and any interlocutory applications not yet filed.");
  return insights;
}

function buildTimeline(input, grandTotal) {
  const weights = STAGE_WEIGHTS_BY_CATEGORY[input.caseCategory] || null;
  const DEFAULT_WEIGHTS = [0.04, 0.14, 0.06, 0.06, 0.08, 0.14, 0.1, 0.1, 0.06, 0.06, 0.08, 0.03, 0.03, 0.02];
  const table = weights || DEFAULT_WEIGHTS;
  const currentStageKey = input.currentStageLabel ? CASE_STAGE_TO_TIMELINE_STAGE[input.currentStageLabel] : null;
  const currentIndex = currentStageKey ? LITIGATION_STAGES.indexOf(currentStageKey) : -1;
  let cumulative = 0;
  return LITIGATION_STAGES.map((stage, i) => {
    const estimatedExpenditure = Math.round(grandTotal * table[i]);
    cumulative += estimatedExpenditure;
    return {
      stage,
      estimatedExpenditure,
      cumulativeTotal: cumulative,
      isPast: currentIndex >= 0 && i < currentIndex,
      isCurrent: currentIndex >= 0 && i === currentIndex,
    };
  });
}

function buildStatutoryReferences(input) {
  const tags = new Set(["ALL", input.caseCategory, input.valuationMethod, input.state, input.courtLevel, input.jurisdiction]);
  return STATUTORY_REFERENCE_CORPUS.filter((ref) => ref.tags.some((t) => tags.has(t)));
}

export function calculateEstimate(rawInput) {
  const input = normalizeInput(rawInput);
  const valuation = resolveValuation(input);
  const courtFeeAmount = resolveCourtFee(input, valuation);
  const relief = input.reliefClaimed || input.suitValuation;
  const valuationMismatch = relief > 0 && Math.abs(input.suitValuation - relief) > relief * 0.2;

  const ctx = {
    input,
    valuation,
    courtFeeAmount,
    valuationMismatch,
    urgentMultiplier: input.urgentFiling ? 1.25 : 1,
    n: {
      plaintiffs: input.plaintiffs,
      defendants: input.defendants,
      reliefs: input.reliefs,
      applications: input.applications,
      annexures: input.annexures,
      pages: input.pages,
      certifiedCopies: input.certifiedCopies,
      witnesses: input.witnesses,
    },
  };

  const rows = FEE_PARTICULARS.map((entry) => {
    const amount = Math.max(0, Math.round(entry.amount(ctx)));
    const risk = riskFor(entry, amount, ctx);
    return {
      id: entry.id,
      particular: entry.particular,
      stage: entry.stage,
      jurisdictionLabel: `${input.courtLevel} · ${input.state}`,
      amount,
      risk,
      notes: entry.notes(ctx, amount),
      bucket: entry.bucket,
      mandatoryFee: entry.mandatory,
      explanation: {
        formula: entry.formula,
        provision: entry.statutoryRefId,
        notificationRef: entry.notificationRef,
        mandatory: entry.mandatory,
        lastUpdated: RULES_LAST_UPDATED,
      },
    };
  });

  const totals = TOTAL_BUCKET_KEYS.reduce((acc, key) => {
    acc[key] = rows.filter((r) => r.bucket === key).reduce((s, r) => s + r.amount, 0);
    return acc;
  }, {});

  const subtotal = TOTAL_BUCKET_KEYS.reduce((s, key) => s + totals[key], 0);
  const professionalExpenses = input.professionalFeesEnabled ? Math.round(subtotal * 0.35) : 0;
  const gstBase = input.gstEnabled ? professionalExpenses + totals.administrativeCharges : 0;
  const gstAmount = input.gstEnabled ? Math.round(gstBase * 0.18) : 0;
  const grandTotal = subtotal + professionalExpenses + gstAmount;

  totals.professionalExpenses = professionalExpenses;
  totals.subtotal = subtotal;
  totals.gstAmount = gstAmount;
  totals.grandTotal = grandTotal;
  totals.grandTotalWords = numberToIndianWords(grandTotal);

  const timeline = buildTimeline(input, grandTotal);
  const alerts = buildAlerts(ctx, rows, totals);
  const insights = buildInsights(ctx, totals, timeline, rows);
  const statutoryReferences = buildStatutoryReferences(input);

  return {
    input,
    rows,
    totals,
    timeline,
    alerts,
    insights,
    statutoryReferences,
    meta: {
      rulesVersion: RULES_VERSION,
      lastUpdated: RULES_LAST_UPDATED,
      calculatedAt: new Date().toISOString(),
    },
  };
}
