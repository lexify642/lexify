// Frontend-only mock configuration for the Partnership Deed Engineering Engine.
// Selections live in component state today; once Supabase is wired up this
// becomes the seed for a `deed_clause_options` / `deed_presets` table pair.

export const CLAUSES = [
  {
    id: "identity",
    number: 1,
    jumpLabel: "Identity & Style",
    title: "Firm Identity & Style",
    description: "Establishes the commercial operating name and registration particulars of the partnership.",
    heading: "1. BUSINESS FRAMEWORK, STYLE, AND REGISTRATION PLACE",
    options: [
      { id: "standard", label: "Standard Registered Trade Name" },
      { id: "dba", label: "Doing-Business-As (DBA) Trade Style" },
      { id: "multi", label: "Multi-Brand Operating Style" },
    ],
    buildText: (optionLabel) =>
      `1.1 Firm Name and Style: The commercial entity shall operate under the specific firm style identifier of [Proposed Firm Name], structured as a ${optionLabel}. Any adjustment to this institutional operating branding requires unanimous written consent of all Partners and shall be reflected in the Firm's registration particulars.`,
  },
  {
    id: "capital",
    number: 2,
    jumpLabel: "Capital Influx",
    title: "Initial Capital Contribution",
    description: "Defines the opening capital contribution structure between partners.",
    heading: "2. INITIAL CAPITAL CONTRIBUTION",
    options: [
      { id: "equal", label: "Equal Capital Contribution Split" },
      { id: "weighted", label: "Capital-Weighted Contribution (Asymmetric)" },
      { id: "staggered", label: "Staggered Capital Infusion Schedule" },
    ],
    extraField: { name: "capitalPool", label: "Total Capital Pool (₹)", default: "10,00,000" },
    buildText: (optionLabel, extraValue) =>
      `2.1 Capital Contribution: Each Partner shall contribute capital to the Firm in accordance with the ${optionLabel}, aggregating to a Total Capital Pool of ₹${extraValue}, to be deposited into the Firm's designated current account prior to commencement of operations.`,
  },
  {
    id: "interest",
    number: 3,
    jumpLabel: "Capital Interest",
    title: "Interest on Capital",
    description: "Sets the statutory interest rate applied to partner capital accounts.",
    heading: "3. INTEREST ON PARTNERS' CAPITAL",
    options: [
      { id: "statutory", label: "12% Max Statutory Interest (Section 40(b) Safe Harbor)" },
      { id: "zero", label: "Zero Capital Interest Loop" },
      { id: "custom", label: "Custom Fixed Rate" },
    ],
    buildText: (optionLabel) =>
      `3.1 Interest on Capital: Interest on the capital standing to the credit of each Partner's account shall be calculated and credited in accordance with the ${optionLabel}, subject at all times to the ceiling prescribed under Section 40(b) of the Income-tax Act, 1961.`,
  },
  {
    id: "plsharing",
    number: 4,
    jumpLabel: "P&L Sharing",
    title: "Profit & Loss Allocation",
    description: "Map operational financial disbursement parameters.",
    heading: "4. SHARING OF PROFITS AND LOSSES",
    options: [
      { id: "equal", label: "Equal Pro-Rata Split Matrix (50:50 Symmetry)" },
      { id: "weighted", label: "Capital-Weighted Ratio (Asymmetric)" },
      { id: "custom", label: "Custom Fixed Ratio" },
    ],
    buildText: (optionLabel) =>
      `4.1 Profit and Loss Sharing: The Partners shall share in the net profits and bear the net losses of the Firm in accordance with the ${optionLabel}, calculated and finalized at the close of each financial year and duly recorded in the Firm's annual accounts.`,
  },
  {
    id: "remuneration",
    number: 5,
    jumpLabel: "Remuneration",
    title: "Working Partner Remuneration",
    description: "Configure active executive salary rules tracking Section 40(b) limits.",
    heading: "5. REMUNERATION OF WORKING PARTNERS",
    options: [
      { id: "statutory", label: "Income-Tax Act Maximum Tiered Scale Alignment" },
      { id: "fixed", label: "Fixed Monthly Honorarium" },
      { id: "none", label: "No Remuneration (Sleeping Partners Only)" },
    ],
    buildText: (optionLabel) =>
      `5.1 Remuneration: Working Partners actively engaged in the conduct of the Firm's business shall be entitled to remuneration determined under the ${optionLabel}, and such remuneration shall be treated as an allowable deduction to the extent permitted by law.`,
  },
  {
    id: "deadlock",
    number: 6,
    jumpLabel: "Decision/Deadlocks",
    title: "Executive Voice & Deadlock System",
    description: "Establishes control hierarchies and administrative tie-breaking models.",
    heading: "6. DECISION-MAKING AND DEADLOCK RESOLUTION",
    options: [
      { id: "consensus", label: "Total Consensus - Unanimous Assent Safeguard" },
      { id: "weighted", label: "Holding-Weighted Voice Blocks" },
      { id: "majority", label: "Majority Vote (51%)" },
    ],
    buildText: (optionLabel) =>
      `6.1 Decision Making: All major operational and strategic decisions of the Firm shall be governed by a ${optionLabel} framework, and no Partner shall act unilaterally in matters falling outside the ordinary course of business without the requisite level of Partner assent as prescribed herein.`,
  },
  {
    id: "drawings",
    number: 7,
    jumpLabel: "Drawings/Leaks",
    title: "Financial Drawing Restraints",
    description: "Limits capital leakage by locking monthly transactional cash-outs.",
    heading: "7. DRAWINGS AGAINST PROFITS",
    options: [
      { id: "strict", label: "Strict Monthly Ceiling Caps (Hard Vault Lock)" },
      { id: "flexible", label: "Flexible Drawings Against Profit Share" },
      { id: "none", label: "No Cap (Trust-Based)" },
    ],
    extraField: { name: "drawingLimit", label: "Maximum Monthly Drawing Limit (₹)", default: "30000" },
    buildText: (optionLabel, extraValue) =>
      `7.1 Drawings: Partners may draw against their anticipated share of profits strictly subject to the ${optionLabel}, with drawings not to exceed ₹${extraValue} per Partner per month unless otherwise sanctioned in writing by the remaining Partners.`,
  },
  {
    id: "separation",
    number: 8,
    jumpLabel: "Separation/Exit",
    title: "Voluntary Retirement Separation Trace",
    description: "Sets advance warning parameters for operational partner exits.",
    heading: "8. VOLUNTARY RETIREMENT OF A PARTNER",
    options: [
      { id: "long", label: "Long Notice Strategic Window (6 Months Buffer)" },
      { id: "standard", label: "Standard Notice (90 Days)" },
      { id: "immediate", label: "Immediate Exit With Settlement" },
    ],
    buildText: (optionLabel) =>
      `8.1 Voluntary Retirement: A Partner intending to voluntarily retire from the Firm shall be governed by the ${optionLabel}, and shall tender notice in writing to the remaining Partners specifying the intended date of retirement.`,
  },
  {
    id: "continuity",
    number: 9,
    jumpLabel: "Continuity/Death",
    title: "Death & Continuity Protection",
    description: "Governs status of firm if a partner faces liquidation or demise.",
    heading: "9. DEATH, INSOLVENCY OR RETIREMENT OF A PARTNER",
    options: [
      { id: "safeguard", label: "Structural Anti-Dissolution Safe Guard (Firm Continues)" },
      { id: "dissolve", label: "Automatic Dissolution" },
      { id: "succession", label: "Legal Heir Succession Option" },
    ],
    buildText: (optionLabel) =>
      `9.1 Continuity: In the event of the death, insolvency or permanent incapacity of a Partner, the status and continuity of the Firm shall be governed by the ${optionLabel}, and the legal heirs or representatives of the outgoing Partner shall be entitled only to the settlement of accounts as provided herein.`,
  },
  {
    id: "arbitration",
    number: 10,
    jumpLabel: "Arbitration",
    title: "Conflict Forum Allocation",
    description: "Defines structural legal channels for resolving inter-partner claims.",
    heading: "10. GOVERNING LAW AND DISPUTE RESOLUTION",
    options: [
      { id: "arbitration", label: "Fast-Track Arbitration under Indian Arbitration Act" },
      { id: "civil", label: "Civil Court Jurisdiction" },
      { id: "mediation", label: "Mediation First, Then Arbitration" },
    ],
    extraField: { name: "venue", label: "Arbitration Venue / City Venue Seat", default: "Mumbai, Maharashtra" },
    buildText: (optionLabel, extraValue) =>
      `10.1 Dispute Resolution: Any dispute, difference or claim arising out of or in connection with this Deed, including as to its existence, validity or termination, shall be resolved under the ${optionLabel}, with the seat and venue of proceedings at ${extraValue}.`,
  },
];

