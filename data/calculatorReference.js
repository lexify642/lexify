// Frontend-only mock configuration for the Court Fees & Litigation Cost Calculator.
// Rates, slabs and statutory summaries below are representative approximations for
// demo purposes and are not a substitute for verifying the exact figures with the
// relevant court registry. This is the seed data that would move into a maintained
// rules service once a backend exists (see data/partnershipDeed.js for the same
// convention used elsewhere in this app).

export const CASE_CATEGORIES = [
  "Civil",
  "Criminal",
  "Family",
  "Commercial",
  "Consumer",
  "Labour",
  "Tribunal",
  "Tax",
  "Arbitration",
];

export const VALUATION_METHODS = ["Ad Valorem", "Fixed Court Fee", "Schedule Fee", "Percentage Based"];

export const COURT_LEVELS = [
  "District Court",
  "City Civil Court",
  "Sessions Court",
  "High Court",
  "Supreme Court",
  "Family Court",
  "Consumer Commission",
  "Labour Court / Tribunal",
  "NCLT / NCLAT",
  "Tax Tribunal",
];

export const JURISDICTIONS = ["Original", "Appellate", "Revisional", "Writ", "Execution"];

export const STATES = [
  "Maharashtra",
  "Delhi",
  "Karnataka",
  "Tamil Nadu",
  "Uttar Pradesh",
  "West Bengal",
  "Gujarat",
  "Telangana",
];

export const DISTRICTS_BY_STATE = {
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Thane"],
  Delhi: ["New Delhi", "South Delhi", "West Delhi"],
  Karnataka: ["Bengaluru Urban", "Mysuru"],
  "Tamil Nadu": ["Chennai", "Coimbatore"],
  "Uttar Pradesh": ["Lucknow", "Noida"],
  "West Bengal": ["Kolkata", "Howrah"],
  Gujarat: ["Ahmedabad", "Surat"],
  Telangana: ["Hyderabad"],
};

// Progressive ad valorem slabs: rate applies to the portion of the valuation within
// that bracket (cumulative, like an income-tax slab), then the running total is
// capped at `cap`.
export const AD_VALOREM_SLABS = {
  Maharashtra: {
    cap: 300000,
    brackets: [
      { upTo: 1000, rate: 0.06 },
      { upTo: 10000, rate: 0.05 },
      { upTo: 100000, rate: 0.045 },
      { upTo: 500000, rate: 0.04 },
      { upTo: 2000000, rate: 0.035 },
      { upTo: Infinity, rate: 0.03 },
    ],
  },
  Delhi: {
    cap: 200000,
    brackets: [
      { upTo: 1000, rate: 0.05 },
      { upTo: 10000, rate: 0.045 },
      { upTo: 100000, rate: 0.04 },
      { upTo: 500000, rate: 0.035 },
      { upTo: Infinity, rate: 0.03 },
    ],
  },
  Karnataka: {
    cap: 250000,
    brackets: [
      { upTo: 1000, rate: 0.055 },
      { upTo: 10000, rate: 0.05 },
      { upTo: 100000, rate: 0.045 },
      { upTo: 500000, rate: 0.038 },
      { upTo: Infinity, rate: 0.032 },
    ],
  },
  "Tamil Nadu": {
    cap: 200000,
    brackets: [
      { upTo: 1000, rate: 0.05 },
      { upTo: 10000, rate: 0.045 },
      { upTo: 100000, rate: 0.04 },
      { upTo: Infinity, rate: 0.03 },
    ],
  },
  "Uttar Pradesh": {
    cap: 150000,
    brackets: [
      { upTo: 1000, rate: 0.045 },
      { upTo: 10000, rate: 0.04 },
      { upTo: 100000, rate: 0.035 },
      { upTo: Infinity, rate: 0.028 },
    ],
  },
  "West Bengal": {
    cap: 150000,
    brackets: [
      { upTo: 1000, rate: 0.045 },
      { upTo: 10000, rate: 0.04 },
      { upTo: 100000, rate: 0.033 },
      { upTo: Infinity, rate: 0.027 },
    ],
  },
  Gujarat: {
    cap: 200000,
    brackets: [
      { upTo: 1000, rate: 0.05 },
      { upTo: 10000, rate: 0.045 },
      { upTo: 100000, rate: 0.038 },
      { upTo: Infinity, rate: 0.03 },
    ],
  },
  Telangana: {
    cap: 250000,
    brackets: [
      { upTo: 1000, rate: 0.055 },
      { upTo: 10000, rate: 0.05 },
      { upTo: 100000, rate: 0.043 },
      { upTo: Infinity, rate: 0.032 },
    ],
  },
};

