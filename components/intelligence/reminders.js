import { clientConversationId } from "@/components/chat/ChatContext";
import { lastMessageFor } from "@/components/chat/conversationUtils";
import { buildClientDirectory } from "@/components/cases/clientDirectory";
import { dueCategory } from "@/data/tasks";
import { TODAY } from "@/data/cases";
import { daysAgo, caseLabel } from "./shared";

// Forward-looking actionable items — distinct from the Activity Feed (which
// looks backward at what already happened). Every entry is derived from a
// real field (note.dueDate/isReminder, task.dueDate, appointment.date/time,
// case.caseDetails.civil.courtFeePaid) — nothing here is invented.
export function computeSmartReminders({ cases = [], tasks = [], appointments = [], attachments = [] }) {
  const items = [];

  cases.forEach((c) => {
    c.notes
      .filter((n) => n.isReminder && !n.completed && n.dueDate)
      .forEach((n) => {
        items.push({
          id: `reminder-note-${n.id}`,
          type: "reminder",
          label: `${n.text} — ${caseLabel(c)}`,
          timestamp: `${n.dueDate}T09:00:00`,
          href: `/cases/${c.no}`,
        });
      });

    if (c.caseDetails?.civil && !c.caseDetails.civil.courtFeePaid) {
      items.push({
        id: `reminder-fee-${c.no}`,
        type: "reminder",
        label: `Court fee pending — ${caseLabel(c)}`,
        timestamp: `${TODAY}T09:00:00`,
        href: `/cases/${c.no}`,
      });
    }
  });

  tasks
    .filter((t) => dueCategory(t) === "overdue" || dueCategory(t) === "today")
    .forEach((t) => {
      items.push({
        id: `reminder-task-${t.id}`,
        type: "reminder",
        label: `${dueCategory(t) === "overdue" ? "Overdue" : "Due today"}: "${t.title}" (${t.assignedToName})`,
        timestamp: `${t.dueDate}T09:00:00`,
        href: `/tasks/${t.id}`,
      });
    });

  appointments
    .filter((a) => a.status === "Scheduled" && (daysAgo(a.date) ?? 1) <= 0 && (daysAgo(a.date) ?? -99) >= -2)
    .forEach((a) => {
      items.push({
        id: `reminder-appt-${a.id}`,
        type: "reminder",
        label: `Upcoming ${a.eventType.toLowerCase()}: "${a.title}" at ${a.time}`,
        timestamp: `${a.date}T12:00:00`,
        href: `/appointments/${a.id}`,
      });
    });

  return items.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

// "Last contacted" is derived from the real client chat's most recent
// message (see components/chat/conversationUtils.js) — there's no other
// client-contact log anywhere in this app. A client who never had a chat
// message shows as "Never contacted" rather than a fabricated date.
export function computeClientFollowUps({ cases = [], messages = [] }, thresholdDays = 7) {
  return buildClientDirectory(cases)
    .map((client) => {
      const conversationId = clientConversationId(client.name);
      const last = lastMessageFor(conversationId, messages);
      const lastContactedDaysAgo = last ? daysAgo(last.createdAt.slice(0, 10)) : null;
      return {
        clientName: client.name,
        lastContactedDaysAgo,
        nextAction: lastContactedDaysAgo === null ? "Reach out" : "Follow up",
        href: `/chat?c=${conversationId}`,
      };
    })
    .filter((c) => c.lastContactedDaysAgo === null || c.lastContactedDaysAgo >= thresholdDays)
    .sort((a, b) => (b.lastContactedDaysAgo ?? 9999) - (a.lastContactedDaysAgo ?? 9999));
}
