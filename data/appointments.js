// Standalone calendar-event module ("Appointments" internally, but covers any
// event created from the Calendar's Add Event modal — linked to an existing
// case or fully independent). No such concept existed elsewhere in the app
// before the Calendar feature — this is a fixed in-memory demo dataset, same
// convention as data/team.js.
export const EVENT_TYPE_OPTIONS = ["Appointment", "Hearing", "Reminder", "Deadline", "Personal", "Other"];

export const REMINDER_OPTIONS = [
  "None",
  "At Event Time",
  "15 Minutes Before",
  "30 Minutes Before",
  "1 Hour Before",
  "1 Day Before",
  "3 Days Before",
  "1 Week Before",
  "Custom",
];

export const STATUS_OPTIONS = ["Scheduled", "Completed", "Adjourned", "Cancelled", "Missed"];

export const PRIORITY_OPTIONS = ["High", "Medium", "Low"];

export function toneForEventStatus(status) {
  return { Scheduled: "blue", Completed: "green", Adjourned: "orange", Cancelled: "red", Missed: "red" }[status] || "blue";
}

export function toneForPriority(priority) {
  return { High: "red", Medium: "orange", Low: "green" }[priority] || "blue";
}

export const initialAppointments = [
  {
    id: "appt-1",
    title: "Client briefing — Chevron Inc.",
    eventType: "Appointment",
    date: "2026-07-22",
    time: "03:00 PM",
    location: "Chambers, Room 3",
    caseNo: "01",
    clientName: null,
    notes: "Review upcoming affidavit strategy ahead of the next hearing.",
    assignedToName: "John Anderson",
    assignedToRole: "Senior Advocate",
    reminder: "1 Day Before",
    customReminderMinutes: null,
    status: "Scheduled",
    priority: "High",
  },
  {
    id: "appt-2",
    title: "Consultation — new matter intake",
    eventType: "Appointment",
    date: "2026-07-23",
    time: "11:30 AM",
    location: "Chambers, Room 1",
    caseNo: null,
    clientName: "Rakesh Malhotra",
    notes: "Prospective client, property dispute.",
    assignedToName: "John Anderson",
    assignedToRole: "Senior Advocate",
    reminder: "1 Hour Before",
    customReminderMinutes: null,
    status: "Scheduled",
    priority: "Medium",
  },
  {
    id: "appt-4",
    title: "Conference call with co-counsel",
    eventType: "Appointment",
    date: "2026-07-27",
    time: "05:00 PM",
    location: "Video Call",
    caseNo: "01",
    clientName: null,
    notes: "Coordinate on writ petition draft revisions.",
    assignedToName: null,
    assignedToRole: null,
    reminder: "15 Minutes Before",
    customReminderMinutes: null,
    status: "Scheduled",
    priority: "Medium",
  },
  {
    id: "appt-5",
    title: "Court filing submission",
    eventType: "Deadline",
    date: "2026-07-21",
    time: "09:30 AM",
    location: "High Court Registry",
    caseNo: null,
    clientName: null,
    notes: "Submit compilation of annexures.",
    assignedToName: "P. Iyer",
    assignedToRole: "Clerk",
    reminder: "1 Week Before",
    customReminderMinutes: null,
    status: "Completed",
    priority: "High",
  },
];
