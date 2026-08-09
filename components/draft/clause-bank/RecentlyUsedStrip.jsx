"use client";

import clauseData from "@/data/clauses.json";
import { useClauseWorkspace } from "../ClauseWorkspaceContext";

const clauseById = new Map(clauseData.map((c) => [c.id, c]));

export default function RecentlyUsedStrip({ onView }) {
  const { recentlyUsed } = useClauseWorkspace();
  if (recentlyUsed.length === 0) return null;

  const items = [];
  const seen = new Set();
  for (const entry of recentlyUsed) {
    if (seen.has(entry.clauseId)) continue;
    seen.add(entry.clauseId);
    const clause = clauseById.get(entry.clauseId);
    if (clause) items.push({ clause, action: entry.action });
    if (items.length >= 6) break;
  }
  if (items.length === 0) return null;

  return (
    <div className="recently-used-strip">
      <span className="recently-used-label">Recently used:</span>
      {items.map(({ clause, action }) => (
        <button type="button" key={clause.id} className="chip-link" onClick={() => onView(clause)}>
          {clause.name || clause.type} <small>({action})</small>
        </button>
      ))}
    </div>
  );
}