export function computeAdValoremFee(state, valuation) {
  const table = AD_VALOREM_SLABS[state] || AD_VALOREM_SLABS.Maharashtra;
  let remaining = Math.max(0, valuation);
  let lower = 0;
  let fee = 0;
  for (const bracket of table.brackets) {
    if (remaining <= 0) break;
    const span = Math.min(remaining, bracket.upTo - lower);
    if (span > 0) {
      fee += span * bracket.rate;
      remaining -= span;
    }
    lower = bracket.upTo;
  }
  return Math.min(Math.round(fee), table.cap);
}

// Flat fee schedules for non-ad-valorem valuation methods.
export const FIXED_COURT_FEE_BY_CATEGORY = {
  Civil: 500,
  Criminal: 200,
  Family: 300,
  Commercial: 1000,
  Consumer: 400,
  Labour: 250,
  Tribunal: 750,
  Tax: 1000,
  Arbitration: 1500,
};

export const SCHEDULE_FEE_BY_PROCEEDING = {
  "Money Recovery": 2500,
  "Injunction": 1000,
  "Declaration": 1500,
  "Specific Performance": 3000,
  "Partition": 2000,
  "Eviction": 1200,
  "Bail Application": 300,
  "Maintenance": 400,
  "Divorce": 600,
  "Winding Up": 5000,
  "Appeal": 2000,
  "Writ Petition": 1000,
};

export const PERCENTAGE_METHOD_RATE = 0.02; // flat 2% of valuation, non-progressive

// 14-stage litigation lifecycle used for the cost timeline projection.
export const LITIGATION_STAGES = [
  "Pre-litigation",
  "Institution",
  "Notice Stage",
  "Admission",
  "Written Statement",
  "Evidence",
  "Cross Examination",
  "Arguments",
  "Judgment",
  "Execution",
  "Appeal",
  "Revision",
  "Review",
  "SLP",
];

const DEFAULT_STAGE_WEIGHTS = [0.04, 0.14, 0.06, 0.06, 0.08, 0.14, 0.1, 0.1, 0.06, 0.06, 0.08, 0.03, 0.03, 0.02];

// Category-specific reweighting; anything not listed falls back to the default.
export const STAGE_WEIGHTS_BY_CATEGORY = {
  Criminal: [0.02, 0.1, 0.08, 0.08, 0.04, 0.2, 0.16, 0.1, 0.06, 0.04, 0.06, 0.02, 0.02, 0.02],
  Arbitration: [0.03, 0.16, 0.04, 0.05, 0.05, 0.16, 0.12, 0.16, 0.08, 0.06, 0.05, 0.02, 0.01, 0.01],
  Family: [0.03, 0.12, 0.08, 0.08, 0.1, 0.12, 0.08, 0.1, 0.08, 0.08, 0.06, 0.03, 0.03, 0.01],
  Tax: [0.02, 0.1, 0.04, 0.06, 0.08, 0.08, 0.06, 0.14, 0.08, 0.04, 0.12, 0.08, 0.06, 0.04],
  Tribunal: [0.02, 0.1, 0.04, 0.06, 0.08, 0.1, 0.08, 0.14, 0.08, 0.04, 0.1, 0.06, 0.06, 0.04],
};

// Maps the freeform case "stage" text used in data/cases.js to a LITIGATION_STAGES entry.
export const CASE_STAGE_TO_TIMELINE_STAGE = {
  Admission: "Admission",
  "Final Hearing": "Arguments",
  Evidence: "Evidence",
  Reply: "Written Statement",
};

