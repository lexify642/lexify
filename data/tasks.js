import { TODAY } from "./cases";

// The single Task store for the whole app — the Case Diary's per-case Tasks
// tab, the Calendar's task events, and the Dashboard's task widgets all read
// from (and write to) this, replacing the old case.tasks[] array and the
// Calendar Appointments store's old "Task" eventType so there's exactly one
// task concept anywhere in the app.
export const TASK_STATUSES = ["Pending", "In Progress", "Waiting for Review", "Completed", "Cancelled"];

export const PRIORITY_OPTIONS = ["High", "Medium", "Low"];

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

export function toneForTaskStatus(status) {
  return (
    {
      Pending: "blue",
      "In Progress": "teal",
      "Waiting for Review": "teal",
      Completed: "green",
      Cancelled: "grey",
    }[status] || "blue"
  );
}

export function toneForPriority(priority) {
  return { High: "red", Medium: "orange", Low: "green" }[priority] || "blue";
}

// "today" | "overdue" | "upcoming" | null (done/cancelled/no due date don't
// belong to any due-date bucket). Shared by the Task list's due-filter and
// the Dashboard's stat tiles so both always agree.
export function dueCategory(task, today = TODAY) {
  if (task.status === "Completed" || task.status === "Cancelled") return null;
  if (!task.dueDate) return null;
  if (task.dueDate < today) return "overdue";
  if (task.dueDate === today) return "today";
  return "upcoming";
}

export function isRecentlyCompleted(task, today = TODAY, days = 7) {
  if (task.status !== "Completed") return false;
  const completedEntry = task.activity.find((a) => a.statusTo === "Completed");
  if (!completedEntry) return false;
  const cutoff = new Date(`${today}T00:00:00`);
  cutoff.setDate(cutoff.getDate() - days);
  return new Date(`${completedEntry.timestamp.slice(0, 10)}T00:00:00`) >= cutoff;
}

function activityEntry(statusTo, note, timestamp, user) {
  return { id: `act-${Math.random().toString(36).slice(2, 9)}`, timestamp, user, statusTo, note };
}

