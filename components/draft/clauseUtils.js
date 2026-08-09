// Pure helpers over the real data/clauses.json library (254 clauses) — no
// state here. Several fields in the source data have stray trailing
// whitespace ("LOW ", "APPROVED ") and frequent nulls (domain, caseLaw,
// name), so every helper below normalizes defensively rather than assuming
// clean input.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function trim(value) {
  return typeof value === "string" ? value.trim() : value;
}

export function displayValue(value, fallback = "—") {
  const t = trim(value);
  return t ? t : fallback;
}

// Builds a filter dropdown's options from what's actually in the data set,
// never a hardcoded enum — so a filter with thin real data (e.g. Domain,
// which has exactly one populated value today) honestly shows just that,
// rather than pretending options exist that no clause actually has.
export function distinctValues(clauses, field) {
  return [...new Set(clauses.map((c) => trim(c[field])).filter(Boolean))].sort();
}

export function riskTone(risk) {
  const r = trim(risk);
  if (r === "HIGH") return "red";
  if (r === "MEDIUM") return "orange";
  if (r === "LOW") return "green";
  return "grey";
}

export function statusTone(status) {
  const s = trim(status);
  if (s === "APPROVED") return "green";
  if (s === "DRAFT" || s === "PENDING") return "orange";
  if (s === "DEPRECATED" || s === "REJECTED") return "red";
  return "grey";
}

const CLAUSE_SEARCH_FIELDS = ["id", "name", "type", "category", "domain", "text"];

export function searchClauses(clauses, { filters = {}, query = "" } = {}) {
  const term = query.trim().toLowerCase();
  return clauses.filter((c) => {
    for (const [field, value] of Object.entries(filters)) {
      if (!value) continue;
      if (trim(c[field]) !== value) return false;
    }
    if (term) {
      const haystack = CLAUSE_SEARCH_FIELDS.map((f) => c[f] || "")
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

// caseLaw is null on every seed clause today — this only ever produces a
// link once a real value is entered. UUID-shaped values point straight at
// the Case Research detail route (Supabase row id); anything else is
// treated as a citation string and routed through Case Research's existing
// `?citation=` search filter rather than guessing at a record that may not
// exist.
export function caseLawHref(value) {
  const v = trim(value);
  if (!v) return null;
  if (UUID_PATTERN.test(v)) return `/case-research/${v}`;
  return `/case-research?citation=${encodeURIComponent(v)}`;
}

export const DRAFT_POSITIONS = [
  "Introduction",
  "Definitions",
  "Scope",
  "Obligations",
  "Representations & Warranties",
  "Confidentiality",
  "Indemnity",
  "Limitation of Liability",
  "Termination",
  "Dispute Resolution",
  "Miscellaneous",
];