// Curated statutory reference corpus. `tags` are matched against the case category,
// valuation method, state name, or the literal "ALL".
export const STATUTORY_REFERENCE_CORPUS = [
  {
    id: "court-fees-act-1870",
    act: "The Court Fees Act, 1870",
    sections: "Section 7, 7A, 11",
    tags: ["ALL"],
    whyApplicable: "Central statute governing ad valorem and fixed court fees payable on plaints, appeals, and applications.",
    fullText:
      "The Court Fees Act, 1870 lays down the base framework for computing court fees on plaints, memoranda of appeal and other proceedings. Section 7 prescribes ad valorem computation for suits for money or property where the subject matter admits of monetary valuation, Section 7A extends this to suits for possession, and Section 11 deals with refunds where a court fee has been paid in excess.",
  },
  {
    id: "suits-valuation-act-1887",
    act: "The Suits Valuation Act, 1887",
    sections: "Section 8, 9",
    tags: ["Ad Valorem"],
    whyApplicable: "Governs how suit valuation is determined for jurisdictional purposes when the ad valorem method is used.",
    fullText:
      "The Suits Valuation Act, 1887 works alongside the Court Fees Act to fix the valuation of a suit for the purpose of determining pecuniary jurisdiction. Section 8 requires that, ordinarily, the valuation for court fee and for jurisdiction should coincide unless a special enactment provides otherwise.",
  },
  {
    id: "cpc-1908",
    act: "Code of Civil Procedure, 1908",
    sections: "Order IV, Order VII, Order XIII",
    tags: ["Civil", "Commercial", "Consumer"],
    whyApplicable: "Procedural code governing institution of suits, plaint requirements, and production of documents.",
    fullText:
      "Order IV governs the institution of suits, Order VII prescribes the contents of a plaint including the statement of value for jurisdiction and court fees, and Order XIII deals with production, impounding and return of documents relied upon at trial.",
  },
  {
    id: "commercial-courts-act-2015",
    act: "The Commercial Courts Act, 2015",
    sections: "Section 12, 12A",
    tags: ["Commercial"],
    whyApplicable: "Special valuation and pre-institution mediation requirements apply to commercial disputes.",
    fullText:
      "Section 12 fixes the specified value threshold that brings a dispute within the ambit of the commercial court, and Section 12A mandates pre-institution mediation before filing a suit that does not contemplate urgent interim relief.",
  },
  {
    id: "crpc-1973",
    act: "Code of Criminal Procedure, 1973",
    sections: "Section 200, 204, 340",
    tags: ["Criminal"],
    whyApplicable: "Governs process fee, summons issuance and complaint procedure in criminal matters.",
    fullText:
      "Section 200 prescribes the examination of a complainant, Section 204 governs issuance of process (summons/warrant) and the associated process fee, and Section 340 deals with proceedings for offences affecting the administration of justice.",
  },
  {
    id: "family-courts-act-1984",
    act: "The Family Courts Act, 1984",
    sections: "Section 7, 10",
    tags: ["Family"],
    whyApplicable: "Confers jurisdiction over matrimonial, maintenance and guardianship matters, with simplified fee schedules.",
    fullText:
      "Section 7 confers jurisdiction on Family Courts over matrimonial causes, guardianship and maintenance, while Section 10 makes the Code of Civil Procedure applicable subject to any State Family Courts Rules that may prescribe simplified or nominal court fees.",
  },
  {
    id: "consumer-protection-act-2019",
    act: "The Consumer Protection Act, 2019",
    sections: "Section 34, 69, Rule 7",
    tags: ["Consumer"],
    whyApplicable: "Prescribes concessional fixed fee slabs for consumer complaints based on the value of goods/services and compensation claimed.",
    fullText:
      "Section 34 fixes pecuniary jurisdiction across District, State and National Commissions, Section 69 prescribes limitation, and Rule 7 of the Consumer Protection Rules lays down a concessional fixed-fee slab structure rather than the ordinary ad valorem regime.",
  },
  {
    id: "industrial-disputes-act-1947",
    act: "The Industrial Disputes Act, 1947",
    sections: "Section 2A, 10",
    tags: ["Labour"],
    whyApplicable: "Labour court/tribunal references are generally exempt from ordinary court fees.",
    fullText:
      "Section 2A permits an individual workman to raise a dispute regarding discharge/dismissal, and Section 10 empowers the appropriate Government to refer disputes to a Labour Court or Tribunal. References under this Act typically carry nominal or no court fee, unlike ordinary civil suits.",
  },
  {
    id: "arbitration-act-1996",
    act: "The Arbitration and Conciliation Act, 1996",
    sections: "Section 9, 11, 34",
    tags: ["Arbitration"],
    whyApplicable: "Governs interim relief, appointment of arbitrator, and challenge to award, each with its own court-fee treatment.",
    fullText:
      "Section 9 empowers a court to grant interim measures before, during or after arbitral proceedings, Section 11 governs appointment of an arbitrator by the court, and Section 34 provides for setting aside an arbitral award — each attracting a separate application fee distinct from a plaint's ad valorem fee.",
  },
  {
    id: "income-tax-act-1961",
    act: "The Income Tax Act, 1961",
    sections: "Section 253, 260A",
    tags: ["Tax"],
    whyApplicable: "Fixes the appeal fee slabs before the Income Tax Appellate Tribunal and High Court.",
    fullText:
      "Section 253 prescribes a slab-based fixed appeal fee before the Income Tax Appellate Tribunal keyed to the assessed income, and Section 260A governs further appeal to the High Court on a substantial question of law.",
  },
  {
    id: "nclt-rules-2016",
    act: "NCLT Rules, 2016 / Companies (Fees) Rules",
    sections: "Rule 34, Schedule of Fees",
    tags: ["Tribunal"],
    whyApplicable: "Prescribes fixed fees for petitions and applications before the NCLT/NCLAT.",
    fullText:
      "Rule 34 read with the Schedule of Fees under the Companies (Fees) Rules prescribes a fixed fee for each category of petition or application filed before the National Company Law Tribunal, distinct from ad valorem civil court fees.",
  },
  {
    id: "stamp-act-1899",
    act: "The Indian Stamp Act, 1899",
    sections: "Section 3, 4",
    tags: ["ALL"],
    whyApplicable: "Governs stamp duty payable on the plaint, vakalatnama, and affidavits filed with the court.",
    fullText:
      "Section 3 is the charging section for stamp duty on specified instruments, and Section 4 addresses instruments relating to several matters. Vakalatnamas, affidavits and certain plaints attract a separate stamp duty distinct from the court fee proper.",
  },
  {
    id: "state-court-fees-act",
    act: "State Court Fees Act",
    sections: "Section 6, 7, 12",
    tags: ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "West Bengal", "Gujarat", "Telangana"],
    whyApplicable: "The applicable State's own Court Fees Act amends the central slabs and caps used in this estimate.",
    fullText:
      "Most States have amended the Court Fees Act, 1870 through their own enactment (e.g. the Maharashtra Court Fees Act, 1959), which supersedes the central slabs with State-specific ad valorem brackets and a maximum fee cap. The slab table used in this estimate reflects the selected State's amended structure.",
  },
  {
    id: "civil-courts-rules",
    act: "State Civil Courts Rules",
    sections: "Rule 2, 3, 4, 17",
    tags: ["District Court", "City Civil Court", "Sessions Court"],
    whyApplicable: "Governs procedural charges such as process fee, service charges and certified copy fees at the subordinate court level.",
    fullText:
      "The Civil Courts Rules framed by each High Court under its rule-making power prescribe the process fee for service of summons, charges for certified copies of judgments/orders, and the scale of miscellaneous procedural charges levied by the subordinate judiciary.",
  },
  {
    id: "high-court-rules",
    act: "High Court (Original Side / Appellate Side) Rules",
    sections: "Chapter on Fees and Costs",
    tags: ["High Court", "Writ"],
    whyApplicable: "Governs filing fee, process fee and certified copy charges for matters before the High Court.",
    fullText:
      "Each High Court's Original Side and Appellate Side Rules prescribe the filing fee, process fee for service, and the scale of charges for certified copies and paper-book preparation applicable to matters instituted before that High Court.",
  },
];

