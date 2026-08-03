import { TODAY } from "@/data/cases";
import { dueCategory } from "@/data/tasks";
import { computeSmartReminders } from "./reminders";
import { computeRecentActivity } from "./activity";
import { caseLabel } from "./shared";

// Every count/alert below reads straight off the live Cases/Tasks/Appointments/
// Attachments state — nothing is pre-computed or cached, so it's always
// current for whoever is looking at it "this morning".
export function computeDailyBrief({ cases = [], tasks = [], appointments = [], attachments = [], auditLog = [], currentUser }) {
  const hearingsToday = cases.filter((c) => c.date === TODAY);
  const meetingsToday = appointments.filter((a) => a.date === TODAY && a.eventType === "Appointment" && a.status === "Scheduled");
  const pendingTasks = tasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled");
  const filingsDueToday = appointments.filter((a) => a.date === TODAY && a.eventType === "Deadline" && a.status !== "Completed");
  const docsAwaitingReview = attachments.filter((a) => !a.category && !a.linkedCaseNo);

  const priorityAlerts = [];
  hearingsToday.slice(0, 2).forEach((c) => {
    priorityAlerts.push(`${caseLabel(c)} has a hearing today at ${c.time}.`);
  });

  const reminders = computeSmartReminders({ cases, tasks, appointments, attachments });
  reminders.slice(0, 2).forEach((r) => priorityAlerts.push(r.label));

  const recent = computeRecentActivity({ tasks, cases, attachments, auditLog }, 2);
  recent.forEach((item) => priorityAlerts.push(`${item.user} ${item.action}${item.caseLabel ? ` on ${item.caseLabel}` : ""}.`));

  return {
    greeting: `Good Morning, ${currentUser?.name?.split(" ")[0] || "there"}.`,
    counts: {
      hearingsToday: hearingsToday.length,
      clientMeetingsToday: meetingsToday.length,
      pendingTasks: pendingTasks.length,
      filingsDueToday: filingsDueToday.length,
      docsAwaitingReview: docsAwaitingReview.length,
    },
    priorityAlerts: priorityAlerts.slice(0, 5),
  };
}
