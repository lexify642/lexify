// All case-list querying goes through here — one place that builds the
// Supabase (PostgREST) query, so every endpoint (search, court/judge/year/act
// presets, recent) stays consistent.
//
// Note on "relevance" sort: the underlying `searchVector` full-text column
// (and its GIN index + trigger) still exist in Postgres exactly as before —
// only the query layer changed. Supabase's JS client can filter by full-text
// search (`.textSearch`) but can't order by a computed ts_rank() the way raw
// SQL could, so "relevance" sort currently falls back to the same
// newest-first ordering as "latest". True rank ordering would need a small
// Postgres RPC function — ask if you want that added later.
const { supabase } = require("../supabase");

const LIST_COLUMNS =
  "id, caseTitle, partyPetitioner, partyRespondent, courtName, benchName, " +
  "presidingJudge, decisionDate, citationYear, decisionYear, neutralCitation, " +
  "lawReportCitation, docketNumber, cnrNumber, dispositionText, datasetSource";

// PostgREST's `.or()` filter string treats `,`, `.`, `(`, `)` as syntax —
// wrapping a value in double quotes (and escaping any quotes/backslashes
// inside it) is the documented way to pass arbitrary user input safely.
function quoteFilterValue(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function applyFilters(query, { q, court, judge, year, act, section, citation }) {
  let next = query;
  if (q) next = next.textSearch("searchVector", q, { type: "plain", config: "english" });
  if (court) next = next.ilike("courtName", `%${court}%`);
  if (judge) {
    next = next.or(
      `presidingJudge.ilike.${quoteFilterValue("%" + judge + "%")},` +
        `coramMembersText.ilike.${quoteFilterValue("%" + judge + "%")}`
    );
  }
  if (year) next = next.eq("decisionYear", year);
  if (act) {
    next = next.or(
      `referencedActs.cs.{${quoteFilterValue(act)}},` + `indexableText.ilike.${quoteFilterValue("%" + act + "%")}`
    );
  }
  if (section) {
    next = next.or(
      `referencedSections.cs.{${quoteFilterValue(section)}},` +
        `indexableText.ilike.${quoteFilterValue("%" + section + "%")}`
    );
  }
  if (citation) {
    next = next.or(
      `neutralCitation.ilike.${quoteFilterValue("%" + citation + "%")},` +
        `lawReportCitation.ilike.${quoteFilterValue("%" + citation + "%")},` +
        `cnrNumber.ilike.${quoteFilterValue("%" + citation + "%")},` +
        `docketNumber.ilike.${quoteFilterValue("%" + citation + "%")}`
    );
  }
  return next;
}

async function searchCases(params) {
  const { page, pageSize } = params;
  const offset = (page - 1) * pageSize;

  let query = supabase.from("legal_cases").select(LIST_COLUMNS, { count: "exact" });
  query = applyFilters(query, params);
  query = query
    .order("decisionDate", { ascending: false, nullsFirst: false })
    .order("createdAt", { ascending: false })
    .range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  const total = count ?? 0;
  return { rows: data ?? [], total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

async function getRecentCases({ page, pageSize }) {
  return searchCases({ sort: "latest", page, pageSize });
}

async function getCaseById(id) {
  const { data: legalCase, error } = await supabase
    .from("legal_cases")
    .select(
      "*, aiAnalysis:legal_case_ai_analysis(*), " +
        "citationsFrom:legal_case_citations!fromCaseId(*, toCase:legal_cases!toCaseId(id,caseTitle,courtName)), " +
        "citationsTo:legal_case_citations!toCaseId(*, fromCase:legal_cases!fromCaseId(id,caseTitle,courtName))"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!legalCase) return null;

  const orClauses = [
    legalCase.partyPetitioner && `partyPetitioner.eq.${quoteFilterValue(legalCase.partyPetitioner)}`,
    legalCase.partyRespondent && `partyRespondent.eq.${quoteFilterValue(legalCase.partyRespondent)}`,
    legalCase.docketNumber && `docketNumber.eq.${quoteFilterValue(legalCase.docketNumber)}`,
  ].filter(Boolean);

  let relatedCases = [];
  if (orClauses.length) {
    const { data, error: relatedError } = await supabase
      .from("legal_cases")
      .select("id, caseTitle, courtName, decisionDate, dispositionText")
      .neq("id", legalCase.id)
      .or(orClauses.join(","))
      .limit(5);
    if (relatedError) throw relatedError;
    relatedCases = data ?? [];
  }

  return { ...legalCase, relatedCases };
}

module.exports = { searchCases, getRecentCases, getCaseById };
