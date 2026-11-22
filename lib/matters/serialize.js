import "server-only";
import { displayDate } from "@/components/cases/utils";

// Reassembles matters + matter_notes + matter_previous_dates + clients rows
// back into the exact nested shape data/cases.js has always produced
// ({no, number, ..., previousDates: [...], notes: [...], client: {...},
// caseDetails: {...}}) — this is what lets CasesContext.jsx swap its
// implementation without any consuming component (CaseDiary, CaseModal,
// EditCaseModal, the dashboard, clientDirectory.js, etc.) changing at all.

function safeDisplayDate(dateOnlyStr) {
  if (!dateOnlyStr) return "";
  try {
    return displayDate(dateOnlyStr);
  } catch {
    return String(dateOnlyStr);
  }
}

function formatTimestamp(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function serializeMatter(row, { notes = [], previousDates = [], client = null } = {}) {
  return {
    no: row.display_no,
    number: row.number || "",
    court: row.court || "",
    city: row.city || "",
    room: row.room || "",
    judge: row.judge || "",
    parties: row.parties,
    date: row.hearing_date,
    time: row.hearing_time || "",
    stage: row.stage || "",
    tone: row.tone || "blue",
    activity: row.activity_summary || "",
    registered: row.registered_on || "",
    filing: row.filing_type || "",
    caseDetails: row.case_details || {},
    docs: row.docs || [],
    client: client ? { name: client.name, phone: client.phone || "", address: client.address || "" } : null,
    notes: notes
      .slice()
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .map((n) => ({
        id: n.id,
        date: safeDisplayDate(n.created_at ? n.created_at.slice(0, 10) : null),
        text: n.text,
        isReminder: n.is_reminder,
        dueDate: n.due_date,
        completed: n.completed,
      })),
    previousDates: previousDates
      .slice()
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .map((p) => ({
        id: p.id,
        date: p.date || "",
        court: p.court || "",
        stage: p.stage || "",
        purpose: p.purpose || "",
        outcome: p.outcome || "",
        advocate: p.advocate || "",
        updatedAt: formatTimestamp(p.created_at),
        fullNotes: p.full_notes || "",
      })),
  };
}

// Groups flat notes/previousDates arrays (fetched separately, one query
// each, rather than N+1-ing per matter) by matter_id for serializeMatter().
export function groupByMatterId(rows) {
  const map = new Map();
  for (const row of rows) {
    const list = map.get(row.matter_id) ?? [];
    list.push(row);
    map.set(row.matter_id, list);
  }
  return map;
}

const MATTER_COLUMN_MAP = {
  number: "number",
  court: "court",
  city: "city",
  room: "room",
  judge: "judge",
  parties: "parties",
  date: "hearing_date",
  time: "hearing_time",
  stage: "stage",
  tone: "tone",
  activity: "activity_summary",
  registered: "registered_on",
  filing: "filing_type",
};

// Maps the client-facing case shape's top-level scalar fields to their DB
// column names for an insert/update payload. caseDetails/docs/client/
// notes/previousDates are handled separately by the route (client needs a
// find-or-create against public.clients; notes/previousDates are child
// tables, not columns).
export function matterScalarColumns(data) {
  const out = {};
  for (const [jsKey, column] of Object.entries(MATTER_COLUMN_MAP)) {
    if (data[jsKey] !== undefined) out[column] = data[jsKey] || null;
  }
  if (data.caseDetails !== undefined) out.case_details = data.caseDetails ?? {};
  if (data.docs !== undefined) out.docs = data.docs ?? [];
  return out;
}
