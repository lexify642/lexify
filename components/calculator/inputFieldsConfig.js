import {
  CASE_CATEGORIES,
  COURT_LEVELS,
  DISTRICTS_BY_STATE,
  JURISDICTIONS,
  SCHEDULE_FEE_BY_PROCEEDING,
  STATES,
  VALUATION_METHODS,
} from "@/data/calculatorReference";

const NATURE_OPTIONS = Object.keys(SCHEDULE_FEE_BY_PROCEEDING);

// Declarative field groups driving Input Details — mirrors the FORM_CONFIGS pattern
// already used by components/cases/CaseModal.jsx, generalized with a `visible`
// predicate for conditionally-shown fields and an `options` function for fields
// whose choices depend on another field's current value.
export const INPUT_FIELD_GROUPS = [
  {
    id: "proceeding",
    title: "Proceeding",
    fields: [
      { key: "natureOfProceeding", label: "Nature of Proceeding", type: "select", options: () => NATURE_OPTIONS },
      { key: "caseCategory", label: "Case Type", type: "select", options: () => CASE_CATEGORIES },
      { key: "valuationMethod", label: "Valuation Method", type: "select", options: () => VALUATION_METHODS },
      { key: "appealOrOriginal", label: "Appeal or Original Proceeding", type: "select", options: () => ["Original", "Appeal"] },
    ],
  },
  {
    id: "court",
    title: "Court & Jurisdiction",
    fields: [
      { key: "state", label: "State", type: "select", options: () => STATES },
      { key: "district", label: "District", type: "select", options: (v) => DISTRICTS_BY_STATE[v.state] || [] },
      { key: "court", label: "Court", type: "text" },
      { key: "courtLevel", label: "Court Level", type: "select", options: () => COURT_LEVELS },
      { key: "jurisdiction", label: "Jurisdiction", type: "select", options: () => JURISDICTIONS },
    ],
  },
  {
    id: "valuation",
    title: "Valuation",
    fields: [
      { key: "reliefClaimed", label: "Relief Claimed (₹)", type: "number" },
      { key: "suitValuation", label: "Suit Valuation (₹)", type: "number" },
      { key: "marketValue", label: "Market Value (₹)", type: "number" },
      { key: "considerationAmount", label: "Consideration Amount (₹)", type: "number" },
    ],
  },
  {
    id: "composition",
    title: "Case Composition",
    fields: [
      { key: "plaintiffs", label: "Plaintiffs", type: "number" },
      { key: "defendants", label: "Defendants", type: "number" },
      { key: "reliefs", label: "Reliefs", type: "number" },
      { key: "applications", label: "Applications", type: "number" },
      { key: "annexures", label: "Annexures", type: "number" },
      { key: "pages", label: "Pages", type: "number" },
      { key: "certifiedCopies", label: "Certified Copies", type: "number" },
      { key: "witnesses", label: "Witnesses", type: "number" },
    ],
  },
  {
    id: "additional",
    title: "Additional Claims",
    fields: [
      { key: "additionalClaims", label: "Additional Claims (₹)", type: "number" },
      { key: "counterClaimValue", label: "Counter Claim Value (₹)", type: "number" },
      { key: "interestClaimed", label: "Interest Claimed (₹)", type: "number" },
      {
        key: "previousCourtFeePaid",
        label: "Previous Court Fee Paid (₹)",
        type: "number",
        visible: (v) => v.appealOrOriginal === "Appeal",
        hint: "Only relevant for an appeal — offsets the fresh court fee below.",
      },
    ],
  },
  {
    id: "filing-options",
    title: "Filing Options",
    fields: [
      { key: "urgentFiling", label: "Urgent Filing", type: "toggle" },
      { key: "interimReliefRequired", label: "Interim Relief Required", type: "toggle" },
    ],
  },
];