export const DEFAULT_SELECTIONS = {
  identity: "standard",
  capital: "equal",
  interest: "statutory",
  plsharing: "equal",
  remuneration: "statutory",
  deadlock: "consensus",
  drawings: "strict",
  separation: "long",
  continuity: "safeguard",
  arbitration: "arbitration",
};

export const DEFAULT_EXTRA_VALUES = {
  capitalPool: "10,00,000",
  drawingLimit: "30000",
  venue: "Mumbai, Maharashtra",
};

export const PLAYBOOK = [
  {
    clauseId: "capital",
    impact: "Establishes structured matching initialization cash layouts for identical stakeholder status.",
    guidance: "Track and log capital deposits to formal firm ledgers within 7 bank clearance working days.",
  },
  {
    clauseId: "interest",
    impact: "Provides maximum legal safe-harbor tax deductions under Section 40(b) of the Income Tax Act.",
    guidance: "Keep interest tracks fixed at simple interest calculations to comply with tax auditor scrutiny templates.",
  },
  {
    clauseId: "plsharing",
    impact: "Symmetric operational alignment sharing trading performance gains and down-side risks equally.",
    guidance: "Best suited for partnerships where executive workloads match financial contributions evenly.",
  },
  {
    clauseId: "remuneration",
    impact: "Dynamic statutory formula optimizing allowable corporate income tax deductions.",
    guidance: "Requires standard quarterly financial verification to adjust tracking benchmarks.",
  },
  {
    clauseId: "deadlock",
    impact: "Protects minority stakeholders absolutely by requiring unanimous agreement across all major choices.",
    guidance: "Include an explicit fast-track mediation window to handle operational decision standstills.",
  },
  {
    clauseId: "drawings",
    impact: "Prevents unauthorized partner cash-outs and maintains working capital reserves.",
    guidance: "Review drawing limits during inflationary periods to ensure alignment with standard cost-of-living index shifts.",
  },
  {
    clauseId: "separation",
    impact: "Provides a long transition buffer to protect client accounts and stabilize operational cash positions.",
    guidance: "Use this period to conduct comprehensive client transitions and close out active operational cycles smoothly.",
  },
  {
    clauseId: "continuity",
    impact: "Ironclad continuity protection ensuring the firm survives even if an individual partner passes away or faces liquidation.",
    guidance: "Provides a smooth transition pathway to onboard legal heirs as non-voting financial beneficiaries.",
  },
  {
    clauseId: "arbitration",
    impact: "Bypasses slow public court litigation via expedited private arbitration paths.",
    guidance: "Specify the single arbitrator appointment mechanism clearly to prevent venue selection gridlocks.",
  },
];

