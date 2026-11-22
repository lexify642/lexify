import { TODAY } from "@/data/cases";
import { dueCategory } from "@/data/tasks";
import { ROLE_OPTIONS } from "@/lib/roles";
import { buildClientDirectory } from "@/components/cases/clientDirectory";
import { clientConversationId } from "@/components/chat/ChatContext";
import { lastMessageFor } from "@/components/chat/conversationUtils";
import { daysAgo } from "@/components/intelligence/shared";

// Local calendar date as "YYYY-MM-DD" (toISOString() is UTC and would roll
// over to the wrong day outside Greenwich).
export function localISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// One pass over the live Cases/Tasks/Appointments/Chat state that builds
// every list the Dashboard shows. The count tiles are just `.length` of
// these same arrays, so a tile can never disagree with the list under it.

const CLOSED_CASE_STATUSES = ["Closed", "Disposed"];
const DEADLINE_WINDOW_DAYS = 30;

// "10:30 AM" → minutes since midnight, for sorting the hearing list.
function minutesOf(time) {
  const m = /^(\d{1,2}):(\d{2})\s*([AP]M)?$/i.exec((time || "").trim());
  if (!m) return 24 * 60;
  let h = Number(m[1]) % 12;
  if (m[3] && m[3].toUpperCase() === "PM") h += 12;
  if (!m[3]) h = Number(m[1]);
  return h * 60 + Number(m[2]);
}

function isOpenCase(c) {
  return !CLOSED_CASE_STATUSES.includes(c.caseDetails?.caseStatus);
}

// A message is from the client unless it was sent by staff: staff messages
// carry an app role (ChatContext stamps currentUser.role) or a sender name
// that's in the staff directory (older/seeded rows have no role).
function isFromClient(message, clientName, staffNames) {
  if (!message) return false;
  const sender = (message.senderName || "").trim().toLowerCase();
  if (sender && sender === clientName.trim().toLowerCase()) return true;
  if (ROLE_OPTIONS.includes(message.senderRole)) return false;
  return !staffNames.has(sender);
}

export function computeDashboard({ cases = [], tasks = [], appointments = [], messages = [], staffNames = [] }, today = TODAY) {
  const staffSet = new Set(staffNames.map((n) => (n || "").trim().toLowerCase()).filter(Boolean));
  const hearingsToday = cases
    .filter((c) => c.date === today)
    .sort((a, b) => minutesOf(a.time) - minutesOf(b.time))
    .map((c) => ({
      caseNo: c.no,
      time: c.time,
      parties: c.parties,
      number: c.number,
      court: [c.court, c.city].filter(Boolean).join(", "),
      room: c.room,
      itemNo: c.caseDetails?.itemNo || "",
      stage: c.stage,
      href: `/cases/${c.no}`,
    }));

  const byDue = (a, b) => (a.dueDate || "").localeCompare(b.dueDate || "");
  const overdueTasks = tasks.filter((t) => dueCategory(t, today) === "overdue").sort(byDue);
  const dueTodayTasks = tasks.filter((t) => dueCategory(t, today) === "today").sort(byDue);

  const clientsWaiting = buildClientDirectory(cases)
    .map((client) => {
      const conversationId = clientConversationId(client.name);
      const last = lastMessageFor(conversationId, messages);
      if (!isFromClient(last, client.name, staffSet)) return null;
      return {
        clientName: client.name,
        preview: last.deleted ? "Message deleted" : last.text || "Sent an attachment",
        waitingDays: daysAgo(last.createdAt.slice(0, 10), today),
        receivedAt: last.createdAt,
        href: `/chat?c=${encodeURIComponent(conversationId)}`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));

  // Filing deadlines come from Calendar "Deadline" events; limitation dates
  // from a civil matter's case details. Overdue ones stay listed (negative
  // days left) until they're completed or the date is changed.
  const deadlines = [
    ...appointments
      .filter((a) => a.eventType === "Deadline" && a.date && !["Completed", "Cancelled"].includes(a.status))
      .map((a) => ({
        id: `appt-${a.id}`,
        kind: "Filing",
        title: a.title,
        caseLabel: cases.find((c) => c.no === a.caseNo)?.number || a.clientName || "",
        date: a.date,
        href: `/appointments/${a.id}`,
      })),
    ...cases
      .filter((c) => isOpenCase(c) && c.caseDetails?.civil?.limitationDate)
      .map((c) => ({
        id: `lim-${c.no}`,
        kind: "Limitation",
        title: c.parties,
        caseLabel: c.number,
        date: c.caseDetails.civil.limitationDate,
        href: `/cases/${c.no}`,
      })),
  ]
    .map((d) => ({ ...d, daysLeft: -daysAgo(d.date, today) }))
    .filter((d) => d.daysLeft <= DEADLINE_WINDOW_DAYS)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const unassignedMatters = cases
    .filter((c) => isOpenCase(c) && !(c.caseDetails?.assignedAdvocate || "").trim())
    .sort((a, b) => (b.caseDetails?.dateOfRegistration || "").localeCompare(a.caseDetails?.dateOfRegistration || ""))
    .map((c) => ({
      caseNo: c.no,
      parties: c.parties,
      number: c.number,
      court: c.court,
      href: `/cases/${c.no}`,
    }));

  return {
    hearingsToday,
    overdueTasks,
    dueTodayTasks,
    clientsWaiting,
    deadlines,
    unassignedMatters,
    counts: {
      hearingsToday: hearingsToday.length,
      tasksOverdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
      clientsWaiting: clientsWaiting.length,
    },
  };
}

// Case/task/client matches for the header search box.
export function searchWorkspace({ cases = [], tasks = [] }, query, limit = 8) {
  const term = query.trim().toLowerCase();
  if (term.length < 2) return [];
  const caseHits = cases
    .filter((c) => `${c.parties} ${c.number} ${c.court} ${c.client?.name || ""}`.toLowerCase().includes(term))
    .map((c) => ({ key: `case-${c.no}`, kind: "Case", title: c.parties, meta: [c.number, c.court].filter(Boolean).join(" · "), href: `/cases/${c.no}` }));
  const taskHits = tasks
    .filter((t) => `${t.title} ${t.assignedToName || ""}`.toLowerCase().includes(term))
    .map((t) => ({ key: `task-${t.id}`, kind: "Task", title: t.title, meta: t.assignedToName || "", href: `/tasks/${t.id}` }));
  return [...caseHits, ...taskHits].slice(0, limit);
}