// Migrated 1:1 from the old data/cases.js case.tasks[] arrays (Assigned →
// Pending, In Progress → In Progress, Done → Completed) plus the one task
// that previously lived in the Calendar's Appointments store (appt-3).
export const initialTasks = [
  {
    id: "task-01",
    title: "Draft compilation of annexures",
    description: "",
    caseNo: "01",
    clientName: "",
    assignedByName: "John Anderson",
    assignedByRole: "Senior Advocate",
    assignedToName: "R. Sharma",
    assignedToRole: "Junior Advocate",
    assignedAt: "2026-07-20T10:00:00",
    priority: "High",
    dueDate: "2026-07-23",
    dueTime: "",
    status: "In Progress",
    reminder: "1 Day Before",
    customReminderMinutes: null,
    notes: "",
    comments: [],
    attachments: [],
    activity: [
      activityEntry("Pending", "Task created and assigned.", "2026-07-20T10:00:00", "John Anderson"),
      activityEntry("In Progress", "Draft compilation of annexures underway.", "2026-07-21T09:15:00", "R. Sharma"),
    ],
  },
  {
    id: "task-02",
    title: "Collect signed vakalatnama from client",
    description: "",
    caseNo: "01",
    clientName: "",
    assignedByName: "John Anderson",
    assignedByRole: "Senior Advocate",
    assignedToName: "P. Iyer",
    assignedToRole: "Clerk",
    assignedAt: "2026-07-20T10:05:00",
    priority: "Medium",
    dueDate: "2026-07-22",
    dueTime: "",
    status: "Pending",
    reminder: "None",
    customReminderMinutes: null,
    notes: "",
    comments: [],
    attachments: [],
    activity: [activityEntry("Pending", "Task created and assigned.", "2026-07-20T10:05:00", "John Anderson")],
  },
  {
    id: "task-03",
    title: "Prepare written brief for senior counsel",
    description: "",
    caseNo: "02",
    clientName: "",
    assignedByName: "John Anderson",
    assignedByRole: "Senior Advocate",
    assignedToName: "K. Verma",
    assignedToRole: "Junior Advocate",
    assignedAt: "2026-07-21T11:00:00",
    priority: "Medium",
    dueDate: "2026-07-24",
    dueTime: "",
    status: "Pending",
    reminder: "None",
    customReminderMinutes: null,
    notes: "",
    comments: [],
    attachments: [],
    activity: [activityEntry("Pending", "Task created and assigned.", "2026-07-21T11:00:00", "John Anderson")],
  },
  {
    id: "task-04",
    title: "Collect witness affidavits",
    description: "",
    caseNo: "03",
    clientName: "",
    assignedByName: "John Anderson",
    assignedByRole: "Senior Advocate",
    assignedToName: "P. Iyer",
    assignedToRole: "Clerk",
    assignedAt: "2026-06-01T09:00:00",
    priority: "Low",
    dueDate: "2026-06-15",
    dueTime: "",
    status: "Completed",
    reminder: "None",
    customReminderMinutes: null,
    notes: "",
    comments: [],
    attachments: [],
    activity: [
      activityEntry("Pending", "Task created and assigned.", "2026-06-01T09:00:00", "John Anderson"),
      activityEntry("Completed", "All witness affidavits collected and filed.", "2026-06-14T16:30:00", "P. Iyer"),
    ],
  },
  {
    id: "task-05",
    title: "File reply to bail application",
    description: "",
    caseNo: "03",
    clientName: "",
    assignedByName: "John Anderson",
    assignedByRole: "Senior Advocate",
    assignedToName: "R. Sharma",
    assignedToRole: "Junior Advocate",
    assignedAt: "2026-07-15T09:00:00",
    priority: "High",
    dueDate: "2026-07-25",
    dueTime: "",
    status: "In Progress",
    reminder: "1 Day Before",
    customReminderMinutes: null,
    notes: "",
    comments: [],
    attachments: [],
    activity: [
      activityEntry("Pending", "Task created and assigned.", "2026-07-15T09:00:00", "John Anderson"),
      activityEntry("In Progress", "Draft petition completed. Waiting for supporting documents.", "2026-07-21T14:10:00", "R. Sharma"),
    ],
  },
  {
    id: "task-06",
    title: "Draft rejoinder to reply",
    description: "",
    caseNo: "05",
    clientName: "",
    assignedByName: "John Anderson",
    assignedByRole: "Senior Advocate",
    assignedToName: "S. Nair",
    assignedToRole: "Staff",
    assignedAt: "2026-07-22T09:00:00",
    priority: "Medium",
    dueDate: "2026-08-02",
    dueTime: "",
    status: "Pending",
    reminder: "1 Hour Before",
    customReminderMinutes: null,
    notes: "",
    comments: [],
    attachments: [],
    activity: [activityEntry("Pending", "Task created and assigned.", "2026-07-22T09:00:00", "John Anderson")],
  },
  {
    id: "task-07",
    title: "Deposition — opposing witness",
    description: "",
    caseNo: "02",
    clientName: "",
    assignedByName: "John Anderson",
    assignedByRole: "Senior Advocate",
    assignedToName: "R. Sharma",
    assignedToRole: "Junior Advocate",
    assignedAt: "2026-07-20T09:00:00",
    priority: "High",
    dueDate: "2026-07-24",
    dueTime: "10:00 AM",
    status: "Pending",
    reminder: "30 Minutes Before",
    customReminderMinutes: null,
    notes: "Court Complex, Room 12",
    comments: [],
    attachments: [],
    activity: [activityEntry("Pending", "Task created and assigned.", "2026-07-20T09:00:00", "John Anderson")],
  },
];
