import "server-only";

// Reassembles tasks + task_comments + task_attachments + task_activity rows
// into the exact nested shape data/tasks.js has always produced — so
// TasksContext.jsx can swap its implementation without TaskListWorkspace,
// TaskDetailsWorkspace, CaseDiary/CaseOverview's "+ Add Task", the Calendar's
// AddEventModal, or chat's MessageContextMenu needing any changes.
export function serializeTask(row, { comments = [], attachments = [], activity = [], matterDisplayNo = null } = {}) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    caseNo: matterDisplayNo,
    clientName: row.client_name || "",
    assignedByName: row.assigned_by_name,
    assignedByRole: row.assigned_by_role,
    assignedToName: row.assigned_to_name,
    assignedToRole: row.assigned_to_role,
    assignedAt: row.assigned_at,
    priority: row.priority,
    dueDate: row.due_date,
    dueTime: row.due_time || "",
    status: row.status,
    reminder: row.reminder,
    customReminderMinutes: row.custom_reminder_minutes,
    notes: row.notes || "",
    comments: comments
      .slice()
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .map((c) => ({ id: c.id, user: c.author_name, timestamp: c.created_at, text: c.body })),
    attachments: attachments.map((a) => ({ id: a.id, name: a.name })),
    activity: activity
      .slice()
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .map((a) => ({ id: a.id, timestamp: a.created_at, user: a.actor_name, statusTo: a.status_to, note: a.note || "" })),
  };
}

export function groupBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const list = map.get(row[key]) ?? [];
    list.push(row);
    map.set(row[key], list);
  }
  return map;
}
