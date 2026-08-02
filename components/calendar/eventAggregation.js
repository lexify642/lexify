import { Gavel, CalendarClock, CheckSquare, AlertTriangle } from "lucide-react";

// Per-type visual identity, reusing the app's existing tone palette
// (app/globals.css :root tokens) so calendar colors match badges/stat-icons
// elsewhere instead of inventing a new palette.
export const EVENT_META = {
  case: { label: "Case", tone: "blue", hex: "#7c3aed", Icon: Gavel },
  appointment: { label: "Appointment", tone: "purple", hex: "#8065db", Icon: CalendarClock },
  task: { label: "Task", tone: "orange", hex: "#ee9d35", Icon: CheckSquare },
  deadline: { label: "Deadline", tone: "red", hex: "#e6535b", Icon: AlertTriangle },
};

export const EVENT_TYPES = ["case", "appointment", "task", "deadline"];

function parseTimeToParts(time) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec((time || "").trim());
  if (!m) return null;
  let hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  const period = m[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

// Cases/appointments carry a real time ("10:30 AM") so they render as timed
// events; tasks/deadlines only carry a due date, so they stay all-day.
function toStart(date, time) {
  const parts = parseTimeToParts(time);
  if (!parts) return date;
  return `${date}T${String(parts.hours).padStart(2, "0")}:${String(parts.minutes).padStart(2, "0")}:00`;
}

// Builds the calendar's event list entirely from the live Cases/Appointments
// data sources — no separate event store, so nothing here can drift out of
// sync with the Case Diary, Task delegation, or Appointments modules.
export function buildCalendarEvents({ cases, appointments }) {
  const events = [];

  cases.forEach((c) => {
    if (c.date) {
      events.push({
        id: `case-${c.no}`,
        type: "case",
        date: c.date,
        time: c.time || "",
        start: toStart(c.date, c.time),
        title: c.parties,
        subtitle: `${c.number} · ${c.court}, ${c.city}`,
        caseNumber: c.number,
        parties: c.parties,
        clientName: c.client?.name ?? "",
        href: `/cases/${c.no}`,
      });
    }

    (c.tasks || []).forEach((t) => {
      if (!t.dueDate) return;
      events.push({
        id: `task-${c.no}-${t.id}`,
        type: "task",
        date: t.dueDate,
        time: "",
        start: t.dueDate,
        title: t.title,
        subtitle: `${c.parties} · ${t.assignee}`,
        caseNumber: c.number,
        parties: c.parties,
        clientName: c.client?.name ?? "",
        href: `/cases/${c.no}?tab=tasks`,
      });
    });

    (c.notes || []).forEach((n) => {
      if (!n.isReminder || !n.dueDate) return;
      events.push({
        id: `deadline-${c.no}-${n.id}`,
        type: "deadline",
        date: n.dueDate,
        time: "",
        start: n.dueDate,
        title: n.text,
        subtitle: c.parties,
        caseNumber: c.number,
        parties: c.parties,
        clientName: c.client?.name ?? "",
        href: `/cases/${c.no}?tab=notes`,
      });
    });
  });

  appointments.forEach((a) => {
    const linkedCase = a.caseNo ? cases.find((c) => c.no === a.caseNo) : null;
    events.push({
      id: `appointment-${a.id}`,
      type: "appointment",
      date: a.date,
      time: a.time || "",
      start: toStart(a.date, a.time),
      title: a.title,
      subtitle: [a.location, linkedCase?.parties || a.clientName].filter(Boolean).join(" · "),
      caseNumber: linkedCase?.number ?? "",
      parties: linkedCase?.parties ?? "",
      clientName: a.clientName ?? "",
      href: `/appointments/${a.id}`,
    });
  });

  return events;
}

export function filterEvents(events, { types, search }) {
  const term = (search || "").trim().toLowerCase();
  return events.filter((e) => {
    if (!types[e.type]) return false;
    if (!term) return true;
    return (
      e.title.toLowerCase().includes(term) ||
      e.caseNumber.toLowerCase().includes(term) ||
      e.parties.toLowerCase().includes(term) ||
      e.clientName.toLowerCase().includes(term)
    );
  });
}

export function groupEventsByDate(events) {
  const map = new Map();
  events.forEach((e) => {
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date).push(e);
  });
  map.forEach((list) => list.sort((a, b) => (a.start > b.start ? 1 : -1)));
  return map;
}
