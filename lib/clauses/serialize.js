import "server-only";

export function serializeClause(row) {
  return {
    id: row.id,
    category: row.category,
    type: row.type,
    name: row.name,
    position: row.position,
    domain: row.domain,
    text: row.text,
    version: row.version,
    risk: row.risk,
    favorability: row.favorability,
    negotiation: row.negotiation,
    frequency: row.frequency,
    caseLaw: row.case_law,
    status: row.status,
    isPublished: row.is_published,
  };
}