export const COURT_LEVEL_FILING_BASE = {
  "District Court": 500,
  "City Civil Court": 500,
  "Sessions Court": 400,
  "High Court": 1500,
  "Supreme Court": 5000,
  "Family Court": 300,
  "Consumer Commission": 400,
  "Labour Court / Tribunal": 250,
  "NCLT / NCLAT": 2000,
  "Tax Tribunal": 1000,
};

const TRANSLATION_REQUIRED_STATES = ["Tamil Nadu", "West Bengal", "Karnataka", "Telangana"];
const RULES_LAST_UPDATED = "01 Apr 2026";
const RULES_VERSION = "LEXIFY-FEE-RULES-2026.1";
export { RULES_VERSION, RULES_LAST_UPDATED };

// The 25 auto-calculated line items. Each `amount(ctx)` is a pure function of the
// normalized input context built by costEngine.js. `bucket` maps the row into one of
// the Grand Total summary buckets; `mandatory` and `affectedByUrgency` feed the
// default risk-level rule in costEngine.js.
export const FEE_PARTICULARS = [
  {
    id: "court-fee",
    particular: "Court Fee",
    stage: "Institution",
    bucket: "courtFee",
    mandatory: true,
    affectedByUrgency: false,
    statutoryRefId: "court-fees-act-1870",
    formula: "Ad valorem slab / fixed / schedule / percentage fee resolved by the selected Valuation Method.",
    notificationRef: "State Court Fees Act (as amended)",
    amount: (ctx) => ctx.courtFeeAmount,
    notes: (ctx) =>
      ctx.input.appealOrOriginal === "Appeal" && ctx.input.previousCourtFeePaid > 0
        ? `Adjusted for ₹${ctx.input.previousCourtFeePaid.toLocaleString("en-IN")} already paid at the court below.`
        : `Computed via ${ctx.input.valuationMethod} on ₹${ctx.valuation.toLocaleString("en-IN")}.`,
  },
  {
    id: "filing-fee",
    particular: "Filing & Process Fee",
    stage: "Institution",
    bucket: "filingCharges",
    mandatory: true,
    affectedByUrgency: false,
    statutoryRefId: "civil-courts-rules",
    formula: "Base filing fee by court level + ₹100 per additional relief beyond the first.",
    notificationRef: "Civil Courts Rules, Schedule of Fees",
    amount: (ctx) => (COURT_LEVEL_FILING_BASE[ctx.input.courtLevel] || 500) + Math.max(0, ctx.n.reliefs - 1) * 100,
    notes: (ctx) => `${ctx.input.courtLevel} base fee plus ${Math.max(0, ctx.n.reliefs - 1)} additional relief(s).`,
  },
  {
    id: "process-fee",
    particular: "Process Fee",
    stage: "Notice Stage",
    bucket: "filingCharges",
    mandatory: true,
    affectedByUrgency: true,
    statutoryRefId: "civil-courts-rules",
    formula: "₹150 per defendant for service of process, ×1.25 if urgent filing.",
    notificationRef: "Civil Courts Rules, Schedule of Fees",
    amount: (ctx) => Math.round(ctx.n.defendants * 150 * ctx.urgentMultiplier),
    notes: (ctx) => `${ctx.n.defendants} defendant(s) to be served.`,
  },
  {
    id: "vakalatnama",
    particular: "Vakalatnama Charges",
    stage: "Institution",
    bucket: "governmentFees",
    mandatory: true,
    affectedByUrgency: false,
    statutoryRefId: "stamp-act-1899",
    formula: "₹60 stamp value per plaintiff-executed vakalatnama.",
    notificationRef: "Indian Stamp Act, Schedule I",
    amount: (ctx) => ctx.n.plaintiffs * 60,
    notes: (ctx) => `${ctx.n.plaintiffs} vakalatnama(s).`,
  },
  {
    id: "stamp-duty",
    particular: "Stamp Duty",
    stage: "Institution",
    bucket: "governmentFees",
    mandatory: true,
    affectedByUrgency: false,
    statutoryRefId: "stamp-act-1899",
    formula: "0.1% of valuation, floor ₹100, cap ₹25,000.",
    notificationRef: "Indian Stamp Act, Section 3",
    amount: (ctx) => Math.min(25000, Math.max(100, Math.round(ctx.valuation * 0.001))),
    notes: () => "Plaint stamp duty, distinct from the court fee proper.",
  },
  {
    id: "affidavit",
    particular: "Affidavit Charges",
    stage: "Institution",
    bucket: "governmentFees",
    mandatory: false,
    affectedByUrgency: false,
    statutoryRefId: "stamp-act-1899",
    formula: "₹100 per plaintiff, plus ₹100 if interim relief is sought.",
    notificationRef: "Indian Stamp Act, Schedule I",
    amount: (ctx) => (ctx.n.plaintiffs + (ctx.input.interimReliefRequired ? 1 : 0)) * 100,
    notes: (ctx) => (ctx.input.interimReliefRequired ? "Includes affidavit in support of interim relief." : "Verification affidavit(s) accompanying the plaint."),
  },
  {
    id: "notary",
    particular: "Notary Charges",
    stage: "Documentation",
    bucket: "miscExpenses",
    mandatory: false,
    affectedByUrgency: false,
    statutoryRefId: "stamp-act-1899",
    formula: "₹150 per set of 10 annexures notarized (rounded up).",
    notificationRef: "Notaries Act, 1952 — fee schedule",
    amount: (ctx) => Math.ceil(ctx.n.annexures / 10) * 150,
    notes: (ctx) => `${ctx.n.annexures} annexure(s) notarized.`,
  },
  {
    id: "documentation",
    particular: "Documentation Charges",
    stage: "Documentation",
    bucket: "documentation",
    mandatory: false,
    affectedByUrgency: false,
    statutoryRefId: "civil-courts-rules",
    formula: "₹25 per page for compilation and paper-book preparation.",
    notificationRef: "Civil Courts Rules, Schedule of Fees",
    amount: (ctx) => ctx.n.pages * 25,
    notes: (ctx) => `${ctx.n.pages} page(s) compiled.`,
  },
  {
    id: "photocopy",
    particular: "Photocopy Charges",
    stage: "Documentation",
    bucket: "documentation",
    mandatory: false,
    affectedByUrgency: false,
    statutoryRefId: "civil-courts-rules",
    formula: "₹1.50 per page per certified copy set required.",
    notificationRef: "Civil Courts Rules, Schedule of Fees",
    amount: (ctx) => Math.round(ctx.n.pages * ctx.n.certifiedCopies * 1.5),
    notes: (ctx) => `${ctx.n.certifiedCopies} copy set(s) of ${ctx.n.pages} page(s).`,
  },
  {
    id: "printing",
    particular: "Printing Charges",
    stage: "Documentation",
    bucket: "documentation",
    mandatory: false,
    affectedByUrgency: false,
    statutoryRefId: "civil-courts-rules",
    formula: "₹1 per page, plus 3 pages per annexure.",
    notificationRef: "Civil Courts Rules, Schedule of Fees",
    amount: (ctx) => Math.round(ctx.n.pages + ctx.n.annexures * 3),
    notes: () => "Estimated at 3 printed pages per annexure.",
  },
  {
    id: "certified-copy",
    particular: "Certified Copy Charges",
    stage: "Judgment",
    bucket: "documentation",
    mandatory: false,
    affectedByUrgency: false,
    statutoryRefId: "civil-courts-rules",
    formula: "₹150 per certified copy, plus ₹2 per page copied.",
    notificationRef: "Civil Courts Rules, Schedule of Fees",
    amount: (ctx) => ctx.n.certifiedCopies * 150 + ctx.n.certifiedCopies * ctx.n.pages * 2,
    notes: (ctx) => `${ctx.n.certifiedCopies} certified copy(ies) requested.`,
  },
  {
    id: "courier",
    particular: "Courier Charges",
    stage: "Notice Stage",
    bucket: "courtProcessExpenses",
    mandatory: false,
    affectedByUrgency: false,
    statutoryRefId: "civil-courts-rules",
    formula: "₹120 per defendant for courier service of process.",
    notificationRef: "Civil Courts Rules, Schedule of Fees",
    amount: (ctx) => ctx.n.defendants * 120,
    notes: (ctx) => `Courier service to ${ctx.n.defendants} defendant(s).`,
  },
  {
    id: "process-server",
    particular: "Process Server Charges",
    stage: "Notice Stage",
    bucket: "courtProcessExpenses",
    mandatory: false,
    affectedByUrgency: true,
    statutoryRefId: "civil-courts-rules",
    formula: "₹200 per defendant, ×1.25 if urgent filing.",
    notificationRef: "Civil Courts Rules, Schedule of Fees",
    amount: (ctx) => Math.round(ctx.n.defendants * 200 * ctx.urgentMultiplier),
    notes: () => "Bailiff/process server field visit charges.",
  },
  {
    id: "summons",
    particular: "Summons Charges",
    stage: "Notice Stage",
    bucket: "courtProcessExpenses",
    mandatory: true,
    affectedByUrgency: false,
    statutoryRefId: "civil-courts-rules",
    formula: "₹80 per summons issued to defendants and witnesses.",
    notificationRef: "Civil Courts Rules, Schedule of Fees",
    amount: (ctx) => (ctx.n.defendants + ctx.n.witnesses) * 80,
    notes: (ctx) => `${ctx.n.defendants + ctx.n.witnesses} summons issued.`,
  },
  {
    id: "postal",
    particular: "Postal Charges",
    stage: "Notice Stage",
    bucket: "courtProcessExpenses",
    mandatory: false,
    affectedByUrgency: false,
    statutoryRefId: "civil-courts-rules",
    formula: "₹40 per defendant and witness for registered post/RPAD.",
    notificationRef: "Civil Courts Rules, Schedule of Fees",
    amount: (ctx) => (ctx.n.defendants + ctx.n.witnesses) * 40,
    notes: () => "Registered post / RPAD acknowledgment charges.",
  },
  {
    id: "misc-court-charges",
    particular: "Miscellaneous Court Charges",
    stage: "Institution",
    bucket: "miscExpenses",
    mandatory: false,
    affectedByUrgency: false,
    statutoryRefId: "civil-courts-rules",
    formula: "Flat ₹500 base plus ₹50 per relief claimed.",
    notificationRef: "Civil Courts Rules, Schedule of Fees",
    amount: (ctx) => 500 + ctx.n.reliefs * 50,
    notes: () => "Diary, index and miscellaneous registry charges.",
  },
  {
    id: "advocate-clerk",
    particular: "Advocate Clerk Expenses",
    stage: "Institution",
    bucket: "administrativeCharges",
    mandatory: false,
    affectedByUrgency: false,
    statutoryRefId: "civil-courts-rules",
    formula: "₹300 base plus ₹150 per interlocutory application.",
    notificationRef: "Firm-standard clerkage schedule",
    amount: (ctx) => 300 + ctx.n.applications * 150,
    notes: (ctx) => `${ctx.n.applications} application(s) to be filed.`,
  },
  {
    id: "local-commissioner",
    particular: "Local Commissioner Expenses",
    stage: "Evidence",
    bucket: "incidentalExpenses",
    mandatory: false,
    affectedByUrgency: false,
    statutoryRefId: "cpc-1908",
    formula: "₹5,000 flat, only if interim relief / local investigation is required.",
    notificationRef: "CPC, Order XXVI",
    amount: (ctx) => (ctx.input.interimReliefRequired ? 5000 : 0),
    notes: (ctx) => (ctx.input.interimReliefRequired ? "Local Commissioner appointment anticipated for interim relief." : "Not applicable — no interim relief requested."),
  },
  {
    id: "inspection",
    particular: "Inspection Charges",
    stage: "Evidence",
    bucket: "incidentalExpenses",
    mandatory: false,
    affectedByUrgency: false,
    statutoryRefId: "cpc-1908",
    formula: "₹1,500 flat for Civil/Commercial matters involving site or document inspection.",
    notificationRef: "CPC, Order XI",
    amount: (ctx) => (["Civil", "Commercial"].includes(ctx.input.caseCategory) ? 1500 : 0),
    notes: (ctx) => (["Civil", "Commercial"].includes(ctx.input.caseCategory) ? "Site/document inspection anticipated." : "Not applicable for this case category."),
  },
  {
    id: "witness-expenses",
    particular: "Witness Expenses",
    stage: "Cross Examination",
    bucket: "incidentalExpenses",
    mandatory: false,
    affectedByUrgency: false,
    statutoryRefId: "cpc-1908",
    formula: "₹400 per witness for travel and daily allowance.",
    notificationRef: "CPC, Order XVI",
    amount: (ctx) => ctx.n.witnesses * 400,
    notes: (ctx) => `${ctx.n.witnesses} witness(es) to be examined.`,
  },
  {
    id: "translation",
    particular: "Translation Charges",
    stage: "Documentation",
    bucket: "miscExpenses",
    mandatory: false,
    affectedByUrgency: false,
    statutoryRefId: "state-court-fees-act",
    formula: "₹5 per page, only where the State's court language requires translation.",
    notificationRef: "State Court Language Rules",
    amount: (ctx) => (TRANSLATION_REQUIRED_STATES.includes(ctx.input.state) ? ctx.n.pages * 5 : 0),
    notes: (ctx) => (TRANSLATION_REQUIRED_STATES.includes(ctx.input.state) ? `Regional-language translation of ${ctx.n.pages} page(s).` : "Not applicable for this State."),
  },
  {
    id: "typing",
    particular: "Typing Charges",
    stage: "Documentation",
    bucket: "administrativeCharges",
    mandatory: false,
    affectedByUrgency: false,
    statutoryRefId: "civil-courts-rules",
    formula: "₹4 per page for typing/stenography.",
    notificationRef: "Firm-standard typing schedule",
    amount: (ctx) => ctx.n.pages * 4,
    notes: () => "Fair-typing of pleadings and annexures.",
  },
  {
    id: "digital-filing",
    particular: "Digital Filing Charges",
    stage: "Institution",
    bucket: "administrativeCharges",
    mandatory: false,
    affectedByUrgency: false,
    statutoryRefId: "high-court-rules",
    formula: "Flat ₹250 e-filing portal charge.",
    notificationRef: "e-Committee, Supreme Court of India — e-filing rules",
    amount: () => 250,
    notes: () => "e-Filing portal handling charge.",
  },
  {
    id: "e-filing",
    particular: "E-filing Charges",
    stage: "Institution",
    bucket: "administrativeCharges",
    mandatory: false,
    affectedByUrgency: false,
    statutoryRefId: "high-court-rules",
    formula: "₹200 base plus ₹100 per application e-filed.",
    notificationRef: "e-Committee, Supreme Court of India — e-filing rules",
    amount: (ctx) => 200 + ctx.n.applications * 100,
    notes: (ctx) => `${ctx.n.applications} application(s) e-filed alongside the plaint.`,
  },
  {
    id: "scanning",
    particular: "Scanning Charges",
    stage: "Documentation",
    bucket: "documentation",
    mandatory: false,
    affectedByUrgency: false,
    statutoryRefId: "high-court-rules",
    formula: "₹1 per page for scanning into the e-filing system.",
    notificationRef: "e-Committee, Supreme Court of India — e-filing rules",
    amount: (ctx) => ctx.n.pages * 1,
    notes: (ctx) => `${ctx.n.pages} page(s) scanned.`,
  },
];
