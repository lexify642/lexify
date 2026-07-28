// All case-list querying goes through here — one place that builds the SQL,
// so every endpoint (search, court/judge/year/act presets, recent) stays
// consistent and the raw-SQL surface (the only place user input reaches SQL
// text) is small and reviewable.
//
// SQL-injection note: every user-supplied value below is passed as a
// parameter through Prisma's `Prisma.sql`/`Prisma.join` tagged templates —
// never string-concatenated into the query — so this is safe against
// injection regardless of what a caller passes as q/court/judge/etc.
const { Prisma } = require("@prisma/client");
const { prisma } = require("../db");

const LIST_COLUMNS = Prisma.sql`
  "id", "caseTitle", "partyPetitioner", "partyRespondent", "courtName", "benchName",
  "presidingJudge", "decisionDate", "citationYear", "decisionYear", "neutralCitation",
  "lawReportCitation", "docketNumber", "cnrNumber", "dispositionText", "datasetSource"
`;

function buildConditions({ q, court, judge, year, act, section, citation }) {
  const conditions = [Prisma.sql`1=1`];
  if (q) conditions.push(Prisma.sql`"searchVector" @@ plainto_tsquery('english', ${q})`);
  if (court) conditions.push(Prisma.sql`"courtName" ILIKE ${"%" + court + "%"}`);
  if (judge) {
    conditions.push(
      Prisma.sql`("presidingJudge" ILIKE ${"%" + judge + "%"} OR "coramMembersText" ILIKE ${"%" + judge + "%"})`
    );
  }
  if (year) conditions.push(Prisma.sql`"decisionYear" = ${year}`);
  if (act) {
    conditions.push(Prisma.sql`(${act} = ANY("referencedActs") OR "indexableText" ILIKE ${"%" + act + "%"})`);
  }
  if (section) {
    conditions.push(
      Prisma.sql`(${section} = ANY("referencedSections") OR "indexableText" ILIKE ${"%" + section + "%"})`
    );
  }
  if (citation) {
    conditions.push(Prisma.sql`(
      "neutralCitation" ILIKE ${"%" + citation + "%"} OR
      "lawReportCitation" ILIKE ${"%" + citation + "%"} OR
      "cnrNumber" ILIKE ${"%" + citation + "%"} OR
      "docketNumber" ILIKE ${"%" + citation + "%"}
    )`);
  }
  return Prisma.join(conditions, " AND ");
}

async function searchCases(params) {
  const { q, sort, page, pageSize } = params;
  const whereSql = buildConditions(params);
  const useRelevance = sort === "relevance" && !!q;
  const orderSql = useRelevance
    ? Prisma.sql`ts_rank("searchVector", plainto_tsquery('english', ${q})) DESC, "decisionDate" DESC NULLS LAST`
    : Prisma.sql`"decisionDate" DESC NULLS LAST, "createdAt" DESC`;
  const offset = (page - 1) * pageSize;

  const [rows, totalResult] = await Promise.all([
    prisma.$queryRaw`
      SELECT ${LIST_COLUMNS} FROM "legal_cases"
      WHERE ${whereSql}
      ORDER BY ${orderSql}
      LIMIT ${pageSize} OFFSET ${offset}
    `,
    prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "legal_cases" WHERE ${whereSql}`,
  ]);

  const total = totalResult[0]?.count ?? 0;
  return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

async function getRecentCases({ page, pageSize }) {
  return searchCases({ sort: "latest", page, pageSize });
}

async function getCaseById(id) {
  const legalCase = await prisma.legalCase.findUnique({
    where: { id },
    include: {
      aiAnalysis: true,
      citationsFrom: { include: { toCase: { select: { id: true, caseTitle: true, courtName: true } } } },
      citationsTo: { include: { fromCase: { select: { id: true, caseTitle: true, courtName: true } } } },
    },
  });
  if (!legalCase) return null;

  const relatedCases = await prisma.legalCase.findMany({
    where: {
      id: { not: legalCase.id },
      OR: [
        legalCase.partyPetitioner ? { partyPetitioner: legalCase.partyPetitioner } : undefined,
        legalCase.partyRespondent ? { partyRespondent: legalCase.partyRespondent } : undefined,
        legalCase.docketNumber ? { docketNumber: legalCase.docketNumber } : undefined,
      ].filter(Boolean),
    },
    take: 5,
    select: { id: true, caseTitle: true, courtName: true, decisionDate: true, dispositionText: true },
  });

  return { ...legalCase, relatedCases };
}

module.exports = { searchCases, getRecentCases, getCaseById };
