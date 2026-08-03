import { TODAY } from "@/data/cases";

// Whole-day difference between an ISO date and TODAY (positive = in the
// past, negative = in the future). Only ever fed real ISO ("YYYY-MM-DD")
// fields (case.date, note.dueDate, task.dueDate, appointment.date) — never
// the human-formatted display strings (previousDates[].date/updatedAt),
// which are intentionally left untouched by day-math throughout this module
// to avoid the same locale-parsing fragility fixed elsewhere in the app.
export function daysAgo(isoDate, today = TODAY) {
  if (!isoDate) return null;
  const a = new Date(`${isoDate}T00:00:00`);
  const b = new Date(`${today}T00:00:00`);
  return Math.round((b - a) / 86400000);
}

export function caseLabel(caseData) {
  return caseData ? `${caseData.parties} (${caseData.number})` : "";
}
