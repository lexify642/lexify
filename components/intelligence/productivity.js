import { TODAY } from "@/data/cases";
import { dueCategory } from "@/data/tasks";

function isToday(isoDateTime) {
  return typeof isoDateTime === "string" && isoDateTime.slice(0, 10) === TODAY;
}

// "Hearings Attended"/"Research Completed" have no real check-in/completion
// flag anywhere in this app (a case's `date` only says a hearing is
// scheduled, not that it happened) — these are honestly reported as
// "scheduled for today" counts using the same real fields as the rest of
// the dashboard, not a fabricated attendance log.
export function computeProductivityToday({ cases = [], tasks = [], appointments = [], attachments = [] }, today = TODAY) {
  const tasksCompletedToday = tasks.filter((t) => t.status === "Completed" && t.activity.some((a) => a.statusTo === "Completed" && isToday(a.timestamp))).length;
  const hearingsToday = cases.filter((c) => c.date === today).length;
  const documentsUploadedToday = attachments.filter((a) => isToday(a.uploadedAt)).length;
  const researchAttachedToday = attachments.filter((a) => a.category === "Research" && isToday(a.uploadedAt)).length;
  const draftsCreatedToday = tasks.filter(
    (t) => /draft/i.test(t.title) && t.status === "Completed" && t.activity.some((a) => a.statusTo === "Completed" && isToday(a.timestamp))
  ).length;
  const clientMeetingsToday = appointments.filter((a) => a.date === today && a.eventType === "Appointment").length;

  const dueTodayOrOverdue = tasks.filter((t) => dueCategory(t, today) === "today" || dueCategory(t, today) === "overdue");
  const completionDenominator = tasksCompletedToday + dueTodayOrOverdue.length;
  const productivityPercent = completionDenominator === 0 ? 100 : Math.round((tasksCompletedToday / completionDenominator) * 100);

  return {
    tasksCompletedToday,
    hearingsAttendedToday: hearingsToday,
    documentsUploadedToday,
    researchAttachedToday,
    draftsCreatedToday,
    clientMeetingsToday,
    productivityPercent,
  };
}