export const PRESETS = [
  {
    pathId: "DEED-MAT-01",
    posture: "Symmetric Consensual Trust",
    interestPath: "12% Max Statutory Interest",
    votingLock: "Strict Unanimous Consent Panel",
    friction: "Low Initial Drift / High Deadlock Risk (120/400)",
    guidelines: "Ideal for early-stage equal funding plays. Prevents unilateral overreach by locking out single-partner vetos.",
    selections: { interest: "statutory", plsharing: "equal", deadlock: "consensus", capital: "equal" },
  },
  {
    pathId: "DEED-MAT-02",
    posture: "Asymmetric Capital Play",
    interestPath: "Zero Capital Interest Loop",
    votingLock: "Holding-Weighted Voice Blocks",
    friction: "Balanced Asset Allocation (240/400)",
    guidelines: "Optimized for structures where one major strategic partner brings the majority of initialization capital.",
    selections: { interest: "zero", plsharing: "weighted", deadlock: "weighted", capital: "weighted" },
  },
];

export const RECITALS_HTML = `<h3>PARTNERSHIP DEED</h3>
<p>This Partnership Deed (the "Deed") is executed and brought into operational effect on this [Execution Date], by and between the following executing entities:</p>
<p>1. [Partner 1 Name], residing at the address detailed in tax filing registries, hereinafter referred to as the "First Partner" (which expression shall unless repugnant to the context include heirs, legal representatives, and executors); and</p>
<p>2. [Partner 2 Name], residing at the address detailed in tax filing registries, hereinafter referred to as the "Second Partner" (which expression shall unless repugnant to the context include heirs, legal representatives, and executors).</p>
<h4>RECITALS</h4>
<p>WHEREAS: The strategic parties mentioned above intend to combine their commercial assets, expert skill arrays, and operational capacities to jointly operate a general partnership firm under the provisions of the Indian Partnership Act, 1932;</p>
<p>NOW, THEREFORE, this transactional alignment verifies the following architectural structural clauses:</p>`;

export const CLOSING_HTML = `<h4>EXECUTION</h4>
<p>IN WITNESS WHEREOF, the Partners have set their respective hands to this Deed on the date first written above, in the presence of the witnesses named below.</p>`;
